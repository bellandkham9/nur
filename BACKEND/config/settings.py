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
    "jazzmin",

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
    "apps.analytics"
    
]



# ==========================================================
# JAZZMIN — ADMINISTRATION NUR
# ==========================================================

JAZZMIN_SETTINGS = {

    # ------------------------------------------------------
    # Branding
    # ------------------------------------------------------

    "site_title": "NUR Administration",
    "site_header": "NUR",
    "site_brand": "NUR",
    "site_logo": None,
    "login_logo": None,

    "welcome_sign": "Bienvenue dans l'administration NUR",
    "copyright": "NUR",

    # ------------------------------------------------------
    # Navigation
    # ------------------------------------------------------

    "show_sidebar": True,
    "navigation_expanded": True,

    "hide_apps": [],

    "hide_models": [],

    "order_with_respect_to": [
        "accounts",
        "quiz",
        "daily_quotes",
        "communities",
        "activities",
        "notifications",
        "personal_events",
        "document_imports",
        "events",
        "bahai_calendar",
        "myCalendar",
        "auth",
        "sessions",
    ],

    # ------------------------------------------------------
    # Icônes
    # ------------------------------------------------------

    "icons": {
        "accounts": "fas fa-users",
        "accounts.User": "fas fa-user",
        "accounts.Profile": "fas fa-id-card",
        "accounts.Permission": "fas fa-key",
        "accounts.Role": "fas fa-user-shield",
        "accounts.RolePermission": "fas fa-user-lock",

        "quiz": "fas fa-brain",
        "quiz.QuizCategory": "fas fa-layer-group",
        "quiz.QuizQuestion": "fas fa-circle-question",
        "quiz.QuizAnswer": "fas fa-list-check",
        "quiz.QuizSession": "fas fa-gamepad",
        "quiz.QuizUserAnswer": "fas fa-check-double",
        "quiz.QuizProgress": "fas fa-chart-line",

        "daily_quotes": "fas fa-quote-left",
        "daily_quotes.DailyQuote": "fas fa-quote-left",

        "communities": "fas fa-users",
        "communities.Community": "fas fa-people-group",
        "communities.CommunityMembership": "fas fa-user-group",

        "activities": "fas fa-calendar-check",
        "activities.Activity": "fas fa-calendar-day",
        "activities.ActivityType": "fas fa-tags",
        "activities.ActivityParticipant": "fas fa-user-check",

        "notifications": "fas fa-bell",
        "notifications.Notification": "fas fa-bell",
        "notifications.PushSubscription": "fas fa-mobile-screen",

        "personal_events": "fas fa-calendar",
        "document_imports": "fas fa-file-import",
        "events": "fas fa-calendar-days",
        "bahai_calendar": "fas fa-moon",
        "myCalendar": "fas fa-calendar-week",

        "auth": "fas fa-lock",
        "auth.User": "fas fa-user",
        "auth.Group": "fas fa-users-cog",
        "sessions": "fas fa-clock",
    },

    # ------------------------------------------------------
    # Interface
    # ------------------------------------------------------

    "related_modal_active": True,

    "custom_css": "admin/css/nur-admin.css",
    "custom_js": None,

    "show_ui_builder": False,

    # ------------------------------------------------------
    # Recherche
    # ------------------------------------------------------

    # ------------------------------------------------------
    # Actions
    # ------------------------------------------------------

    "changeform_format": "horizontal_tabs",
    "changeform_format_overrides": {
        "quiz.QuizQuestion": "collapsible",
        "daily_quotes.DailyQuote": "collapsible",
    },

    # ------------------------------------------------------
    # Menu utilisateur
    # ------------------------------------------------------

    "usermenu_links": [],

    # ------------------------------------------------------
    # Liens externes
    # ------------------------------------------------------

    "topmenu_links": [
        {
            "name": "Voir le site",
            "url": "/",
            "new_window": True,
        },
    ],
}

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
        "BACKEND": "django.template.backends.django.DjangoTemplates",

        "DIRS": [
            BASE_DIR / "templates",
        ],

        "APP_DIRS": True,

        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "config.context_processors.nur_stats",
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

# ==========================================================
# DATABASE
# ==========================================================

# ==========================================================
# DATABASE
# ==========================================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",

        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),

        "HOST": os.getenv("DB_HOST"),
        "PORT": os.getenv("DB_PORT", "5432"),
 
        "OPTIONS": {
            "sslmode": os.getenv(
                "DB_SSLMODE",
                "require",
            ),
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

STATICFILES_DIRS = [
    BASE_DIR / "static",
]

# ==========================================================
# MEDIA FILES
# ==========================================================

MEDIA_URL = "/media/"

if os.environ.get("RENDER"):
    MEDIA_ROOT = "/tmp/nur_media"
else:
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
# CRON JOB
# ==========================================================

CRON_SECRET = os.getenv(
    "CRON_SECRET",
    "",
)


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