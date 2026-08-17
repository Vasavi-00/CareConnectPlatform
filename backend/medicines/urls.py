from django.urls import path

from .views import (
    MedicineListCreateView,
    MedicineDetailView,
)


urlpatterns = [
    path(
        "",
        MedicineListCreateView.as_view(),
        name="medicine-list-create",
    ),

    path(
        "<int:pk>/",
        MedicineDetailView.as_view(),
        name="medicine-detail",
    ),
]