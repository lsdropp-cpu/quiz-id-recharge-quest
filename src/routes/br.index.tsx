import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/br/")({
  head: () => ({ meta: [
    { title: "Free Fire Brasil — Avaliação e recarga" },
    { name: "description", content: "Avalie sua conta Free Fire e escolha sua recarga de diamantes com bônus." },
    { property: "og:title", content: "Free Fire Brasil — Avaliação e recarga" },
    { property: "og:description", content: "Avalie sua conta Free Fire e escolha sua recarga de diamantes com bônus." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: ({ location }) => {
    throw redirect({ to: "/br/quiz", search: location.search });
  },
});
