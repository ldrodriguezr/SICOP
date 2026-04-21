"use client";

import { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  AlertOctagon,
  Lightbulb,
  BookOpen,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScoreViabilidad } from "./ScoreViabilidad";
import type { AnalisisResultado } from "@/types/analysis";
import { cn } from "@/lib/utils";

interface ResultadoAnalisisProps {
  resultado: AnalisisResultado;
  onGuardar?: () => void;
  isSaving?: boolean;
}

const recomendacionConfig = {
  participar: {
    label: "PARTICIPAR",
    icon: ThumbsUp,
    className: "bg-green-50 border-green-200 text-green-700",
  },
  evaluar_mas: {
    label: "EVALUAR MÁS",
    icon: HelpCircle,
    className: "bg-yellow-50 border-yellow-200 text-yellow-700",
  },
  no_participar: {
    label: "NO PARTICIPAR",
    icon: ThumbsDown,
    className: "bg-red-50 border-red-200 text-red-700",
  },
};

const tipoRequisitoBadge: Record<string, string> = {
  habilitante: "bg-blue-100 text-blue-700",
  tecnico: "bg-purple-100 text-purple-700",
  financiero: "bg-green-100 text-green-700",
  legal: "bg-gray-100 text-gray-700",
};

export function ResultadoAnalisis({
  resultado,
  onGuardar,
  isSaving,
}: ResultadoAnalisisProps) {
  const [requisitosCheck, setRequisitosCheck] = useState<Record<number, boolean>>({});
  const rec = recomendacionConfig[resultado.recomendacion];
  const RecIcon = rec.icon;

  function toggleRequisito(idx: number) {
    setRequisitosCheck((prev) => ({ ...prev, [idx]: !prev[idx] }));
  }

  return (
    <div className="space-y-6">
      {/* Recomendación + Score */}
      <div className="grid grid-cols-2 gap-6">
        <Card className={cn("border-2", rec.className)}>
          <CardContent className="pt-6 flex flex-col items-center justify-center h-full text-center">
            <RecIcon className="w-10 h-10 mb-3" />
            <p className="text-sm font-medium">Recomendación</p>
            <p className="text-2xl font-bold mt-1">{rec.label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-center">
            <ScoreViabilidad
              score={resultado.score_viabilidad}
              razon={resultado.razon_score}
            />
          </CardContent>
        </Card>
      </div>

      {/* Resumen ejecutivo */}
      <Card className="border-blue-100 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Resumen ejecutivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-800">{resultado.resumen_ejecutivo}</p>
          {resultado.objeto_contrato && (
            <p className="text-sm text-gray-500 mt-2">
              <strong>Objeto:</strong> {resultado.objeto_contrato}
            </p>
          )}
          {resultado.plazo_oferta_dias > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              <strong>Plazo para ofertar:</strong> {resultado.plazo_oferta_dias} días
            </p>
          )}
        </CardContent>
      </Card>

      {/* Requisitos checklist */}
      {resultado.requisitos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Requisitos ({resultado.requisitos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {resultado.requisitos.map((req, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    requisitosCheck[idx]
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-100"
                  )}
                >
                  <Checkbox
                    id={`req-${idx}`}
                    checked={requisitosCheck[idx] ?? false}
                    onCheckedChange={() => toggleRequisito(idx)}
                    className="mt-0.5"
                  />
                  <label
                    htmlFor={`req-${idx}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900">
                        {req.descripcion}
                      </span>
                      {req.critico && (
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                      )}
                      <Badge className={cn("text-xs", tipoRequisitoBadge[req.tipo])}>
                        {req.tipo}
                      </Badge>
                    </div>
                    {req.nota_simplificada && (
                      <p className="text-xs text-gray-500">
                        {req.nota_simplificada}
                      </p>
                    )}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentos necesarios */}
      {resultado.documentos_necesarios.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" />
              Documentos necesarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {resultado.documentos_necesarios.map((doc, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  {doc}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Banderas rojas y oportunidades */}
      <div className="grid grid-cols-2 gap-4">
        {resultado.banderas_rojas.length > 0 && (
          <Card className="border-red-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-600 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4" />
                Banderas rojas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {resultado.banderas_rojas.map((flag, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    {flag}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {resultado.oportunidades.length > 0 && (
          <Card className="border-green-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-600 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Oportunidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {resultado.oportunidades.map((op, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    {op}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* CTA guardar */}
      {onGuardar && (
        <Button
          onClick={onGuardar}
          disabled={isSaving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isSaving ? "Guardando..." : "Guardar en seguimiento"}
        </Button>
      )}
    </div>
  );
}
