# Truck Driver HOS Planner & FMCSA ELD Logs

A full-stack logistics compliance application for truck route planning, Hours of Service (HOS) scheduling, and FMCSA-style Electronic Logging Device (ELD) daily log generation.

This project simulates a real trucking operations workflow by combining route planning, HOS calculations, compliance validation, and 24-hour duty status visualization into a single responsive web application.

---

# Features

## Route Planning
- Generate truck trip routes using pickup and dropoff locations
- Interactive route visualization with Leaflet maps
- Multi-stop logistics workflow support
- Distance and estimated duration calculation

## FMCSA Hours of Service (HOS)
- 11-hour driving limit validation
- 14-hour duty window calculations
- 30-minute mandatory break handling
- 70-hour / 8-day cycle calculations
- 10-hour off-duty reset logic
- Multi-day schedule generation

## FMCSA Daily ELD Logs
- 24-hour duty status timeline visualization
- Off Duty tracking
- Sleeper Berth tracking
- Driving status tracking
- On Duty (Not Driving) tracking
- Route-aware operational remarks
- Daily compliance summaries
- Duty status validation

## Compliance Validation
- FMCSA compliance badge generation
- HOS rule validation engine
- 24-hour duty log verification
- Violation detection support

## PDF Export
- Export FMCSA daily logs as downloadable PDF documents
- Includes:
  - Driver log summary
  - Duty status totals
  - Route remarks
  - Compliance information

## User Experience
- Responsive mobile-friendly UI
- Loading states
- Empty states
- Professional logistics workflow layout
- Clean operational dashboard structure

---

# Tech Stack

## Frontend
- React
- Vite
- Tailwind CSS
- React Router
- Axios
- React Leaflet
- jsPDF

## Backend
- Django
- Django REST Framework
- Python

## APIs & Services
- OpenRouteService API
- OpenStreetMap

---

# Project Structure

```bash
trucker-hos-app/
│
├── backend/
│   ├── hos/
│   ├── logs/
│   ├── services/
│   │   ├── route_service.py
│   │   ├── hos_calculator.py
│   │   └── eld_generator.py
│   ├── trips/
│   └── manage.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.jsx
│   └── package.json
│
└── README.md
```

---

# FMCSA Rules Implemented

## 11-Hour Driving Rule
Drivers may drive a maximum of 11 hours after 10 consecutive hours off duty.

## 14-Hour Duty Window
Drivers may not drive beyond the 14th consecutive hour after coming on duty.

## 30-Minute Break Requirement
Drivers must take a minimum 30-minute break after 8 cumulative driving hours.

## 70-Hour / 8-Day Cycle Rule
Drivers may not drive after accumulating 70 on-duty hours in 8 consecutive days.

## 10-Hour Reset
Drivers must complete a minimum 10-hour off-duty period before starting a new shift.

---

# Installation

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver
```

Backend runs on:

```bash
http://127.0.0.1:8000
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# Environment Variables

Create a `.env` file inside the backend directory.

```env
ORS_API_KEY=your_openrouteservice_api_key
```

Get API key from:

https://openrouteservice.org/

---

# API Endpoint

## Create Trip Route & HOS Logs

```http
POST /api/trips/create/
```

### Request Body

```json
{
  "current_location": "Chicago, IL",
  "pickup_location": "Dallas, TX",
  "dropoff_location": "Los Angeles, CA",
  "current_cycle_used": 32
}
```

### Response Includes

- Route geometry
- Distance calculation
- Estimated duration
- HOS schedules
- FMCSA compliance validation
- ELD log data
- Daily remarks/events

---

# Key Functionalities

## Interactive Route Visualization
Displays route geometry between current location, pickup point, and dropoff location.

## HOS Schedule Generation
Automatically calculates:
- driving hours
- break requirements
- cycle usage
- off-duty resets
- daily trip segmentation

## FMCSA ELD Timeline
Each day generates a 24-hour log containing:
- Off Duty
- Sleeper Berth
- Driving
- On Duty

## Compliance Engine
Detects violations such as:
- exceeded driving limits
- missing breaks
- exceeded cycle limits



---

# Future Improvements

Potential production enhancements:

- Driver authentication
- Fleet management system
- Real-time GPS tracking
- Driver mobile app integration
- ELD hardware integration
- DOT inspection mode
- Cloud deployment
- Persistent trip storage
- Role-based access control

---

# Deployment

## Recommended Deployment

### Frontend
- Vercel
- Netlify

### Backend
- Render
- Railway
- AWS

---

# Assessment Highlights

This project demonstrates:

- Full-stack application architecture
- REST API integration
- Domain-specific logistics workflows
- FMCSA compliance modeling
- Data visualization
- Frontend/backend coordination
- Responsive UI/UX design
- Real-world operational simulation

---

# Author

## Shiva Krishna Koduri

GitHub:
https://github.com/shivakrishna-devloper

