"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { login } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    if (!username.trim()) {
      setError("Veuillez saisir votre nom d'utilisateur.");
      return;
    }

    if (!password) {
      setError("Veuillez saisir votre mot de passe.");
      return;
    }

    try {
      setLoading(true);

      await login(username.trim(), password);

      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nom d'utilisateur ou mot de passe incorrect.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8">
      <div className="mx-auto flex min-h-[90vh] max-w-md items-center">
        <div className="w-full">
          {/* Logo / identité */}
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-600 text-4xl shadow-lg">
              ✨
            </div>

            <h1 className="mt-5 text-3xl font-bold text-slate-900">
              Bahá'í Companion
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Votre compagnon pour organiser vos activités et événements.
            </p>
          </div>

          {/* Formulaire */}
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900">Connexion</h2>

              <p className="mt-1 text-sm text-slate-500">
                Connectez-vous à votre compte.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div>
                <label
                  htmlFor="username"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Nom d'utilisateur
                </label>

                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  autoComplete="username"
                  placeholder="Votre nom d'utilisateur"
                  disabled={loading}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Mot de passe
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                  disabled={loading}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                />
              </div>

              {/* Erreur */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <div className="flex gap-2">
                    <span>⚠️</span>

                    <p>{error}</p>
                  </div>
                </div>
              )}

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </div>

          {/* Retour */}
          <div className="mt-6 text-center space-y-3">
            <p className="text-sm text-slate-500">
              Vous n'avez pas encore de compte ?{" "}
              <Link
                href="/register"
                className="font-semibold text-emerald-600 transition hover:text-emerald-700"
              >
                Créer un compte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
