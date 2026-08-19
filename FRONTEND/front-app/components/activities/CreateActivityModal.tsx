
"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type ActivityType = {
  id: number;
  name: string;
  code: string;
  description?: string;
  icon?: string;
  color?: string;
  requires_confirmation?: boolean;
};

type Community = {
  id: number;
  name: string;
  city?: string | null;
  country?: string | null;
};

type CreateActivityModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function CreateActivityModal({
  open,
  onClose,
  onCreated,
}: CreateActivityModalProps) {
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [activityType, setActivityType] = useState("");
  const [community, setCommunity] = useState("");

  const [startDatetime, setStartDatetime] = useState("");
  const [endDatetime, setEndDatetime] = useState("");

  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");

  const [isOnline, setIsOnline] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState("");

  const [maxParticipants, setMaxParticipants] = useState("");
  const [requiresConfirmation, setRequiresConfirmation] =
    useState(false);

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /*
   * =========================================================
   * CHARGER TYPES + COMMUNAUTÉS
   * =========================================================
   */

  useEffect(() => {
    if (!open) {
      return;
    }

    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setError(null);

        const data = await apiFetch(
          "/api/activities/options/"
        );

        const normalizedTypes = Array.isArray(data?.types)
          ? data.types
          : Array.isArray(data?.activity_types)
            ? data.activity_types
            : [];

        const normalizedCommunities = Array.isArray(
          data?.communities
        )
          ? data.communities
          : [];

        setTypes(normalizedTypes);
        setCommunities(normalizedCommunities);

        if (
          normalizedTypes.length > 0 &&
          !activityType
        ) {
          setActivityType(
            String(normalizedTypes[0].id)
          );
        }

        if (
          normalizedCommunities.length > 0 &&
          !community
        ) {
          setCommunity(
            String(normalizedCommunities[0].id)
          );
        }
      } catch (err) {
        console.error(
          "❌ Erreur chargement options activité :",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger les options."
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, [open]);

  /*
   * =========================================================
   * RESET
   * =========================================================
   */

  function resetForm() {
    setTitle("");
    setDescription("");
    setActivityType("");
    setCommunity("");
    setStartDatetime("");
    setEndDatetime("");
    setLocationName("");
    setAddress("");
    setIsOnline(false);
    setMeetingUrl("");
    setMaxParticipants("");
    setRequiresConfirmation(false);
    setError(null);
  }

  /*
   * =========================================================
   * FERMETURE
   * =========================================================
   */

  function handleClose() {
    if (loadingSubmit) {
      return;
    }

    resetForm();
    onClose();
  }

  /*
   * =========================================================
   * CRÉATION
   * =========================================================
   */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }

    if (!activityType) {
      setError("Veuillez choisir un type d'activité.");
      return;
    }

    if (!community) {
      setError("Veuillez choisir une communauté.");
      return;
    }

    if (!startDatetime) {
      setError("La date et l'heure de début sont obligatoires.");
      return;
    }

    if (isOnline && !meetingUrl.trim()) {
      setError(
        "Veuillez renseigner le lien de réunion en ligne."
      );
      return;
    }

    try {
      setLoadingSubmit(true);
      setError(null);

      const payload = {
        title: title.trim(),

        description:
          description.trim() || "",

        activity_type: Number(activityType),

        community: Number(community),

        start_datetime: new Date(
          startDatetime
        ).toISOString(),

        end_datetime: endDatetime
          ? new Date(endDatetime).toISOString()
          : null,

        location_name:
          locationName.trim() || "",

        address:
          address.trim() || "",

        is_online: isOnline,

        meeting_url: isOnline
          ? meetingUrl.trim()
          : "",

        max_participants:
          maxParticipants
            ? Number(maxParticipants)
            : null,

        requires_confirmation:
          requiresConfirmation,
      };

      await apiFetch(
        "/api/activities/",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      resetForm();

      onCreated?.();
      onClose();
    } catch (err) {
      console.error(
        "❌ Erreur création activité :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer l'activité."
      );
    } finally {
      setLoadingSubmit(false);
    }
  }

  if (!open) {
    return null;
  }

  /*
   * =========================================================
   * RENDU
   * =========================================================
   */

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4">

          <div>
            <p className="text-sm font-medium uppercase tracking-[0.15em] text-emerald-600">
              Activité
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Créer une activité
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Organisez une activité pour votre communauté.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={loadingSubmit}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
            aria-label="Fermer"
          >
            ✕
          </button>

        </div>

        {/* CHARGEMENT */}

        {loadingOptions ? (
          <div className="py-12 text-center">

            <div className="text-3xl">
              ⏳
            </div>

            <p className="mt-3 text-sm text-slate-500">
              Chargement des communautés et des types...
            </p>

          </div>
        ) : (

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-5"
          >

            {/* TITRE */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Titre *
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                placeholder="Ex. Réunion de dévotion"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            {/* TYPE + COMMUNAUTÉ */}

            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Type *
                </label>

                <select
                  value={activityType}
                  onChange={(event) =>
                    setActivityType(event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">
                    Choisir un type
                  </option>

                  {types.map((type) => (
                    <option
                      key={type.id}
                      value={type.id}
                    >
                      {type.icon ? `${type.icon} ` : ""}
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Communauté *
                </label>

                <select
                  value={community}
                  onChange={(event) =>
                    setCommunity(event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  <option value="">
                    Choisir une communauté
                  </option>

                  {communities.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                      {item.city
                        ? ` — ${item.city}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            {/* DESCRIPTION */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows={3}
                placeholder="Présentez cette activité..."
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            {/* DATES */}

            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Début *
                </label>

                <input
                  type="datetime-local"
                  value={startDatetime}
                  onChange={(event) =>
                    setStartDatetime(event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Fin
                </label>

                <input
                  type="datetime-local"
                  value={endDatetime}
                  onChange={(event) =>
                    setEndDatetime(event.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

            </div>

            {/* LIEU */}

            <div className="rounded-2xl bg-slate-50 p-4">

              <label className="flex items-center gap-3">

                <input
                  type="checkbox"
                  checked={isOnline}
                  onChange={(event) =>
                    setIsOnline(event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />

                <span className="text-sm font-semibold text-slate-700">
                  Activité en ligne
                </span>

              </label>

              {!isOnline && (
                <div className="mt-4 space-y-4">

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Nom du lieu
                    </label>

                    <input
                      type="text"
                      value={locationName}
                      onChange={(event) =>
                        setLocationName(event.target.value)
                      }
                      placeholder="Ex. Centre bahá'í"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Adresse
                    </label>

                    <input
                      type="text"
                      value={address}
                      onChange={(event) =>
                        setAddress(event.target.value)
                      }
                      placeholder="Adresse de l'activité"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                </div>
              )}

              {isOnline && (
                <div className="mt-4">

                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Lien de réunion *
                  </label>

                  <input
                    type="url"
                    value={meetingUrl}
                    onChange={(event) =>
                      setMeetingUrl(event.target.value)
                    }
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />

                </div>
              )}

            </div>

            {/* PARTICIPANTS */}

            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Nombre maximum
                </label>

                <input
                  type="number"
                  min="1"
                  value={maxParticipants}
                  onChange={(event) =>
                    setMaxParticipants(event.target.value)
                  }
                  placeholder="Illimité"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>

              <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">

                <input
                  type="checkbox"
                  checked={requiresConfirmation}
                  onChange={(event) =>
                    setRequiresConfirmation(
                      event.target.checked
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600"
                />

                <span className="text-sm font-semibold text-slate-700">
                  Confirmation obligatoire
                </span>

              </label>

            </div>

            {/* ERREUR */}

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                ⚠️ {error}
              </div>
            )}

            {/* ACTIONS */}

            <div className="flex gap-3 pt-2">

              <button
                type="button"
                onClick={handleClose}
                disabled={loadingSubmit}
                className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={
                  loadingSubmit ||
                  loadingOptions ||
                  types.length === 0 ||
                  communities.length === 0
                }
                className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingSubmit
                  ? "Création..."
                  : "Créer l'activité"}
              </button>

            </div>

          </form>
        )}

      </div>
    </div>
  );
}

