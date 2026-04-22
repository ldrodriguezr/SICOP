"use client";

import { useState, useRef } from "react";
import { Upload, Link, FileText, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface UploadCartelProps {
  onSubmit: (data: {
    tipo: "pdf" | "url" | "texto";
    contenido: string;
  }) => void;
  isLoading?: boolean;
  defaultUrl?: string;
}

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function UploadCartel({ onSubmit, isLoading, defaultUrl }: UploadCartelProps) {
  const [url, setUrl] = useState(defaultUrl ?? "");
  const [texto, setTexto] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfError, setPdfError] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(file: File) {
    setPdfError("");
    if (file.type !== "application/pdf") {
      setPdfError("Solo se aceptan archivos PDF.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setPdfError(`El archivo no puede superar ${MAX_SIZE_MB}MB.`);
      return;
    }
    setPdfFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function handlePdfSubmit() {
    if (!pdfFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(",")[1];
      onSubmit({ tipo: "pdf", contenido: base64 });
    };
    reader.readAsDataURL(pdfFile);
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue={defaultUrl ? "url" : "pdf"}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="pdf" className="gap-2">
            <Upload className="w-4 h-4" /> Subir PDF
          </TabsTrigger>
          <TabsTrigger value="url" className="gap-2">
            <Link className="w-4 h-4" /> URL del cartel
          </TabsTrigger>
          <TabsTrigger value="texto" className="gap-2">
            <FileText className="w-4 h-4" /> Pegar texto
          </TabsTrigger>
        </TabsList>

        {/* PDF Upload */}
        <TabsContent value="pdf" className="mt-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
              dragging
                ? "border-blue-400 bg-blue-50"
                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50",
              pdfFile ? "border-green-300 bg-green-50" : ""
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {pdfFile ? (
              <div>
                <FileText className="w-10 h-10 text-green-500 mx-auto mb-2" />
                <p className="font-medium text-green-700">{pdfFile.name}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {(pdfFile.size / 1024 / 1024).toFixed(2)}MB
                </p>
                <button
                  type="button"
                  className="text-xs text-gray-400 underline mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPdfFile(null);
                  }}
                >
                  Cambiar archivo
                </button>
              </div>
            ) : (
              <div>
                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">
                  Arrastrá el PDF acá o hacé clic para seleccionar
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  Solo PDF · Máximo {MAX_SIZE_MB}MB
                </p>
              </div>
            )}
          </div>

          {pdfError && (
            <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
              <AlertTriangle className="w-4 h-4" />
              {pdfError}
            </div>
          )}

          <p className="text-xs text-amber-600 mt-2 flex items-start gap-1">
            <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
            Si el PDF es escaneado (imagen), la extracción de texto puede ser limitada.
          </p>

          <Button
            onClick={handlePdfSubmit}
            disabled={!pdfFile || isLoading}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {isLoading ? "Analizando con IA..." : "Analizar PDF"}
          </Button>
        </TabsContent>

        {/* URL */}
        <TabsContent value="url" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url-cartel">URL del cartel</Label>
            <Input
              id="url-cartel"
              type="url"
              placeholder="https://www.sicop.go.cr/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Pegá la URL del cartel desde SICOP o cualquier fuente pública.
            </p>
          </div>
          <Button
            onClick={() => onSubmit({ tipo: "url", contenido: url })}
            disabled={!url.trim() || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isLoading ? "Analizando..." : "Analizar URL"}
          </Button>
        </TabsContent>

        {/* Texto */}
        <TabsContent value="texto" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="texto-cartel">Texto del cartel</Label>
            <Textarea
              id="texto-cartel"
              placeholder="Pegá aquí el texto del cartel de licitación..."
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-500">
              {texto.length.toLocaleString()} caracteres · Recomendado: al menos
              500 caracteres para un análisis preciso.
            </p>
          </div>
          <Button
            onClick={() => onSubmit({ tipo: "texto", contenido: texto })}
            disabled={texto.trim().length < 100 || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isLoading ? "Analizando..." : "Analizar texto"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
