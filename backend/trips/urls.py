from django.urls import path

from .views import TripCreateAPIView


urlpatterns = [
    path("create/", TripCreateAPIView.as_view(), name="trip-create"),
]
