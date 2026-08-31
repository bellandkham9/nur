from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import UserPreferences
from .serializers import (
    RegisterSerializer,
    UserPreferencesSerializer,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        return Response(
            {
                "message": "Compte créé avec succès.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "country": user.profile.country,
                },
            },
            status=status.HTTP_201_CREATED,
        )

class CurrentUserView(APIView):

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):

        user = request.user

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
        })

class UserPreferencesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Récupère les informations de l'utilisateur
        connecté ainsi que ses préférences.
        """

        preferences, created = (
            UserPreferences.objects.get_or_create(
                user=request.user
            )
        )

        serializer = UserPreferencesSerializer(
            preferences
        )

        return Response(
            {
                "user": {
                    "id": request.user.id,
                    "username": request.user.username,
                    "email": request.user.email,
                },
                "preferences": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        """
        Modifie les préférences de l'utilisateur connecté.
        """

        preferences, created = (
            UserPreferences.objects.get_or_create(
                user=request.user
            )
        )

        serializer = UserPreferencesSerializer(
            preferences,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "user": {
                    "id": request.user.id,
                    "username": request.user.username,
                    "email": request.user.email,
                },
                "preferences": serializer.data,
            },
            status=status.HTTP_200_OK,
        )