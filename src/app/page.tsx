import Link from "next/link";
import { Building2, Brain, TrendingUp, Bell, Users, ArrowRight, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Brain,
    title: "Análisis de carteles con IA",
    description:
      "Pegás el PDF del cartel y en 30 segundos sabés si vale la pena, qué documentos necesitás y cuánto debería ser tu oferta.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: TrendingUp,
    title: "Inteligencia de precios históricos",
    description:
      "Accedé a datos reales de licitaciones adjudicadas. Sabé a cuánto vendieron otros y calculá tu precio competitivo.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Bell,
    title: "Alertas de licitaciones",
    description:
      "Configurás palabras clave y te avisamos cuando aparece una licitación que te interesa. Sin perderte nada.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Users,
    title: "Red de consorcios",
    description:
      "Conectate con otros proveedores para armar consorcios y participar en licitaciones más grandes.",
    color: "bg-purple-50 text-purple-600",
  },
];

const plans = [
  {
    name: "Free",
    price: "₡0",
    period: "/mes",
    description: "Para explorar el sistema",
    features: [
      "5 análisis IA por mes",
      "2 alertas configuradas",
      "Explorador de licitaciones",
      "Historial 12 meses",
    ],
    cta: "Empezar gratis",
    highlight: false,
  },
  {
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
    cta: "Empezar Pro",
    highlight: true,
  },
  {
    name: "Business",
    price: "$40",
    period: "/mes",
    description: "Para gestores y consultores",
    features: [
      "200 análisis IA por mes",
      "Alertas ilimitadas",
      "Exportar datos Excel/CSV",
      "Historial completo",
      "API access",
      "Soporte dedicado",
    ],
    cta: "Empezar Business",
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-gray-900">SICOP Copilot</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/registro">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                Empezar gratis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50">
            El Estado compra ₡3.2 billones al año en Costa Rica
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Tu copiloto inteligente para{" "}
            <span className="text-blue-600">contratar con el Estado</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            En 60 segundos sabés si una licitación vale tu tiempo, cuánto debés
            ofertar y qué documentos te faltan.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/registro">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                Empezar gratis
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/explorar">
              <Button size="lg" variant="outline">
                Ver licitaciones activas
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">
            Sin tarjeta de crédito · 5 análisis gratis al mes
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-4xl font-bold text-blue-600">₡3.2B</p>
            <p className="text-gray-600 mt-1">en compras públicas anuales</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-green-600">15%</p>
            <p className="text-gray-600 mt-1">del PIB de Costa Rica</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-amber-600">30s</p>
            <p className="text-gray-600 mt-1">para analizar un cartel con IA</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Todo lo que necesitás para ganar licitaciones
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              SICOP Copilot combina IA, datos históricos y red de proveedores
              para que vos tomés mejores decisiones más rápido.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-6 rounded-xl border border-gray-100 bg-white hover:shadow-md transition-shadow"
                >
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${f.color}`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {f.title}
                  </h3>
                  <p className="text-gray-600">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Precios simples y transparentes
            </h2>
            <p className="text-gray-600">
              Empezás gratis. Escalás cuando lo necesités.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-xl border-2 bg-white relative ${
                  plan.highlight
                    ? "border-blue-500 shadow-lg"
                    : "border-gray-200"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white hover:bg-blue-600 gap-1">
                      <Star className="w-3 h-3" /> Popular
                    </Badge>
                  </div>
                )}
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-2 mb-1">
                  <span className="text-3xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-500 mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link href="/registro" className="block">
                  <Button
                    className={`w-full ${
                      plan.highlight
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : ""
                    }`}
                    variant={plan.highlight ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded flex items-center justify-center">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-700">SICOP Copilot</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/privacidad" className="hover:text-gray-700">
              Privacidad
            </Link>
            <Link href="/terminos" className="hover:text-gray-700">
              Términos
            </Link>
          </div>
          <p className="text-sm text-gray-400">
            © 2026 SICOP Copilot. Costa Rica.
          </p>
        </div>
      </footer>
    </div>
  );
}
