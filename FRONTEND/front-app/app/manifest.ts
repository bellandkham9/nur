import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NUR",
    short_name: "NUR",
    description:
      "NUR — Votre compagnon bahá'í pour apprendre, découvrir et rester connecté.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f8f5",
    theme_color: "#10b981",
    orientation: "portrait",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
    {
        src: "/screenshots/desktop.png",
        sizes: "1867x902",
        type: "image/png",
        form_factor: "wide",
    },
    {
        src: "/screenshots/mobile.png",
        sizes: "381x788",
        type: "image/png",
    },
    ],
  };
}
