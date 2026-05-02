import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Edit2, Trash2, X, Snowflake, Play, UserCheck, Users } from "lucide-react";
import {
  useListResellers, useCreateReseller, useUpdateReseller, useDeleteReseller, useToggleReseller,
  getListResellersQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface ResellerForm {
  name: string;
  email: string;
  password: string;
}

const defaultForm: ResellerForm = { name: "", email: "", password: "" };

function ConfirmDeleteModal({
  reseller, onConfirm, onCancel, loading,
}: { reseller: any; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <motion.div initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 10 }}
        className="relative w-full max-w-sm z-10 rounded-2xl overflow-hidden"
        style={{ background: "rgba(10,13,28,0.95)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg,transparent,#ef4444aa,transparent)" }} />
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Eliminar revendedor</h3>
          <p className="text-sm text-white/40 mb-1"><span className="text-white/70 font-medium">{reseller.name}</span></p>
          <p className="text-sm text-white/35 mb-6">Esta acción no se puede deshacer.</p>
          <div className="flex gap-3">
            <button onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/50 hover:text-white/80 transition-colors"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              Cancelar
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#991b1b,#ef4444)", boxShadow: "0 0 20px rgba(239,68,68,0.3)" }}>
              {loading ? "..." : "Eliminar"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Resellers() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editReseller, setEditReseller] = useState<any | null>(null);
  const [form, setForm] = useState<ResellerForm>(defaultForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [toggleId, setToggleId] = useState<number | null>(null);

  const { data: resellers = [], isLoading } = useListResellers();

  const createMutation = useCreateReseller();
  const updateMutation = useUpdateReseller();
  const deleteMutation = useDeleteReseller();
  const toggleMutation = useToggleReseller();

  const filtered = (resellers as any[]).filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      return r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
    }
    return true;
  });

  function openCreate() {
    setEditReseller(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function openEdit(r: any) {
    setEditReseller(r);
    setForm({ name: r.name, email: r.email, password: "" });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditReseller(null);
    setForm(defaultForm);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast({ title: "Error", description: "Nombre y email son requeridos", variant: "destructive" });
      return;
    }

    if (editReseller) {
      const body: any = { name: form.name, email: form.email };
      if (form.password) body.password = form.password;
      updateMutation.mutate({ id: editReseller.id, data: body }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListResellersQueryKey() });
          toast({ title: "Revendedor actualizado" });
          closeModal();
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err?.message || "Error al actualizar", variant: "destructive" });
        },
      });
    } else {
      if (!form.password) {
        toast({ title: "Error", description: "La contraseña es requerida", variant: "destructive" });
        return;
      }
      createMutation.mutate({ data: form }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListResellersQueryKey() });
          toast({ title: "Revendedor creado exitosamente" });
          closeModal();
        },
        onError: (err: any) => {
          toast({ title: "Error", description: err?.message || "Error al crear", variant: "destructive" });
        },
      });
    }
  }

  function handleDelete(id: number) {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListResellersQueryKey() });
        toast({ title: "Revendedor eliminado" });
        setDeleteId(null);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.message || "Error al eliminar", variant: "destructive" });
        setDeleteId(null);
      },
    });
  }

  function handleToggle(id: number) {
    setToggleId(id);
    toggleMutation.mutate({ id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListResellersQueryKey() });
        setToggleId(null);
      },
      onError: (err: any) => {
        toast({ title: "Error", description: err?.message || "Error al actualizar", variant: "destructive" });
        setToggleId(null);
      },
    });
  }

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Revendedores</h1>
          <p className="text-sm text-white/35 mt-0.5">{filtered.length} revendedores registrados</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #1d4ed8, #6d28d9)", boxShadow: "0 0 20px rgba(59,130,246,0.3)" }}>
          <Plus className="w-4 h-4" />
          Nuevo revendedor
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar revendedores..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder:text-white/25 outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <UserCheck className="w-10 h-10 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-white/35">No hay revendedores registrados</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {filtered.map((r: any) => (
              <motion.div key={r.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                  style={{ background: r.active ? "linear-gradient(135deg,#1d4ed8,#6d28d9)" : "rgba(255,255,255,0.08)" }}>
                  {r.name.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white truncate">{r.name}</p>
                    {!r.active && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                        style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                        Congelado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/35 truncate">{r.email}</p>
                </div>

                {/* Client count */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0"
                  style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-semibold text-blue-300">{r.clientCount}</span>
                  <span className="text-[10px] text-blue-400/60">clientes</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => handleToggle(r.id)} disabled={toggleId === r.id}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.08] disabled:opacity-50"
                    title={r.active ? "Congelar" : "Activar"}>
                    {r.active
                      ? <Snowflake className="w-4 h-4 text-amber-400" />
                      : <Play className="w-4 h-4 text-blue-400" />
                    }
                  </button>
                  <button onClick={() => openEdit(r)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-white/[0.08]">
                    <Edit2 className="w-4 h-4 text-white/40 hover:text-white/70" />
                  </button>
                  <button onClick={() => setDeleteId(r.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4 text-white/30 hover:text-red-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, scale: 0.92, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="relative w-full max-w-md z-10 rounded-2xl overflow-hidden"
              style={{ background: "rgba(10,13,28,0.97)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="absolute top-0 left-0 right-0 h-px"
                style={{ background: "linear-gradient(90deg,transparent,#3b82f6aa,transparent)" }} />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-white">
                    {editReseller ? "Editar revendedor" : "Nuevo revendedor"}
                  </h2>
                  <button onClick={closeModal} className="text-white/30 hover:text-white/70 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-white/40 mb-1.5 block">Nombre</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                      placeholder="Nombre del revendedor" required />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/40 mb-1.5 block">Email</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                      placeholder="correo@ejemplo.com" required />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-white/40 mb-1.5 block">
                      Contraseña {editReseller && <span className="text-white/25">(dejar vacío para no cambiar)</span>}
                    </label>
                    <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
                      placeholder={editReseller ? "Nueva contraseña (opcional)" : "Contraseña"} />
                  </div>
                  <button type="submit" disabled={isMutating}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 hover:opacity-90"
                    style={{ background: "linear-gradient(135deg,#1d4ed8,#6d28d9)", boxShadow: "0 0 20px rgba(59,130,246,0.25)" }}>
                    {isMutating ? "..." : editReseller ? "Actualizar" : "Crear revendedor"}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {deleteId !== null && (
          <ConfirmDeleteModal
            reseller={(resellers as any[]).find((r: any) => r.id === deleteId)}
            onConfirm={() => handleDelete(deleteId)}
            onCancel={() => setDeleteId(null)}
            loading={deleteMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
