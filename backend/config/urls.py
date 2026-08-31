from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path(
    "api/medicines/",
    include("medicines.urls")),
    path(
    "api/appointments/",
    include("appointments.urls")),
    path(
    "api/emergency-contacts/",
    include("emergency_contacts.urls")),
    path(
    "api/notifications/",
    include("notifications.urls")
),

]