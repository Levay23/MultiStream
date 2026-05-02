import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit2, Trash2, X, Snowflake, Play, Users as UsersIcon, CheckCircle, AlertCircle, UserCheck, Clock } from "lucide-react";
import {
  useListUsers, useCreateUser, useUpdateUser, useDeleteUser,
  useListServers, useListResellers,
  getListUsersQueryKey, getListResellersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ServiceBadge } from "@/components/ServiceBadge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

type Role = "admin" | "reseller" | "client";
type Service = "plex" | "jellyfin" | "emby";

interface UserForm {
  name: string;
  email: string;
  password: string;
  role: Role;
  service: Service | "";
  serverId: number | "";
  expiresAt: string;
  active: boolean;
  resellerId: number | "";
}

const defaultForm: UserForm = {
  name: "", email: "", password: "", role: "client",
  service: "", serverId: "", expiresAt: "", active: true, resellerId: "",
};

interface SyncResult {
  synced: boolean;
  syncError?: string;
}

function ConfirmFreezeModal({
  user, onConfirm, onCancel, loading,
}: { user: any; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  const isFrozen = !user.active;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        className="relative w-full max-w-sm z-10 rounded-2xl overflow-hidden"
        style={{ background: "rgba(10,13,28,0.95)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}
      >
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: isFrozen ? "linear-gradient(90deg,transparent,#3b82f6aa,transparent)" : "linear-gradient(90deg,transparent,#f59e0baa,transparent)" }} />
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: isFrozen ? "rgba(59,130,246,0.12)" : "rgba(245,158,11,0.12)", border: isFrozen ? "1px solid rgba(59,130,246,0.25)" : "1px solid rgba(245,158,11,0.25)" }}>
            {isFrozen ? <Play className="w-6 h-6 text-blue-400" /> : <Snowflake className="w-6 h-6 text-amber-400" />}
          </div>
          <h3 className="text-base font-bold text-white mb-1">{isFrozen ? "Activar cuenta" : "Congelar cuenta"}</h3>
          <p className="text-sm text-white/40 mb-1"><span className="text-white/70 font-medium">{user.name}</span></p>
          <p className="text-sm text-white/35 mb-6">
            {isFrozen
              ? "El usuario podrá acceder nuevamente al servicio."
              : "El usuario perderá acceso inmediatamente. Puedes reactivar en cualquier momento."}
          </p>
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/50 hover:text-white/80 transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Cancelar
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{
                background: isFrozen ? "linear-gradient(135deg,#1d4ed8,#3b82f6)" : "linear-gradient(135deg,#b45309,#f59e0b)",
                boxShadow: isFrozen ? "0 0 20px rgba(59,130,246,0.3)" : "0 0 20px rgba(245,158,11,0.3)",
              }}>
              {loading ? "..." : isFrozen ? "Activar" : "Congelar"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Users() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("client");
  const [serviceFilter, setServiceFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [form, setForm] = useState<UserForm>(defaultForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [freezeUser, setFreezeUser] = useState<any | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const params: any = {};
  if (roleFilter) params.role = roleFilter;
  if (serviceFilter) params.service = serviceFilter;
  if (search) params.search = search;

  const { data: users = [], isLoading } = useListUsers(params);
  const { data: servers = [] } = useListServers();
  const { data: resellers = [] } = useListResellers(undefined, {
    query: { enabled: isAdmin, queryKey: getListResellersQueryKey() },
  });
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListUsersQueryKey() });
  }

  function openCreate() {
    setEditUser(null);
    setForm(defaultForm);
    setSyncResult(null);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(u: any) {
    setEditUser(u);
    setForm({
      name: u.name, email: u.email, password: "", role: u.role,
      service: u.service ?? "", serverId: u.serverId ?? "",
      expiresAt: u.expiresAt ? u.expiresAt.slice(0, 10) : "",
      active: u.active, resellerId: u.resellerId ?? "",
    });
    setSyncResult(null);
    setFormError(null);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSyncResult(null);

    const payload: any = {
      name: form.name,
      email: form.email,
      role: form.role,
      ...(form.service ? { service: form.service } : {}),
      ...(form.serverId !== "" ? { serverId: Number(form.serverId) } : {}),
      ...(form.expiresAt ? { expiresAt: new Date(form.expiresAt + "T23:59:59").toISOString() } : {}),
      ...(form.resellerId !== "" ? { resellerId: Number(form.resellerId) } : {}),
    };
    if (form.password) payload.password = form.password;

    if (editUser) {
      updateMutation.mutate(
        { id: editUser.id, data: payload },
        {
          onSuccess: () => { invalidate(); setModalOpen(false); },
          onError: (err: any) => {
            const msg = err?.response?.data?.error ?? err?.message ?? "Error al guardar";
            setFormError(msg);
          },
        }
      );
    } else {
      payload.password = form.password;
      createMutation.mutate(
        { data: payload },
        {
          onSuccess: (data: any) => {
            invalidate();
            if (data?.syncStatus) {
              setSyncResult(data.syncStatus);
              if (!data.syncStatus.syncError) {
                setTimeout(() => setModalOpen(false), 2000);
              }
            } else {
              setModalOpen(false);
            }
          },
          onError: (err: any) => {
            const msg = err?.response?.data?.error ?? err?.message ?? "Error al crear usuario";
            setFormError(msg);
          },
        }
      );
    }
  }

  function handleDelete(id: number) {
    deleteMutation.mutate({ id }, { onSuccess: () => { invalidate(); setDeleteId(null); } });
  }

  function handleToggleFreeze() {
    if (!freezeUser) return;
    const willFreeze = freezeUser.active;
    const userName = freezeUser.name;
    updateMutation.mutate(
      { id: freezeUser.id, data: { active: !freezeUser.active } as any },
      {
        onSuccess: (data: any) => {
          invalidate();
          setFreezeUser(null);
          if (data?.syncStatus?.synced) {
            toast({
              title: willFreeze ? "Cuenta congelada" : "Cuenta activada",
              description: willFreeze
                ? `${userName} ha sido bloqueado en el servidor de streaming`
                : `${userName} ha sido reactivado en el servidor de streaming`,
            });
          } else if (data?.syncStatus?.syncError) {
            toast({
              title: willFreeze ? "Congelado localmente" : "Activado localmente",
              description: `Advertencia: ${data.syncStatus.syncError}`,
              variant: "destructive",
            });
          } else {
            toast({
              title: willFreeze ? "Cuenta congelada" : "Cuenta activada",
              description: `${userName} actualizado correctamente`,
            });
          }
        },
        onError: () => {
          toast({ title: "Error", description: "No se pudo actualizar la cuenta", variant: "destructive" });
        }
      }
    );
  }

  const serversByService = servers.filter((s: any) =>
    !form.service || s.type === form.service
  );

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all"
    + " " + "bg-white/[0.04] border border-white/10 focus:bg-white/[0.06]";
  const selectCls = "px-3 py-2 rounded-xl text-sm text-white focus:outline-none transition-all"
    + " " + "bg-white/[0.04] border border-white/10 focus:border-primary/50 focus:bg-white/[0.06]";

  const selectedServer = servers.find((s: any) => s.id === Number(form.serverId));

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UsersIcon className="w-4 h-4 text-primary" />
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Gestion</p>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Clientes</h1>
          <p className="text-sm text-white/30 mt-0.5">Gestiona usuarios del sistema</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg,#1d4ed8,#6d28d9)", boxShadow: "0 0 20px rgba(59,130,246,0.25)" }}
        >
          <Plus className="w-4 h-4" /> Nuevo Usuario
        </motion.button>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuario..." className={inputCls + " pl-9"} />
        </div>
        {isAdmin && (
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={selectCls}>
            <option value="client">Clientes</option>
            <option value="admin">Admins</option>
          </select>
        )}
        <select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} className={selectCls}>
          <option value="">Todos los servicios</option>
          <option value="plex">Plex</option>
          <option value="jellyfin">Jellyfin</option>
          <option value="emby">Emby</option>
        </select>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05]">
              <th className="text-left px-5 py-3.5 text-[10px] font-bold text-white/25 uppercase tracking-widest">Usuario</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-bold text-white/25 uppercase tracking-widest hidden sm:table-cell">Rol</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-bold text-white/25 uppercase tracking-widest hidden md:table-cell">Servicio</th>
              <th className="text-left px-5 py-3.5 text-[10px] font-bold text-white/25 uppercase tracking-widest hidden md:table-cell">Estado</th>
              <th className="text-right px-5 py-3.5 text-[10px] font-bold text-white/25 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={5} className="px-5 py-3.5">
                  <div className="h-4 rounded animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
                </td></tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-14 text-white/25 text-sm">
                No se encontraron usuarios
              </td></tr>
            ) : (
              users.map((u: any, idx: number) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{u.name}</p>
                        {u.resellerId && (() => {
                          const r = (resellers as any[]).find((r: any) => r.id === u.resellerId);
                          return r ? (
                            <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: "rgba(139,92,246,0.1)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.2)" }}>
                              <UserCheck className="w-2.5 h-2.5" />{r.name}
                            </span>
                          ) : null;
                        })()}
                      </div>
                      <p className="text-xs text-white/30">{u.email}</p>
                      {u.expiresAt && (() => {
                        const exp = new Date(u.expiresAt);
                        const now = new Date();
                        const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                        const expired = daysLeft < 0;
                        const urgent = daysLeft >= 0 && daysLeft <= 7;
                        return (
                          <span className={`flex items-center gap-1 text-[10px] mt-0.5 font-medium ${expired ? "text-red-400" : urgent ? "text-amber-400" : "text-white/30"}`}>
                            <Clock className="w-2.5 h-2.5" />
                            {expired ? `Expirado hace ${Math.abs(daysLeft)}d` : `Expira en ${daysLeft}d`}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 hidden sm:table-cell">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      u.role === "admin" ? "text-purple-400 bg-purple-500/10 border border-purple-500/20"
                        : u.role === "reseller" ? "text-blue-400 bg-blue-500/10 border border-blue-500/20"
                          : "text-white/40 bg-white/5 border border-white/10"
                    }`}>
                      {u.role === "admin" ? "Admin" : u.role === "reseller" ? "Revendedor" : "Cliente"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    {u.service ? <ServiceBadge service={u.service} /> : <span className="text-white/20 text-xs">—</span>}
                  </td>
                  <td className="px-5 py-3.5 hidden md:table-cell">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                      u.active ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                        : "text-blue-400 bg-blue-500/10 border border-blue-500/20"
                    }`}>
                      {u.active ? (
                        <><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><span>Activo</span></>
                      ) : (
                        <><Snowflake className="w-3 h-3 text-blue-400" /><span>Congelado</span></>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setFreezeUser(u)}
                        title={u.active ? "Congelar cuenta" : "Activar cuenta"}
                        className="p-1.5 rounded-lg transition-all duration-200"
                        style={{
                          background: u.active ? "rgba(245,158,11,0.08)" : "rgba(59,130,246,0.08)",
                          border: u.active ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(59,130,246,0.2)",
                          color: u.active ? "#f59e0b" : "#60a5fa",
                        }}>
                        {u.active ? <Snowflake className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => openEdit(u)}
                        className="p-1.5 rounded-lg text-white/25 hover:text-primary transition-all hover:bg-primary/10">
                        <Edit2 className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        onClick={() => setDeleteId(u.id)}
                        className="p-1.5 rounded-lg text-white/25 hover:text-red-400 transition-all hover:bg-red-500/10">
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </motion.div>

      {/* Freeze Confirm Modal */}
      <AnimatePresence>
        {freezeUser && (
          <ConfirmFreezeModal
            user={freezeUser} onConfirm={handleToggleFreeze}
            onCancel={() => setFreezeUser(null)} loading={updateMutation.isPending}
          />
        )}
      </AnimatePresence>

      {/* Create/Edit User Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              className="relative w-full max-w-lg z-10 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              style={{ background: "rgba(10,13,28,0.97)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg,transparent,rgba(59,130,246,0.6),transparent)" }} />

              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <h2 className="text-sm font-bold text-white">{editUser ? "Editar Usuario" : "Nuevo Usuario"}</h2>
                <button onClick={() => setModalOpen(false)} className="text-white/30 hover:text-white/70 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Error banner */}
                <AnimatePresence>
                  {formError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                      style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <span className="text-red-300">{formError}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Sync result banner */}
                <AnimatePresence>
                  {syncResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm"
                      style={{
                        background: syncResult.synced ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.08)",
                        border: syncResult.synced ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(245,158,11,0.2)",
                      }}
                    >
                      {syncResult.synced
                        ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        : <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
                      <div>
                        <p className={`font-semibold ${syncResult.synced ? "text-emerald-400" : "text-amber-400"}`}>
                          {syncResult.synced ? "Usuario creado en el servidor" : "Usuario guardado localmente"}
                        </p>
                        {syncResult.syncError && (
                          <p className="text-white/40 text-xs mt-0.5">{syncResult.syncError}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">Nombre</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className={inputCls} />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">
                    Contrasena {editUser && <span className="text-white/20 normal-case">(dejar vacio para no cambiar)</span>}
                  </label>
                  <input type="password" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!editUser} className={inputCls} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">Rol</label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })} className={inputCls} disabled={!isAdmin}>
                      <option value="client">Cliente</option>
                      {isAdmin && <option value="admin">Admin</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">Servicio</label>
                    <select value={form.service}
                      onChange={(e) => setForm({ ...form, service: e.target.value as Service | "", serverId: "" })}
                      className={inputCls}>
                      <option value="">Ninguno</option>
                      <option value="plex">Plex</option>
                      <option value="jellyfin">Jellyfin</option>
                      <option value="emby">Emby</option>
                    </select>
                  </div>
                </div>

                {/* Server selector — only shown when service is selected */}
                {form.service && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                    <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">
                      Servidor {form.service === "jellyfin" || form.service === "emby" ? "· se creará en el servidor" : ""}
                    </label>
                    <select value={form.serverId} onChange={(e) => setForm({ ...form, serverId: e.target.value ? Number(e.target.value) : "" })}
                      className={inputCls}>
                      <option value="">Sin servidor asignado</option>
                      {serversByService.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name} ({s.url})</option>
                      ))}
                    </select>
                    {serversByService.length === 0 && (
                      <p className="text-xs text-amber-400/70 mt-1.5">
                        No hay servidores de {form.service} configurados. Ve a Servidores para agregar uno.
                      </p>
                    )}
                    {form.serverId !== "" && (form.service === "jellyfin" || form.service === "emby") && (
                      <p className="text-xs text-emerald-400/60 mt-1.5">
                        El usuario se creará automáticamente en {selectedServer?.name}
                      </p>
                    )}
                    {form.serverId !== "" && form.service === "plex" && (
                      <p className="text-xs text-white/30 mt-1.5">
                        Plex no permite crear usuarios via API directamente — se guardará localmente.
                      </p>
                    )}
                  </motion.div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">Expira el (opcional)</label>
                  <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputCls}
                    style={{ colorScheme: "dark" }} />
                </div>

                {isAdmin && form.role === "client" && (resellers as any[]).length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">Revendedor (opcional)</label>
                    <select value={form.resellerId} onChange={(e) => setForm({ ...form, resellerId: e.target.value ? Number(e.target.value) : "" })} className={inputCls}>
                      <option value="">Sin revendedor</option>
                      {(resellers as any[]).map((r: any) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {editUser && (
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div
                      onClick={() => setForm({ ...form, active: !form.active })}
                      className="w-10 h-5 rounded-full transition-all relative"
                      style={{ background: form.active ? "linear-gradient(135deg,#1d4ed8,#6d28d9)" : "rgba(255,255,255,0.10)" }}
                    >
                      <motion.div
                        animate={{ x: form.active ? 20 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
                      />
                    </div>
                    <span className="text-sm text-white/50">Cuenta activa</span>
                  </label>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    Cancelar
                  </button>
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#1d4ed8,#6d28d9)", boxShadow: "0 0 20px rgba(59,130,246,0.2)" }}>
                    {createMutation.isPending || updateMutation.isPending
                      ? "Guardando..."
                      : editUser ? "Guardar Cambios" : "Crear Usuario"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {deleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
              className="relative w-full max-w-sm z-10 rounded-2xl overflow-hidden"
              style={{ background: "rgba(10,13,28,0.97)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg,transparent,rgba(239,68,68,0.6),transparent)" }} />
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Eliminar usuario</h3>
                <p className="text-sm text-white/35 mb-6">Esta accion no se puede deshacer.</p>
                <div className="flex gap-3">
                  <button onClick={() => setDeleteId(null)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    Cancelar
                  </button>
                  <button onClick={() => handleDelete(deleteId!)} disabled={deleteMutation.isPending}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#991b1b,#ef4444)", boxShadow: "0 0 20px rgba(239,68,68,0.2)" }}>
                    Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
