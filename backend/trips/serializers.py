from rest_framework import serializers

from .models import Trip


def _clean_location(value: str, label: str) -> str:
    cleaned = value.strip()
    if not cleaned:
        raise serializers.ValidationError(f"{label} is required.")
    return cleaned


class TripCreateSerializer(serializers.ModelSerializer):
    current_cycle_used = serializers.FloatField(min_value=0, max_value=70)

    class Meta:
        model = Trip
        fields = (
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_used",
        )

    def validate_current_location(self, value: str) -> str:
        return _clean_location(value, "Current location")

    def validate_pickup_location(self, value: str) -> str:
        return _clean_location(value, "Pickup location")

    def validate_dropoff_location(self, value: str) -> str:
        return _clean_location(value, "Dropoff location")


class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = (
            "id",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_used",
            "total_distance",
            "estimated_duration",
            "created_at",
        )
