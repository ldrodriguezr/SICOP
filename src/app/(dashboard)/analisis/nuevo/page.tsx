"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UploadCartel } from "@/components/analisis/UploadCartel";
import { ResultadoAnalisis } from "@/components/analisis/ResultadoAnalisis";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, ArrowLeft, Building2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, getEstadoBadgeColor } from "@/lib/utils";
import type { AnalisisResultado } from "@/types/analysis";
import type { Licitacion } from "@/types";
import Link from "next/link";

function NuevoAnalisisContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const licitacionId = searchParams.get("licitacionId");

  const [isLoading, setIsLoading] = useState(false);
  const [resultado, setResultado] = useState<AnalisisResultado | null>(null);
  const [analisisId, setAnalisisId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [licitacion, setLicitacion] = useState<Licitacion | null>(null);

  useEffect(() => {
    if (!licitacionId) return;
    const supabase = createClient();
    supabase
      .from("licitaciones")
      .select("*")
      .eq("id", licitacionId)
      .single()
      .then(({ data }) => {
        if (data) setLicitacion(data);
      });
  }, [licitacionId]);

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
        body: JSON.stringify({
          ...data,
          licitacionId: licitacionId ?? undefined,
        }),
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
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={licitacionId ? "/explorar" : "/analisis"}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            {licitacionId ? "Volver a Explorar" : "Volver"}
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            Análisis IA de cartel
          </h1>
          <p className="text-sm text-gray-500">
            Claude analiza el documento y evalúa tu chances de ganar.
          </p>
        </div>
      </div>

      {/* Info de la licitación si viene desde Explorar */}
      {licitacion && (
        <Card className="border-blue-100 bg-blue-50/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={`text-xs ${getEstadoBadgeColor(licitacion.estado ?? "")}`}>
                    {licitacion.estado}
                  </Badge>
                  {licitacion.tipo && (
                    <span className="text-xs text-gray-500">{licitacion.tipo}</span>
                  )}
                </div>
                <p className="font-semibold text-gray-900 text-sm leading-snug">
                  {licitacion.titulo}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <Building2 className="w-3 h-3" />
                  <span>{licitacion.institucion}</span>
                  {licitacion.monto_estimado != null && (
                    <span className="text-green-700 font-medium">
                      · {formatCurrency(Number(licitacion.monto_estimado), licitacion.moneda ?? "CRC")}
                    </span>
                  )}
                </div>
              </div>
              {licitacion.url_sicop && (
                <a
                  href={licitacion.url_sicop}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <Button variant="outline" size="sm" className="text-xs gap-1">
                    <ExternalLink className="w-3 h-3" /> Ver en SICOP
                  </Button>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!resultado ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {licitacion
                ? "Proporcioná el cartel de esta licitación"
                : "¿Cómo querés ingresar el cartel?"}
            </CardTitle>
            <CardDescription>
              {licitacion
                ? "El cartel es el documento oficial PDF con los requisitos. Podés descargarlo desde SICOP y subirlo, o pegar su URL directa."
                : "Subí el PDF, pegá la URL del cartel de SICOP, o copiá el texto directamente."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadCartel
              onSubmit={handleSubmit}
              isLoading={isLoading}
              defaultUrl={licitacion?.url_sicop ?? undefined}
            />
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
              Analizar de nuevo
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

export default function NuevoAnalisisPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="h-10 bg-gray-100 rounded animate-pulse w-48" />
          <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      }
    >
      <NuevoAnalisisContent />
    </Suspense>
  );
}
