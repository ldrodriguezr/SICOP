import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MapPin, Star, Plus, Inbox } from "lucide-react";
import type { ConsorcioProfile } from "@/types";
import { SolicitudConsorcioDialog } from "@/components/consorcios/SolicitudConsorcioDialog";

export default async function ConsorciosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfiles } = await supabase
    .from("consorcio_perfiles")
    .select("*, user_profiles(nombre_contacto, nombre_empresa)")
    .eq("activo", true)
    .order("rating", { ascending: false })
    .limit(30);

  const { data: miPerfil } = await supabase
    .from("consorcio_perfiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" />
            Red de Consorcios
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Conectate con proveedores para armar consorcios y ganar más licitaciones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/consorcios/solicitudes">
            <Button variant="outline" className="gap-2">
              <Inbox className="w-4 h-4" />
              Solicitudes
            </Button>
          </Link>
          <Link href="/consorcios/mi-perfil">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
              {miPerfil ? (
                "Mi perfil"
              ) : (
                <>
                  <Plus className="w-4 h-4" /> Crear mi perfil
                </>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {!perfiles?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 mb-3">
              Todavía no hay proveedores en la red.
            </p>
            <Link href="/consorcios/mi-perfil">
              <Button variant="outline">Sé el primero en publicar tu perfil</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {(perfiles as unknown as (ConsorcioProfile & { user_profiles: { nombre_contacto: string; nombre_empresa: string | null } })[]).map(
            (p) => (
              <Card key={p.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{p.titulo}</p>
                      <p className="text-sm text-gray-500">
                        {p.user_profiles?.nombre_empresa ??
                          p.user_profiles?.nombre_contacto}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span className="text-sm font-medium">
                        {p.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {p.descripcion}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.productos_servicios?.slice(0, 3).map((ps) => (
                      <Badge
                        key={ps}
                        className="text-xs bg-purple-50 text-purple-700"
                      >
                        {ps}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <MapPin className="w-3 h-3" />
                      {p.zona_cobertura?.join(", ") ?? "Nacional"}
                    </div>
                    <div className="flex items-center gap-2">
                      {p.tiene_sicop && (
                        <Badge className="text-xs bg-green-50 text-green-700">
                          Registrado SICOP
                        </Badge>
                      )}
                      {p.user_id !== user.id && (
                        <>
                          <Link href={`/consorcios/${p.id}`}>
                            <Button variant="outline" size="sm" className="text-xs">
                              Ver perfil
                            </Button>
                          </Link>
                          <SolicitudConsorcioDialog
                            receptorId={p.user_id}
                            receptorNombre={
                              p.user_profiles?.nombre_contacto ?? "este proveedor"
                            }
                            triggerLabel="Conectar"
                          />
                        </>
                      )}
                      {p.user_id === user.id && (
                        <Link href={`/consorcios/${p.id}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            Ver perfil
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
