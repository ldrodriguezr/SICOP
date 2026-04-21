"use client";

import { useEffect, useState } from "react";
import { Settings, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import Link from "next/link";
import type { UserProfile } from "@/types";

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nombre_contacto: "",
    nombre_empresa: "",
    cedula_juridica: "",
    telefono: "",
    zona_geografica: "",
    registrado_sicop: false,
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setForm({
          nombre_contacto: data.nombre_contacto ?? "",
          nombre_empresa: data.nombre_empresa ?? "",
          cedula_juridica: data.cedula_juridica ?? "",
          telefono: data.telefono ?? "",
          zona_geografica: data.zona_geografica ?? "",
          registrado_sicop: data.registrado_sicop ?? false,
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

    const { error } = await supabase
      .from("user_profiles")
      .update({
        nombre_contacto: form.nombre_contacto,
        nombre_empresa: form.nombre_empresa || null,
        cedula_juridica: form.cedula_juridica || null,
        telefono: form.telefono || null,
        zona_geografica: form.zona_geografica || null,
        registrado_sicop: form.registrado_sicop,
      })
      .eq("id", user.id);

    if (error) {
      toast.error("Error guardando el perfil");
    } else {
      toast.success("Perfil actualizado");
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

  const plan = profile?.plan ?? "free";
  const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS];

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Configuración
        </h1>
      </div>

      {/* Plan actual */}
      <Card className="border-blue-100 bg-blue-50">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">Plan actual:</p>
                <Badge className="capitalize bg-blue-100 text-blue-700">
                  {plan}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {limits.analisis_por_mes} análisis/mes · {limits.alertas_max} alertas
              </p>
            </div>
            {plan === "free" && (
              <Link href="/settings/plan">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Mejorar plan
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Información del perfil</CardTitle>
          <CardDescription>
            Esta información se usa para personalizar tu experiencia.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_contacto">Tu nombre</Label>
                <Input
                  id="nombre_contacto"
                  value={form.nombre_contacto}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nombre_contacto: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre_empresa">Empresa</Label>
                <Input
                  id="nombre_empresa"
                  value={form.nombre_empresa}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nombre_empresa: e.target.value }))
                  }
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cedula">Cédula jurídica</Label>
                <Input
                  id="cedula"
                  value={form.cedula_juridica}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, cedula_juridica: e.target.value }))
                  }
                  placeholder="3-xxx-xxxxxx"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={form.telefono}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, telefono: e.target.value }))
                  }
                  placeholder="8888-8888"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zona">Zona geográfica</Label>
              <Input
                id="zona"
                value={form.zona_geografica}
                onChange={(e) =>
                  setForm((p) => ({ ...p, zona_geografica: e.target.value }))
                }
                placeholder="Ej: San José, Cartago"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="sicop"
                checked={form.registrado_sicop}
                onCheckedChange={(checked) =>
                  setForm((p) => ({
                    ...p,
                    registrado_sicop: checked === true,
                  }))
                }
              />
              <Label htmlFor="sicop" className="cursor-pointer">
                Estoy registrado como proveedor en SICOP
              </Label>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
