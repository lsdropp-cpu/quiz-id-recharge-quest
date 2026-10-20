import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Activity,
  DollarSign,
  Globe2,
  Lock,
  Moon,
  RefreshCw,
  ShoppingCart,
  Sun,
  TrendingUp,
  Users,
} from "lucide-react";

const DASH_THEME_KEY = "dashboard_theme";

const DASH_AUTH_KEY = "dashboard_authed";
const DASH_PASSWORD = "admin123";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [
    { title: "Dashboard — Funil Magico" },
    { name: "description", content: "Acompanhe as etapas e vendas do funil Free Fire." },
    { property: "og:title", content: "Dashboard — Funil Magico" },
    { property: "og:description", content: "Acompanhe as etapas e vendas do funil Free Fire." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Dashboard,
});

type FunnelEvent = {
  id: string;
  session_id: string;
  step: string;
  event_type: string;
  country: string | null;
  country_code: string | null;
  source: string | null;
  utm_source: string | null;
  created_at: string;
};

type Order = {
  id: string;
  email: string;
  customer_name: string | null;
  amount: number;
  currency: string;
  status: string;
  country: string | null;
  plan_name: string;
  created_at: string;
  utm_source: string | null;
  src: string | null;
};

type DateRange = "today" | "yesterday" | "7d" | "30d" | "custom";

const FUNNEL_STEPS = [
  { key: "quiz", label: "Quiz" },
  { key: "idplayer", label: "ID Jugador" },
  { key: "recharge", label: "Recarga" },
  { key: "checkout", label: "Checkout" },
  { key: "checkout-success", label: "Compra ✓" },
];

const ONLINE_WINDOW_MS = 90_000;

const formatMoney = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getRange = (range: DateRange, customStart?: string, customEnd?: string) => {
  const now = new Date();
  const today = startOfToday();
  switch (range) {
    case "today":
      return { from: today, to: now };
    case "yesterday": {
      const from = new Date(today);
      from.setDate(from.getDate() - 1);
      const to = new Date(today);
      to.setMilliseconds(-1);
      return { from, to };
    }
    case "7d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      return { from, to: now };
    }
    case "30d": {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      return { from, to: now };
    }
    case "custom": {
      const from = customStart ? new Date(customStart) : today;
      const to = customEnd ? new Date(customEnd + "T23:59:59") : now;
      return { from, to };
    }
  }
};

const PasswordGate = ({ onAuth }: { onAuth: () => void }) => {
  const [pwd, setPwd] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === DASH_PASSWORD) {
      sessionStorage.setItem(DASH_AUTH_KEY, "1");
      onAuth();
    } else {
      setError(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <CardTitle>Dashboard</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="password"
              placeholder="Senha"
              value={pwd}
              onChange={(e) => {
                setPwd(e.target.value);
                setError(false);
              }}
              autoFocus
            />
            {error && <p className="text-destructive text-sm">Senha incorreta</p>}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

function Dashboard() {
  const [authed, setAuthed] = useState(
    typeof window !== "undefined" && sessionStorage.getItem(DASH_AUTH_KEY) === "1",
  );
  const [range, setRange] = useState<DateRange>("today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [events, setEvents] = useState<FunnelEvent[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [recentEvents, setRecentEvents] = useState<FunnelEvent[]>([]);
  const [now, setNow] = useState(Date.now());
  const [reloading, setReloading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem(DASH_THEME_KEY) as "light" | "dark") || "dark";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(DASH_THEME_KEY, theme);
  }, [theme]);
  const isDark = theme === "dark";

  const { from, to } = useMemo(
    () => getRange(range, customStart, customEnd),
    [range, customStart, customEnd],
  );

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 2_000);
    return () => clearInterval(t);
  }, []);

  // Poll recent events every 10s so the "real-time" window stays accurate
  // even if realtime drops an insert.
  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    const fetchRecent = async () => {
      const { data } = await supabase
        .from("funnel_events")
        .select("id, session_id, step, event_type, country, country_code, source, utm_source, created_at")
        .gte("created_at", new Date(Date.now() - 2 * 60_000).toISOString())
        .order("created_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      setRecentEvents((data as FunnelEvent[]) || []);
    };
    const t = setInterval(fetchRecent, 10_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [authed]);

  const loadAll = useCallback(async () => {
    const [{ data: ev }, { data: ord }, { data: recent }] = await Promise.all([
      supabase
        .from("funnel_events")
        .select("id, session_id, step, event_type, country, country_code, source, utm_source, created_at")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .order("created_at", { ascending: false })
        .limit(10000),
      supabase
        .from("orders")
        .select("id, email, customer_name, amount, currency, status, country, plan_name, created_at, utm_source, src")
        .gte("created_at", from.toISOString())
        .lte("created_at", to.toISOString())
        .neq("email", "pending@checkout.local")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("funnel_events")
        .select("id, session_id, step, event_type, country, country_code, source, utm_source, created_at")
        .gte("created_at", new Date(Date.now() - 5 * 60_000).toISOString())
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    setEvents((ev as FunnelEvent[]) || []);
    setOrders((ord as Order[]) || []);
    setRecentEvents((recent as FunnelEvent[]) || []);
  }, [from, to]);

  useEffect(() => {
    if (!authed) return;
    loadAll();
  }, [authed, loadAll]);

  const handleReload = useCallback(async () => {
    setReloading(true);
    try {
      await loadAll();
    } finally {
      setTimeout(() => setReloading(false), 400);
    }
  }, [loadAll]);

  useEffect(() => {
    if (!authed) return;
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "funnel_events" },
        (payload) => {
          const ev = payload.new as FunnelEvent;
          setRecentEvents((prev) => [ev, ...prev].slice(0, 200));
          const evDate = new Date(ev.created_at);
          if (evDate >= from && evDate <= to) {
            setEvents((prev) => [ev, ...prev]);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          const ord = payload.new as Order;
          if (!ord) return;
          const ordDate = new Date(ord.created_at);
          if (ordDate >= from && ordDate <= to) {
            setOrders((prev) => {
              const idx = prev.findIndex((o) => o.id === ord.id);
              if (idx >= 0) {
                const copy = [...prev];
                copy[idx] = ord;
                return copy;
              }
              return [ord, ...prev];
            });
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [authed, from, to]);

  const onlinePerStep = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    FUNNEL_STEPS.forEach((s) => (map[s.key] = new Set()));
    const cutoff = now - ONLINE_WINDOW_MS;
    for (const ev of recentEvents) {
      if (new Date(ev.created_at).getTime() >= cutoff && map[ev.step]) {
        map[ev.step].add(ev.session_id);
      }
    }
    return map;
  }, [recentEvents, now]);

  const totalOnline = useMemo(() => {
    const all = new Set<string>();
    Object.values(onlinePerStep).forEach((set) => set.forEach((id) => all.add(id)));
    return all.size;
  }, [onlinePerStep]);

  const stepStats = useMemo(() => {
    const sessionsByStep: Record<string, Set<string>> = {};
    FUNNEL_STEPS.forEach((s) => (sessionsByStep[s.key] = new Set()));
    for (const ev of events) {
      if (ev.event_type === "view" && sessionsByStep[ev.step]) {
        sessionsByStep[ev.step].add(ev.session_id);
      }
    }
    return FUNNEL_STEPS.map((s) => ({
      key: s.key,
      label: s.label,
      count: sessionsByStep[s.key].size,
      online: onlinePerStep[s.key]?.size || 0,
    }));
  }, [events, onlinePerStep]);

  const topStep = Math.max(...stepStats.map((s) => s.count), 1);

  const paidOrders = orders.filter((o) => o.status === "paid");
  const revenue = paidOrders.reduce((sum, o) => sum + o.amount, 0);
  const avgTicket = paidOrders.length > 0 ? revenue / paidOrders.length : 0;

  const salesByCountry = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    for (const o of paidOrders) {
      const key = o.country || "Desconhecido";
      const existing = map.get(key) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += o.amount;
      map.set(key, existing);
    }
    return [...map.entries()]
      .map(([country, v]) => ({ country, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [paidOrders]);

  const visitorsBySource = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const ev of events) {
      if (ev.event_type !== "view") continue;
      const key = ev.source || ev.utm_source || "direct";
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(ev.session_id);
    }
    return [...map.entries()]
      .map(([source, sessions]) => ({ source, count: sessions.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [events]);

  const salesBySource = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    for (const o of paidOrders) {
      const key = o.utm_source || o.src || "direct";
      const existing = map.get(key) || { count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += o.amount;
      map.set(key, existing);
    }
    return [...map.entries()]
      .map(([source, v]) => ({ source, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [paidOrders]);

  const visitorsByCountry = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const ev of events) {
      if (ev.event_type !== "view") continue;
      const key = ev.country || ev.country_code || "Desconhecido";
      if (!map.has(key)) map.set(key, new Set());
      map.get(key)!.add(ev.session_id);
    }
    return [...map.entries()]
      .map(([country, sessions]) => ({ country, count: sessions.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [events]);

  const conversionRate =
    stepStats[0].count > 0
      ? ((paidOrders.length / stepStats[0].count) * 100).toFixed(2)
      : "0.00";

  const handleLogout = () => {
    sessionStorage.removeItem(DASH_AUTH_KEY);
    setAuthed(false);
  };

  if (!authed) return <PasswordGate onAuth={() => setAuthed(true)} />;

  return (
    <div className={`${isDark ? "dark" : ""} min-h-screen bg-background text-foreground relative`}>
      <div className="tech-grid absolute inset-0 pointer-events-none opacity-40" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent opacity-70" />
      <header className="relative border-b border-border/60 bg-card/60 backdrop-blur-xl">
        <div className="container py-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center tech-glow">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                {"// DASHBOARD"}
              </h1>
              <p className="text-xs text-muted-foreground font-mono">
                funil · tempo_real · v2.0
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
              </span>
              <span className="text-sm font-semibold text-success font-mono">{totalOnline} online</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReload}
              disabled={reloading}
              className="gap-2"
              title="Recarregar dados"
            >
              <RefreshCw className={`h-4 w-4 ${reloading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Recarregar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="gap-2"
              title={isDark ? "Modo claro" : "Modo escuro"}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>


      <main className="container py-6 space-y-6 relative">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end gap-3">
              <Tabs value={range} onValueChange={(v) => setRange(v as DateRange)}>
                <TabsList>
                  <TabsTrigger value="today">Hoje</TabsTrigger>
                  <TabsTrigger value="yesterday">Ontem</TabsTrigger>
                  <TabsTrigger value="7d">7 dias</TabsTrigger>
                  <TabsTrigger value="30d">30 dias</TabsTrigger>
                  <TabsTrigger value="custom">Personalizado</TabsTrigger>
                </TabsList>
              </Tabs>
              {range === "custom" && (
                <div className="flex gap-2 items-end">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">De</label>
                    <Input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Até</label>
                    <Input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="w-auto"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita</CardTitle>
              <DollarSign className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatMoney(revenue)}</div>
              <p className="text-xs text-muted-foreground">{paidOrders.length} vendas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ticket médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{formatMoney(avgTicket)}</div>
              <p className="text-xs text-muted-foreground">Por venda aprovada</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Visitantes</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stepStats[0].count}</div>
              <p className="text-xs text-muted-foreground">Sessões únicas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Conversão</CardTitle>
              <Activity className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{conversionRate}%</div>
              <p className="text-xs text-muted-foreground">Visita → Compra</p>
            </CardContent>
          </Card>
        </div>

        {(() => {
          const STEP_COLORS = [
            { dot: "bg-sky-400", text: "text-sky-400", glow: "shadow-sky-500/30" },
            { dot: "bg-violet-400", text: "text-violet-400", glow: "shadow-violet-500/30" },
            { dot: "bg-pink-400", text: "text-pink-400", glow: "shadow-pink-500/30" },
            { dot: "bg-amber-400", text: "text-amber-400", glow: "shadow-amber-500/30" },
            { dot: "bg-emerald-400", text: "text-emerald-400", glow: "shadow-emerald-500/30" },
          ];
          return (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-wrap items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
                    </span>
                    Comportamento do cliente em tempo real
                    <span className="text-xs font-semibold text-success/80 tracking-widest">
                      AO VIVO · 90S
                    </span>
                    <span className="ml-auto text-xs text-muted-foreground rounded-full border px-3 py-1">
                      Últimos 90s
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative pt-2">
                    {/* connecting line */}
                    <div className="absolute left-[10%] right-[10%] top-[34px] h-px bg-border" />
                    <div className="relative grid grid-cols-5 gap-2">
                      {stepStats.map((stat, idx) => {
                        const c = STEP_COLORS[idx];
                        const active = stat.online > 0;
                        return (
                          <div key={stat.key} className="flex flex-col items-center gap-2">
                            <div
                              className={`relative h-16 w-16 rounded-full grid place-items-center transition-all ${
                                active
                                  ? `bg-gradient-to-br from-background to-card ring-2 ring-offset-2 ring-offset-background shadow-lg ${c.glow}`
                                  : "bg-muted/40"
                              }`}
                              style={
                                active
                                  ? { boxShadow: `0 0 24px -4px currentColor` }
                                  : undefined
                              }
                            >
                              {active && (
                                <span
                                  className={`absolute inset-0 rounded-full ${c.dot} opacity-20 animate-ping`}
                                />
                              )}
                              <span
                                className={`relative text-2xl font-black ${
                                  active ? c.text : "text-muted-foreground/60"
                                }`}
                              >
                                {stat.online}
                              </span>
                            </div>
                            <span className="text-xs sm:text-sm text-muted-foreground text-center">
                              {stat.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Acessos por etapa
                    </span>
                    <span className="text-xs font-normal text-muted-foreground">
                      sessões únicas
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    {stepStats.map((stat, idx) => {
                      const c = STEP_COLORS[idx];
                      return (
                        <div
                          key={stat.key}
                          className="rounded-xl border bg-card/60 px-4 py-3 flex flex-col gap-2"
                        >
                          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                            {stat.label}
                          </div>
                          <div className="text-3xl font-black text-foreground">{stat.count}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Funil de conversão
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stepStats.map((stat, idx) => {
                    const pct = (stat.count / topStep) * 100;
                    const prevCount = idx > 0 ? stepStats[idx - 1].count : stat.count;
                    const dropoff =
                      idx > 0 && prevCount > 0
                        ? ((stat.count / prevCount) * 100).toFixed(1)
                        : null;
                    return (
                      <div key={stat.key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">
                            {idx + 1}. {stat.label}
                          </span>
                          <div className="flex items-center gap-3 text-muted-foreground">
                            {dropoff && <span className="text-xs">{dropoff}%</span>}
                            <span className="font-bold text-foreground">{stat.count}</span>
                          </div>
                        </div>
                        <div className="h-3 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-success transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </>
          );
        })()}


        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-primary" />
                Vendas por país
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesByCountry.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem vendas no período</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>País</TableHead>
                      <TableHead className="text-right">Vendas</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesByCountry.map((row) => (
                      <TableRow key={row.country}>
                        <TableCell className="font-medium">{row.country}</TableCell>
                        <TableCell className="text-right">{row.count}</TableCell>
                        <TableCell className="text-right text-success font-semibold">
                          {formatMoney(row.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Vendas por fonte
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesBySource.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem vendas no período</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fonte</TableHead>
                      <TableHead className="text-right">Vendas</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesBySource.map((row) => (
                      <TableRow key={row.source}>
                        <TableCell className="font-medium">{row.source}</TableCell>
                        <TableCell className="text-right">{row.count}</TableCell>
                        <TableCell className="text-right text-success font-semibold">
                          {formatMoney(row.revenue)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Visitantes por país
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visitorsByCountry.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem visitantes no período</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>País</TableHead>
                      <TableHead className="text-right">Sessões</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitorsByCountry.map((row) => (
                      <TableRow key={row.country}>
                        <TableCell className="font-medium">{row.country}</TableCell>
                        <TableCell className="text-right">{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-primary" />
                Visitantes por fonte
              </CardTitle>
            </CardHeader>
            <CardContent>
              {visitorsBySource.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem visitantes no período</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fonte</TableHead>
                      <TableHead className="text-right">Sessões</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visitorsBySource.map((row) => (
                      <TableRow key={row.source}>
                        <TableCell className="font-medium">{row.source}</TableCell>
                        <TableCell className="text-right">{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              Vendas recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem vendas no período</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quando</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>País</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.slice(0, 50).map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{o.customer_name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{o.email}</div>
                      </TableCell>
                      <TableCell>{o.country || "—"}</TableCell>
                      <TableCell className="text-xs">{o.plan_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            o.status === "paid"
                              ? "border-success/40 bg-success/10 text-success"
                              : o.status === "failed"
                                ? "border-destructive/40 bg-destructive/10 text-destructive"
                                : "border-muted-foreground/30 bg-muted text-muted-foreground"
                          }
                        >
                          {o.status === "paid"
                            ? "Pago"
                            : o.status === "failed"
                              ? "Falhou"
                              : "Pendente"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatMoney(o.amount, o.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
