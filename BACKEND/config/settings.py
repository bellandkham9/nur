"""
Django settings for config project.

Bahá'í Companion
Production-ready configuration
"""

from pathlib import Path
from datetime import timedelta
import os

from dotenv import load_dotenv
from celery.schedules import crontab


# ==========================================================
# BASE
# ==========================================================

BASE_DIR = Path(__file__).resolve().parent.parent

# Charge le fichier .env situé dans BACKEND/
load_dotenv(BASE_DIR / ".env")


# ==========================================================
# SECURITY
# ==========================================================

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")

if not SECRET_KEY:
    raise RuntimeError(
        "DJANGO_SECRET_KEY n'est pas définie dans le fichier .env"
    )


DEBUG = os.getenv(
    "DEBUG",
    "False",
).lower() == "true"


ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "ALLOWED_HOSTS",
        "",
    ).split(",")
    if host.strip()
]


# ==========================================================
# APPLICATIONS
# ==========================================================

INSTALLED_APPS = [

    # ------------------------------------------------------
    # Third-party
    # ------------------------------------------------------

    "corsheaders",

    "rest_framework",

    # ------------------------------------------------------
    # Django
    # ------------------------------------------------------

    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # ------------------------------------------------------
    # Bahá'í Companion
    # ------------------------------------------------------

    "apps.accounts",
    "apps.communities",
    "apps.activities",
    "apps.myCalendar",
    "apps.bahai_calendar",
    "apps.personal_events",
    "apps.document_imports",
    "apps.events",
    "apps.notifications",
    "apps.quiz",
    "apps.daily_quotes",
]


# ==========================================================
# MIDDLEWARE
# ==========================================================

MIDDLEWARE = [

    "django.middleware.security.SecurityMiddleware",

    "corsheaders.middleware.CorsMiddleware",

    "django.contrib.sessions.middleware.SessionMiddleware",

    "django.middleware.common.CommonMiddleware",

    "django.middleware.csrf.CsrfViewMiddleware",

    "django.contrib.auth.middleware.AuthenticationMiddleware",

    "django.contrib.messages.middleware.MessageMiddleware",

    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ==========================================================
# URLS
# ==========================================================

ROOT_URLCONF = "config.urls"


# ==========================================================
# TEMPLATES
# ==========================================================

TEMPLATES = [

    {
        "BACKEND":
            "django.template.backends.django.DjangoTemplates",

        "DIRS": [],

        "APP_DIRS": True,

        "OPTIONS": {

            "context_processors": [

                "django.template.context_processors.request",

                "django.contrib.auth.context_processors.auth",

                "django.contrib.messages.context_processors.messages",

            ],

        },

    },

]


# ==========================================================
# WSGI
# ==========================================================

WSGI_APPLICATION = "config.wsgi.application"


# ==========================================================
# DATABASE
# ==========================================================

DATABASES = {

    "default": {

        "ENGINE":
            "django.db.backends.postgresql",

        "NAME":
            os.getenv("DB_NAME"),

        "USER":
            os.getenv("DB_USER"),

        "PASSWORD":
            os.getenv("DB_PASSWORD"),

        "HOST":
            os.getenv(
                "DB_HOST",
                "127.0.0.1",
            ),

        "PORT":
            os.getenv(
                "DB_PORT",
                "5433",
            ),
        "OPTIONS": {
            "sslmode": "require",
        },
    }

}


# ==========================================================
# PASSWORD VALIDATION
# ==========================================================

AUTH_PASSWORD_VALIDATORS = [

    {
        "NAME":
            "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },

    {
        "NAME":
            "django.contrib.auth.password_validation.MinimumLengthValidator",
    },

    {
        "NAME":
            "django.contrib.auth.password_validation.CommonPasswordValidator",
    },

    {
        "NAME":
            "django.contrib.auth.password_validation.NumericPasswordValidator",
    },

]


# ==========================================================
# INTERNATIONALIZATION
# ==========================================================

LANGUAGE_CODE = "fr-fr"

TIME_ZONE = "Africa/Brazzaville"

USE_I18N = True

USE_TZ = True


# ==========================================================
# CORS
# ==========================================================

CORS_ALLOWED_ORIGINS = [

    origin.strip()

    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "",
    ).split(",")

    if origin.strip()

]


CORS_ALLOW_CREDENTIALS = True


# ==========================================================
# CSRF
# ==========================================================

CSRF_TRUSTED_ORIGINS = [

    origin.strip()

    for origin in os.getenv(
        "CSRF_TRUSTED_ORIGINS",
        "",
    ).split(",")

    if origin.strip()

]


# ==========================================================
# DJANGO REST FRAMEWORK
# ==========================================================

REST_FRAMEWORK = {

    "DEFAULT_AUTHENTICATION_CLASSES": (

        "rest_framework_simplejwt.authentication.JWTAuthentication",

    ),

    "DEFAULT_PERMISSION_CLASSES": (

        "rest_framework.permissions.IsAuthenticated",

    ),

}


# ==========================================================
# SIMPLE JWT
# ==========================================================

SIMPLE_JWT = {

    "ACCESS_TOKEN_LIFETIME":
        timedelta(minutes=30),

    "REFRESH_TOKEN_LIFETIME":
        timedelta(days=7),

    "ROTATE_REFRESH_TOKENS":
        True,

    "BLACKLIST_AFTER_ROTATION":
        True,

    "AUTH_HEADER_TYPES":
        ("Bearer",),

}


# ==========================================================
# EMAIL
# ==========================================================

# ==========================================================
# EMAIL
# ==========================================================

EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.console.EmailBackend",
)

EMAIL_HOST = os.getenv(
    "EMAIL_HOST",
    "",
)

EMAIL_PORT = int(
    os.getenv(
        "EMAIL_PORT",
        "587",
    )
)

EMAIL_HOST_USER = os.getenv(
    "EMAIL_HOST_USER",
    "",
)

EMAIL_HOST_PASSWORD = os.getenv(
    "EMAIL_HOST_PASSWORD",
    "",
)

EMAIL_USE_TLS = os.getenv(
    "EMAIL_USE_TLS",
    "True",
).lower() == "true"

EMAIL_USE_SSL = os.getenv(
    "EMAIL_USE_SSL",
    "False",
).lower() == "true"

DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    "Bahá'í Companion <noreply@example.com>",
)
# ==========================================================
# STATIC FILES
# ==========================================================

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


# ==========================================================
# MEDIA FILES
# ==========================================================

MEDIA_URL = "/media/"

MEDIA_ROOT = BASE_DIR / "media"


# ==========================================================
# VAPID / WEB PUSH
# ==========================================================

VAPID_PUBLIC_KEY = os.getenv(
    "VAPID_PUBLIC_KEY",
    "",
)

VAPID_PRIVATE_KEY = os.getenv(
    "VAPID_PRIVATE_KEY",
    "",
)

VAPID_EMAIL = os.getenv(
    "VAPID_EMAIL",
    "mailto:bellandkham9@gmail.com",
)


# ==========================================================
# CELERY
# ==========================================================

CELERY_BROKER_URL = os.getenv(
    "CELERY_BROKER_URL",
    "redis://127.0.0.1:6379/0",
)

CELERY_RESULT_BACKEND = os.getenv(
    "CELERY_RESULT_BACKEND",
    "redis://127.0.0.1:6379/0",
)

CELERY_ACCEPT_CONTENT = [
    "json",
]

CELERY_TASK_SERIALIZER = "json"

CELERY_RESULT_SERIALIZER = "json"

CELERY_ENABLE_UTC = True

CELERY_TIMEZONE = "Africa/Brazzaville"


# ==========================================================
# CELERY BEAT
# ==========================================================

CELERY_BEAT_SCHEDULE = {

    # ------------------------------------------------------
    # Notifications programmées
    # ------------------------------------------------------

    "process-notifications-every-minute": {

        "task":
            "apps.notifications.tasks.process_notifications_task",

        "schedule":
            60.0,

    },


    # ------------------------------------------------------
    # Citation du matin
    # ------------------------------------------------------

    "daily-quote-morning": {

        "task":
            "daily_quotes.send_morning_quote",

        "schedule":
            crontab(
                hour=8,
                minute=0,
            ),

    },


    # ------------------------------------------------------
    # Citation du soir
    # ------------------------------------------------------

    "daily-quote-evening": {

        "task":
            "daily_quotes.send_evening_quote",

        "schedule":
            crontab(
                hour=20,
                minute=0,
            ),

    },


    # ------------------------------------------------------
    # Génération des notifications bahá'íes
    # ------------------------------------------------------

    "generate-bahai-notifications": {

        "task":
            "apps.notifications.tasks.generate_bahai_notifications_task",

        "schedule":
            crontab(
                hour=1,
                minute=0,
            ),

    },

}


# ==========================================================
# SECURITY — HTTPS
# ==========================================================

SECURE_SSL_REDIRECT = os.getenv(
    "SECURE_SSL_REDIRECT",
    "False",
).lower() == "true"


SESSION_COOKIE_SECURE = os.getenv(
    "SESSION_COOKIE_SECURE",
    "False",
).lower() == "true"


CSRF_COOKIE_SECURE = os.getenv(
    "CSRF_COOKIE_SECURE",
    "False",
).lower() == "true"


# ==========================================================
# HSTS
# ==========================================================

SECURE_HSTS_SECONDS = int(
    os.getenv(
        "SECURE_HSTS_SECONDS",
        "0",
    )
)


SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv(
    "SECURE_HSTS_INCLUDE_SUBDOMAINS",
    "False",
).lower() == "true"


SECURE_HSTS_PRELOAD = os.getenv(
    "SECURE_HSTS_PRELOAD",
    "False",
).lower() == "true"


# ==========================================================
# SECURITY HEADERS
# ==========================================================

SECURE_CONTENT_TYPE_NOSNIFF = True

SECURE_REFERRER_POLICY = "same-origin"

X_FRAME_OPTIONS = "DENY"


# ==========================================================
# DEFAULT PRIMARY KEY
# ==========================================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"