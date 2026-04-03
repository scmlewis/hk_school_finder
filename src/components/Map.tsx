import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import axios from 'axios';
import { useStore } from '../store';
import { SCHOOL_NET_GEOJSON_URL } from '../services';
import { School } from '../types';
import { getSchoolNameByLanguage, getSchoolSecondaryNameByLanguage } from '../utils';

type SchoolFeature = GeoJSON.Feature<GeoJSON.Point, {
  schoolId: string;
  schoolName: string;
  englishName: string;
  level: string;
  color: string;
}>;

const SCHOOLS_SOURCE_ID = 'schools-source';
const CLUSTERS_LAYER_ID = 'clusters';
const CLUSTER_COUNT_LAYER_ID = 'cluster-count';
const SCHOOL_POINTS_LAYER_ID = 'school-points';
const HK_BOUNDS: maplibregl.LngLatBoundsLike = [
  [113.75, 22.15],
  [114.55, 22.62],
];

function getSelectionOffset(): [number, number] {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    return [0, -220];
  }
  return [0, -60];
}

const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const geojsonData = useRef<any>(null);
  const schoolsById = useRef<Record<string, School>>({});
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapReady = useRef(false);
  const currentPopup = useRef<maplibregl.Popup | null>(null);
  const hoverPopup = useRef<maplibregl.Popup | null>(null);
  const selectedSchoolRef = useRef<School | null>(null);
  const lastZoomBucketRef = useRef<number | null>(null);
  const languageRef = useRef<'en' | 'zh'>('en');

  const {
    filteredSchools,
    setSelectedSchool,
    selectedSchool,
    setActiveSchoolNet,
    activeSchoolNet,
    setMapZoom,
    language,
  } = useStore();

  useEffect(() => {
    selectedSchoolRef.current = selectedSchool;
  }, [selectedSchool]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const schoolFeatures = useMemo<GeoJSON.FeatureCollection<GeoJSON.Point>>(() => {
    schoolsById.current = {};

    const features: SchoolFeature[] = [];
    for (const school of filteredSchools) {
      const id = getSchoolId(school);
      if (!id) continue;

      const lng = parseFloat(school.Longitude || school.longitude || '');
      const lat = parseFloat(school.Latitude || school.latitude || '');
      if (isNaN(lng) || isNaN(lat)) continue;

      schoolsById.current[id] = school;
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        properties: {
          schoolId: id,
          schoolName: school['School Name'] || '',
          englishName: school['English Name'] || '',
          level: (school['School Level'] || '').toUpperCase(),
          color: getMarkerColor(school['School Level']),
        },
      });
    }

    return {
      type: 'FeatureCollection',
      features,
    };
  }, [filteredSchools]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      let styleUrl = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
      let retryCount = 0;
      const maxRetries = 2;

      const createMap = (url: string) => {
        const m = new maplibregl.Map({
          container: mapContainer.current!,
          style: url,
          center: [114.1694, 22.3191],
          zoom: 11,
          minZoom: 10,
          maxZoom: 18,
          maxBounds: HK_BOUNDS,
          trackResize: true,
          pitch: 0,
          bearing: 0,
          renderWorldCopies: false,
          dragRotate: false,
          touchPitch: false,
        });
        return m;
      };

      const m = createMap(styleUrl);
      map.current = m;

      m.on('error', (err) => {
        const errorMsg = err?.message || String(err);
        // If it's a style load error and we haven't exceeded retries, try again
        if (
          (errorMsg.includes('projection') || errorMsg.includes('Failed to fetch') || errorMsg.includes('style')) &&
          retryCount < maxRetries
        ) {
          retryCount++;
          console.warn(`Map style load failed (attempt ${retryCount}/${maxRetries}), attempting retry...`);
          setTimeout(() => {
            if (map.current) {
              try {
                // Try to reload the style
                map.current.setStyle(styleUrl);
              } catch (e) {
                console.error('Retry failed:', e);
              }
            }
          }, 1000);
        } else {
          console.error('Map error (non-recoverable):', err);
        }
      });

      m.on('zoomend', () => {
        if (!map.current) return;
        const zoomBucket = Math.floor(map.current.getZoom());
        if (lastZoomBucketRef.current !== zoomBucket) {
          lastZoomBucketRef.current = zoomBucket;
          setMapZoom(zoomBucket);
        }
      });

      m.on('load', async () => {
        if (!map.current) return;

        try {
          const response = await axios.get(SCHOOL_NET_GEOJSON_URL, { timeout: 20000 });
          const data = response.data;

          if (data?.features) {
            data.features = data.features.map((f: any, i: number) => ({
              ...f,
              id: i,
            }));
          }
          geojsonData.current = data;

          if (!map.current) return;

          map.current.addSource('school-nets', {
            type: 'geojson',
            data,
            generateId: false,
          });

          map.current.addLayer({
            id: 'school-nets-fill',
            type: 'fill',
            source: 'school-nets',
            paint: {
              'fill-color': '#3b82f6',
              'fill-opacity': [
                'case',
                ['boolean', ['feature-state', 'active'], false],
                0.16,
                0,
              ],
            },
          });

          map.current.addLayer({
            id: 'school-nets-outline',
            type: 'line',
            source: 'school-nets',
            paint: {
              'line-color': '#60a5fa',
              'line-width': [
                'case',
                ['boolean', ['feature-state', 'active'], false],
                2,
                0.5,
              ],
              'line-opacity': [
                'case',
                ['boolean', ['feature-state', 'active'], false],
                0.9,
                0.2,
              ],
            },
          });

          map.current.addSource(SCHOOLS_SOURCE_ID, {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [],
            },
            cluster: true,
            clusterRadius: 50,
            clusterMaxZoom: 14,
          });

          map.current.addLayer({
            id: CLUSTERS_LAYER_ID,
            type: 'circle',
            source: SCHOOLS_SOURCE_ID,
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': '#2563eb',
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                16,
                80,
                20,
                250,
                24,
              ],
              'circle-opacity': 0.82,
              'circle-stroke-color': '#bfdbfe',
              'circle-stroke-width': 2,
            },
          });

          map.current.addLayer({
            id: CLUSTER_COUNT_LAYER_ID,
            type: 'symbol',
            source: SCHOOLS_SOURCE_ID,
            filter: ['has', 'point_count'],
            layout: {
              'text-field': ['get', 'point_count_abbreviated'],
              'text-font': ['Open Sans Bold'],
              'text-size': 12,
            },
            paint: {
              'text-color': '#f8fafc',
            },
          });

          map.current.addLayer({
            id: SCHOOL_POINTS_LAYER_ID,
            type: 'circle',
            source: SCHOOLS_SOURCE_ID,
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': ['coalesce', ['get', 'color'], '#64748b'],
              'circle-radius': 7,
              'circle-stroke-color': '#e2e8f0',
              'circle-stroke-width': 1.5,
              'circle-opacity': 0.95,
            },
          });

          map.current.on('click', CLUSTERS_LAYER_ID, (e) => {
            if (!map.current || !e.features?.length) return;
            const clusterId = e.features[0].properties?.cluster_id;
            if (clusterId === undefined || clusterId === null) return;

            const source = map.current.getSource(SCHOOLS_SOURCE_ID) as GeoJSONSource;
            source.getClusterExpansionZoom(Number(clusterId)).then((zoom) => {
              if (!map.current) return;
              const coords = e.features?.[0]?.geometry;
              if (!coords || coords.type !== 'Point') return;
              map.current.easeTo({
                center: coords.coordinates as [number, number],
                zoom,
                duration: 400,
              });
            }).catch((err) => {
              console.error('Failed to expand cluster:', err);
            });
          });

          map.current.on('click', SCHOOL_POINTS_LAYER_ID, (e) => {
            if (!map.current || !e.features?.length) return;

            const feature = e.features[0] as maplibregl.MapGeoJSONFeature;
            const schoolId = String(feature.properties?.schoolId || '');
            if (!schoolId) return;

            const school = schoolsById.current[schoolId];
            if (!school) return;

            const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
            setSelectedSchool(school);

            if (currentPopup.current) {
              currentPopup.current.remove();
            }
            if (hoverPopup.current) {
              hoverPopup.current.remove();
              hoverPopup.current = null;
            }
            const popupContent = document.createElement('div');
            popupContent.style.padding = '10px';
            popupContent.style.maxWidth = '240px';
            popupContent.style.fontFamily = 'system-ui';
            popupContent.style.color = '#e2e8f0';

            const nameEl = document.createElement('p');
            nameEl.style.fontWeight = '700';
            nameEl.style.margin = '0 0 2px 0';
            nameEl.style.fontSize = '13px';
            nameEl.textContent = getSchoolNameByLanguage(school, languageRef.current);
            popupContent.appendChild(nameEl);

            const secondaryEl = document.createElement('p');
            secondaryEl.style.fontSize = '11px';
            secondaryEl.style.color = '#94a3b8';
            secondaryEl.style.margin = '0';
            secondaryEl.textContent = getSchoolSecondaryNameByLanguage(school, languageRef.current);
            popupContent.appendChild(secondaryEl);

            currentPopup.current = new maplibregl.Popup({
              offset: [0, -12],
              closeButton: false,
              closeOnClick: false,
              className: 'school-popup',
            })
              .setLngLat(coordinates)
              .setDOMContent(popupContent)
              .addTo(map.current);

            map.current.flyTo({
              center: coordinates,
              zoom: Math.max(map.current.getZoom(), 16),
              duration: 650,
              offset: getSelectionOffset(),
            });
          });

          map.current.on('mousemove', SCHOOL_POINTS_LAYER_ID, () => {
            if (!map.current) return;
            map.current.getCanvas().style.cursor = 'pointer';
          });

          map.current.on('mouseenter', SCHOOL_POINTS_LAYER_ID, () => {
            if (!map.current || selectedSchoolRef.current) return;
            hoverPopup.current = new maplibregl.Popup({
              offset: [0, -10],
              closeButton: false,
              closeOnClick: false,
              className: 'school-popup',
            });
          });

          map.current.on('mousemove', SCHOOL_POINTS_LAYER_ID, (e) => {
            if (!map.current || selectedSchoolRef.current || !e.features?.length) return;
            const feature = e.features[0] as maplibregl.MapGeoJSONFeature;
            const schoolId = String(feature.properties?.schoolId || '');
            const school = schoolsById.current[schoolId];
            if (!school) return;

            const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
            if (!hoverPopup.current) {
              hoverPopup.current = new maplibregl.Popup({
                offset: [0, -10],
                closeButton: false,
                closeOnClick: false,
                className: 'school-popup',
              });
            }

            const hoverContent = document.createElement('div');
            hoverContent.style.padding = '10px';
            hoverContent.style.maxWidth = '240px';
            hoverContent.style.fontFamily = 'system-ui';
            hoverContent.style.color = '#e2e8f0';

            const hoverNameEl = document.createElement('p');
            hoverNameEl.style.fontWeight = '700';
            hoverNameEl.style.margin = '0 0 2px 0';
            hoverNameEl.style.fontSize = '13px';
            hoverNameEl.textContent = getSchoolNameByLanguage(school, languageRef.current);
            hoverContent.appendChild(hoverNameEl);

            const hoverSecondaryEl = document.createElement('p');
            hoverSecondaryEl.style.fontSize = '11px';
            hoverSecondaryEl.style.color = '#94a3b8';
            hoverSecondaryEl.style.margin = '0';
            hoverSecondaryEl.textContent = getSchoolSecondaryNameByLanguage(school, languageRef.current);
            hoverContent.appendChild(hoverSecondaryEl);

            hoverPopup.current
              .setLngLat(coordinates)
              .setDOMContent(hoverContent)
              .addTo(map.current);
          });

          map.current.on('mouseleave', SCHOOL_POINTS_LAYER_ID, () => {
            if (map.current) {
              map.current.getCanvas().style.cursor = '';
            }
            if (hoverPopup.current) {
              hoverPopup.current.remove();
              hoverPopup.current = null;
            }
          });

          map.current.on('click', (e) => {
            if (!map.current) return;

            const schoolOrCluster = map.current.queryRenderedFeatures(e.point, {
              layers: [SCHOOL_POINTS_LAYER_ID, CLUSTERS_LAYER_ID],
            });
            if (schoolOrCluster.length > 0) {
              return;
            }

            const netFeatures = map.current.queryRenderedFeatures(e.point, {
              layers: ['school-nets-fill'],
            });
            const topFeature = netFeatures[0];
            if (!topFeature) return;

            const netId =
              topFeature.properties?.NET_ID ||
              topFeature.properties?.Net_ID ||
              topFeature.properties?.NET_NO ||
              null;

            if (netId) {
              setActiveSchoolNet(String(netId));
            }
          });

          mapReady.current = true;
          setIsMapLoaded(true);
        } catch (err) {
          console.error('Error in map load:', err);
          mapReady.current = true;
          setIsMapLoaded(true);
        }
      });

      return () => {
        mapReady.current = false;
        setIsMapLoaded(false);
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };
    } catch (err) {
      console.error('Error initializing map:', err);
    }
  }, [setMapZoom, setActiveSchoolNet, setSelectedSchool]);

  useEffect(() => {
    if (!mapContainer.current || !map.current) return;
    const observer = new ResizeObserver(() => {
      map.current?.resize();
    });
    observer.observe(mapContainer.current);
    return () => observer.disconnect();
  }, []);

  const prevActiveNet = useRef<string | null>(null);

  useEffect(() => {
    if (!isMapLoaded || !mapReady.current || !geojsonData.current || !map.current) return;

    if (!map.current.getSource('school-nets')) return;

    geojsonData.current.features.forEach((f: any, i: number) => {
      const netId = f.properties.NET_ID || f.properties.Net_ID || f.properties.NET_NO;
      if (netId === activeSchoolNet || netId === prevActiveNet.current) {
        map.current?.setFeatureState(
          { source: 'school-nets', id: i },
          { active: netId === activeSchoolNet }
        );
      }
    });

    prevActiveNet.current = activeSchoolNet;
  }, [activeSchoolNet, isMapLoaded]);

  useEffect(() => {
    if (!isMapLoaded || !mapReady.current || !map.current) return;
    const source = map.current.getSource(SCHOOLS_SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) return;

    source.setData(schoolFeatures);
  }, [schoolFeatures, isMapLoaded]);

  useEffect(() => {
    if (!isMapLoaded || !selectedSchool || !map.current) return;

    const lng = parseFloat(selectedSchool.Longitude || selectedSchool.longitude || '');
    const lat = parseFloat(selectedSchool.Latitude || selectedSchool.latitude || '');

    if (!isNaN(lng) && !isNaN(lat)) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: Math.max(map.current.getZoom(), 16),
        duration: 650,
        offset: getSelectionOffset(),
      });
    }
  }, [selectedSchool, isMapLoaded]);

  useEffect(() => {
    if (!selectedSchool && currentPopup.current) {
      currentPopup.current.remove();
      currentPopup.current = null;
    }
    if (selectedSchool && hoverPopup.current) {
      hoverPopup.current.remove();
      hoverPopup.current = null;
    }
  }, [selectedSchool]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

function getMarkerColor(schoolLevel: string): string {
  const level = (schoolLevel || '').toUpperCase();
  if (level.includes('KINDERGARTEN')) return '#f472b6';
  if (level.includes('PRIMARY')) return '#60a5fa';
  if (level.includes('SECONDARY')) return '#34d399';
  return '#94a3b8';
}

function getSchoolId(school: School): string {
  const primary = String(school['School No.'] || school['SCHOOL NO.'] || '').trim();
  if (primary) return primary;

  const englishName = String(school['English Name'] || school['ENGLISH NAME'] || '').trim();
  const localName = String(school['School Name'] || school['中文名稱'] || '').trim();
  const district = String(school['District'] || school['DISTRICT'] || '').trim();
  const level = String(school['School Level'] || school['SCHOOL LEVEL'] || '').trim();
  const lat = String(school['Latitude'] || school['LATITUDE'] || '').trim();
  const lng = String(school['Longitude'] || school['LONGITUDE'] || '').trim();

  const composite = [englishName, localName, district, level, lat, lng].filter(Boolean).join('|');
  return composite || '';
}

export default Map;
