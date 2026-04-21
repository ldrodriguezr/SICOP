import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatSolicitud } from "@/components/consorcios/ChatSolicitud";
import type { ConsorcioSolicitud, UserProfile } from "@/types";

export default async function SolicitudChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: solicitudData } = await supabase
    .from("consorcio_solicitudes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const solicitud = solicitudData as ConsorcioSolicitud | null;

  if (!solicitud) notFound();

  const isParticipant =
    solicitud.solicitante_id === user.id || solicitud.receptor_id === user.id;

  if (!isParticipant) redirect("/consorcios/solicitudes");

  const counterpartId =
    solicitud.solicitante_id === user.id
      ? solicitud.receptor_id
      : solicitud.solicitante_id;

  const { data: counterpartData } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", counterpartId)
    .maybeSingle();

  const counterpart = counterpartData as UserProfile | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/consorcios/solicitudes">
            <Button variant="ghost" size="sm" className="gap-2 mb-2">
              <ArrowLeft className="h-4 w-4" />
              Volver a solicitudes
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-purple-600" />
            Chat de consorcio
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Conversación con {counterpart?.nombre_empresa ?? counterpart?.nombre_contacto ?? "proveedor"}
          </p>
        </div>
        <Badge className="bg-purple-100 text-purple-700">{solicitud.estado}</Badge>
      </div>

      <ChatSolicitud
        solicitudId={solicitud.id}
        currentUserId={user.id}
        estado={solicitud.estado}
        counterpartName={counterpart?.nombre_empresa ?? counterpart?.nombre_contacto ?? "Proveedor"}
      />
    </div>
  );
}
