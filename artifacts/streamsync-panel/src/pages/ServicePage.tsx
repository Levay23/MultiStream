import { motion } from "framer-motion";
import { useListUsers, useListServers } from "@workspace/api-client-react";
import { Play, Monitor, Activity, Users, Server } from "lucide-react";

type ServiceType = "plex" | "jellyfin" | "emby";

const serviceConfig: Record<ServiceType, {
  label: string;
  color: string;
}> = {
  plex: { label: "Plex", color: "#e5a00d" },
  jellyfin: { label: "Jellyfin", color: "#aa5cc3" },
  emby: { label: "Emby", color: "#52b54b" },
};

function ServiceIcon({ service, className }: { service: ServiceType; className?: string }) {
  if (service === "plex") return <Play className={className} />;
  if (service === "jellyfin") return <Monitor className={className} />;
  return <Activity className={className} />;
}

export default function ServicePage({ service }: { service: ServiceType }) {
  const cfg = serviceConfig[service];

  const { data: users = [] } = useListUsers({ service });
  const { data: servers = [] } = useListServers();

  const serviceServers = servers.filter((s) => s.type === service);

  const statCards = [
    { label: "Usuarios", value: users.length, icon: Users },
    { label: "Servidores", value: serviceServers.length, icon: Server },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${cfg.color}15`, border: `1px solid ${cfg.color}30` }}
        >
          <ServiceIcon service={service} className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{cfg.label}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Panel de servicio {cfg.label}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-4 text-center"
          >
            <div className="flex justify-center mb-2">
              <stat.icon className="w-5 h-5" style={{ color: cfg.color }} />
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Users on this service */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Usuarios en {cfg.label}
        </h2>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {users.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Sin usuarios asignados</p>
          ) : (
            <div className="divide-y divide-border">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${u.active ? "bg-emerald-400" : "bg-muted-foreground"}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Servers */}
      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Servidores {cfg.label}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {serviceServers.map((s) => (
            <div key={s.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${cfg.color}15` }}
              >
                <Server className="w-4 h-4" style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{s.name}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{s.url}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`text-xs font-medium ${s.active ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {s.active ? "Activo" : "Inactivo"}
                </span>
                <span className="text-xs text-muted-foreground">{s.userCount} usuarios</span>
              </div>
            </div>
          ))}
          {serviceServers.length === 0 && (
            <p className="text-muted-foreground text-sm col-span-2 text-center py-4">
              Sin servidores {cfg.label}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
