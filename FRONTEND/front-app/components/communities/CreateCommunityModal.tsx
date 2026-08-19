"use client";

import { FormEvent, useState } from "react";

type CreateCommunityModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

export default function CreateCommunityModal({
  open,
  onClose,
  onCreated,
}: CreateCommunityModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] =
    useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    null,
  );

  if (!open) {
    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError(
        "Le nom de la communauté est obligatoire.",
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token =
        localStorage.getItem("access_token");

      const response = await fetch(
        "http://127.0.0.1:8000/api/communities/",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            name: name.trim(),
            description:
              description.trim() || null,
            country: country.trim() || null,
            city: city.trim() || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        const message =
          data?.detail ||
          data?.name?.[0] ||
          data?.message ||
          "Impossible de créer la communauté.";

        throw new Error(message);
      }

      setName("");
      setDescription("");
      setCountry("");
      setCity("");

      onCreated?.();
      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Une erreur est survenue.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.15em] text-emerald-600">
              Communauté
            </p>

            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Créer une communauté
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Créez un espace pour votre communauté
              bahá'íe.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* FORMULAIRE */}
        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-700">
              Nom
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Ex. Communauté de Brazzaville"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

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
              placeholder="Présentez brièvement cette communauté..."
              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Pays
              </label>

              <input
                type="text"
                value={country}
                onChange={(event) =>
                  setCountry(event.target.value)
                }
                placeholder="Congo"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Ville
              </label>

              <input
                type="text"
                value={city}
                onChange={(event) =>
                  setCity(event.target.value)
                }
                placeholder="Brazzaville"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </div>
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
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Création..."
                : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}