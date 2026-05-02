import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Server, Package, Play, Monitor, LogOut, Menu, X, Activity,
  ChevronRight, UserCheck
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const streamingItems = [
  { href: "/plex", label: "Plex", icon: Play, color: "#e5a00d" },
  { href: "/jellyfin", label: "Jellyfin", icon: Monitor, color: "#aa5cc3" },
  { href: "/emby", label: "Emby", icon: Activity, color: "#52b54b" },
];

const managementItems = [
  { href: "/users", label: "Clientes", icon: Users },
  { href: "/resellers", label: "Revendedores", icon: UserCheck, adminOnly: true },
  { href: "/servers", label: "Servidores", icon: Server, adminOnly: true },
  { href: "/packages", label: "Paquetes", icon: Package, adminOnly: true },
];

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color?: string;
  onClick?: () => void;
  adminOnly?: boolean;
}

function NavLink({ href, label, icon: Icon, color, onClick }: NavLinkProps) {
  const [location] = useLocation();
  const isActive = location === href;
  return (
    <Link href={href} onClick={onClick}>
      <motion.div
        whileHover={{ x: 3 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer overflow-hidden group ${
          isActive
            ? "text-white"
            : "text-white/35 hover:text-white/75"
        }`}
      >
        {/* Active background */}
        {isActive && (
          <motion.div
            layoutId="activeNav"
            className="absolute inset-0 rounded-lg"
            style={{
              background: color
                ? `linear-gradient(135deg, ${color}22 0%, ${color}10 100%)`
                : "linear-gradient(135deg, rgba(59,130,246,0.18) 0%, rgba(109,40,217,0.08) 100%)",
              border: `1px solid ${color ? color + "35" : "rgba(59,130,246,0.25)"}`,
            }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
        {/* Hover background */}
        <div className="absolute inset-0 rounded-lg bg-white/[0.03] opacity-0 group-hover:opacity-100 transition-opacity" />

        <span className="w-4 h-4 shrink-0 relative z-10 transition-colors flex items-center justify-center">
          <Icon
            className="w-4 h-4"
            style={isActive && color ? { color } : isActive ? { color: "#3b82f6" } : {}}
          />
        </span>
        <span className="relative z-10">{label}</span>
        {isActive && (
          <ChevronRight
            className="ml-auto w-3 h-3 relative z-10 opacity-50"
            style={{ color: color ?? "#3b82f6" }}
          />
        )}
      </motion.div>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-3 pt-4 pb-1.5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">{children}</p>
    </div>
  );
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const logoutMutation = useLogout();
  const queryClient = useQueryClient();

  function handleLogout() {
    logoutMutation.mutate(undefined, {
      onSettled: () => {
        queryClient.clear();
        logout();
      }
    });
  }

  return (
    <div className="flex flex-col h-full bg-[#060912]/90 backdrop-blur-2xl border-r border-white/[0.06]">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/[0.05]">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #1d4ed8, #6d28d9)", boxShadow: "0 0 20px rgba(59,130,246,0.4)" }}>
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-black text-white tracking-widest leading-none">STREAMSYNC</p>
            <p className="text-[9px] text-white/25 tracking-[0.25em] leading-none mt-0.5">PANEL</p>
          </div>
        </motion.div>
        {onClose && (
          <button onClick={onClose} className="text-white/30 hover:text-white/70 lg:hidden transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} onClick={onClose} />
        ))}

        <SectionLabel>Streaming</SectionLabel>
        {streamingItems.map((item) => (
          <NavLink key={item.href} {...item} onClick={onClose} />
        ))}

        <SectionLabel>Gestion</SectionLabel>
        {managementItems
          .filter((item) => !item.adminOnly || user?.role === "admin")
          .map((item) => (
            <NavLink key={item.href} {...item} onClick={onClose} />
          ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-3 border-t border-white/[0.05] space-y-2">
        {user && (
          <div className="px-3 py-2.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #1d4ed8, #6d28d9)" }}>
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-none">{user.name}</p>
                <p className="text-[10px] text-white/30 truncate leading-none mt-0.5">{user.email}</p>
              </div>
            </div>
            <div className="mt-2">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                style={{
                  background: user.role === "admin" ? "rgba(59,130,246,0.15)" : "rgba(109,40,217,0.15)",
                  color: user.role === "admin" ? "#60a5fa" : "#c084fc",
                  border: `1px solid ${user.role === "admin" ? "rgba(59,130,246,0.25)" : "rgba(109,40,217,0.25)"}`,
                }}>
                {user.role}
              </span>
            </div>
          </div>
        )}
        <motion.button
          whileHover={{ x: 2 }}
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesion
        </motion.button>
      </div>
    </div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 w-[220px] z-50 lg:hidden"
            >
              <Sidebar onClose={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
