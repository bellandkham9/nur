from rest_framework import serializers
from django.contrib.auth.models import User
from django.db import transaction

from .models import Profile, UserPreferences


from .models import UserPreferences


class UserPreferencesSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserPreferences
        fields = [
            "push_notifications_enabled",
            "event_reminders_enabled",
            "daily_reminder_enabled",
            "updated_at",
        ]
        read_only_fields = [
            "updated_at",
        ]


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8
    )

    password_confirm = serializers.CharField(
        write_only=True
    )

    country = serializers.CharField(
        write_only=True,
        max_length=100
    )

    class Meta:
        model = User

        fields = [
            "username",
            "email",
            "password",
            "password_confirm",
            "country",
        ]

    def validate_username(self, value):

        if User.objects.filter(
            username__iexact=value
        ).exists():

            raise serializers.ValidationError(
                "Ce nom d'utilisateur est déjà utilisé."
            )

        return value

    def validate_email(self, value):

        value = value.strip().lower()

        if User.objects.filter(
            email__iexact=value
        ).exists():

            raise serializers.ValidationError(
                "Cette adresse email est déjà utilisée."
            )

        return value

    def validate(self, attrs):

        if attrs["password"] != attrs["password_confirm"]:

            raise serializers.ValidationError({
                "password_confirm":
                    "Les mots de passe ne correspondent pas."
            })

        return attrs

    @transaction.atomic
    def create(self, validated_data):

        country = validated_data.pop("country")

        validated_data.pop("password_confirm")

        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            **validated_data
        )

        Profile.objects.create(
            user=user,
            country=country,
            display_name=user.username,
        )

        UserPreferences.objects.create(
            user=user
        )

        return user


class UserPreferencesSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserPreferences

        fields = [
            "push_notifications_enabled",
            "event_reminders_enabled",
            "daily_reminder_enabled",
            "updated_at",
        ]

        read_only_fields = [
            "updated_at",
        ]