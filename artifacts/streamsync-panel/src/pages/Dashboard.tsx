import { motion } from "framer-motion";
import { Users, Server, Package, Play, Activity, Monitor, TrendingUp, Wifi } from "lucide-react";
import { useGetDashboardStats, useGetStreamingSessions } from "@workspace/api-client-react";
import { StatCard } from "@/components/StatCard";

const serviceConfig = {
  plex:     { color: "#e5a00d", icon: Play,    label: "Plex",     key: "plexSessions"     as const },
  jellyfin: { color: "#aa5cc3", icon: Monitor, label: "Jellyfin", key: "jellyfinSessions" as const },
  emby:     { color: "#52b54b", icon: Activity, label: "Emby",    key: "embySessions"     as const },
};

function LiveDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-2 w-2">
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ backgroundColor: color }}
        animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: color }} />
    </span>
  );
}

function SessionCard({ service, count, sessions, color, icon: Icon }: {
  service: string; count: number; sessions: any[]; color: string; icon: any;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="relative rounded-2xl overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${color}25`,
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Top glow accent */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${color}80 50%, transparent 100%)` }} />
      {/* BG gradient */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top right, ${color}08 0%, transparent 60%)` }} />

      {/* Header */}
      <div className="relative flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
            <Icon className="w-4 h-4" style={{ color }} />
          </div>
          <span className="text-sm font-bold text-white capitalize tracking-wide">{service}</span>
        </div>
        <div className="flex items-center gap-2">
          <LiveDot color={color} />
          <span className="text-xs font-bold" style={{ color }}>
            {count} activa{count !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Sessions */}
      <div className="relative px-5 pb-4 space-y-3">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2">
            <Wifi className="w-6 h-6 text-white/15" />
            <p className="text-xs text-white/25">Sin sesiones activas</p>
          </div>
        ) : (
          sessions.map((s: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i }}
              className="space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white/80">{s.user}</span>
                <span className="text-[10px] font-mono text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                  {s.quality}
                </span>
              </div>
              <p className="text-[11px] text-white/40 truncate">{s.title}</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${color}15` }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${s.progress}%` }}
                    transition={{ duration: 0.8, delay: 0.2 * i, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[10px] text-white/25 w-6 text-right">{s.progress}%</span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}

function PageHeader() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-7"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
        />
        <span className="text-[11px] font-semibold text-emerald-400/80 tracking-widest uppercase">Sistema en linea</span>
      </div>
      <h1 className="text-3xl font-black text-white tracking-tight">Dashboard</h1>
      <p className="text-sm text-white/30 mt-1">Vista general del sistema en tiempo real</p>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: sessions, isLoading: sessionsLoading } = useGetStreamingSessions();

  const statCards = [
    { title: "Clientes", value: stats?.totalClients ?? 0,   icon: Users,       color: "#3b82f6",  delay: 0 },
    { title: "Revendedores", value: stats?.totalResellers ?? 0, icon: TrendingUp, color: "#aa5cc3", delay: 0.05 },
    { title: "Servidores", value: `${stats?.activeServers ?? 0}/${stats?.totalServers ?? 0}`, icon: Server, color: "#52b54b", subtitle: "activos / total", delay: 0.1 },
    { title: "Paquetes",   value: stats?.totalPackages ?? 0, icon: Package,     color: "#e5a00d",  delay: 0.15 },
    { title: "Demos Activas", value: stats?.activeDemos ?? 0, icon: Play,       color: "#f43f5e",  delay: 0.2 },
    {
      title: "Distribucion",
      value: `${stats?.clientsByService?.plex ?? 0} · ${stats?.clientsByService?.jellyfin ?? 0} · ${stats?.clientsByService?.emby ?? 0}`,
      icon: Activity,
      color: "#06b6d4",
      subtitle: "Plex · Jellyfin · Emby",
      delay: 0.25,
    },
  ];

  return (
    <div className="space-y-7 max-w-6xl">
      <PageHeader />

      {/* Sessions */}
      <section>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-3 mb-4"
        >
          <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Sesiones Activas</span>
          <div className="flex-1 h-px bg-white/[0.05]" />
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sessionsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl h-40 animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
            ))
          ) : (
            Object.entries(serviceConfig).map(([svc, cfg]) => (
              <SessionCard
                key={svc}
                service={cfg.label}
                count={(sessions as any)?.[svc] ?? 0}
                sessions={(sessions as any)?.[cfg.key] ?? []}
                color={cfg.color}
                icon={cfg.icon}
              />
            ))
          )}
        </div>
      </section>

      {/* Stats */}
      <section>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 mb-4"
        >
          <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Estadisticas</span>
          <div className="flex-1 h-px bg-white/[0.05]" />
        </motion.div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {statsLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl h-20 animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
              ))
            : statCards.map((s) => <StatCard key={s.title} {...s} />)
          }
        </div>
      </section>

      {/* Recent Users */}
      {stats?.recentUsers && stats.recentUsers.length > 0 && (
        <section>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 mb-4"
          >
            <span className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Usuarios Recientes</span>
            <div className="flex-1 h-px bg-white/[0.05]" />
          </motion.div>

          <div className="rounded-2xl overflow-hidden"
            style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
            {stats.recentUsers.map((user, i) => {
              const svc = user.service as keyof typeof serviceConfig | null;
              const svcColor = svc ? serviceConfig[svc]?.color : null;
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i + 0.4 }}
                  className="flex items-center gap-4 px-5 py-3.5 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                    style={{ background: `linear-gradient(135deg, #1d4ed8, #6d28d9)` }}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white/90 truncate">{user.name}</p>
                    <p className="text-xs text-white/30 truncate">{user.email}</p>
                  </div>
                  {svcColor && (
                    <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full"
                      style={{ backgroundColor: `${svcColor}15`, color: svcColor, border: `1px solid ${svcColor}30` }}>
                      <span className="w-1 h-1 rounded-full" style={{ backgroundColor: svcColor }} />
                      {svc}
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                    style={{
                      backgroundColor: user.role === "admin" ? "rgba(59,130,246,0.15)" : user.role === "reseller" ? "rgba(109,40,217,0.15)" : "rgba(255,255,255,0.06)",
                      color: user.role === "admin" ? "#60a5fa" : user.role === "reseller" ? "#c084fc" : "rgba(255,255,255,0.35)",
                      border: `1px solid ${user.role === "admin" ? "rgba(59,130,246,0.25)" : user.role === "reseller" ? "rgba(109,40,217,0.25)" : "rgba(255,255,255,0.08)"}`,
                    }}>
                    {user.role}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
