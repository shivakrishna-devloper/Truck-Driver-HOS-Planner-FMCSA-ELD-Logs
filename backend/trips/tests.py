from unittest.mock import patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Trip


MOCK_ROUTE = {
    "distance_miles": 1810.4,
    "duration_hours": 31.25,
    "geometry": "mfp_Ih`vpA??",
    "bounds": [[41.88, -87.63], [34.05, -118.24]],
    "waypoints": [
        {
            "kind": "current",
            "label": "Current Location",
            "query": "Chicago, IL",
            "resolved_name": "Chicago, Illinois, United States",
            "longitude": -87.6298,
            "latitude": 41.8781,
        },
        {
            "kind": "pickup",
            "label": "Pickup Location",
            "query": "Dallas, TX",
            "resolved_name": "Dallas, Texas, United States",
            "longitude": -96.797,
            "latitude": 32.7767,
        },
        {
            "kind": "dropoff",
            "label": "Dropoff Location",
            "query": "Los Angeles, CA",
            "resolved_name": "Los Angeles, California, United States",
            "longitude": -118.2437,
            "latitude": 34.0522,
        },
    ],
    "legs": [
        {
            "name": "Current Location to Pickup Location",
            "start_label": "Chicago, Illinois, United States",
            "end_label": "Dallas, Texas, United States",
            "distance_miles": 924.5,
            "duration_hours": 14.8,
        },
        {
            "name": "Pickup Location to Dropoff Location",
            "start_label": "Dallas, Texas, United States",
            "end_label": "Los Angeles, California, United States",
            "distance_miles": 885.9,
            "duration_hours": 16.45,
        },
    ],
}


class TripCreateAPIViewTests(APITestCase):
    @patch("trips.views.build_truck_route", return_value=MOCK_ROUTE)
    def test_create_trip_returns_route_schedule_and_eld_logs(self, mocked_route):
        response = self.client.post(
            reverse("trip-create"),
            {
                "current_location": "Chicago, IL",
                "pickup_location": "Dallas, TX",
                "dropoff_location": "Los Angeles, CA",
                "current_cycle_used": 32,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        payload = response.json()

        self.assertEqual(payload["trip"]["total_distance"], MOCK_ROUTE["distance_miles"])
        self.assertGreater(len(payload["hos_schedule"]), 0)
        self.assertIn("eld_log", payload["hos_schedule"][0])
        self.assertIn("segments", payload["hos_schedule"][0]["eld_log"])
        self.assertEqual(Trip.objects.count(), 1)
        mocked_route.assert_called_once_with(
            current_location="Chicago, IL",
            pickup_location="Dallas, TX",
            dropoff_location="Los Angeles, CA",
        )

    def test_create_trip_validates_required_fields(self):
        response = self.client.post(
            reverse("trip-create"),
            {
                "current_location": "   ",
                "pickup_location": "",
                "dropoff_location": "Los Angeles, CA",
                "current_cycle_used": 75,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        payload = response.json()

        self.assertIn("errors", payload)
        self.assertEqual(Trip.objects.count(), 0)
