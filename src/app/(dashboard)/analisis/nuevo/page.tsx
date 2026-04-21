"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCartel } from "@/components/analisis/UploadCartel";
import { ResultadoAnalisis } from "@/components/analisis/ResultadoAnalisis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { AnalisisResultado } from "@/types/analysis";
import Link from "next/link";

export default function NuevoAnalisisPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<AnalisisResultado | null>(null);
  const [analisisId, setAnalisisId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(data: {
    tipo: "pdf" | "url" | "texto";
    contenido: string;
  }) {
    setIsLoading(true);
    setResultado(null);

    try {
      const res = await fetch("/api/analysis/cartel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!json.success) {
        toast.error(json.error?.message ?? "Error en el análisis");
        return;
      }

      setResultado(json.data.resultado);
      setAnalisisId(json.data.analisisId);
      toast.success("¡Análisis completado!");
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGuardar() {
    if (!analisisId) return;
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Guardado en seguimiento");
    setIsSaving(false);
    router.push("/analisis");
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/analisis">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Nuevo análisis de cartel
          </h1>
          <p className="text-sm text-gray-500">
            Subí el PDF, la URL o pegá el texto del cartel.
          </p>
        </div>
      </div>

      {!resultado ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">¿Cómo querés ingresar el cartel?</CardTitle>
            <CardDescription>
              Podés subir el PDF, pegar la URL de SICOP o copiar el texto
              directamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadCartel onSubmit={handleSubmit} isLoading={isLoading} />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Resultado del análisis</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResultado(null)}
            >
              Analizar otro cartel
            </Button>
          </div>
          <ResultadoAnalisis
            resultado={resultado}
            onGuardar={handleGuardar}
            isSaving={isSaving}
          />
        </>
      )}
    </div>
  );
}
