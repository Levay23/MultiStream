import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Package, Check } from "lucide-react";
import {
  useListPackages, useCreatePackage, useUpdatePackage, useDeletePackage,
  getListPackagesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ServiceBadge } from "@/components/ServiceBadge";

interface PkgForm {
  name: string;
  price: string;
  durationDays: string;
  services: string[];
  description: string;
  active: boolean;
}

const defaultForm: PkgForm = { name: "", price: "", durationDays: "30", services: ["plex"], description: "", active: true };

export default function Packages() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<any | null>(null);
  const [form, setForm] = useState<PkgForm>(defaultForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: packages = [], isLoading } = useListPackages();
  const createMutation = useCreatePackage();
  const updateMutation = useUpdatePackage();
  const deleteMutation = useDeletePackage();

  function invalidate() {
    qc.invalidateQueries({ queryKey: getListPackagesQueryKey() });
  }

  function toggleService(svc: string) {
    setForm((f) => ({
      ...f,
      services: f.services.includes(svc) ? f.services.filter((s) => s !== svc) : [...f.services, svc],
    }));
  }

  function openCreate() {
    setEditPkg(null);
    setForm(defaultForm);
    setModalOpen(true);
  }

  function openEdit(p: any) {
    setEditPkg(p);
    setForm({ name: p.name, price: String(p.price), durationDays: String(p.durationDays), services: p.services, description: p.description ?? "", active: p.active });
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = { name: form.name, price: Number(form.price), durationDays: Number(form.durationDays), services: form.services, description: form.description || undefined, active: form.active };
    if (editPkg) {
      updateMutation.mutate({ id: editPkg.id, data: payload }, { onSuccess: () => { invalidate(); setModalOpen(false); } });
    } else {
      createMutation.mutate({ data: payload }, { onSuccess: () => { invalidate(); setModalOpen(false); } });
    }
  }

  const serviceColors: Record<string, string> = { plex: "amber", jellyfin: "violet", emby: "emerald" };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paquetes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Planes y suscripciones disponibles</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Nuevo Paquete
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl h-48 animate-pulse" />
          ))
        ) : packages.map((p) => (
          <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className={`bg-card border rounded-xl p-5 space-y-4 ${p.active ? "border-border" : "border-border opacity-60"}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Package className="w-4 h-4 text-primary" />
                  <h3 className="text-base font-bold text-foreground">{p.name}</h3>
                </div>
                {p.description && <p className="text-xs text-muted-foreground mt-1">{p.description}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-2xl font-bold text-foreground">${p.price}</span>
                <span className="text-xs text-muted-foreground ml-1">/ {p.durationDays} dias</span>
              </div>
              <span className="text-xs text-muted-foreground">{p.userCount} usuarios</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {p.services.map((svc) => <ServiceBadge key={svc} service={svc as any} />)}
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${p.active ? "bg-emerald-400" : "bg-muted-foreground"}`} />
              <span className={`text-xs font-medium ${p.active ? "text-emerald-400" : "text-muted-foreground"}`}>
                {p.active ? "Activo" : "Inactivo"}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60" onClick={() => setModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl z-10 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="text-base font-semibold text-foreground">{editPkg ? "Editar Paquete" : "Nuevo Paquete"}</h2>
                <button onClick={() => setModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nombre del Plan</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Precio ($)</label>
                    <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Duracion (dias)</label>
                    <input type="number" min="1" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} required
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-2">Servicios Incluidos</label>
                  <div className="flex gap-2">
                    {["plex", "jellyfin", "emby"].map((svc) => (
                      <button key={svc} type="button" onClick={() => toggleService(svc)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                          form.services.includes(svc)
                            ? svc === "plex" ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                              : svc === "jellyfin" ? "bg-violet-500/20 border-violet-500/40 text-violet-400"
                              : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                            : "bg-muted border-border text-muted-foreground"
                        }`}>
                        {svc.charAt(0).toUpperCase() + svc.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Descripcion (opcional)</label>
                  <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="pkgActive" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="w-4 h-4 rounded accent-primary" />
                  <label htmlFor="pkgActive" className="text-sm text-muted-foreground">Paquete activo</label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)}
                    className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium">Cancelar</button>
                  <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold disabled:opacity-50">
                    {editPkg ? "Guardar" : "Crear Paquete"}
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
              className="absolute inset-0 bg-black/60" onClick={() => setDeleteId(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl z-10 p-6 text-center">
              <Trash2 className="w-8 h-8 text-destructive mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground mb-1">Eliminar paquete</h3>
              <p className="text-sm text-muted-foreground mb-5">Esta accion no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm font-medium">Cancelar</button>
                <button onClick={() => { deleteMutation.mutate({ id: deleteId }, { onSuccess: () => { invalidate(); setDeleteId(null); } }); }}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold disabled:opacity-50">
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
