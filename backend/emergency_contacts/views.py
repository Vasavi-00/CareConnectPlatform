from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from accounts.models import FamilyElderRelationship

from .models import EmergencyContact
from .serializers import EmergencyContactSerializer


class EmergencyContactAccessMixin:

    def check_elder_access(
        self,
        elder_id,
        write=False,
    ):
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
                    "You can access only your own emergency contacts."
                )

            return elder_profile

        # ==============================================
        # FAMILY
        # ==============================================

        if user.role == "FAMILY":
            try:
                relationship = (
                    FamilyElderRelationship.objects
                    .select_related("elder", "family")
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
                and not relationship.can_manage_emergency_contacts
            ):
                raise PermissionDenied(
                    "You do not have permission to manage "
                    "emergency contacts."
                )

            return relationship.elder

        raise PermissionDenied(
            "You do not have permission to access "
            "emergency contacts."
        )


class EmergencyContactListCreateView(
    EmergencyContactAccessMixin,
    generics.ListCreateAPIView,
):
    permission_classes = [IsAuthenticated]
    serializer_class = EmergencyContactSerializer

    def get_queryset(self):
        elder_id = self.request.query_params.get(
            "elder_id"
        )

        if not elder_id:
            return EmergencyContact.objects.none()

        self.check_elder_access(
            elder_id=elder_id,
            write=False,
        )

        return (
            EmergencyContact.objects
            .filter(
                elder_id=elder_id
            )
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


class EmergencyContactDetailView(
    EmergencyContactAccessMixin,
    generics.RetrieveUpdateDestroyAPIView,
):
    permission_classes = [IsAuthenticated]
    serializer_class = EmergencyContactSerializer

    queryset = (
        EmergencyContact.objects
        .select_related(
            "elder",
            "elder__user",
        )
    )

    def get_object(self):
        contact = super().get_object()

        write = self.request.method in {
            "PUT",
            "PATCH",
            "DELETE",
        }

        self.check_elder_access(
            elder_id=contact.elder_id,
            write=write,
        )

        return contact

    def perform_update(self, serializer):
        contact = self.get_object()

        requested_elder_id = (
            self.request.data.get("elder_id")
        )

        if (
            requested_elder_id is not None
            and str(requested_elder_id)
            != str(contact.elder_id)
        ):
            raise PermissionDenied(
                "You cannot move an emergency contact "
                "to another elder."
            )

        serializer.save()