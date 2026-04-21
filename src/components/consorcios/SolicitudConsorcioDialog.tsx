"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SolicitudConsorcioDialogProps {
  receptorId: string;
  receptorNombre: string;
  triggerLabel?: string;
}

export function SolicitudConsorcioDialog({
  receptorId,
  receptorNombre,
  triggerLabel = "Conectar",
}: SolicitudConsorcioDialogProps) {
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);

    const response = await fetch("/api/consorcios/solicitud", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receptorId,
        mensaje,
      }),
    });

    const json = await response.json();

    if (!json.success) {
      toast.error(json.error?.message ?? "No se pudo enviar la solicitud");
      setLoading(false);
      return;
    }

    toast.success("Solicitud enviada correctamente");
    setMensaje("");
    setOpen(false);
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar solicitud a {receptorNombre}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="mensaje-consorcio">Mensaje inicial</Label>
          <Textarea
            id="mensaje-consorcio"
            rows={5}
            placeholder="Contale brevemente qué buscás, qué ofrecés y cómo te gustaría colaborar."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || mensaje.trim().length < 20}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Enviar solicitud
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
