import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/fr/")({
  head: () => ({ meta: [
    { title: "Free Fire France — Évaluation et recharge" },
    { name: "description", content: "Évaluez votre compte Free Fire et découvrez les recharges de diamants avec bonus en euros." },
    { property: "og:title", content: "Free Fire France — Évaluation et recharge" },
    { property: "og:description", content: "Évaluez votre compte Free Fire et découvrez les recharges de diamants avec bonus en euros." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  beforeLoad: ({ location }) => { throw redirect({ to: "/fr/quiz", search: location.search }); },
});