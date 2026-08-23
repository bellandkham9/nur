from django.shortcuts import render

# Create your views here.
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import UserPreferences
from rest_framework.permissions import AllowAny

from .serializers import (
    RegisterSerializer,
    UserPreferencesSerializer,
)

from .models import UserPreferences


class RegisterView(APIView):

    permission_classes = [
        AllowAny,
    ]

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
                }
            },
            status=status.HTTP_201_CREATED,
        )




class UserPreferencesView(APIView):

    permission_classes = [
        IsAuthenticated,
    ]

    def get(self, request):
        """
        Récupère les préférences de l'utilisateur connecté.
        """

        preferences, created = UserPreferences.objects.get_or_create(
            user=request.user
        )

        serializer = UserPreferencesSerializer(
            preferences
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        """
        Modifie les préférences de l'utilisateur connecté.
        """

        preferences, created = UserPreferences.objects.get_or_create(
            user=request.user
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
            serializer.data,
            status=status.HTTP_200_OK,
        )