from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from services.eld_generator import attach_eld_logs
from services.hos_calculator import generate_hos_schedule
from services.route_service import (
    RouteConfigurationError,
    RouteLookupError,
    RouteRequestError,
    build_truck_route,
)

from .serializers import TripCreateSerializer, TripSerializer

import traceback


class TripCreateAPIView(APIView):
    def post(self, request):
        try:
            print("TRIP API HIT")

            serializer = TripCreateSerializer(data=request.data)

            if not serializer.is_valid():
                return Response(
                    {
                        "message": "Please correct the trip details and try again.",
                        "errors": serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            validated_data = serializer.validated_data

            try:
                route_data = build_truck_route(
                    current_location=validated_data["current_location"],
                    pickup_location=validated_data["pickup_location"],
                    dropoff_location=validated_data["dropoff_location"],
                )

            except RouteLookupError as exc:
                return Response(
                    {
                        "message": "We could not resolve one or more trip stops.",
                        "detail": str(exc),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            except RouteConfigurationError as exc:
                return Response(
                    {
                        "message": "Routing is not configured on the backend.",
                        "detail": str(exc),
                    },
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )

            except RouteRequestError as exc:
                return Response(
                    {
                        "message": "The route provider could not build this truck route.",
                        "detail": str(exc),
                    },
                    status=status.HTTP_502_BAD_GATEWAY,
                )

            hos_schedule = generate_hos_schedule(
                total_distance_miles=route_data["distance_miles"],
                current_cycle_used=validated_data["current_cycle_used"],
            )

            hos_schedule = attach_eld_logs(hos_schedule)

            with transaction.atomic():
                trip = serializer.save(
                    total_distance=route_data["distance_miles"],
                    estimated_duration=route_data["duration_hours"],
                )

            return Response(
                {
                    "message": "Route, HOS schedule, and ELD logs generated successfully.",
                    "trip": TripSerializer(trip).data,
                    "route": route_data,
                    "hos_schedule": hos_schedule,
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            print("UNHANDLED ERROR:")
            print(str(e))
            traceback.print_exc()

            return Response(
                {
                    "message": "Internal server error",
                    "detail": str(e),
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )