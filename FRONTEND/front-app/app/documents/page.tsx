
"use client";

import { ChangeEvent, useMemo, useEffect, useState } from "react";
import Link from "next/link";

import { apiFetch } from "@/lib/api";
import type {
  DocumentImport,
  DocumentStatus,
} from "@/types/document";
import BottomNavigation from "@/components/navigation/BottomNavigation";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentImport[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDocuments() {
    try {
      setLoading(true);
      setError(null);

      const data = await apiFetch("/api/document-imports/");

      setDocuments(Array.isArray(data) ? data : data.results ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les documents."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleUpload(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      await apiFetch("/api/document-imports/", {
        method: "POST",
        body: formData,
      });

      await loadDocuments();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'importer le document."
      );
    } finally {
      setUploading(false);

      // Permet de sélectionner à nouveau le même fichier
      event.target.value = "";
    }
  }

  function getStatusLabel(status: DocumentStatus) {
    switch (status) {
      case "PENDING":
        return "En attente";

      case "PROCESSING":
        return "Traitement";

      case "COMPLETED":
        return "Terminé";

      case "FAILED":
        return "Échec";

      default:
        return status;
    }
  }

  function getStatusClass(status: DocumentStatus) {
    switch (status) {
      case "PENDING":
        return "bg-amber-100 text-amber-700";

      case "PROCESSING":
        return "bg-blue-100 text-blue-700";

      case "COMPLETED":
        return "bg-emerald-100 text-emerald-700";

      case "FAILED":
        return "bg-red-100 text-red-700";

      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  function getDocumentIcon(type: string) {
    switch (type) {
      case "PDF":
        return "📕";

      case "DOCX":
        return "📘";

      case "XLSX":
        return "📗";

      case "IMAGE":
        return "🖼️";

      default:
        return "📄";
    }
  }


    type NotificationItem = {
        id: number;
        title: string;
        message: string;
        event_source: string;
        event_id: number | null;
        scheduled_for: string;
        created_at: string;
        status: string;
        read_at: string | null;
      };


  const [notifications, setNotifications] = useState<
      NotificationItem[]
    >([]);


   const unreadCount = useMemo(() => {
      return notifications.filter(
        (notification) =>
          notification.status !== "READ"
      ).length;
    }, [notifications]);
  


  return (
    <main className="min-h-screen bg-slate-50 pb-24">

      {/* HEADER */}
      <header className="border-b bg-white px-5 pb-5 pt-7">
        <div className="mx-auto max-w-6xl">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm text-slate-500">
                Bahá'í Companion
              </p>

              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                Documents
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Importez vos programmes et documents
              </p>
            </div>

            <Link
              href="/"
              className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700"
            >
              Accueil
            </Link>

          </div>

        </div>
      </header>


      {/* CONTENU */}
      <div className="mx-auto max-w-6xl px-5 py-6">

        {/* IMPORT */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">

          <div>
            <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-400">
              Nouveau document
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              Importer un fichier
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              PDF, Word, Excel ou image
            </p>
          </div>


          <label
            htmlFor="document-upload"
            className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center transition hover:border-emerald-400 hover:bg-emerald-50"
          >

            <div className="text-5xl">
              {uploading ? "⏳" : "📤"}
            </div>

            <h3 className="mt-4 font-semibold text-slate-900">
              {uploading
                ? "Importation en cours..."
                : "Choisir un fichier"}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Cliquez ici pour sélectionner votre document
            </p>

            <p className="mt-3 text-xs text-slate-400">
              PDF • DOCX • XLSX • JPG • PNG
            </p>

            <input
              id="document-upload"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              onChange={handleUpload}
              disabled={uploading}
              className="hidden"
            />

          </label>

        </section>


        {/* ERREUR */}
        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">

            <div className="flex gap-3">

              <div className="text-2xl">
                ⚠️
              </div>

              <div>
                <h2 className="font-semibold text-red-800">
                  Une erreur est survenue
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  {error}
                </p>
              </div>

            </div>

          </div>
        )}


        {/* DOCUMENTS */}
        <section className="mt-8">

          <div className="mb-5 flex items-end justify-between">

            <div>
              <p className="text-sm font-medium uppercase tracking-[0.15em] text-slate-400">
                Bibliothèque
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Mes documents
              </h2>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              {documents.length}
            </span>

          </div>


          {/* CHARGEMENT */}
          {loading && (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

              <div className="text-3xl">
                ⏳
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Chargement des documents...
              </p>

            </div>
          )}


          {/* VIDE */}
          {!loading && documents.length === 0 && (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

              <div className="text-5xl">
                📂
              </div>

              <h3 className="mt-4 font-bold text-slate-900">
                Aucun document
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Importez votre premier programme ou document.
              </p>

            </div>
          )}


          {/* LISTE */}
          {!loading && documents.length > 0 && (
            <div className="space-y-3">

              {documents.map((document) => (

                <article
                  key={document.id}
                  className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
                >

                  <div className="flex items-start gap-4">

                    {/* ICÔNE */}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                      {getDocumentIcon(document.document_type)}
                    </div>


                    {/* INFORMATIONS */}
                    <div className="min-w-0 flex-1">

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">

                        <div className="min-w-0">

                          <h3 className="truncate font-semibold text-slate-900">
                            {document.original_name}
                          </h3>

                          <p className="mt-1 text-xs text-slate-400">
                            {document.document_type}
                            {document.page_count > 0 &&
                              ` • ${document.page_count} page${
                                document.page_count > 1 ? "s" : ""
                              }`}
                          </p>

                        </div>


                        {/* STATUT */}
                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            document.status
                          )}`}
                        >
                          {getStatusLabel(document.status)}
                        </span>

                      </div>


                      {/* ERREUR DOCUMENT */}
                      {document.status === "FAILED" &&
                        document.error_message && (
                          <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs text-red-700">
                            {document.error_message}
                          </p>
                        )}


                      {/* ACTIONS */}
                      <div className="mt-4 flex flex-wrap gap-2">

                        {document.status === "COMPLETED" && (
                          <Link
                            href={`/documents/${document.id}`}
                            className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700"
                          >
                            Voir les détails
                          </Link>
                        )}

                        {document.status === "PROCESSING" && (
                          <span className="rounded-xl bg-blue-50 px-4 py-2 text-xs font-medium text-blue-600">
                            Analyse du document...
                          </span>
                        )}

                        {document.status === "PENDING" && (
                          <span className="rounded-xl bg-amber-50 px-4 py-2 text-xs font-medium text-amber-600">
                            En attente de traitement
                          </span>
                        )}

                      </div>

                    </div>

                  </div>

                </article>

              ))}

            </div>
          )}

        </section>

      </div>


      {/* NAVIGATION */}
      <BottomNavigation />
    </main>
  );
}

