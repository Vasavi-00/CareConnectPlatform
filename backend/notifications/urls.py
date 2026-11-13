from django.urls import path

from .views import (
    NotificationListView,
    NotificationDetailView,
    NotificationMarkReadView,
    NotificationMarkAllReadView,
    NotificationUnreadCountView,
    SOSActivateView,
    FamilySOSEventListView,
    SOSLocationUpdateView,
    SOSCancelView,
)


urlpatterns = [
    path(
        "",
        NotificationListView.as_view(),
        name="notification-list",
    ),

    path(
        "unread-count/",
        NotificationUnreadCountView.as_view(),
        name="notification-unread-count",
    ),
    path("sos/activate/", SOSActivateView.as_view(), name="sos-activate"),
    path("sos/<int:pk>/location/", SOSLocationUpdateView.as_view(), name="sos-location-update"),
    path("sos/<int:pk>/cancel/", SOSCancelView.as_view(), name="sos-cancel"),
    path("sos/", FamilySOSEventListView.as_view(), name="sos-events"),
    path("sos/<int:pk>/", FamilySOSEventListView.as_view(), name="sos-event-detail"),

    path(
        "mark-all-read/",
        NotificationMarkAllReadView.as_view(),
        name="notification-mark-all-read",
    ),

    path(
        "<int:pk>/",
        NotificationDetailView.as_view(),
        name="notification-detail",
    ),

    path(
        "<int:pk>/read/",
        NotificationMarkReadView.as_view(),
        name="notification-mark-read",
    ),
]
