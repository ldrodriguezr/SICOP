"use client";

import { Bell, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAppStore } from "@/store/useAppStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HeaderProps {
  titulo?: string;
}

export function Header({ titulo }: HeaderProps) {
  const { user, notificacionesNoLeidas } = useAppStore();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const initials = user?.nombre_contacto
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "U";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {titulo && (
        <h1 className="text-lg font-semibold text-gray-900">{titulo}</h1>
      )}
      {!titulo && <div />}

      <div className="flex items-center gap-3">
        {/* Notificaciones */}
        <Link href="/dashboard" className="relative">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-5 h-5 text-gray-500" />
            {notificacionesNoLeidas > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-500">
                {notificacionesNoLeidas > 9 ? "9+" : notificacionesNoLeidas}
              </Badge>
            )}
          </Button>
        </Link>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {user && (
                <span className="text-sm text-gray-700 hidden sm:block">
                  {user.nombre_contacto}
                </span>
              )}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {user && (
              <>
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-gray-900">
                    {user.nombre_empresa ?? user.nombre_contacto}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    Plan {user.plan}
                  </p>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Mi perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings/plan" className="flex items-center gap-2">
                Upgrade de plan
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:text-red-600 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
