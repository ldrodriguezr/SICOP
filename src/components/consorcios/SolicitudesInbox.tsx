"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export interface SolicitudInboxItem {
  id: string;
  estado: "pendiente" | "aceptada" | "rechazada" | "completada";
  mensaje: string | null;
  created_at: string;
  esRecibida: boolean;
  contraparte: {
    id: string;
    nombre: string;
    empresa: string | null;
  };
}

interface SolicitudesInboxProps {
  solicitudes: SolicitudInboxItem[];
}

const badgeMap: Record<SolicitudInboxItem["estado"], string> = {
  pendiente: "bg-yellow-100 text-yellow-800",
  aceptada: "bg-green-100 text-green-800",
  rechazada: "bg-red-100 text-red-800",
  completada: "bg-blue-100 text-blue-800",
};

export function SolicitudesInbox({ solicitudes }: SolicitudesInboxProps) {
  const [items, setItems] = useState(solicitudes);

  async function cambiarEstado(id: string, estado: "aceptada" | "rechazada" | "completada") {
    const response = await fetch(`/api/consorcios/solicitud/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });

    const json = await response.json();

    if (!json.success) {
      toast.error(json.error?.message ?? "No se pudo actualizar la solicitud");
      return;
    }

    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, estado } : item))
    );
    toast.success(`Solicitud ${estado}`);
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-gray-500">
          No tenés solicitudes todavía.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-gray-900">
                    {item.contraparte.empresa ?? item.contraparte.nombre}
                  </p>
                  <Badge className={badgeMap[item.estado]}>{item.estado}</Badge>
                  <Badge variant="outline">
                    {item.esRecibida ? "Recibida" : "Enviada"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400">{formatDate(item.created_at)}</p>
                {item.mensaje && (
                  <p className="text-sm text-gray-600 line-clamp-2">{item.mensaje}</p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/consorcios/solicitudes/${item.id}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <MessageSquare className="h-4 w-4" />
                    Chat
                  </Button>
                </Link>

                {item.esRecibida && item.estado === "pendiente" && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white gap-1"
                      onClick={() => cambiarEstado(item.id, "aceptada")}
                    >
                      <Check className="h-4 w-4" />
                      Aceptar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                      onClick={() => cambiarEstado(item.id, "rechazada")}
                    >
                      <X className="h-4 w-4" />
                      Rechazar
                    </Button>
                  </>
                )}

                {!item.esRecibida && item.estado === "aceptada" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cambiarEstado(item.id, "completada")}
                  >
                    Marcar completada
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
