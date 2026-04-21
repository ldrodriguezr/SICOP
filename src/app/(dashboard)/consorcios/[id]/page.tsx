import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Briefcase, Building2, MapPin, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SolicitudConsorcioDialog } from "@/components/consorcios/SolicitudConsorcioDialog";
import { formatCurrency } from "@/lib/utils";
import type { ConsorcioProfile, UserProfile, ConsorcioSolicitud } from "@/types";

export default async function ConsorcioDetallePage({
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

  const { data: profileData } = await supabase
    .from("consorcio_perfiles")
    .select("*")
    .eq("id", id)
    .eq("activo", true)
    .maybeSingle();

  const profile = profileData as ConsorcioProfile | null;

  if (!profile) notFound();

  const { data: ownerData } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", profile.user_id)
    .maybeSingle();

  const owner = ownerData as UserProfile | null;

  const { data: solicitudData } = await supabase
    .from("consorcio_solicitudes")
    .select("*")
    .or(
      `and(solicitante_id.eq.${user.id},receptor_id.eq.${profile.user_id}),and(solicitante_id.eq.${profile.user_id},receptor_id.eq.${user.id})`
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const solicitud = solicitudData as ConsorcioSolicitud | null;
  const esPropio = profile.user_id === user.id;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/consorcios">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>

        {!esPropio && solicitud ? (
          <Link href={`/consorcios/solicitudes/${solicitud.id}`}>
            <Button variant="outline">Abrir conversación</Button>
          </Link>
        ) : null}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{profile.titulo}</h1>
                <p className="text-gray-500">
                  {owner?.nombre_empresa ?? owner?.nombre_contacto ?? "Proveedor"}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-purple-50 text-purple-700">
                  {profile.experiencia_licitaciones} licitaciones
                </Badge>
                {profile.tiene_sicop ? (
                  <Badge className="bg-green-50 text-green-700">Registrado SICOP</Badge>
                ) : null}
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span className="text-sm font-medium">{profile.rating.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {!esPropio ? (
              solicitud ? (
                <Badge className="bg-blue-100 text-blue-700">{solicitud.estado}</Badge>
              ) : (
                <SolicitudConsorcioDialog
                  receptorId={profile.user_id}
                  receptorNombre={owner?.nombre_contacto ?? "este proveedor"}
                />
              )
            ) : (
              <Link href="/consorcios/mi-perfil">
                <Button>Editar mi perfil</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Descripción</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{profile.descripcion}</p>

            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Productos y servicios</h3>
              <div className="flex flex-wrap gap-2">
                {profile.productos_servicios?.map((item) => (
                  <Badge key={item} variant="outline">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Capacidad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
              <span>{profile.zona_cobertura?.join(", ") ?? "Cobertura nacional"}</span>
            </div>
            <div className="flex items-start gap-2">
              <Briefcase className="h-4 w-4 text-gray-400 mt-0.5" />
              <span>
                {profile.capacidad_mensual_usd
                  ? `${formatCurrency(profile.capacidad_mensual_usd, "USD")} / mes`
                  : "Capacidad no indicada"}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-gray-400 mt-0.5" />
              <span>{owner?.zona_geografica ?? "Ubicación no indicada"}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
