import { Resend } from "resend";

const FROM_EMAIL = "SICOP Copilot <alertas@sicopcopilot.com>";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

interface AlertaEmailData {
  to: string;
  nombre: string;
  licitaciones: Array<{
    titulo: string;
    institucion: string;
    fecha_limite: string;
    url_sicop: string | null;
  }>;
  nombreAlerta: string;
}

export async function sendAlertaEmail(data: AlertaEmailData) {
  const resend = getResend();
  const licitacionesHtml = data.licitaciones
    .map(
      (l) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
          <strong>${l.titulo}</strong><br/>
          <span style="color: #6B7280; font-size: 14px;">${l.institucion}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB; color: #EF4444;">
          ${l.fecha_limite}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #E5E7EB;">
          ${l.url_sicop ? `<a href="${l.url_sicop}" style="color: #1A56DB;">Ver en SICOP</a>` : "N/D"}
        </td>
      </tr>
    `
    )
    .join("");

  await resend.emails.send({
    from: FROM_EMAIL,
    to: data.to,
    subject: `🔔 ${data.licitaciones.length} licitaciones nuevas — Alerta "${data.nombreAlerta}"`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1A56DB; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">SICOP Copilot</h1>
          <p style="color: #93C5FD; margin: 4px 0 0 0;">Tu alerta tiene ${data.licitaciones.length} licitación(es) nueva(s)</p>
        </div>
        
        <div style="background: white; padding: 24px; border: 1px solid #E5E7EB; border-top: none;">
          <p>Hola <strong>${data.nombre}</strong>,</p>
          <p>Tu alerta <em>"${data.nombreAlerta}"</em> encontró las siguientes licitaciones:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
            <thead>
              <tr style="background: #F9FAFB;">
                <th style="padding: 12px; text-align: left; font-size: 13px; color: #6B7280;">LICITACIÓN</th>
                <th style="padding: 12px; text-align: left; font-size: 13px; color: #6B7280;">FECHA LÍMITE</th>
                <th style="padding: 12px; text-align: left; font-size: 13px; color: #6B7280;">LINK</th>
              </tr>
            </thead>
            <tbody>${licitacionesHtml}</tbody>
          </table>
          
          <div style="margin-top: 24px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background: #1A56DB; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
              Ver en SICOP Copilot
            </a>
          </div>
        </div>
        
        <div style="padding: 16px; text-align: center; color: #9CA3AF; font-size: 12px;">
          <p>Recibís este email porque configuraste esta alerta en SICOP Copilot.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/alertas" style="color: #6B7280;">Gestionar alertas</a>
        </div>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to: string, nombre: string) {
  const resend = getResend();
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Bienvenido a SICOP Copilot — Tu copiloto para licitaciones",
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: #1A56DB; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">¡Bienvenido, ${nombre}!</h1>
        </div>
        <div style="background: white; padding: 24px; border: 1px solid #E5E7EB; border-top: none;">
          <p>Gracias por registrarte en <strong>SICOP Copilot</strong>.</p>
          <p>Ya podés empezar a explorar licitaciones del gobierno costarricense y analizar carteles con IA.</p>
          <div style="margin-top: 24px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
               style="background: #1A56DB; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
              Ir al Dashboard
            </a>
          </div>
        </div>
      </div>
    `,
  });
}
