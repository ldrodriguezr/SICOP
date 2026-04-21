import { CheckCircle2, Zap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    id: "pro",
    name: "Pro",
    price: "$15",
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
  },
  {
    id: "business",
    name: "Business",
    price: "$40",
    period: "/mes",
    description: "Para gestores y consultores SICOP",
    features: [
      "200 análisis IA por mes",
      "Alertas ilimitadas",
      "Exportar datos Excel/CSV",
      "Historial completo",
      "Soporte dedicado",
    ],
    icon: Building2,
    color: "bg-purple-600",
  },
];

export default function PlanPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mejorar plan</h1>
        <p className="text-gray-500 text-sm mt-1">
          Elegí el plan que mejor se adapta a tus necesidades.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card key={plan.id} className="border-2 border-gray-200">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`w-10 h-10 rounded-lg ${plan.color} flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
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
                  disabled
                >
                  Próximamente — Integración de pagos en Fase 5
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Badge className="bg-amber-100 text-amber-700">Nota</Badge>
          <p className="text-sm text-amber-800">
            La integración de pagos (Stripe/Paddle) está planificada para la Fase 5 del
            proyecto. Mientras tanto, contactanos directamente si querés acceder a
            un plan Pro o Business.
          </p>
        </div>
      </div>
    </div>
  );
}
