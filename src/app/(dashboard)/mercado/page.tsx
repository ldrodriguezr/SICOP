"use client";

import { useState } from "react";
import { TrendingUp, Search, Calculator, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";

interface Tendencia {
  año: number;
  promedio: number;
  contratos: number;
}

interface Estadisticas {
  promedio: number;
  minimo: number;
  maximo: number;
  total_contratos: number;
}

interface MercadoData {
  estadisticas: Estadisticas;
  tendencia: Tendencia[];
  registros: Array<{
    id: string;
    descripcion_bien: string | null;
    proveedor_nombre: string | null;
    monto_adjudicado: number | null;
    precio_unitario: number | null;
    fecha_adjudicacion: string | null;
    institucion: string | null;
  }>;
}

export default function MercadoPage() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MercadoData | null>(null);

  const [miCosto, setMiCosto] = useState("");
  const [margen, setMargen] = useState("30");

  async function handleBuscar() {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/mercado/precios?q=${encodeURIComponent(q)}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast.error("Error buscando datos de mercado");
      }
    } catch {
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  }

  function calcularPrecioSugerido() {
    if (!miCosto || !data) return null;
    const costo = parseFloat(miCosto);
    const margenNum = parseFloat(margen) / 100;
    const precioConMargen = costo * (1 + margenNum);
    const promedioHistorico = data.estadisticas.promedio;
    const porcentajeVsPromedio = ((precioConMargen - promedioHistorico) / promedioHistorico) * 100;

    return { precioConMargen, promedioHistorico, porcentajeVsPromedio };
  }

  const calc = calcularPrecioSugerido();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-600" />
          Inteligencia de Mercado
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Precios históricos de licitaciones adjudicadas en SICOP.
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por tipo de bien o servicio..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && handleBuscar()}
          />
        </div>
        <Button
          onClick={handleBuscar}
          disabled={loading || !q.trim()}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Buscar
        </Button>
      </div>

      {!data && !loading && (
        <Card>
          <CardContent className="py-16 text-center text-gray-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Buscá un tipo de bien o servicio para ver datos históricos.</p>
            <p className="text-sm mt-1">Ej: "computadoras", "cemento", "servicios limpieza"</p>
          </CardContent>
        </Card>
      )}

      {data && (
        <Tabs defaultValue="precios">
          <TabsList>
            <TabsTrigger value="precios">Precios históricos</TabsTrigger>
            <TabsTrigger value="calculadora">
              <Calculator className="w-4 h-4 mr-1" /> Calculadora
            </TabsTrigger>
          </TabsList>

          <TabsContent value="precios" className="space-y-4 mt-4">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Precio promedio", value: formatCurrency(data.estadisticas.promedio) },
                { label: "Precio mínimo", value: formatCurrency(data.estadisticas.minimo) },
                { label: "Precio máximo", value: formatCurrency(data.estadisticas.maximo) },
                { label: "Total contratos", value: String(data.estadisticas.total_contratos) },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="pt-4 pb-4">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{s.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Gráfico */}
            {data.tendencia.length > 1 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Tendencia de precios por año</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={data.tendencia}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                      <XAxis dataKey="año" tick={{ fontSize: 12 }} />
                      <YAxis
                        tickFormatter={(v) =>
                          new Intl.NumberFormat("es-CR", {
                            notation: "compact",
                          }).format(v)
                        }
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(v) => formatCurrency(v as number)}
                        labelFormatter={(l) => `Año ${l}`}
                      />
                      <Line
                        type="monotone"
                        dataKey="promedio"
                        stroke="#1A56DB"
                        strokeWidth={2}
                        dot={{ fill: "#1A56DB" }}
                        name="Precio promedio"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Últimos contratos */}
            {data.registros.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Últimos contratos adjudicados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.registros.map((r) => (
                      <div
                        key={r.id}
                        className="flex justify-between items-start text-sm border-b border-gray-50 pb-2"
                      >
                        <div>
                          <p className="font-medium text-gray-800 line-clamp-1">
                            {r.proveedor_nombre ?? "Proveedor N/D"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {r.institucion} · {r.fecha_adjudicacion}
                          </p>
                        </div>
                        <p className="font-semibold text-green-700 flex-shrink-0 ml-4">
                          {r.precio_unitario
                            ? formatCurrency(r.precio_unitario)
                            : "N/D"}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="calculadora" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Calculadora de oferta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Mi costo (CRC)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={miCosto}
                      onChange={(e) => setMiCosto(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Margen deseado (%)</Label>
                    <Input
                      type="number"
                      placeholder="30"
                      value={margen}
                      onChange={(e) => setMargen(e.target.value)}
                    />
                  </div>
                </div>

                {calc && (
                  <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Precio sugerido:</span>
                      <span className="font-bold text-blue-700 text-lg">
                        {formatCurrency(calc.precioConMargen)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Promedio histórico:</span>
                      <span className="font-medium text-gray-700">
                        {formatCurrency(calc.promedioHistorico)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Tu precio vs promedio:</span>
                      <span
                        className={`font-medium ${
                          calc.porcentajeVsPromedio > 20
                            ? "text-red-600"
                            : calc.porcentajeVsPromedio < -20
                            ? "text-green-600"
                            : "text-amber-600"
                        }`}
                      >
                        {calc.porcentajeVsPromedio > 0 ? "+" : ""}
                        {calc.porcentajeVsPromedio.toFixed(1)}%
                      </span>
                    </div>
                    {Math.abs(calc.porcentajeVsPromedio) > 30 && (
                      <p className="text-xs text-amber-600">
                        ⚠ Tu precio está lejos del promedio histórico. Revisá si el costo refleja bien la realidad del mercado.
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
