"use client";

import Link from "next/link";

export default function OfflinePage() {
return ( <main className="min-h-screen flex items-center justify-center px-6"> <div className="max-w-md w-full text-center"> <div className="text-6xl mb-6">
📱 </div>

    <h1 className="text-2xl font-bold mb-3">
      Vous êtes hors connexion
    </h1>

    <p className="text-muted-foreground mb-8">
      Certaines fonctionnalités de Bahá'í Companion restent
      disponibles hors ligne.
    </p>

    <div className="space-y-3">
      <button
        onClick={() => window.location.reload()}
        className="w-full rounded-xl px-4 py-3 font-medium border"
      >
        🔄 Réessayer
      </button>

      <Link
        href="/"
        className="block w-full rounded-xl px-4 py-3 font-medium border"
      >
        🏠 Accueil
      </Link>
    </div>
  </div>
</main>

);
}
