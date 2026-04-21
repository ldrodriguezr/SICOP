"use client";

import { Bell, CheckCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import type { Notificacion } from "@/types";

interface NotificacionesFeedProps {
  notificaciones: Notificacion[];
}

export function NotificacionesFeed({ notificaciones }: NotificacionesFeedProps) {
  const { marcarNotificacionLeida } = useAppStore();

  async function handleMarcarLeida(id: string) {
    const supabase = createClient();
    await supabase
      .from("notificaciones")
      .update({ leida: true })
      .eq("id", id);
    marcarNotificacionLeida(id);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notificaciones recientes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notificaciones.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No hay notificaciones nuevas
          </p>
        ) : (
          <div className="space-y-2">
            {notificaciones.slice(0, 6).map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg transition-colors",
                  n.leida ? "bg-white" : "bg-blue-50 border border-blue-100"
                )}
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                    n.leida ? "bg-gray-300" : "bg-blue-500"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {n.titulo}
                  </p>
                  {n.mensaje && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {n.mensaje}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(n.created_at)}
                  </p>
                </div>
                {!n.leida && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 flex-shrink-0"
                    onClick={() => handleMarcarLeida(n.id)}
                  >
                    <CheckCheck className="w-3 h-3 text-blue-500" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
