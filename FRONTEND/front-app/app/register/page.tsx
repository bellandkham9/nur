"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { register, login } from "@/lib/auth";

const COUNTRIES = [
  "République du Congo",
  "République démocratique du Congo",
  "Cameroun",
  "Gabon",
  "Centrafrique",
  "Tchad",
  "Côte d'Ivoire",
  "Sénégal",
  "Bénin",
  "Togo",
  "Burkina Faso",
  "Mali",
  "Guinée",
  "Rwanda",
  "Burundi",
  "Kenya",
  "Tanzanie",
  "Afrique du Sud",
  "France",
  "Belgique",
  "Canada",
  "Suisse",
  "États-Unis",
  "Royaume-Uni",
  "Autre",
];

export default function RegisterPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    if (!username.trim()) {
      setError(
        "Veuillez saisir votre nom d'utilisateur."
      );
      return;
    }

    if (!email.trim()) {
      setError(
        "Veuillez saisir votre adresse email."
      );
      return;
    }

    if (!country) {
      setError(
        "Veuillez sélectionner votre pays."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères."
      );
      return;
    }

    if (password !== passwordConfirm) {
      setError(
        "Les mots de passe ne correspondent pas."
      );
      return;
    }

    try {
      setLoading(true);

      await register(
        username.trim(),
        email.trim(),
        password,
        passwordConfirm,
        country
      );

      /*
       * Connexion automatique après inscription.
       */
      await login(
        username.trim(),
        password
      );

      router.replace("/");
      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer le compte."
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
              Créez votre compte et commencez
              votre parcours avec Bahá'í Companion.
            </p>

          </div>

          {/* Formulaire */}

          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">

            <div className="mb-6">

              <h2 className="text-xl font-bold text-slate-900">
                Créer un compte
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Quelques informations pour commencer.
              </p>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

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
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  autoComplete="username"
                  placeholder="Ex. belland"
                  disabled={loading}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                />

              </div>

              {/* Email */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Adresse email
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="email"
                  placeholder="vous@example.com"
                  disabled={loading}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                />

              </div>

              {/* Pays */}

              <div>

                <label
                  htmlFor="country"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Pays
                </label>

                <select
                  id="country"
                  value={country}
                  onChange={(event) =>
                    setCountry(event.target.value)
                  }
                  disabled={loading}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                >

                  <option value="">
                    Sélectionnez votre pays
                  </option>

                  {COUNTRIES.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}

                </select>

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
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  placeholder="Minimum 8 caractères"
                  disabled={loading}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 disabled:opacity-60"
                />

              </div>

              {/* Confirmation */}

              <div>

                <label
                  htmlFor="passwordConfirm"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Confirmer le mot de passe
                </label>

                <input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) =>
                    setPasswordConfirm(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  placeholder="Répétez votre mot de passe"
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
                {loading
                  ? "Création du compte..."
                  : "Créer mon compte"}
              </button>

            </form>

          </div>

          {/* Login */}

          <div className="mt-6 text-center">

            <p className="text-sm text-slate-500">

              Vous avez déjà un compte ?{" "}

              <Link
                href="/login"
                className="font-semibold text-emerald-600 transition hover:text-emerald-700"
              >
                Se connecter
              </Link>

            </p>

          </div>

        </div>

      </div>

    </main>
  );
}

