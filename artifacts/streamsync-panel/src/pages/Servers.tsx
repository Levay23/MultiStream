import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, X, Server, Wifi, WifiOff, Key, Zap,
  CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import {
  useListServers, useCreateServer, useUpdateServer, useDeleteServer,
  useTestServerConnection, getListServersQueryKey,
} from "@workspace/api-client-react";
import type { ServerTestResult } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ServiceBadge } from "@/components/ServiceBadge";

interface ServerForm {
  name: string;
  url: string;
  type: "plex" | "jellyfin" | "emby";
  apiKey: string;
  active: boolean;
}

const defaultForm: ServerForm = { name: "", url: "", type: "jellyfin", apiKey: "", active: true };

const typeColors: Record<string, string> = {
  plex: "#e5a00d",
  jellyfin: "#aa5cc3",
  emby: "#52b54b",
};

const apiKeyPlaceholders: Record<string, string> = {
  plex: "Token X-Plex-Token (desde la URL de Plex)",
  jellyfin: "API Key desde Panel → Admin → API Keys",
  emby: "API Key desde Admin → Advanced → Security",
};

const apiKeyHelp: Record<string, string> = {
  plex: "Abre Plex Media Server → Configuración → Acceso remoto y copia el token de la URL",
  jellyfin: "En Jellyfin: Panel de control → Administration → API Keys → Nueva clave",
  emby: "En Emby: Menú principal → Administration → Advanced → Security → API Keys",
};

function CheckRow({ check, delay }: { check: NonNullable<ServerTestResult["checks"]>[0]; delay: number }) {
  const icon =
    check.status === "ok" ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
    ) : check.status === "fail" ? (
      <XCircle className="w-4 h-4 text-red-400 shrink-0" />
    ) : (
      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
    );

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0"
    >
      {icon}
      <span className="text-sm text-white/70 flex-1">{check.name}</span>
      {check.detail && (
        <span className="text-xs text-white/30 font-mono">{check.detail}</span>
      )}
    </motion.div>
  );
}

function TestResultPanel({ result, loading }: { result: ServerTestResult | null; loading: boolean }) {
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        className="mt-4 rounded-xl overflow-hidden"
        style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}
      >
        <div className="px-4 py-4 flex items-center gap-3">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <Loader2 className="w-5 h-5 text-primary" />
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-white/80">Probando conexion...</p>
            <p className="text-xs text-white/35">Verificando API key y servicios</p>
          </div>
        </div>
        <div className="px-4 pb-4 space-y-2">
          {["Conectando al servidor", "Verificando usuarios", "Revisando bibliotecas"].map((t, i) => (
            <motion.div key={t} className="flex items-center gap-2"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.3 }}>
              <motion.div className="w-1.5 h-1.5 rounded-full bg-primary/60"
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.3 }} />
              <span className="text-xs text-white/30">{t}...</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  if (!result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="mt-4 rounded-xl overflow-hidden"
      style={{
        background: result.success ? "rgba(52,211,153,0.04)" : "rgba(239,68,68,0.04)",
        border: `1px solid ${result.success ? "rgba(52,211,153,0.2)" : "rgba(239,68,68,0.2)"}`,
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {result.success
            ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            : <XCircle className="w-5 h-5 text-red-400" />}
          <div>
            <p className="text-sm font-bold" style={{ color: result.success ? "#34d399" : "#f87171" }}>
              {result.success ? "Conexion exitosa" : "Error de conexion"}
            </p>
            {result.serverName && (
              <p className="text-xs text-white/40">{result.serverName} {result.version ? `· v${result.version}` : ""}</p>
            )}
            {result.error && <p className="text-xs text-red-400/70 mt-0.5">{result.error}</p>}
          </div>
        </div>
        {result.responseMs != null && (
          <span className="text-xs font-mono text-white/25">{result.responseMs}ms</span>
        )}
      </div>
      {/* Checks */}
      <div className="px-4 py-1">
        {result.checks.map((c, i) => (
          <CheckRow key={c.name} check={c} delay={i * 0.1} />
        ))}
      </div>
    </motion.div>
  );
}

function ServerCard({ s, onEdit, onDelete }: { s: any; onEdit: (s: any) => void; onDelete: (id: number) => void }) {
  const [testResult, setTestResult] = useState<ServerTestResult | null>(null);
  const [showTest, setShowTest] = useState(false);
  const testMutation = useTestServerConnection();
  const color = typeColors[s.type] ?? "#3b82f6";

  function runTest() {
    setShowTest(true);
    setTestResult(null);
    testMutation.mutate({ id: s.id }, {
      onSuccess: (data) => setTestResult(data),
      onError: () => setTestResult({ success: false, checks: [{ name: "Conexion", status: "fail", detail: "Error interno" }], error: "Error del servidor" }),
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="relative rounded-2xl overflow-hidden group"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${color}20`,
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}70, transparent)` }} />
      {/* BG glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(ellipse at top right, ${color}07 0%, transparent 60%)` }} />

      <div className="relative p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
              <Server className="w-4.5 h-4.5" style={{ width: 18, height: 18, color }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white/90">{s.name}</p>
              <ServiceBadge service={s.type as any} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => onEdit(s)}
              className="p-1.5 rounded-lg text-white/25 hover:text-primary transition-all hover:bg-primary/10">
              <Edit2 className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => onDelete(s.id)}
              className="p-1.5 rounded-lg text-white/25 hover:text-red-400 transition-all hover:bg-red-500/10">
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/25 shrink-0">URL</span>
            <span className="text-white/60 font-mono truncate text-[11px]">{s.url}</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Key className="w-3 h-3 text-white/25 shrink-0" />
            <span className="text-white/40 font-mono truncate text-[11px]">
              {s.apiKey ? `${s.apiKey.slice(0, 8)}${"•".repeat(Math.min(12, s.apiKey.length - 8))}` : "Sin API key"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/25 shrink-0">Usuarios</span>
            <span className="text-white/70 font-bold">{s.userCount}</span>
          </div>
        </div>

        {/* Status + Test button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {s.active ? (
              <>
                <motion.span className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                  animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 2, repeat: Infinity }} />
                <span className="text-xs text-emerald-400 font-medium">Activo</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-white/25" />
                <span className="text-xs text-white/30">Inactivo</span>
              </>
            )}
            {testResult && (
              <span className="ml-2 flex items-center gap-1 text-xs font-medium"
                style={{ color: testResult.success ? "#34d399" : "#f87171" }}>
                {testResult.success
                  ? <><CheckCircle2 className="w-3 h-3" /> Verificado</>
                  : <><XCircle className="w-3 h-3" /> Fallo</>}
              </span>
            )}
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={runTest}
            disabled={testMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
            style={{
              background: `${color}15`,
              border: `1px solid ${color}30`,
              color,
            }}
          >
            {testMutation.isPending
              ? <><Loader2 className="w-3 h-3 animate-spin" /> Probando...</>
              : <><Zap className="w-3 h-3" /> Probar</>}
          </motion.button>
        </div>

        {/* Test results */}
        <AnimatePresence>
          {showTest && (
            <div>
              <TestResultPanel result={testResult} loading={testMutation.isPending} />
              {testResult && (
                <button
                  onClick={() => setShowTest(false)}
                  className="mt-2 flex items-center gap-1 text-xs text-white/25 hover:text-white/50 transition-colors mx-auto"
                >
                  <ChevronUp className="w-3 h-3" /> Ocultar
                </button>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function Servers() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editServer, setEditServer] = useState<any | null>(null);
  const [form, setForm] = useState<ServerForm>(defaultForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [postCreateTest, setPostCreateTest] = useState<{ id: number; result: ServerTestResult | null; loading: boolean } | null>(null);

  const { data: servers = [], isLoading } = useListServers();
  const createMutation = useCreateServer();
  const updateMutation = useUpdateServer();
  const deleteMutation = useDeleteServer();
  const testMutation = useTestServerConnection();

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListServersQueryKey() });
  }

  function openCreate() {
    setEditServer(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function openEdit(s: any) {
    setEditServer(s);
    setForm({ name: s.name, url: s.url, type: s.type, apiKey: s.apiKey ?? "", active: s.active });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editServer) {
      updateMutation.mutate(
        { id: editServer.id, data: form },
        { onSuccess: () => { invalidate(); setModalOpen(false); } }
      );
    } else {
      createMutation.mutate(
        { data: form },
        {
          onSuccess: (newServer) => {
            invalidate();
            setModalOpen(false);
            // Auto-trigger connection test after creation
            setPostCreateTest({ id: newServer.id, result: null, loading: true });
            testMutation.mutate({ id: newServer.id }, {
              onSuccess: (r) => setPostCreateTest((prev) => prev ? { ...prev, result: r, loading: false } : null),
              onError: () => setPostCreateTest((prev) =>
                prev ? { ...prev, result: { success: false, checks: [{ name: "Conexion", status: "fail" as const }], error: "Error del servidor" }, loading: false } : null
              ),
            });
          },
        }
      );
    }
  }

  function handleDelete(id: number) {
    deleteMutation.mutate({ id }, { onSuccess: () => { invalidate(); setDeleteId(null); } });
  }

  const inputCls = "w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all bg-white/[0.04] border border-white/10 focus:bg-white/[0.06]";

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Server className="w-4 h-4 text-primary" />
            <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest">Infraestructura</p>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Servidores</h1>
          <p className="text-sm text-white/30 mt-0.5">Administra y verifica conexiones de streaming</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #1d4ed8, #6d28d9)", boxShadow: "0 0 20px rgba(59,130,246,0.25)" }}
        >
          <Plus className="w-4 h-4" /> Nuevo Servidor
        </motion.button>
      </motion.div>

      {/* Post-create test result banner */}
      <AnimatePresence>
        {postCreateTest && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: postCreateTest.loading ? "rgba(59,130,246,0.06)" :
                postCreateTest.result?.success ? "rgba(52,211,153,0.06)" : "rgba(239,68,68,0.06)",
              border: postCreateTest.loading ? "1px solid rgba(59,130,246,0.2)" :
                postCreateTest.result?.success ? "1px solid rgba(52,211,153,0.2)" : "1px solid rgba(239,68,68,0.2)",
            }}
          >
            <div className="px-5 py-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {postCreateTest.loading
                    ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <Loader2 className="w-4 h-4 text-primary" />
                      </motion.div>
                    : postCreateTest.result?.success
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      : <XCircle className="w-4 h-4 text-red-400" />}
                  <p className="text-sm font-bold text-white">
                    {postCreateTest.loading ? "Estableciendo conexion con el servidor..." :
                      postCreateTest.result?.success ? "Servidor conectado correctamente" : "No se pudo conectar al servidor"}
                  </p>
                </div>
                {postCreateTest.result && (
                  <div className="space-y-0">
                    {postCreateTest.result.checks.map((c, i) => (
                      <CheckRow key={c.name} check={c} delay={i * 0.1} />
                    ))}
                    {postCreateTest.result.error && (
                      <p className="text-xs text-red-400/70 mt-2">{postCreateTest.result.error}</p>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => setPostCreateTest(null)} className="text-white/25 hover:text-white/60 transition-colors mt-0.5">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Server grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl h-52 animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
          ))
        ) : servers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="col-span-full flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Server className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-sm font-semibold text-white/30 mb-1">Sin servidores registrados</p>
            <p className="text-xs text-white/20">Crea tu primer servidor con su API key para establecer conexion</p>
          </motion.div>
        ) : (
          servers.map((s) => (
            <ServerCard key={s.id} s={s} onEdit={openEdit} onDelete={setDeleteId} />
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              className="relative w-full max-w-md z-10 rounded-2xl overflow-hidden"
              style={{ background: "rgba(10,13,28,0.97)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)" }} />

              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-bold text-white">
                    {editServer ? "Editar Servidor" : "Nuevo Servidor"}
                  </h2>
                </div>
                <button onClick={() => setModalOpen(false)} className="text-white/30 hover:text-white/70 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">Nombre</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className={inputCls} placeholder="Mi servidor Jellyfin" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">Tipo</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className={inputCls}>
                      <option value="jellyfin">Jellyfin</option>
                      <option value="plex">Plex</option>
                      <option value="emby">Emby</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">URL del Servidor</label>
                  <input
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    required
                    placeholder="https://jellyfin.miservertest.com"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-white/35 uppercase tracking-widest mb-1.5">
                    API Key <span className="text-red-400">*</span>
                  </label>
                  <input
                    value={form.apiKey}
                    onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                    required
                    placeholder={apiKeyPlaceholders[form.type]}
                    className={inputCls + " font-mono text-xs"}
                  />
                  <p className="text-[10px] text-white/25 mt-1.5 leading-relaxed">
                    {apiKeyHelp[form.type]}
                  </p>
                </div>

                {/* API key visual indicator */}
                {form.apiKey && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}
                  >
                    <Key className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs text-emerald-400/80 font-medium">API key ingresada — la conexion se probara al guardar</span>
                  </motion.div>
                )}

                {editServer && (
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div
                      onClick={() => setForm({ ...form, active: !form.active })}
                      className="w-10 h-5 rounded-full transition-all relative cursor-pointer"
                      style={{ background: form.active ? "linear-gradient(135deg,#1d4ed8,#6d28d9)" : "rgba(255,255,255,0.1)" }}
                    >
                      <motion.div
                        animate={{ x: form.active ? 20 : 2 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow"
                      />
                    </div>
                    <span className="text-sm text-white/50">Servidor activo</span>
                  </label>
                )}

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/40 hover:text-white/70 transition-colors"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending || !form.apiKey}
                    className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
                    style={{ background: "linear-gradient(135deg,#1d4ed8,#6d28d9)", boxShadow: "0 0 20px rgba(59,130,246,0.2)" }}
                  >
                    {editServer ? "Guardar y Verificar" : "Crear y Conectar"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
              className="relative w-full max-w-sm z-10 rounded-2xl overflow-hidden"
              style={{ background: "rgba(10,13,28,0.97)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(24px)" }}
            >
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg, transparent, rgba(239,68,68,0.6), transparent)" }} />
              <div className="p-6 text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Eliminar servidor</h3>
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
