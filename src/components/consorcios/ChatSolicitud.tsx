"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDateShort } from "@/lib/utils";
import type { ConsorcioMensaje } from "@/types";

interface ChatSolicitudProps {
  solicitudId: string;
  currentUserId: string;
  estado: string;
  counterpartName: string;
}

export function ChatSolicitud({
  solicitudId,
  currentUserId,
  estado,
  counterpartName,
}: ChatSolicitudProps) {
  const [mensajes, setMensajes] = useState<ConsorcioMensaje[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [texto, setTexto] = useState("");

  async function loadMensajes() {
    const response = await fetch(`/api/consorcios/solicitud/${solicitudId}/mensajes`);
    const json = await response.json();

    if (!json.success) {
      toast.error(json.error?.message ?? "No se pudo cargar la conversación");
      setLoading(false);
      return;
    }

    setMensajes(json.data.mensajes);
    setLoading(false);
  }

  useEffect(() => {
    loadMensajes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solicitudId]);

  async function enviarMensaje() {
    setSending(true);
    const response = await fetch(`/api/consorcios/solicitud/${solicitudId}/mensajes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje: texto }),
    });

    const json = await response.json();

    if (!json.success) {
      toast.error(json.error?.message ?? "No se pudo enviar el mensaje");
      setSending(false);
      return;
    }

    setMensajes((current) => [...current, json.data]);
    setTexto("");
    setSending(false);
  }

  const bloqueado = useMemo(() => estado === "rechazada", [estado]);

  return (
    <Card className="h-[70vh] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Conversación con {counterpartName}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        <ScrollArea className="flex-1 rounded-md border px-4 py-3">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : mensajes.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-gray-500">
              No hay mensajes todavía.
            </div>
          ) : (
            <div className="space-y-3">
              {mensajes.map((mensaje) => {
                const esMio = mensaje.sender_id === currentUserId;
                return (
                  <div
                    key={mensaje.id}
                    className={`flex ${esMio ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-xl px-4 py-2 ${
                        esMio
                          ? "bg-purple-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{mensaje.mensaje}</p>
                      <p
                        className={`mt-1 text-[11px] ${
                          esMio ? "text-purple-100" : "text-gray-400"
                        }`}
                      >
                        {formatDateShort(mensaje.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="space-y-2">
          <Textarea
            rows={3}
            placeholder={
              bloqueado
                ? "La solicitud fue rechazada y la conversación quedó cerrada."
                : "Escribí un mensaje..."
            }
            disabled={bloqueado || sending}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
          />
          <Button
            className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            disabled={bloqueado || sending || texto.trim().length === 0}
            onClick={enviarMensaje}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar mensaje
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
