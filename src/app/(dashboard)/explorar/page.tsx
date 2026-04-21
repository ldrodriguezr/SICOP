"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { Search, Filter, ExternalLink, Brain, Bookmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatCurrency,
  formatDate,
  getDaysRemaining,
  getEstadoBadgeColor,
  truncate,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { toast } from "sonner";
import type { Licitacion } from "@/types";

function ExplorarContent() {
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("activo");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchLicitaciones = useCallback(
    async (resetPage = false) => {
      setLoading(true);
      setError(null);
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);

      try {
        const params = new URLSearchParams({
          q,
          estado,
          page: String(currentPage),
          limit: "20",
        });
        const res = await fetch(`/api/licitaciones?${params}`);
        if (!res.ok) {
          throw new Error(`Error del servidor: ${res.status}`);
        }
        const json = await res.json();

        if (json.success) {
          if (resetPage) {
            setLicitaciones(json.data ?? []);
          } else {
            setLicitaciones((prev) => [...prev, ...(json.data ?? [])]);
          }
          setTotal(json.meta?.total ?? 0);
          setHasMore(json.meta?.hasMore ?? false);
        } else {
          throw new Error(json.error?.message ?? "Error al cargar datos");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error cargando licitaciones";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, estado, page]
  );

  useEffect(() => {
    fetchLicitaciones(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, estado]);

  async function handleGuardar(licitacionId: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Iniciá sesión para guardar licitaciones");
      return;
    }

    const { error } = await supabase.from("licitaciones_guardadas").upsert(
      { user_id: user.id, licitacion_id: licitacionId, estado_usuario: "seguimiento" },
      { onConflict: "user_id,licitacion_id" }
    );

    if (error) {
      toast.error("Error guardando la licitación");
    } else {
      toast.success("Guardada en seguimiento");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Explorar licitaciones
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {loading
            ? "Cargando..."
            : total > 0
            ? `${total.toLocaleString()} licitaciones encontradas`
            : "Sin resultados"}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, institución..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-44">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="activo">Activas</SelectItem>
            <SelectItem value="adjudicado">Adjudicadas</SelectItem>
            <SelectItem value="desierto">Desiertas</SelectItem>
            <SelectItem value="cancelado">Canceladas</SelectItem>
            <SelectItem value="todos">Todas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error state */}
      {error && !loading && (
        <Card>
          <CardContent className="py-10 text-center text-red-500">
            <p className="font-medium">Error al cargar licitaciones</p>
            <p className="text-sm text-gray-500 mt-1">{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => fetchLicitaciones(true)}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      {!error && loading && licitaciones.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !error && licitaciones.length === 0 && !loading ? (
        <Card>
          <CardContent className="py-16 text-center text-gray-500">
            No se encontraron licitaciones con esos filtros.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {licitaciones.map((l) => {
            const dias = l.fecha_limite_oferta
              ? getDaysRemaining(l.fecha_limite_oferta)
              : null;

            return (
              <Card
                key={l.id}
                className="hover:shadow-sm transition-shadow"
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          className={`text-xs ${getEstadoBadgeColor(l.estado ?? "")}`}
                        >
                          {l.estado}
                        </Badge>
                        {l.tipo && (
                          <span className="text-xs text-gray-400">{l.tipo}</span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900">
                        {truncate(l.titulo ?? "", 100)}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>{l.institucion}</span>
                        {l.monto_estimado != null && (
                          <span className="text-green-700 font-medium">
                            {formatCurrency(Number(l.monto_estimado), l.moneda ?? "CRC")}
                          </span>
                        )}
                        {l.fecha_limite_oferta && (
                          <span className={dias !== null && dias <= 3 ? "text-red-600 font-medium" : ""}>
                            Vence: {formatDate(l.fecha_limite_oferta)}
                            {dias !== null && dias >= 0 && ` (${dias}d)`}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Link href={`/analisis/nuevo?licitacionId=${l.id}`}>
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          <Brain className="w-3 h-3" /> Analizar
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGuardar(l.id)}
                      >
                        <Bookmark className="w-4 h-4" />
                      </Button>
                      {l.url_sicop && (
                        <a
                          href={l.url_sicop}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {hasMore && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setPage((p) => p + 1);
                  fetchLicitaciones(false);
                }}
                disabled={loading}
              >
                {loading ? "Cargando..." : "Cargar más"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExplorarPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      }
    >
      <ExplorarContent />
    </Suspense>
  );
}
