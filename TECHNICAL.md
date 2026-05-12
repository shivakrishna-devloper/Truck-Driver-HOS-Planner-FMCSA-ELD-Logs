# Technical Implementation Guide

## Architecture Overview

### System Design

The Truck Driver HOS Planner uses a clean separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend (Vite)                   │
│  ┌──────────────┬──────────────┬──────────────┬────────────┐ │
│  │  Trip Form   │ Route Map    │ HOS Schedule │ ELD Logs   │ │
│  └──────────────┴──────────────┴──────────────┴────────────┘ │
│                           ↓                                   │
│                    Axios API Client                           │
└─────────────────────────────────────────────────────────────┘
                            ↓ POST /api/trips/create/
┌─────────────────────────────────────────────────────────────┐
│                Django REST Framework Backend                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              TripCreateAPIView (APIView)              │  │
│  └───────────────────────────────────────────────────────┘  │
│              ↓              ↓              ↓                  │
│  ┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │ Route Service    │ │ HOS Calculator│ │ ELD Generator    │ │
│  │ (OpenRouteServ) │ │ (FMCSA Logic)│ │ (Timeline Gen)   │ │
│  └──────────────────┘ └──────────────┘ └──────────────────┘ │
│              ↓              ↓              ↓                  │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │         Trip Model (SQLite Database)                   │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Backend Implementation Details

### 1. Route Service (route_service.py)

**Purpose**: Integrate OpenRouteService API for truck-specific routing

**Key Components**:
- `build_truck_route()` - Main entry point, orchestrates geocoding and routing
- `_geocode_location()` - Converts address text to lat/lng
- `_parse_json()` - Safely parses API responses
- `PlannedStop` dataclass - Represents a stop in the route

**Workflow**:
```
1. Validate ORS_API_KEY exists
2. Create PlannedStop objects for: current → pickup → dropoff
3. Geocode each stop:
   - Send location text to ORS geocode endpoint
   - Parse response, extract first result coordinates
   - Handle errors (location not found, invalid API key, etc.)
4. Build route request with coordinates
5. Call ORS directions endpoint with driving-hgv profile
6. Parse response:
   - Extract geometry (encoded polyline)
   - Extract leg summaries (distance, duration)
   - Extract bbox for map bounds
7. Return complete route object with all metadata
```

**Error Handling**:
- `RouteConfigurationError`: Missing or invalid API key
- `RouteLookupError`: Location cannot be geocoded
- `RouteRequestError`: API request fails or returns invalid data

### 2. HOS Calculator (hos_calculator.py)

**Purpose**: Generate multi-day FMCSA-compliant Hours of Service schedules

**FMCSA Rules Implemented**:

| Rule | Value | Implementation |
|------|-------|-----------------|
| Max Driving Hours | 11 hrs/day | `MAX_DRIVING_HOURS = 11.0` |
| Duty Window | 14 hrs | Implicit (on-duty + off-duty = 24 hrs) |
| Break Requirement | 30 min after 8 hrs | If `driving_hours >= 8`: insert 0.5 hr break |
| Off-Duty Reset | 10 hrs minimum | `MIN_OFF_DUTY_HOURS = 10.0` |
| Cycle Limit | 70 hrs / 8 days | Tracked in schedule, projected forward |
| Planning Speed | 60 mph | `AVERAGE_SPEED_MPH = 60.0` |

**Key Algorithm** (`generate_hos_schedule`):
```
1. Input: total_distance_miles, current_cycle_used
2. remaining_distance = total_distance_miles
3. cycle_hours_used = current_cycle_used
4. day_number = 1

5. WHILE remaining_distance > 0:
   a. distance_today = min(remaining_distance, 660 miles)  // 11 hrs @ 60 mph
   b. driving_hours = distance_today / 60
   c. break_required = driving_hours >= 8
   d. break_hours = 0.5 if break_required else 0
   e. on_duty_not_driving = 1  // pre-trip inspection
   f. total_on_duty = driving_hours + break_hours + on_duty_not_driving
   g. off_duty_hours = max(10, 24 - total_on_duty)
   
   h. cycle_hours_used += total_on_duty_hours
   
   i. Create day object with all metrics
   j. Append to schedule
   
   k. remaining_distance -= distance_today
   l. day_number += 1

6. Return schedule (list of day objects)
```

**Example Output**:
```json
{
  "day": 1,
  "distance": 660,
  "driving_hours": 11.0,
  "break_hours": 0.5,
  "on_duty_not_driving": 1.0,
  "off_duty_hours": 10.5,
  "total_on_duty_hours": 12.5,
  "cycle_hours_used": 44.5,
  "cycle_remaining_hours": 25.5,
  "average_speed_mph": 60,
  "break_required": true
}
```

### 3. ELD Generator (eld_generator.py)

**Purpose**: Create FMCSA-style 24-hour duty status timelines for each day

**Key Functions**:

#### `generate_eld_log(day_schedule)`
Creates timeline segments for a single day.

**Segment Order**:
1. **Sleeper Berth** (0 to ~7 hours)
   - Pre-trip rest period
   - Duration: min(7, available_off_duty)

2. **On Duty (Not Driving)** (~7 to ~8 hours)
   - Pre-trip inspection, dispatch review, paperwork
   - Duration: 1 hour (fixed)

3. **First Driving Block** (~8 to ~16 hours)
   - Duration: min(8, total_driving_hours) if break needed, else all driving

4. **30-Minute Break** (~16 to ~16.5 hours) [optional]
   - Only if total driving >= 8 hours
   - Duration: 0.5 hours

5. **Second Driving Block** (~16.5 to ~19.5 hours) [optional]
   - Remaining driving after break
   - Duration: total_driving_hours - first_block

6. **Off Duty (Post-trip)** (~19.5 to ~24 hours)
   - Post-delivery reset
   - Duration: remaining hours to reach 24

**24-Hour Validation**:
```
total_hours = sum(all_segment_durations)
if abs(total_hours - 24) > 0.01:
    adjustment = 24 - total_hours
    last_segment.end += adjustment
    last_segment.duration += adjustment
```

#### `attach_eld_logs(hos_schedule)`
Augments each HOS day with ELD log data.

```python
for day in hos_schedule:
    day['eld_log'] = generate_eld_log(day)
```

**ELD Log Structure**:
```json
{
  "segments": [
    {
      "status": "sleeper_berth|on_duty|driving|break|off_duty",
      "row": "sleeper_berth|on_duty|driving|off_duty",
      "label": "Display label",
      "start": 0.0,
      "end": 7.0,
      "duration": 7.0
    }
  ],
  "remarks": [
    "Pre-trip inspection logged from...",
    "Required 30-minute break completed..."
  ],
  "shift": {
    "start": 7.0,
    "end": 19.5
  },
  "totals": {
    "sleeper_berth_hours": 7.0,
    "post_trip_off_duty_hours": 4.5
  }
}
```

## Frontend Implementation Details

### Component Architecture

#### 1. TripForm.jsx
**Responsibility**: User input collection

**Form Fields**:
- Current Location (text input)
- Pickup Location (text input)
- Dropoff Location (text input)
- Current Cycle Used (number input, 0-70)

**Features**:
- Real-time input validation
- Error message display
- Loading state management
- Planner assumptions sidebar
- Sample workflow sidebar

**State Management**:
- Managed at HomePage level (passed via props)
- Controlled inputs with onChange handler

#### 2. RouteMap.jsx
**Responsibility**: Visualize truck route on interactive map

**Dependencies**: React Leaflet, @mapbox/polyline

**Features**:
- Decode polyline geometry from route response
- Render map with CARTO light basemap
- Create custom markers for current/pickup/dropoff
- Render route polyline with teal color
- Auto-zoom to route bounds
- Display dispatch leg summaries
- Show stop order with numbers

**Marker Colors**:
- Current Location: Dark (slate-900)
- Pickup: Amber (gold)
- Dropoff: Blue (sky-700)

#### 3. SummaryCards.jsx
**Responsibility**: Display KPI metrics

**Cards** (6 total):
1. Total Distance
2. Estimated Drive Time
3. Driving Days
4. Current Cycle Used
5. Remaining Cycle Hours
6. Total On Duty

**Features**:
- Live badge indicator
- Icon for each card
- Fallback display when no data
- Responsive grid layout

#### 4. HOSSchedule.jsx
**Responsibility**: Display multi-day HOS planning

**Features** (per day):
- Day number and compliance status badge
- Distance traveled
- Shift window (formatted time range)
- Cycle usage breakdown
- 4-column metric display:
  - Driving hours
  - Break + On Duty
  - Off Duty Reset
  - Cycle Remaining
- Duty sequence text
- Dispatch notes

#### 5. ELDLogSheet.jsx
**Responsibility**: Render 24-hour FMCSA-style daily log

**Components**:
- Metadata fields (driver, carrier, truck, trailer, shipment ID)
- Duty status chart
- Legend
- Metrics (miles, driving time, shift window, cycle)
- Duty summary
- Event remarks timeline
- Driver certification

**Duty Status Chart**:
```
                 Hour Grid (0-23)
            ┌────────────────────────────┐
Off Duty   │  [segment]  [segment]       │
Sleeper    │  [segment]                  │
Driving    │            [segment][BREAK] │
On Duty    │  [segment]                  │
            └────────────────────────────┘

Features:
- Hourly grid lines (solid every 4 hrs)
- Row separators
- Segment bars with labels
- Visual transitions between rows
- Tooltip on hover
```

**Color Scheme**:
- Off Duty: Green (#10b981)
- Sleeper Berth: Emerald (#059669)
- Driving: Blue (#2563eb)
- Break: Orange (#f97316)
- On Duty: Amber (#fcd34d)

### Utility Functions

#### formatters.js
- `formatDecimal(value)` - Format numbers with appropriate decimals
- `formatMiles(value)` - Format with "mi" suffix
- `formatHours(value)` - Format with "hrs" suffix
- `formatTimelineLabel(hour)` - Convert 24-hr to 12-hr AM/PM
- `formatTimelineTime(value)` - Format as HH:MM
- `formatTimelineRange(start, end)` - Format range as HH:MM-HH:MM
- `formatCycleWindow(current, limit)` - Format as "X / 70h"
- `formatLongDate(value)` - Format as "Month Day, Year"

#### eld.js
- `buildDisplayLog(eldLog)` - Normalize segments, calculate totals, validate 24-hour
- `buildDriverMetadata(trip, route, day, totalDays)` - Generate realistic driver/carrier info
- `buildDayLocations(trip, route, dayNumber, totalDays)` - Determine location labels
- `buildEldRemarks(segments)` - Create realistic trip event timeline
- `getDutyStatusLabel(status)` - Map status to display text

**Metadata Generation**:
- Uses seeded random selection based on trip ID hash
- Generates realistic names, carrier names, truck numbers
- Creates shipment IDs with trip ID and day number
- Determines locations based on trip sequence

## Frontend-Backend Integration

### API Call Flow

```
1. User fills TripForm and clicks "Generate Route & Logs"
2. HomePage.handleSubmit() invoked
3. Axios POST to /api/trips/create/ with form data
4. Django TripCreateAPIView.post() receives request
5. Deserialize and validate with TripCreateSerializer
6. Call route_service.build_truck_route()
7. Call hos_calculator.generate_hos_schedule()
8. Call eld_generator.attach_eld_logs()
9. Save Trip model to database
10. Return 201 response with trip, route, hos_schedule
11. React receives response
12. startTransition() updates plannerData state
13. Components re-render with new data
14. Maps are rendered
15. ELD logs appear
```

### Error Handling

**Backend Errors** → **Frontend Display**:
- 400 Bad Request → Display validation errors
- 502 Bad Gateway → "Route provider error" message
- 503 Service Unavailable → "Routing not configured" message
- 500 Internal Server Error → Generic error message

## Performance Optimizations

### Frontend
- `useDeferredValue()` defers HOS schedule rendering
- `startTransition()` marks non-urgent state updates
- Lazy component loading with React Router (not implemented yet, but recommended)
- Memoized event remarks building

### Backend
- Atomic database transaction for trip saving
- Connection pooling via requests.Session
- Single geocoding call per stop (not cached, but can be added)

## Security Practices

### Backend
- Input validation with Django serializers
- CSRF protection enabled
- CORS headers configured
- API key stored in environment variables
- SQL injection protection via ORM

### Frontend
- API base URL configurable via environment
- XSS protection via React (automatic escaping)
- CSRF token handled by Axios via Django

## Testing Strategy

### Unit Tests (Backend)
```python
# Test HOS calculator
- test_11_hour_driving_limit()
- test_break_requirement_after_8_hours()
- test_30_minute_break_duration()
- test_10_hour_reset_minimum()
- test_70_hour_cycle_tracking()
- test_multi_day_schedule_generation()

# Test ELD generator
- test_24_hour_validation()
- test_segment_ordering()
- test_break_insertion_logic()
```

### Integration Tests (API)
```python
# Test complete POST /api/trips/create/ flow
- test_valid_trip_creation()
- test_invalid_location_handling()
- test_missing_api_key_handling()
- test_response_shape()
```

### Manual Frontend Testing
1. Fill form with valid locations
2. Verify route map renders
3. Verify summary cards display correct values
4. Verify HOS schedule shows all days
5. Verify ELD logs display 24-hour timelines
6. Verify all segments sum to 24 hours
7. Verify remarks are realistic and timestamped
8. Verify compliance status badges update correctly

## Scalability Considerations

### Current Limitations
- Single backend server (not distributed)
- SQLite database (single machine only)
- Synchronous API calls (no async/await on backend)
- No caching layer

### Scaling Path
1. **Add PostgreSQL** for persistent database
2. **Add Redis** for caching geocoding results
3. **Implement async tasks** with Celery for long-running operations
4. **Deploy with gunicorn + nginx** for production
5. **Add database indexing** on Trip.created_at, location fields
6. **Implement API rate limiting** to prevent abuse
7. **Add request/response caching** headers

## Code Quality

### Backend
- PEP 8 compliant
- Type hints in service modules
- Descriptive function names
- Error handling with custom exceptions
- Clean separation of concerns (models, serializers, views, services)

### Frontend
- ES6+ JavaScript
- Consistent naming conventions
- Component composition over duplication
- Reusable utility functions
- Tailwind CSS utility classes

## Future Enhancements

### Short-term
1. Add trip history/dashboard
2. Implement trip editing/updates
3. Add PDF export for ELD logs
4. Add real-time route optimization

### Medium-term
1. Multi-user support with authentication
2. Fleet management features
3. Driver performance analytics
4. Mobile app (React Native)

### Long-term
1. Machine learning for route optimization
2. Real-time traffic integration
3. Predictive maintenance alerts
4. IoT device integration (GPS, fuel, telemetry)
