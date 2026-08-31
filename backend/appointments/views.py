from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from accounts.models import FamilyElderRelationship
from notifications.services import (
    create_appointment_notification,
)

from .models import Appointment
from .serializers import AppointmentSerializer


class AppointmentAccessMixin:

    def check_elder_access(self, elder_id, write=False):
        if not elder_id:
            raise PermissionDenied(
                "elder_id is required."
            )

        try:
            elder_id = int(elder_id)
        except (TypeError, ValueError):
            raise PermissionDenied(
                "Invalid elder_id."
            )

        user = self.request.user

        # ==============================================
        # ELDER
        # ==============================================

        if user.role == "ELDER":
            try:
                elder_profile = user.elder_profile
            except AttributeError:
                raise PermissionDenied(
                    "Elder profile not found."
                )

            if elder_profile.id != elder_id:
                raise PermissionDenied(
                    "You can access only your own appointments."
                )

            return elder_profile, None

        # ==============================================
        # FAMILY
        # ==============================================

        if user.role == "FAMILY":

            try:
                relationship = (
                    FamilyElderRelationship.objects
                    .select_related(
                        "elder",
                        "family"
                    )
                    .get(
                        family__user=user,
                        elder_id=elder_id,
                        is_active=True,
                    )
                )
            except FamilyElderRelationship.DoesNotExist:
                raise PermissionDenied(
                    "You are not connected to this elder."
                )

            if (
                write
                and not relationship.can_manage_appointments
            ):
                raise PermissionDenied(
                    "You do not have permission to manage "
                    "appointments for this elder."
                )

            return (
                relationship.elder,
                relationship.family
            )

        raise PermissionDenied(
            "You do not have permission to access appointments."
        )


# ============================================================
# LIST + CREATE
# ============================================================

class AppointmentListCreateView(
    AppointmentAccessMixin,
    generics.ListCreateAPIView
):
    permission_classes = [IsAuthenticated]
    serializer_class = AppointmentSerializer

    def get_queryset(self):
        elder_id = self.request.query_params.get(
            "elder_id"
        )

        if not elder_id:
            return Appointment.objects.none()

        self.check_elder_access(
            elder_id=elder_id,
            write=False
        )

        return (
            Appointment.objects
            .filter(elder_id=elder_id)
            .select_related(
                "elder",
                "elder__user",
                "created_by",
                "created_by__user",
            )
        )

    def perform_create(self, serializer):
        elder_id = self.request.data.get(
            "elder_id"
        )

        elder, family_profile = (
            self.check_elder_access(
                elder_id=elder_id,
                write=True
            )
        )

        if self.request.user.role != "FAMILY":
            raise PermissionDenied(
                "Only family members can create appointments."
            )

        appointment = serializer.save(
            elder=elder,
            created_by=family_profile
        )

        create_appointment_notification(
            elder=elder,
            appointment=appointment,
        )


# ============================================================
# RETRIEVE + UPDATE + DELETE
# ============================================================

class AppointmentDetailView(
    AppointmentAccessMixin,
    generics.RetrieveUpdateDestroyAPIView
):
    permission_classes = [IsAuthenticated]
    serializer_class = AppointmentSerializer

    queryset = (
        Appointment.objects
        .select_related(
            "elder",
            "elder__user",
            "created_by",
            "created_by__user",
        )
    )

    def get_object(self):
        appointment = super().get_object()

        write = self.request.method in {
            "PUT",
            "PATCH",
            "DELETE",
        }

        self.check_elder_access(
            elder_id=appointment.elder_id,
            write=write
        )

        return appointment

    def perform_update(self, serializer):
        appointment = self.get_object()

        requested_elder_id = (
            self.request.data.get("elder_id")
        )

        if (
            requested_elder_id is not None
            and str(requested_elder_id)
            != str(appointment.elder_id)
        ):
            raise PermissionDenied(
                "You cannot move an appointment "
                "to another elder."
            )

        serializer.save()