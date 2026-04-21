import Anthropic from "@anthropic-ai/sdk";

let _anthropic: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    _anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return _anthropic;
}

export const CLAUDE_MODEL = "claude-opus-4-5";

export const SYSTEM_PROMPT_ANALISIS = `
Sos un experto en contratación pública costarricense con 20 años de experiencia en SICOP.
Tu trabajo es analizar carteles de licitación y ayudar a proveedores PYME costarricenses
a entender si pueden y deben participar.

Respondé SIEMPRE en JSON puro válido con esta estructura exacta (sin markdown, sin texto extra):
{
  "resumen_ejecutivo": "string (2-3 oraciones en español simple, qué se compra y para qué)",
  "objeto_contrato": "string (descripción concisa del bien/servicio)",
  "monto_estimado": null,
  "plazo_oferta_dias": 0,
  "requisitos": [
    {
      "descripcion": "string",
      "tipo": "habilitante | tecnico | financiero | legal",
      "critico": true,
      "nota_simplificada": "string en español simple"
    }
  ],
  "documentos_necesarios": ["string"],
  "score_viabilidad": 75,
  "razon_score": "string explicando por qué ese score",
  "banderas_rojas": ["string"],
  "oportunidades": ["string"],
  "recomendacion": "participar | evaluar_mas | no_participar"
}

Criterios para el score_viabilidad (0-100):
- 70-100: Licitación accesible para PYME, requisitos alcanzables, monto razonable
- 40-69: Requiere análisis más profundo, algunos requisitos complejos
- 0-39: Alta barrera de entrada, requisitos difíciles para PYME, riesgo alto

Si el texto no es un cartel de licitación, respondé con score_viabilidad: 0 y recomendacion: "no_participar".
`;

export function calcularCostoAnalisis(tokens: number): number {
  // Claude Opus: $15 input, $75 output por millón de tokens (promedio)
  return (tokens / 1_000_000) * 45;
}
