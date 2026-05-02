type Service = "plex" | "jellyfin" | "emby" | null | undefined;

const serviceConfig = {
  plex: { label: "Plex", className: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  jellyfin: { label: "Jellyfin", className: "bg-violet-500/15 text-violet-400 border-violet-500/25" },
  emby: { label: "Emby", className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
};

export function ServiceBadge({ service }: { service: Service }) {
  if (!service) return <span className="text-xs text-muted-foreground">—</span>;
  const cfg = serviceConfig[service];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}

export function ServiceDot({ service }: { service: Service }) {
  if (!service) return null;
  const colors = {
    plex: "bg-amber-400",
    jellyfin: "bg-violet-400",
    emby: "bg-emerald-400",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${colors[service]}`} />;
}

export function getServiceColor(service: string) {
  const colors: Record<string, string> = {
    plex: "#e5a00d",
    jellyfin: "#aa5cc3",
    emby: "#52b54b",
  };
  return colors[service] ?? "#6b7280";
}
