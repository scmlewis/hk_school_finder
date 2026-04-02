import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import axios from 'axios';
import { useStore } from '../store';
import { SCHOOL_NET_GEOJSON_URL } from '../services';

const Map: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<{ [key: string]: { marker: maplibregl.Marker; popup: maplibregl.Popup } }>({});
  const geojsonData = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const mapReady = useRef(false);
  const currentPopup = useRef<maplibregl.Popup | null>(null);
  
  const { filteredSchools, setSelectedSchool, selectedSchool, setActiveSchoolNet, activeSchoolNet, setMapZoom } = useStore();

  // Initialize map once
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    try {
      const m = new maplibregl.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
        center: [114.1694, 22.3191],
        zoom: 11,
        trackResize: true,
        pitch: 0,
        bearing: 0
      });

      map.current = m;

      // Track zoom changes
      m.on('zoom', () => {
        try {
          if (map.current) {
            setMapZoom(Math.floor(map.current.getZoom()));
          }
        } catch (e) {
          console.error('Error updating zoom:', e);
        }
      });

      m.on('load', async () => {
        if (!map.current) return;
        
        try {
          console.log('🗺️ Map loaded. Loading GeoJSON...');
          const response = await axios.get(SCHOOL_NET_GEOJSON_URL, { timeout: 20000 });
          const data = response.data;
          
          // Add numeric IDs to features
          if (data && data.features) {
            data.features = data.features.map((f: any, i: number) => ({
              ...f,
              id: i
            }));
          }
          geojsonData.current = data;

          if (!map.current) return;

          // Add school-nets source and layers
          if (!map.current.getSource('school-nets')) {
            map.current.addSource('school-nets', {
              type: 'geojson',
              data: data,
              generateId: false
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
                  0.15,
                  0
                ]
              }
            });

            map.current.addLayer({
              id: 'school-nets-outline',
              type: 'line',
              source: 'school-nets',
              paint: {
                'line-color': '#3b82f6',
                'line-width': [
                  'case',
                  ['boolean', ['feature-state', 'active'], false],
                  2,
                  0.5
                ],
                'line-opacity': [
                  'case',
                  ['boolean', ['feature-state', 'active'], false],
                  0.8,
                  0.2
                ]
              }
            });
          }

          // Map click handler for school net detection
          map.current.on('click', (e) => {
            const point = [e.lngLat.lng, e.lngLat.lat];
            const pt = turf.point(point);
            
            let foundNet = null;
            if (geojsonData.current && geojsonData.current.features) {
              for (const feature of geojsonData.current.features) {
                if (turf.booleanPointInPolygon(pt, feature)) {
                  foundNet = feature.properties.NET_ID || feature.properties.Net_ID || feature.properties.NET_NO;
                  break;
                }
              }
            }
            if (foundNet) {
              setActiveSchoolNet(foundNet);
            }
          });

          mapReady.current = true;
          setIsMapLoaded(true);
          console.log('✅ Map fully loaded and ready');
        } catch (err) {
          console.error('Error in map load:', err);
          mapReady.current = true;
          setIsMapLoaded(true);
        }
      });

      m.on('error', (err) => {
        console.error('❌ Map error:', err);
      });

      return () => {
        mapReady.current = false;
        setIsMapLoaded(false);
        try {
          if (map.current) {
            map.current.remove();
            map.current = null;
          }
        } catch (e) {
          console.error('Error cleaning up map:', e);
        }
      };
    } catch (err) {
      console.error('Error initializing map:', err);
    }
  }, [setMapZoom, setActiveSchoolNet]);

  // Handle container resize
  useEffect(() => {
    if (!mapContainer.current || !map.current) return;
    const observer = new ResizeObserver(() => {
      try {
        map.current?.resize();
      } catch (e) {
        console.error('Error resizing map:', e);
      }
    });
    observer.observe(mapContainer.current);
    return () => observer.disconnect();
  }, []);

  const prevActiveNet = useRef<string | null>(null);

  // Update active net highlighting
  useEffect(() => {
    if (!isMapLoaded || !mapReady.current || !geojsonData.current || !map.current) return;

    try {
      if (!map.current.getSource('school-nets')) return;
      
      geojsonData.current.features.forEach((f: any, i: number) => {
        const netId = f.properties.NET_ID || f.properties.Net_ID || f.properties.NET_NO;
        
        if (netId === activeSchoolNet || netId === prevActiveNet.current) {
          try {
            map.current!.setFeatureState(
              { source: 'school-nets', id: i },
              { active: netId === activeSchoolNet }
            );
          } catch (err) {}
        }
      });
      prevActiveNet.current = activeSchoolNet;
    } catch (err) {
      console.error('Error updating school nets:', err);
    }
  }, [activeSchoolNet, isMapLoaded]);

  // Helper function to get marker color
  const getMarkerColor = (schoolLevel: string): string => {
    const level = (schoolLevel || "").toUpperCase();
    if (level.includes('KINDERGARTEN')) return '#ec4899';
    if (level.includes('PRIMARY')) return '#3b82f6';
    if (level.includes('SECONDARY')) return '#10b981';
    return '#6b7280';
  };

  // Update markers
  useEffect(() => {
    if (!isMapLoaded || !mapReady.current || !map.current) {
      console.log('⏳ Skipping marker update - map not ready');
      return;
    }

    console.log('📍 Updating markers for', filteredSchools.length, 'filtered schools');

    try {
      // Remove old markers
      const currentIds = new Set(filteredSchools.map(s => s["School No."] || s["English Name"]));
      let removedCount = 0;
      
      Object.keys(markers.current).forEach(id => {
        if (!currentIds.has(id)) {
          try {
            markers.current[id].marker.remove();
            markers.current[id].popup.remove();
            removedCount++;
          } catch (err) {}
          delete markers.current[id];
        }
      });
      
      if (removedCount > 0) {
        console.log('🗑️  Removed', removedCount, 'old markers');
      }

      // Add new markers
      let addedCount = 0;
      
      filteredSchools.forEach((school) => {
        const id = school["School No."] || school["English Name"];
        if (!id || markers.current[id]) return;
        
        const lng = parseFloat(school.Longitude || school.longitude || "");
        const lat = parseFloat(school.Latitude || school.latitude || "");

        if (isNaN(lng) || isNaN(lat)) {
          console.warn('⚠️ Invalid coordinates for', school["School Name"]);
          return;
        }

        // Create marker element
        const el = document.createElement('div');
        el.className = 'school-marker';
        el.style.width = '16px';
        el.style.height = '16px';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';
        el.style.transition = 'transform 0.2s ease';
        el.style.backgroundColor = getMarkerColor(school["School Level"]);
        el.style.zIndex = '10';
        
        // Hover effects
        const handleMouseEnter = () => {
          el.style.transform = 'scale(1.3)';
        };
        const handleMouseLeave = () => {
          el.style.transform = 'scale(1)';
        };

        el.addEventListener('mouseenter', handleMouseEnter);
        el.addEventListener('mouseleave', handleMouseLeave);

        // Create popup
        const popupContent = document.createElement('div');
        popupContent.style.padding = '8px';
        popupContent.style.maxWidth = '200px';
        popupContent.style.fontFamily = 'system-ui';

        const nameEl = document.createElement('p');
        nameEl.style.fontWeight = 'bold';
        nameEl.style.margin = '0 0 4px 0';
        nameEl.style.fontSize = '13px';
        nameEl.textContent = school["School Name"];
        popupContent.appendChild(nameEl);

        const englishNameEl = document.createElement('p');
        englishNameEl.style.fontSize = '12px';
        englishNameEl.style.color = '#666';
        englishNameEl.style.margin = '0';
        englishNameEl.textContent = school["English Name"];
        popupContent.appendChild(englishNameEl);

        const popup = new maplibregl.Popup({
          offset: [0, -10],
          closeButton: false,
          closeOnClick: false
        }).setDOMContent(popupContent);

        // Create and add marker
        try {
          const marker = new maplibregl.Marker(el)
            .setLngLat([lng, lat])
            .addTo(map.current!);

          // CLICK HANDLER
          const handleClick = (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            
            console.log('🎯 CLICKED:', school["School Name"]);

            // Remove old popup
            if (currentPopup.current) {
              try {
                currentPopup.current.remove();
              } catch (e) {}
            }

            // Show new popup
            popup.addTo(map.current!);
            currentPopup.current = popup;

            // Set selected school - THIS OPENS THE BOTTOM SHEET
            setSelectedSchool(school);

            // Zoom to school
            if (map.current) {
              map.current.flyTo({
                center: [lng, lat],
                zoom: 16,
                duration: 1000
              });
            }
          };

          el.addEventListener('click', handleClick);

          // Hover popup handlers
          el.addEventListener('mouseenter', () => {
            if (currentPopup.current !== popup) {
              if (currentPopup.current) {
                try {
                  currentPopup.current.remove();
                } catch (e) {}
              }
              popup.addTo(map.current!);
              currentPopup.current = popup;
            }
          });

          el.addEventListener('mouseleave', () => {
            // Only remove if it's still a hover (not selected)
            if (currentPopup.current === popup && 
                selectedSchool?.["School No."] !== school["School No."]) {
              try {
                popup.remove();
              } catch (e) {}
              currentPopup.current = null;
            }
          });

          markers.current[id] = { marker, popup };
          addedCount++;
        } catch (err) {
          console.error('Error creating marker:', err);
        }
      });

      console.log('✅ Added', addedCount, 'markers. Total:', Object.keys(markers.current).length);
    } catch (err) {
      console.error('Error updating markers:', err);
    }
  }, [filteredSchools, setSelectedSchool, isMapLoaded, selectedSchool]);

  // Sync map center when school selected
  useEffect(() => {
    if (!isMapLoaded || !selectedSchool || !map.current) return;

    try {
      const lng = parseFloat(selectedSchool.Longitude || "");
      const lat = parseFloat(selectedSchool.Latitude || "");
      
      if (!isNaN(lng) && !isNaN(lat)) {
        map.current.flyTo({
          center: [lng, lat],
          zoom: 16,
          duration: 1000
        });
      }
    } catch (err) {
      console.error('Error centering on selected school:', err);
    }
  }, [selectedSchool, isMapLoaded]);

  // Clean up popup when BottomSheet closes
  useEffect(() => {
    if (!selectedSchool && currentPopup.current) {
      try {
        currentPopup.current.remove();
        currentPopup.current = null;
      } catch (e) {}
    }
  }, [selectedSchool]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default Map;
