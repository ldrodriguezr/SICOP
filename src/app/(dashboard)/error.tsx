"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <AlertTriangle className="w-12 h-12 text-red-500" />
      <h2 className="text-xl font-semibold text-gray-900">
        Ocurrió un error al cargar esta página
      </h2>
      <p className="text-sm text-gray-500 max-w-md">
        {error.message ?? "Error desconocido"}
      </p>
      {error.digest && (
        <p className="text-xs text-gray-400 font-mono">
          Código: {error.digest}
        </p>
      )}
      <Button onClick={reset}>Intentar de nuevo</Button>
    </div>
  );
}
