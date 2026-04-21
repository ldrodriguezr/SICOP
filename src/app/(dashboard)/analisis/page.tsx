import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Plus, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { AnalisisCartel } from "@/types";

export default async function AnalisisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: historialRaw } = await supabase
    .from("analisis_carteles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const historial = historialRaw as AnalisisCartel[] | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-blue-600" />
            Análisis de Carteles
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Historial de análisis realizados con IA.
          </p>
        </div>
        <Link href="/analisis/nuevo">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
            <Plus className="w-4 h-4" /> Nuevo análisis
          </Button>
        </Link>
      </div>

      {!historial?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Brain className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">
              Todavía no hiciste ningún análisis.
            </p>
            <Link href="/analisis/nuevo">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Plus className="w-4 h-4" /> Analizar mi primer cartel
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {historial.map((a) => {
            const score = a.score_viabilidad ?? 0;
            const scoreColor =
              score >= 70
                ? "bg-green-100 text-green-700"
                : score >= 40
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700";

            return (
              <Card key={a.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 line-clamp-2">
                        {a.resumen.slice(0, 120)}...
                      </p>
                      {a.documentos_necesarios && (
                        <p className="text-xs text-gray-500 mt-1">
                          {(a.documentos_necesarios as string[]).length} documentos
                          necesarios
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Badge className={`text-sm font-bold ${scoreColor}`}>
                        {score}/100
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        {formatDate(a.created_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
