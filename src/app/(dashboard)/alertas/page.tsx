"use client";

import { useEffect, useState } from "react";
import { Bell, Plus, Trash2, ToggleLeft, ToggleRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { AlertaConfig } from "@/types";

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<AlertaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    palabras_clave: "",
    frecuencia: "diario",
    monto_min: "",
    monto_max: "",
  });

  async function fetchAlertas() {
    const res = await fetch("/api/alertas");
    const json = await res.json();
    if (json.success) setAlertas(json.data);
    setLoading(false);
  }

  useEffect(() => {
    fetchAlertas();
  }, []);

  async function handleCrear(e: React.FormEvent) {
    e.preventDefault();

    const keywords = form.palabras_clave
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const res = await fetch("/api/alertas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: form.nombre,
        palabras_clave: keywords,
        frecuencia: form.frecuencia,
        monto_min: form.monto_min ? parseFloat(form.monto_min) : null,
        monto_max: form.monto_max ? parseFloat(form.monto_max) : null,
      }),
    });

    const json = await res.json();

    if (json.success) {
      toast.success("Alerta creada");
      setAlertas((prev) => [json.data, ...prev]);
      setDialogOpen(false);
      setForm({ nombre: "", palabras_clave: "", frecuencia: "diario", monto_min: "", monto_max: "" });
    } else {
      toast.error(json.error?.message ?? "Error creando la alerta");
    }
  }

  async function handleToggle(alerta: AlertaConfig) {
    const res = await fetch(`/api/alertas/${alerta.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activa: !alerta.activa }),
    });
    const json = await res.json();
    if (json.success) {
      setAlertas((prev) =>
        prev.map((a) => (a.id === alerta.id ? json.data : a))
      );
    }
  }

  async function handleEliminar(id: string) {
    const res = await fetch(`/api/alertas/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.success) {
      setAlertas((prev) => prev.filter((a) => a.id !== id));
      toast.success("Alerta eliminada");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-500" />
            Alertas
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Configurá alertas para recibir notificaciones de licitaciones relevantes.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="w-4 h-4" /> Nueva alerta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear nueva alerta</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCrear} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre de la alerta</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Materiales de construcción"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nombre: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">
                  Palabras clave{" "}
                  <span className="text-gray-400 text-xs">(separadas por coma)</span>
                </Label>
                <Input
                  id="keywords"
                  placeholder="construcción, cemento, varilla"
                  value={form.palabras_clave}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, palabras_clave: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="monto_min">Monto mínimo (CRC)</Label>
                  <Input
                    id="monto_min"
                    type="number"
                    placeholder="0"
                    value={form.monto_min}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, monto_min: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="monto_max">Monto máximo (CRC)</Label>
                  <Input
                    id="monto_max"
                    type="number"
                    placeholder="Sin límite"
                    value={form.monto_max}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, monto_max: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Frecuencia de notificación</Label>
                <Select
                  value={form.frecuencia}
                  onValueChange={(v) =>
                    setForm((p) => ({ ...p, frecuencia: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="inmediato">Inmediato</SelectItem>
                    <SelectItem value="diario">Resumen diario</SelectItem>
                    <SelectItem value="semanal">Resumen semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Crear alerta
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : alertas.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p>No tenés alertas configuradas todavía.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {alertas.map((alerta) => (
            <Card key={alerta.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-medium text-gray-900">{alerta.nombre}</p>
                      <Badge
                        className={`text-xs ${
                          alerta.activa
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {alerta.activa ? "Activa" : "Pausada"}
                      </Badge>
                      <Badge className="text-xs bg-blue-50 text-blue-600">
                        {alerta.frecuencia}
                      </Badge>
                    </div>
                    {alerta.palabras_clave && alerta.palabras_clave.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {alerta.palabras_clave.map((kw) => (
                          <span
                            key={kw}
                            className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 rounded px-2 py-0.5"
                          >
                            <Tag className="w-3 h-3" />
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggle(alerta)}
                      className="text-gray-500"
                    >
                      {alerta.activa ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEliminar(alerta.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
