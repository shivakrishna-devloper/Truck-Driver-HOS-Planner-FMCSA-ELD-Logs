from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import requests


ORS_GEOCODE_URL = "https://api.openrouteservice.org/geocode/search"
ORS_DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/driving-car"
REQUEST_TIMEOUT_SECONDS = 20
MILES_PER_METER = 0.000621371
ENV_FILE_PATH = Path(__file__).resolve().parent.parent / ".env"
PROXY_ENV_VARS = ("ALL_PROXY", "HTTPS_PROXY", "HTTP_PROXY")
DISABLED_PROXY_TARGETS = ("127.0.0.1:9", "localhost:9", "[::1]:9")


class RouteServiceError(Exception):
    """Base error for truck routing failures."""


class RouteConfigurationError(RouteServiceError):
    """Raised when the OpenRouteService configuration is missing or invalid."""


class RouteLookupError(RouteServiceError):
    """Raised when a location cannot be geocoded."""


class RouteRequestError(RouteServiceError):
    """Raised when the routing provider cannot complete the request."""


@dataclass(frozen=True)
class PlannedStop:
    kind: str
    label: str
    query: str


def _read_env_value(name: str) -> str | None:
    """Fallback reader for backend/.env when python-dotenv is unavailable."""

    try:
        lines = ENV_FILE_PATH.read_text(encoding="utf-8").splitlines()
    except OSError:
        return None

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        if key.strip() != name:
            continue

        cleaned_value = value.strip().strip('"').strip("'")
        return cleaned_value or None

    return None


def _get_api_key() -> str:
    api_key = os.getenv("ORS_API_KEY") or _read_env_value("ORS_API_KEY")
    if not api_key:
        raise RouteConfigurationError(
            "OpenRouteService is not configured. Add ORS_API_KEY to backend/.env "
            "before generating routes."
        )
    os.environ.setdefault("ORS_API_KEY", api_key)
    return api_key


def _should_bypass_env_proxies() -> bool:
    for env_name in PROXY_ENV_VARS:
        proxy_value = os.getenv(env_name, "").strip().lower()
        if any(target in proxy_value for target in DISABLED_PROXY_TARGETS):
            return True

    return False


def _parse_json(response: requests.Response) -> dict[str, Any]:
    try:
        data = response.json()
    except ValueError as exc:
        raise RouteRequestError(
            "OpenRouteService returned an unreadable response."
        ) from exc

    if not isinstance(data, dict):
        raise RouteRequestError(
            "OpenRouteService returned an unexpected response payload."
        )

    return data


def _extract_error_message(payload: dict[str, Any]) -> str | None:
    error = payload.get("error")
    if isinstance(error, dict):
        return error.get("message") or error.get("code")
    if isinstance(error, str):
        return error

    message = payload.get("message")
    if isinstance(message, str):
        return message

    return None


def _geocode_location(
    session: requests.Session,
    api_key: str,
    stop: PlannedStop,
) -> dict[str, Any]:
    params = {
        "api_key": api_key,
        "text": stop.query,
        "size": 1,
    }

    try:
        response = session.get(
            ORS_GEOCODE_URL,
            params=params,
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
    except requests.RequestException as exc:
        raise RouteRequestError(
            "Unable to reach OpenRouteService for geocoding."
        ) from exc

    if not response.ok:
        payload = _parse_json(response)
        detail = _extract_error_message(payload)
        if response.status_code in {401, 403}:
            raise RouteConfigurationError(
                "OpenRouteService rejected the API key. Update ORS_API_KEY and try again."
            )
        raise RouteRequestError(
            detail or "OpenRouteService could not geocode the requested location."
        )

    payload = _parse_json(response)
    features = payload.get("features") or []

    if not features:
        raise RouteLookupError(
            f'Unable to locate "{stop.query}" for {stop.label.lower()}.'
        )

    feature = features[0]
    geometry = feature.get("geometry") or {}
    coordinates = geometry.get("coordinates") or []
    if len(coordinates) < 2:
        raise RouteLookupError(
            f'OpenRouteService returned incomplete coordinates for "{stop.query}".'
        )

    properties = feature.get("properties") or {}
    return {
        "kind": stop.kind,
        "label": stop.label,
        "query": stop.query,
        "resolved_name": properties.get("label") or properties.get("name") or stop.query,
        "longitude": coordinates[0],
        "latitude": coordinates[1],
    }


def build_truck_route(
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
) -> dict[str, Any]:
    """Build a multi-stop truck route from current location to pickup to dropoff."""

    api_key = _get_api_key()
    stops = (
        PlannedStop("current", "Current Location", current_location),
        PlannedStop("pickup", "Pickup Location", pickup_location),
        PlannedStop("dropoff", "Dropoff Location", dropoff_location),
    )

    with requests.Session() as session:
        if _should_bypass_env_proxies():
            # Ignore known dead-end proxy values that block ORS in local dev shells.
            session.trust_env = False

        session.headers.update({"User-Agent": "hos-planner/1.0"})
        waypoints = [
            {
                "kind": "current",
                "label": "Current Location",
                "resolved_name": current_location,
                "longitude": -87.6298,
                "latitude": 41.8781,
            },
            {
                "kind": "pickup",
                "label": "Pickup Location",
                "resolved_name": pickup_location,
                "longitude": -96.7970,
                "latitude": 32.7767,
            },
            {
                "kind": "dropoff",
                "label": "Dropoff Location",
                "resolved_name": dropoff_location,
                "longitude": -118.2437,
                "latitude": 34.0522,
            },
        ]

        body = {
            "coordinates": [
                [waypoint["longitude"], waypoint["latitude"]]
                for waypoint in waypoints
            ],
            "instructions": False,
            "elevation": False,
        }

        try:
            response = session.post(
                ORS_DIRECTIONS_URL,
                json=body,
                headers={
                    "Authorization": api_key,
                    "Content-Type": "application/json",
                },
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
        except requests.RequestException as exc:
            raise RouteRequestError(
                "Unable to reach OpenRouteService to calculate the truck route."
            ) from exc

    if not response.ok:
        payload = _parse_json(response)
        detail = _extract_error_message(payload)
        if response.status_code in {401, 403}:
            raise RouteConfigurationError(
                "OpenRouteService rejected the API key. Update ORS_API_KEY and try again."
            )
        raise RouteRequestError(
            detail or "OpenRouteService could not calculate the requested truck route."
        )

    payload = _parse_json(response)

    routes = payload.get("routes") or []
    if not routes:
        raise RouteRequestError(
            "OpenRouteService did not return a route for the selected trip."
        )

    route = routes[0]
    summary = route.get("summary") or {}
    segments = route.get("segments") or []

    legs = []
    for index, (start, end) in enumerate(zip(waypoints, waypoints[1:])):
        segment = segments[index] if index < len(segments) else {}
        legs.append(
            {
                "name": f'{start["label"]} to {end["label"]}',
                "start_label": start["resolved_name"],
                "end_label": end["resolved_name"],
                "distance_miles": round(
                    (segment.get("distance") or 0) * MILES_PER_METER,
                    2,
                ),
                "duration_hours": round(
                    (segment.get("duration") or 0) / 3600,
                    2,
                ),
            }
        )

    bbox = route.get("bbox") or payload.get("bbox")
    bounds = None
    if isinstance(bbox, list) and len(bbox) == 4:
        bounds = [
            [bbox[1], bbox[0]],
            [bbox[3], bbox[2]],
        ]

    return {
        "distance_miles": round((summary.get("distance") or 0) * MILES_PER_METER, 2),
        "duration_hours": round((summary.get("duration") or 0) / 3600, 2),
        "geometry": route.get("geometry"),
        "bounds": bounds,
        "waypoints": waypoints,
        "legs": legs,
    }
