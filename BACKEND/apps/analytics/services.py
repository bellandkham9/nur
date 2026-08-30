from .models import AnalyticsEvent


def track_event(
    event_type,
    *,
    user=None,
    path="",
    metadata=None,
    session_id="",
    client_id="",
):
    """
    Enregistre un événement analytics.
    """

    return AnalyticsEvent.objects.create(
        user=user,
        event_type=event_type,
        path=path or "",
        metadata=metadata or {},
        session_id=session_id or "",
        client_id=client_id or "",
    )