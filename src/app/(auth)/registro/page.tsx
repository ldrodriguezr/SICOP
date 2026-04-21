"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function RegistroPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre_contacto: "",
    nombre_empresa: "",
    email: "",
    password: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          nombre_contacto: form.nombre_contacto,
          nombre_empresa: form.nombre_empresa,
        },
      },
    });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase as any)
        .from("user_profiles")
        .upsert({
          id: data.user.id,
          nombre_contacto: form.nombre_contacto,
          nombre_empresa: form.nombre_empresa || null,
          plan: "free",
        });

      if (profileError) {
        console.error("[registro] Error creando perfil:", profileError);
      }
    }

    if (!data.session) {
      toast.success("Te enviamos un email de confirmación", {
        description:
          "Revisá tu bandeja de entrada o spam y hacé clic en el enlace antes de iniciar sesión.",
        duration: 10000,
      });
      setLoading(false);
      router.push("/login?registered=1");
      return;
    }

    toast.success("¡Cuenta creada! Ya podés usar SICOP Copilot.");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">SICOP Copilot</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Crear cuenta</CardTitle>
            <CardDescription>
              Empezá gratis. Sin tarjeta de crédito. Te enviaremos un email para
              confirmar la cuenta antes del primer ingreso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegistro} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_contacto">Tu nombre</Label>
                <Input
                  id="nombre_contacto"
                  name="nombre_contacto"
                  placeholder="Juan Pérez"
                  value={form.nombre_contacto}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre_empresa">
                  Empresa{" "}
                  <span className="text-gray-400 text-xs">(opcional)</span>
                </Label>
                <Input
                  id="nombre_empresa"
                  name="nombre_empresa"
                  placeholder="Mi Empresa S.A."
                  value={form.nombre_empresa}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="vos@empresa.cr"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Crear cuenta gratis
              </Button>

              <p className="text-xs text-gray-500 text-center">
                Al registrarte, aceptás nuestros{" "}
                <Link href="/terminos" className="underline">
                  Términos de Uso
                </Link>{" "}
                y{" "}
                <Link href="/privacidad" className="underline">
                  Política de Privacidad
                </Link>
                .
              </p>
            </form>

            <p className="text-center text-sm text-gray-600 mt-4">
              ¿Ya tenés cuenta?{" "}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">
                Iniciá sesión
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
