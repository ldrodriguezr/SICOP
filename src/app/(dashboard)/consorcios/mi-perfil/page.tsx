"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { ConsorcioProfile } from "@/types";

export default function MiPerfilConsorciPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [perfilId, setPerfilId] = useState<string | null>(null);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    productos_servicios: "",
    zona_cobertura: "",
    tiene_sicop: false,
    experiencia_licitaciones: 0,
    capacidad_mensual_usd: "",
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: rawData } = await supabase
        .from("consorcio_perfiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const data = rawData as ConsorcioProfile | null;

      if (data) {
        setPerfilId(data.id);
        setForm({
          titulo: data.titulo ?? "",
          descripcion: data.descripcion ?? "",
          productos_servicios: (data.productos_servicios ?? []).join(", "),
          zona_cobertura: (data.zona_cobertura ?? []).join(", "),
          tiene_sicop: data.tiene_sicop ?? false,
          experiencia_licitaciones: data.experiencia_licitaciones ?? 0,
          capacidad_mensual_usd: data.capacidad_mensual_usd?.toString() ?? "",
        });
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      titulo: form.titulo,
      descripcion: form.descripcion,
      productos_servicios: form.productos_servicios
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      zona_cobertura: form.zona_cobertura
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      tiene_sicop: form.tiene_sicop,
      experiencia_licitaciones: form.experiencia_licitaciones,
      capacidad_mensual_usd: form.capacidad_mensual_usd
        ? parseFloat(form.capacidad_mensual_usd)
        : null,
      activo: true,
    };

    const { error } = perfilId
      ? await supabase
          .from("consorcio_perfiles")
          .update(payload)
          .eq("id", perfilId)
      : await supabase.from("consorcio_perfiles").insert(payload);

    if (error) {
      toast.error("Error guardando el perfil");
    } else {
      toast.success("Perfil guardado");
      router.push("/consorcios");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-purple-600" />
          Mi perfil en la red de consorcios
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Este perfil es público y visible para otros proveedores.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del proveedor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título del perfil</Label>
              <Input
                id="titulo"
                placeholder="Ej: Proveedor de materiales de construcción"
                value={form.titulo}
                onChange={(e) =>
                  setForm((p) => ({ ...p, titulo: e.target.value }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                placeholder="Describí qué ofrecés, tu experiencia y capacidad..."
                value={form.descripcion}
                onChange={(e) =>
                  setForm((p) => ({ ...p, descripcion: e.target.value }))
                }
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productos">
                Productos/Servicios{" "}
                <span className="text-gray-400 text-xs">(separados por coma)</span>
              </Label>
              <Input
                id="productos"
                placeholder="Cemento, hierro, agregados"
                value={form.productos_servicios}
                onChange={(e) =>
                  setForm((p) => ({ ...p, productos_servicios: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zona">
                  Zona de cobertura{" "}
                  <span className="text-gray-400 text-xs">(separadas por coma)</span>
                </Label>
                <Input
                  id="zona"
                  placeholder="San José, Alajuela"
                  value={form.zona_cobertura}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, zona_cobertura: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidad">Capacidad mensual (USD)</Label>
                <Input
                  id="capacidad"
                  type="number"
                  placeholder="50000"
                  value={form.capacidad_mensual_usd}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      capacidad_mensual_usd: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experiencia">
                Licitaciones ganadas históricamente
              </Label>
              <Input
                id="experiencia"
                type="number"
                min={0}
                value={form.experiencia_licitaciones}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    experiencia_licitaciones: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="sicop"
                checked={form.tiene_sicop}
                onCheckedChange={(checked) =>
                  setForm((p) => ({ ...p, tiene_sicop: checked === true }))
                }
              />
              <Label htmlFor="sicop" className="cursor-pointer">
                Estoy registrado como proveedor en SICOP
              </Label>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {perfilId ? "Actualizar perfil" : "Publicar perfil"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
