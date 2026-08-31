from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from accounts.models import FamilyElderRelationship

from .models import Medicine
from .serializers import MedicineSerializer
from notifications.services import (
    create_medicine_notification,
)

class MedicineAccessMixin:
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

        # -----------------------------
        # ELDER
        # -----------------------------
        if user.role == "ELDER":
            try:
                elder_profile = user.elder_profile
            except AttributeError:
                raise PermissionDenied(
                    "Elder profile not found."
                )

            if elder_profile.id != elder_id:
                raise PermissionDenied(
                    "You can access only your own medicines."
                )

            return elder_profile

        # -----------------------------
        # FAMILY
        # -----------------------------
        if user.role == "FAMILY":
            try:
                relationship = (
                    FamilyElderRelationship.objects
                    .select_related("elder")
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

            if write and not relationship.can_manage_medicines:
                raise PermissionDenied(
                    "You do not have permission to manage medicines."
                )

            return relationship.elder

        raise PermissionDenied(
            "You do not have permission to access medicines."
        )


class MedicineListCreateView(
    MedicineAccessMixin,
    generics.ListCreateAPIView
):
    permission_classes = [IsAuthenticated]
    serializer_class = MedicineSerializer

    def get_queryset(self):
        elder_id = self.request.query_params.get(
            "elder_id"
        )

        if not elder_id:
            return Medicine.objects.none()

        self.check_elder_access(
            elder_id=elder_id,
            write=False,
        )

        return (
            Medicine.objects
            .filter(elder_id=elder_id)
            .select_related(
                "elder",
                "elder__user",
            )
        )

    def perform_create(self, serializer):
        elder_id = self.request.data.get(
            "elder_id"
        )

        elder = self.check_elder_access(
            elder_id=elder_id,
            write=True,
        )

        serializer.save(
            elder=elder
        )

        medicine = serializer.save(
            elder=elder
        )

        create_medicine_notification(
            elder=elder,
            medicine=medicine,
        )


class MedicineDetailView(
    MedicineAccessMixin,
    generics.RetrieveUpdateDestroyAPIView
):
    permission_classes = [IsAuthenticated]
    serializer_class = MedicineSerializer

    queryset = (
        Medicine.objects
        .select_related(
            "elder",
            "elder__user",
        )
    )

    def get_object(self):
        medicine = super().get_object()

        write = self.request.method in {
            "PUT",
            "PATCH",
            "DELETE",
        }

        self.check_elder_access(
            elder_id=medicine.elder_id,
            write=write,
        )

        return medicine

    def perform_update(self, serializer):
        medicine = self.get_object()

        requested_elder_id = (
            self.request.data.get("elder_id")
        )

        if (
            requested_elder_id is not None
            and str(requested_elder_id)
            != str(medicine.elder_id)
        ):
            raise PermissionDenied(
                "You cannot move a medicine to another elder."
            )

        serializer.save()