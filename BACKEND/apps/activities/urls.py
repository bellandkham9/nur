from django.urls import path

from .views import (
    # Types
    ActivityTypeListView,

    # Options
    MyActivityCommunitiesView,
    ActivityOptionsView,

    # Activities
    ActivityListView,
    ActivityDetailView,
    ActivityJoinView,
    ActivityLeaveView,
    ActivityParticipantListView,
    ActivityPublishView,
    ActivityDeleteView,
 
)


urlpatterns = [

    # =====================================================
    # TYPES D'ACTIVITÉS
    # =====================================================

    path(
        "types/",
        ActivityTypeListView.as_view(),
        name="activity-types",
    ),

    # =====================================================
    # OPTIONS DU FORMULAIRE
    # =====================================================

    path(
        "options/",
        ActivityOptionsView.as_view(),
        name="activity-options",
    ),

    # =====================================================
    # MES COMMUNAUTÉS
    # =====================================================

    path(
        "communities/my/",
        MyActivityCommunitiesView.as_view(),
        name="activity-my-communities",
    ),

    # =====================================================
    # LISTE DES ACTIVITÉS
    # =====================================================

    path(
        "",
        ActivityListView.as_view(),
        name="activity-list",
    ),

    # =====================================================
    # DÉTAIL D'UNE ACTIVITÉ
    # =====================================================

    path(
        "<int:activity_id>/",
        ActivityDetailView.as_view(),
        name="activity-detail",
    ),

    # =====================================================
    # REJOINDRE UNE ACTIVITÉ
    # =====================================================

    path(
        "<int:activity_id>/join/",
        ActivityJoinView.as_view(),
        name="activity-join",
    ),

    # =====================================================
    # QUITTER UNE ACTIVITÉ
    # =====================================================

    path(
        "<int:activity_id>/leave/",
        ActivityLeaveView.as_view(),
        name="activity-leave",
    ),

    # =====================================================
    # PARTICIPANTS
    # =====================================================

    path(
        "<int:activity_id>/participants/",
        ActivityParticipantListView.as_view(),
        name="activity-participants",
    ),

# =====================================================
    # PUBLIER UNE ACTIVITÉ
    # =====================================================

    path(
        "<int:activity_id>/publish/",
        ActivityPublishView.as_view(),
        name="activity-publish",
    ),

# =====================================================
    # SUPPRIMER UNE ACTIVITÉ
    # =====================================================

     path(
        "<int:activity_id>/delete/",
        ActivityDeleteView.as_view(),
        name="activity-delete",
    ),
]

