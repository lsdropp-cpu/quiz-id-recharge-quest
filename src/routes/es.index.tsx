import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/es/")({
  head: () => ({ meta: [
    { title: "Free Fire España — Evaluación y recarga" },
    { name: "description", content: "Evalúa tu cuenta de Free Fire y descubre las recargas de diamantes con bono en euros." },
    { property: "og:title", content: "Free Fire España — Evaluación y recarga" },
    { property: "og:description", content: "Evalúa tu cuenta de Free Fire y descubre las recargas de diamantes con bono en euros." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: ({ location }) => { throw redirect({ to: "/es/quiz", search: location.search }); },
});
