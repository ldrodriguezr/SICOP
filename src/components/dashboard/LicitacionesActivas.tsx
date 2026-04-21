"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, getDaysRemaining, getEstadoBadgeColor } from "@/lib/utils";
import { Clock, ExternalLink } from "lucide-react";
import type { LicitacionConGuardada } from "@/types";

interface LicitacionesActivasProps {
  licitaciones: LicitacionConGuardada[];
}

export function LicitacionesActivas({ licitaciones }: LicitacionesActivasProps) {
  if (licitaciones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mis licitaciones en seguimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="mb-3">Todavía no tenés licitaciones en seguimiento.</p>
            <Link href="/explorar">
              <Button variant="outline" size="sm">
                Explorar licitaciones
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Mis licitaciones en seguimiento</CardTitle>
        <Link href="/dashboard/licitaciones">
          <Button variant="ghost" size="sm" className="text-blue-600 text-xs">
            Ver todas
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {licitaciones.slice(0, 5).map((l) => {
            const estadoUsuario =
              l.licitaciones_guardadas?.[0]?.estado_usuario ?? "seguimiento";
            const diasRestantes = l.fecha_limite_oferta
              ? getDaysRemaining(l.fecha_limite_oferta)
              : null;

            return (
              <div
                key={l.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {l.titulo}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{l.institucion}</p>
                  {l.monto_estimado && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatCurrency(l.monto_estimado, l.moneda)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <Badge className={`text-xs ${getEstadoBadgeColor(estadoUsuario)}`}>
                    {estadoUsuario}
                  </Badge>
                  {diasRestantes !== null && (
                    <div
                      className={`flex items-center gap-1 text-xs ${
                        diasRestantes <= 3
                          ? "text-red-600"
                          : diasRestantes <= 7
                          ? "text-amber-600"
                          : "text-gray-400"
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {diasRestantes > 0
                        ? `${diasRestantes}d`
                        : "Vencida"}
                    </div>
                  )}
                  <div className="flex gap-1">
                    <Link href={`/explorar/${l.id}`}>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
