# HK School Finder 香港學校地圖

A modern, mobile-first web app that helps families in Hong Kong find schools and plan their commute. Search by school name, filter by criteria (level, gender, financing type, religion), and visualize schools on an interactive map with built-in MTR commute information.

## Features

- **Interactive Map**: Real-time visualization of all Hong Kong schools with clustering for better performance
- **Smart Search**: Quick-search schools by name in English or Chinese
- **Advanced Filtering**: Filter by school level (kindergarten, primary, secondary), gender, financing type, and religion
- **Commute Insights**: See the nearest MTR exits and estimated walking times from each school
- **School Net Support**: Identify and highlight the geographic school net boundaries for your area
- **Bilingual Interface**: Full English and Chinese (Traditional) support
- **Mobile-Optimized**: Responsive design perfect for browsing on your phone
- **Offline Ready**: PWA support enables offline access to cached school data
- **Real-time Data**: Powered by official Hong Kong EDB (Education Bureau) school data from Data.gov.hk

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd hk_school_finder
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with any required environment variables:
   ```bash
   # Add environment variables as needed
   ```

### Running Locally

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or another port if specified).

### Building for Production

```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Tech Stack

| Category | Technology |
|----------|-------------|
| Framework | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 4 |
| Map Library | MapLibre GL |
| State Management | Zustand |
| UI Components | Lucide React, Framer Motion |
| Server | Express.js |
| Deployment | Vercel |
| Data Fetching | Axios with Turf.js for geospatial calculations |

## How to Use

1. **Search**: Type a school name in the search bar to find schools
2. **Filter**: Use the filter bar to narrow results by:
   - School Level (Kindergarten, Primary, Secondary)
   - Gender (Coeducational, Boys Only, Girls Only)
   - Financing Type (Government, Aided, Direct Subsidy Scheme, Private)
   - Religion
3. **Explore the Map**: 
   - Zoom and pan to navigate Hong Kong
   - Click a school marker to view details
4. **Check Commute**: When you select a school, see the nearest MTR exits and walking times
5. **Identify School Net**: The app highlights your school net area based on your selection or current location

## Data Source

This app uses official data from:
- **Hong Kong Education Bureau (EDB)**: School location, information, and net boundaries
- **Data.gov.hk**: Open government datasets
- **Google Maps & OpenStreetMap**: Base map layers (via MapLibre GL)

## Development Roadmap

The app is built in phases:

### Phase 1: ✅ Data & Map Foundation
- ✅ Vite + React + TypeScript setup with Tailwind CSS
- ✅ EDB API data integration
- ✅ Full-screen mobile-friendly map
- ✅ School marker visualization and clustering

### Phase 2: ✅ Commute Logic & UI Polish  
- ✅ MTR integration for nearest exits
- ✅ Commute time calculations
- ✅ Glassmorphism-styled bottom sheet
- ✅ Bilingual UI

### Phase 3: 🚀 School Net Geometry (In Progress)
- 🚀 GeoJSON school net boundaries
- 🚀 Spatial filtering
- 🚀 PWA finalization

## Project Structure

```
├── src/
│   ├── components/        # React components (Map, SearchBar, FilterBar, BottomSheet)
│   ├── services.ts        # API and data fetching services
│   ├── store.ts           # Zustand state management
│   ├── types.ts           # TypeScript type definitions
│   ├── utils.ts           # Utility functions
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── api/                   # Backend API routes (Express.js)
├── server.ts              # Express server setup
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Feedback

Have suggestions or found a bug? Please open an issue on GitHub or contact the maintainers.

---

**Built with ❤️ for Hong Kong families**
