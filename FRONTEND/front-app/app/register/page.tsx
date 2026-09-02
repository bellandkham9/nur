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
      setError("Veuillez saisir votre nom d'utilisateur.");
      return;
    }

    if (!email.trim()) {
      setError("Veuillez saisir votre adresse email.");
      return;
    }

    if (!country) {
      setError("Veuillez sélectionner votre pays.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Le mot de passe doit contenir au moins 8 caractères.",
      );
      return;
    }

    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);

      await register(
        username.trim(),
        email.trim(),
        password,
        passwordConfirm,
        country,
      );

      await login(
        username.trim(),
        password,
      );

      router.replace("/");
      router.refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de créer le compte.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f7f8f4] px-5 py-8">

      {/* Décoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-amber-200/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-[92vh] max-w-md items-center">

        <div className="w-full">

          {/* Identité */}
          <div className="mb-7 text-center">

            <div className="relative mx-auto flex h-20 w-20 items-center justify-center">

              <div className="absolute inset-0 rounded-[26px] bg-emerald-600/15 blur-md" />

              <div className="relative flex h-20 w-20 items-center justify-center rounded-[26px] bg-emerald-700 text-3xl text-white shadow-xl shadow-emerald-900/10">
                ✨
              </div>

            </div>

            <h1 className="mt-6 text-[30px] font-bold tracking-tight text-slate-900">
              Bahá'í Companion
            </h1>

            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
              Commencez votre parcours spirituel
              avec votre compagnon personnel.
            </p>

          </div>

          {/* Carte */}
          <div className="rounded-[30px] border border-white/80 bg-white/90 p-6 shadow-[0_20px_60px_-25px_rgba(15,23,42,0.20)] backdrop-blur sm:p-8">

            <div className="mb-7">

              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-lg">
                🌱
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Créer votre compte
              </h2>

              <p className="mt-1.5 text-sm leading-6 text-slate-500">
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
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
                      event.target.value,
                    )
                  }
                  autoComplete="new-password"
                  placeholder="Répétez votre mot de passe"
                  disabled={loading}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                />

              </div>

              {/* Erreur */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

                  <div className="flex items-start gap-3">

                    <span className="mt-0.5">
                      ⚠️
                    </span>

                    <p className="leading-5">
                      {error}
                    </p>

                  </div>

                </div>
              )}

              {/* Bouton */}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-emerald-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-900/10 transition-all hover:bg-emerald-800 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Création du compte..."
                  : "Créer mon compte"}
              </button>

            </form>

          </div>

          {/* Connexion */}
          <div className="mt-7 text-center">

            <p className="text-sm text-slate-500">

              Vous avez déjà un compte ?{" "}

              <Link
                href="/login"
                className="font-bold text-emerald-700 transition hover:text-emerald-800"
              >
                Se connecter
              </Link>

            </p>

          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            Un espace pour grandir, apprendre et cheminer.
          </p>

        </div>

      </div>

    </main>
  );
}
