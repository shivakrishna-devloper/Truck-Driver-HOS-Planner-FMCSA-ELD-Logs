# Truck Driver HOS Planner - Setup & Configuration Guide

## Quick Start

### Backend Setup (Django + DRF)

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env from example
cp .env.example .env

# 5. Update .env with your OpenRouteService API key
# Get free API key at: https://openrouteservice.org

# 6. Apply migrations
python manage.py migrate

# 7. Create superuser (optional, for Django admin)
python manage.py createsuperuser

# 8. Run development server
python manage.py runserver
# Server runs at http://127.0.0.1:8000
```

### Frontend Setup (React + Vite)

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env from example
cp .env.example .env

# 4. Verify VITE_API_BASE_URL points to backend (default is correct)

# 5. Start development server
npm run dev
# Frontend runs at http://localhost:5173
```

## API Configuration

### OpenRouteService Setup

1. Visit https://openrouteservice.org
2. Sign up for a free account
3. Create an API key
4. Add to `backend/.env`:
   ```
   ORS_API_KEY=your_api_key_here
   ```

### CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:5173`
- `http://127.0.0.1:5173`

Update `backend/.env` if running on different ports:
```
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

## Environment Variables

### Backend (.env)

```
# Django Settings
DJANGO_SECRET_KEY=change-me-in-production
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DJANGO_CORS_ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
DJANGO_CSRF_TRUSTED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173
DJANGO_TIME_ZONE=UTC

# OpenRouteService API
ORS_API_KEY=your_openrouteservice_api_key
```

### Frontend (.env)

```
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Project Architecture

### Backend Structure

```
backend/
├── config/              # Django project configuration
│   ├── settings.py     # Settings, INSTALLED_APPS, middleware
│   ├── urls.py         # Root URL configuration
│   ├── asgi.py         # ASGI configuration
│   └── wsgi.py         # WSGI configuration
├── trips/              # Trip planning Django app
│   ├── models.py       # Trip model
│   ├── serializers.py  # Trip serializers for validation
│   ├── views.py        # TripCreateAPIView
│   ├── urls.py         # Trip URL routes
│   └── admin.py        # Django admin registration
├── hos/                # HOS-related app (reserved)
├── logs/               # Logs-related app (reserved)
├── services/           # Reusable business logic
│   ├── route_service.py      # OpenRouteService integration
│   ├── hos_calculator.py     # FMCSA HOS schedule generation
│   └── eld_generator.py      # ELD log generation
├── manage.py           # Django management script
├── db.sqlite3          # SQLite database
├── requirements.txt    # Python dependencies
└── .env.example        # Example environment file
```

### Frontend Structure

```
frontend/
├── src/
│   ├── components/     # Reusable React components
│   │   ├── Navbar.jsx                # Navigation bar
│   │   ├── TripForm.jsx              # Trip input form
│   │   ├── SummaryCards.jsx          # KPI cards
│   │   ├── RouteMap.jsx              # Leaflet map visualization
│   │   ├── HOSSchedule.jsx           # Multi-day HOS cards
│   │   ├── ELDLogSheet.jsx           # 24-hour ELD timeline
│   │   └── ...other components
│   ├── layouts/
│   │   └── DashboardLayout.jsx       # Main app layout
│   ├── pages/
│   │   └── HomePage.jsx              # Main page
│   ├── services/
│   │   └── api.js                    # Axios API client
│   ├── utils/
│   │   ├── formatters.js             # Formatting utilities
│   │   ├── eld.js                    # ELD logic helpers
│   │   └── dashboard.js              # Dashboard utilities
│   ├── App.jsx                       # Main App component
│   ├── main.jsx                      # React entry point
│   └── index.css                     # Tailwind CSS
├── public/             # Static assets
├── package.json        # npm dependencies
├── vite.config.js      # Vite configuration
├── .env.example        # Example environment file
└── index.html          # HTML template
```

## Core Features Explained

### 1. Trip Planning Workflow

**Input Form** → **Route Generation** → **HOS Calculation** → **ELD Log Generation** → **Visualization**

### 2. Route Generation (route_service.py)

- Uses OpenRouteService API for truck-specific routing
- Geocodes three stops: Current Location → Pickup → Dropoff
- Returns truck-safe `driving-hgv` geometry with polyline encoding
- Calculates leg distances and ETAs for each segment

### 3. HOS Calculation (hos_calculator.py)

Implements simplified FMCSA rules:
- **11-hour daily driving limit** (max driving per day)
- **14-hour duty window** (time from start of duty to end)
- **30-minute break requirement** after 8 cumulative driving hours
- **10-hour off-duty reset** minimum between duty periods
- **70-hour / 8-day cycle** tracking
- **60 mph planning speed** for ETA calculations

Generates multi-day schedules:
- Day 1 includes pickup time (1 hour)
- Splits driving if break is required
- Calculates daily cycle usage
- Determines off-duty reset needed

### 4. ELD Log Generation (eld_generator.py)

For each day, creates a 24-hour timeline:
- **Off Duty** segment (green)
- **Sleeper Berth** segment (emerald) - pre-trip rest
- **On Duty (Not Driving)** segment (yellow) - pre-trip inspection & paperwork
- **Driving** segments (blue) - split by 30-min break if needed
- **Break** segment (orange) - required after 8 hours
- **Off Duty Reset** (green) - required 10-hour window

Validates that all segments sum to exactly 24 hours.

### 5. ELD Visualization (ELDLogSheet.jsx)

Interactive 24-hour duty status chart featuring:
- Hour grid with 24 columns (0-23 hours)
- Four duty rows (Off Duty, Sleeper Berth, Driving, On Duty)
- Duty segment bars with labels and time ranges
- Visual duty transitions with connectors
- Real-time duty summary and cycle tracking
- Realistic trip event remarks

## API Endpoints

### POST /api/trips/create/

**Request:**
```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "Dallas, TX",
  "dropoff_location": "Los Angeles, CA",
  "current_cycle_used": 32
}
```

**Response:**
```json
{
  "message": "Route, HOS schedule, and ELD logs generated successfully.",
  "trip": {
    "id": 1,
    "current_location": "Chicago, IL",
    "pickup_location": "Dallas, TX",
    "dropoff_location": "Los Angeles, CA",
    "current_cycle_used": 32,
    "total_distance": 1419.27,
    "estimated_duration": 23.65,
    "created_at": "2026-05-11T10:30:00Z"
  },
  "route": {
    "distance_miles": 1419.27,
    "duration_hours": 23.65,
    "geometry": "encoded_polyline_string",
    "bounds": [[lat1, lon1], [lat2, lon2]],
    "waypoints": [...],
    "legs": [...]
  },
  "hos_schedule": [
    {
      "day": 1,
      "distance": 660,
      "driving_hours": 11,
      "break_hours": 0.5,
      "on_duty_not_driving": 1,
      "off_duty_hours": 10,
      "total_on_duty_hours": 11.5,
      "cycle_hours_used": 43.5,
      "cycle_remaining_hours": 26.5,
      "average_speed_mph": 60,
      "break_required": true,
      "eld_log": {
        "segments": [...],
        "remarks": [...],
        "shift": {...},
        "totals": {...}
      }
    },
    ...
  ]
}
```

## Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Build
```bash
cd frontend
npm run build
```

### Manual Testing Workflow

1. Start backend: `python manage.py runserver` (backend)
2. Start frontend: `npm run dev` (frontend)
3. Navigate to http://localhost:5173
4. Fill trip form:
   - Current Location: Chicago, IL
   - Pickup: Dallas, TX
   - Dropoff: Los Angeles, CA
   - Cycle Used: 32
5. Click "Generate Route & Logs"
6. Verify:
   - Route map appears with polyline
   - Summary cards show route details
   - HOS schedule displays multi-day cards
   - ELD logs render 24-hour timelines with segments

## Deployment

### Frontend (Vercel / Netlify)

1. Build: `npm run build`
2. Deploy `dist/` folder
3. Set environment variable:
   ```
   VITE_API_BASE_URL=https://your-backend-api.com/api
   ```

### Backend (Render / Railway / Fly.io)

1. Set environment variables:
   ```
   DJANGO_DEBUG=False
   DJANGO_SECRET_KEY=your-secret-key
   DJANGO_ALLOWED_HOSTS=your-domain.com
   DJANGO_CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
   DJANGO_CSRF_TRUSTED_ORIGINS=https://your-frontend-domain.com
   ORS_API_KEY=your_openrouteservice_api_key
   ```

2. Use PostgreSQL instead of SQLite:
   ```
   DATABASE_URL=postgresql://user:password@host/dbname
   ```

3. Collect static files:
   ```
   python manage.py collectstatic --noinput
   ```

4. Run migrations:
   ```
   python manage.py migrate
   ```

## Troubleshooting

### Route Generation Fails

- Verify `ORS_API_KEY` is valid in `backend/.env`
- Check that location names are geocodable (use city + state format)
- Ensure backend is running and accessible
- Check Django logs for detailed error messages

### CORS Errors

- Verify frontend URL matches `DJANGO_CORS_ALLOWED_ORIGINS`
- Check that backend is accessible from frontend
- Confirm `DJANGO_CSRF_TRUSTED_ORIGINS` includes frontend domain

### Map Not Showing

- Verify Leaflet CSS is loaded (check browser Network tab)
- Confirm `@mapbox/polyline` is installed
- Check that route geometry is being decoded correctly

### ELD Timeline Missing Segments

- Verify HOS calculator returned valid schedule
- Check that ELD log generation completed without errors
- Confirm all day totals equal 24 hours (within 0.01 hour tolerance)

## Performance Optimization

### Frontend
- Use React Router code splitting for lazy loading
- Memoize expensive computations with `useMemo`
- Defer non-critical updates with `useDeferredValue`
- Optimize map rendering with viewport management

### Backend
- Cache route geocoding results if repeat queries occur
- Use database indexing on frequently queried fields
- Consider async task queues for long-running operations

## Security Considerations

- Never commit `.env` files to version control
- Rotate `DJANGO_SECRET_KEY` regularly in production
- Use HTTPS in production for all endpoints
- Validate and sanitize all user input
- Implement rate limiting for API endpoints
- Use secure cookie settings in production

## Next Steps

1. Get OpenRouteService API key
2. Configure backend `.env` with API key
3. Run migrations
4. Start both servers
5. Test the complete workflow
6. Deploy to production when ready

For issues or questions, refer to the main README.md and component documentation.
