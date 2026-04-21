import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SolicitudesInbox, type SolicitudInboxItem } from "@/components/consorcios/SolicitudesInbox";
import type { ConsorcioSolicitud, UserProfile } from "@/types";

export default async function SolicitudesConsorcioPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: solicitudesData } = await supabase
    .from("consorcio_solicitudes")
    .select("*")
    .or(`solicitante_id.eq.${user.id},receptor_id.eq.${user.id}`)
    .order("created_at", { ascending: false });

  const solicitudes = (solicitudesData ?? []) as ConsorcioSolicitud[];
  const counterpartIds = [
    ...new Set(
      solicitudes.map((solicitud) =>
        solicitud.solicitante_id === user.id
          ? solicitud.receptor_id
          : solicitud.solicitante_id
      )
    ),
  ];

  let profilesMap = new Map<string, UserProfile>();

  if (counterpartIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("user_profiles")
      .select("*")
      .in("id", counterpartIds);

    profilesMap = new Map(
      ((profilesData ?? []) as UserProfile[]).map((profile) => [profile.id, profile])
    );
  }

  const items: SolicitudInboxItem[] = solicitudes.map((solicitud) => {
    const counterpartId =
      solicitud.solicitante_id === user.id
        ? solicitud.receptor_id
        : solicitud.solicitante_id;
    const counterpart = profilesMap.get(counterpartId);

    return {
      id: solicitud.id,
      estado: solicitud.estado,
      mensaje: solicitud.mensaje,
      created_at: solicitud.created_at,
      esRecibida: solicitud.receptor_id === user.id,
      contraparte: {
        id: counterpartId,
        nombre: counterpart?.nombre_contacto ?? "Proveedor",
        empresa: counterpart?.nombre_empresa ?? null,
      },
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Inbox className="h-6 w-6 text-purple-600" />
          Solicitudes de consorcio
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Gestioná tus solicitudes enviadas y recibidas, y abrí el chat cuando haga falta.
        </p>
      </div>

      <SolicitudesInbox solicitudes={items} />
    </div>
  );
}
