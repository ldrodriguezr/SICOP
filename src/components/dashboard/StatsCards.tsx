"use client";

import { Brain, TrendingUp, Clock, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardsProps {
  stats: {
    licitacionesActivas: number;
    analisisEsteMs: number;
    analisisMax: number;
    proximosVencer: number;
    contratosGanados: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const items = [
    {
      label: "Licitaciones activas",
      value: stats.licitacionesActivas,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Análisis este mes",
      value: `${stats.analisisEsteMs} / ${stats.analisisMax}`,
      icon: Brain,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Vencen pronto",
      value: stats.proximosVencer,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Contratos ganados",
      value: stats.contratosGanados,
      icon: Trophy,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {item.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {item.value}
                  </p>
                </div>
                <div className={cn("p-2 rounded-lg", item.bg)}>
                  <Icon className={cn("w-5 h-5", item.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
