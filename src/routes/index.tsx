import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Free Fire — Evaluación de cuenta y recarga" },
    { name: "description", content: "Descubre si tu cuenta Free Fire puede recibir descuentos en diamantes." },
    { property: "og:title", content: "Free Fire — Evaluación de cuenta y recarga" },
    { property: "og:description", content: "Descubre si tu cuenta Free Fire puede recibir descuentos en diamantes." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: ({ location }) => {
    throw redirect({ to: "/quiz", search: location.search });
  },
});
