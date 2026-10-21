import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import HalloweenTheme from "@/components/br/HalloweenTheme";
import SpanishHalloweenTheme from "@/components/HalloweenTheme";
import AdvertisingConsent from "@/components/AdvertisingConsent";

declare global {
  interface Window {
    pixelId?: string;
  }
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: import("@tanstack/react-router").ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

const BR_SCRIPTS = [
  {
    src: "https://cdn.utmify.com.br/scripts/utms/latest.js",
    async: true,
    defer: true,
    "data-utmify-prevent-xcod-sck": "",
    "data-utmify-prevent-subids": "",
  },
  { children: 'window.pixelId = "6ac3c40c0b8aa0336e8b2ded";' },
  { src: "https://cdn.utmify.com.br/scripts/pixel/pixel.js", async: true, defer: true },

];

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: ({ matches }) => {
    const isBr = matches.some((m) => m.pathname === "/br" || m.pathname.startsWith("/br/"));
    return {
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Free Fire — Recarga de diamantes" },
      { name: "description", content: "Evalúa tu cuenta y elige tu recarga de diamantes Free Fire con bono." },
      { property: "og:title", content: "Free Fire — Recarga de diamantes" },
      { property: "og:description", content: "Evalúa tu cuenta y elige tu recarga de diamantes Free Fire con bono." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Free Fire — Recarga de diamantes" },
      { name: "twitter:description", content: "Evalúa tu cuenta y elige tu recarga de diamantes Free Fire con bono." },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
    ],
    // Brazilian funnel has its own Utmify account; Spanish pages keep theirs.
    scripts: isBr ? BR_SCRIPTS : [
      {
        src: "https://cdn.utmify.com.br/scripts/utms/latest.js",
        async: true,
        defer: true,
        "data-utmify-prevent-xcod-sck": "",
        "data-utmify-prevent-subids": "",
      },
      {
        children: 'window.pixelId = "68966bec0ad50b6867bbee95";',
      },
      {
        src: "https://cdn.utmify.com.br/scripts/pixel/pixel.js",
        async: true,
        defer: true,
      },

    ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const pathname = useRouter().state.location.pathname;
  return (
    <html lang={pathname === "/br" || pathname.startsWith("/br/") ? "pt-BR" : pathname === "/fr" || pathname.startsWith("/fr/") ? "fr" : "es"}>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouter().state.location.pathname;
  const isBr = pathname === "/br" || pathname.startsWith("/br/");
  const isSpanishFunnel = ["/", "/quiz", "/idplayer", "/recharge", "/quiz2", "/idplayer2", "/recharge2"].includes(pathname);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      {isBr ? <HalloweenTheme><Outlet /></HalloweenTheme> : isSpanishFunnel ? <SpanishHalloweenTheme><Outlet /></SpanishHalloweenTheme> : <Outlet />}
      <AdvertisingConsent />
      <Toaster />
    </QueryClientProvider>
  );
}
