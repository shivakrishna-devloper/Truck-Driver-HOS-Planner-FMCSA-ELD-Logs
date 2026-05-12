# Quick Start Guide - Truck Driver HOS Planner

Get the application running in 5 minutes.

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn
- Valid OpenRouteService API key (free tier available)

## 30-Second Setup

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install and run
pip install -r requirements.txt
python manage.py migrate

# Create .env file
echo 'DJANGO_DEBUG=True
DJANGO_SECRET_KEY=dev-key-change-me
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
DJANGO_CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
DJANGO_CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
ORS_API_KEY=YOUR_API_KEY_HERE' > .env

# Run server
python manage.py runserver
```

Backend ready at: http://127.0.0.1:8000

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend ready at: http://localhost:5173

## First Trip (Test Data)

Form is pre-filled with:
- **Current Location**: Chicago, IL
- **Pickup**: Dallas, TX
- **Dropoff**: Los Angeles, CA
- **Cycle Used**: 32 hours

1. Ensure both servers are running
2. Go to http://localhost:5173
3. Click "Generate Route & Logs"
4. View the generated route, schedule, and ELD logs

## What You'll See

### Route Map
- Interactive map with truck route
- 3 markers: current location, pickup, dropoff
- Total distance and duration
- Leg breakdowns

### HOS Schedule
- Multi-day schedule cards
- Daily driving hours, breaks, resets
- Cycle usage tracking
- Compliance status badges

### ELD Logs
- 24-hour duty status timeline
- 4 duty rows: Off Duty, Sleeper, Driving, On Duty
- Realistic remarks and timestamps
- Driver metadata (driver name, truck number, etc.)

## API Test

```bash
# Test with curl
curl -X POST http://localhost:8000/api/trips/create/ \
  -H "Content-Type: application/json" \
  -d '{
    "current_location": "Chicago, IL",
    "pickup_location": "Dallas, TX",
    "dropoff_location": "Los Angeles, CA",
    "current_cycle_used": 32
  }'
```

## Troubleshooting

### "OpenRouteService is not configured"

Add your API key to `backend/.env`:
```
ORS_API_KEY=your_key_here
```

Restart backend: `python manage.py runserver`

### Map not showing

Ensure frontend can reach backend:
- Backend URL: http://127.0.0.1:8000
- Frontend: http://localhost:5173
- Check browser console for CORS errors

### Port already in use

Backend:
```bash
python manage.py runserver 8001
# Update CORS origins if changing port
```

Frontend:
```bash
npm run dev -- --port 5174
# Update VITE_API_BASE_URL if needed
```

## Project Structure

```
backend/
  config/        → Django configuration
  trips/         → Trip model & API
  services/      → HOS, routing, ELD logic
  manage.py      → Django CLI
  requirements.txt

frontend/
  src/
    components/  → React components
    pages/       → Page components
    utils/       → Helpers & formatters
    services/    → API client
  package.json
  vite.config.js
```

## Key Files

- **Backend HOS Logic**: `backend/services/hos_calculator.py`
- **Backend Route Service**: `backend/services/route_service.py`
- **Backend ELD Generator**: `backend/services/eld_generator.py`
- **Frontend Main Page**: `frontend/src/pages/HomePage.jsx`
- **Frontend ELD Display**: `frontend/src/components/ELDLogSheet.jsx`

## Next Steps

1. ✅ Get running locally
2. 📚 Read [SETUP.md](SETUP.md) for detailed config
3. 🏗️ Review [TECHNICAL.md](TECHNICAL.md) for architecture
4. 🚀 See [DEPLOYMENT.md](DEPLOYMENT.md) for production
5. 💾 Read [README.md](README.md) for feature overview

## Commands Reference

### Backend
```bash
cd backend

# Run server
python manage.py runserver

# Run tests
python manage.py test

# Create admin user
python manage.py createsuperuser

# Access admin
# http://127.0.0.1:8000/admin

# Database shell
python manage.py dbshell

# Make migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

### Frontend
```bash
cd frontend

# Dev server
npm run dev

# Build production
npm run build

# Preview build locally
npm run preview

# Lint code
npm run lint

# Install dependencies
npm install
```

## Docker Setup (Optional)

```bash
# Build containers
docker-compose build

# Run all services
docker-compose up

# Access:
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
# Django Admin: http://localhost:8000/admin
```

## Environment Variables Checklist

### Backend Required
- [ ] `ORS_API_KEY` - OpenRouteService API key

### Backend Optional (Defaults Provided)
- `DJANGO_SECRET_KEY` - Default OK for dev
- `DJANGO_DEBUG` - Set to False in production
- `DJANGO_ALLOWED_HOSTS` - Update for production
- `DJANGO_CORS_ALLOWED_ORIGINS` - Update for production

### Frontend Optional
- `VITE_API_BASE_URL` - Defaults to http://127.0.0.1:8000/api

## Support

### Resources
- [SETUP.md](SETUP.md) - Configuration guide
- [TECHNICAL.md](TECHNICAL.md) - Architecture details
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production guide
- [README.md](README.md) - Feature overview

### Getting Help

1. **Check logs** for error messages
2. **Review SETUP.md** for configuration
3. **Verify API key** is valid
4. **Test with curl** to isolate frontend vs backend
5. **Check environment variables** are set

## Performance Tips

1. Use Chrome DevTools to check network requests
2. Monitor API response times
3. Check backend logs for slow queries
4. Ensure ORS API responds quickly
5. Consider adding caching for repeated requests

## What This App Demonstrates

✅ Clean React architecture with Vite
✅ Django REST Framework API design
✅ FMCSA Hours of Service calculation
✅ Real truck routing integration
✅ Professional ELD visualization
✅ Responsive Tailwind CSS design
✅ Error handling and validation
✅ Cross-origin resource sharing
✅ Realistic data generation
✅ Production-ready patterns

## Time to First Output

- **Setup**: 2-3 minutes
- **First request**: < 5 seconds
- **Map render**: < 2 seconds
- **ELD visualization**: < 1 second

Total: **~5 minutes to see full working application**

---

Ready to get started? Run the 30-second setup above and begin exploring!

For detailed information, see the other documentation files.
