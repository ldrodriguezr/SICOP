"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Zap,
  Building2,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";

const plans = [
  {
    id: "pro" as const,
    name: "Pro",
    price: "US$15",
    period: "/mes",
    description: "Para proveedores activos",
    features: [
      "50 análisis IA por mes",
      "10 alertas configuradas",
      "Inteligencia de mercado completa",
      "Historial 5 años",
      "Red de consorcios",
      "Soporte prioritario",
    ],
    icon: Zap,
    color: "bg-blue-600",
    border: "border-blue-300",
  },
  {
    id: "business" as const,
    name: "Business",
    price: "US$40",
    period: "/mes",
    description: "Para gestores y consultores SICOP",
    features: [
      "200 análisis IA por mes",
      "Alertas ilimitadas",
      "Exportar datos Excel/CSV",
      "Historial completo",
      "Red de consorcios",
      "Soporte dedicado",
    ],
    icon: Building2,
    color: "bg-purple-600",
    border: "border-purple-300",
  },
];

export default function PlanPage() {
  const { user } = useAppStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const currentPlan = user?.plan ?? "free";

  async function handleCheckout(plan: "pro" | "business") {
    setLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.checkoutUrl;
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al crear el checkout");
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.open(data.portalUrl, "_blank");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al abrir el portal");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mejorar plan</h1>
          <p className="text-gray-500 text-sm mt-1">
            Elegí el plan que mejor se adapta a tus necesidades.
          </p>
        </div>

        {currentPlan !== "free" && (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePortal}
            disabled={portalLoading}
          >
            {portalLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4 mr-2" />
            )}
            Gestionar suscripción
          </Button>
        )}
      </div>

      {currentPlan !== "free" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800">
            Tenés el plan{" "}
            <strong className="capitalize">{currentPlan}</strong> activo. Podés
            gestionar tu suscripción desde el portal de facturación.
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isActive = currentPlan === plan.id;

          return (
            <Card
              key={plan.id}
              className={`border-2 ${isActive ? plan.border : "border-gray-200"}`}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-lg ${plan.color} flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      {isActive && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          Activo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{plan.description}</p>
                  </div>
                </div>
                <div>
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full text-white ${plan.color} hover:opacity-90`}
                  disabled={isActive || loading === plan.id}
                  onClick={() => handleCheckout(plan.id)}
                >
                  {loading === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirigiendo…
                    </>
                  ) : isActive ? (
                    "Plan actual"
                  ) : (
                    `Suscribirse a ${plan.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Badge className="bg-blue-100 text-blue-700">Pagos</Badge>
          <p className="text-sm text-blue-800">
            Los pagos son procesados de forma segura por{" "}
            <strong>Lemon Squeezy</strong>. Aceptamos tarjetas de crédito y
            débito internacionales. Podés cancelar en cualquier momento desde el
            portal de facturación. Los precios están en dólares americanos.
          </p>
        </div>
      </div>
    </div>
  );
}
