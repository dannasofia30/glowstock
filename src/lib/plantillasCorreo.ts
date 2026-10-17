export function plantillaRecuperacion(enlace: string): string {
  return `
    <div style="margin:0;background:#f8fafc;padding:32px;font-family:Arial,sans-serif;color:#0f172a">
      <div style="max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;background:#fff;padding:32px">
        <h1 style="margin:0 0 16px;color:#5b21b6;font-size:24px">Restablecer contraseña</h1>
        <p style="line-height:1.6">Recibimos una solicitud para cambiar la contraseña de tu cuenta Glowstock.</p>
        <p style="margin:28px 0">
          <a href="${enlace}" style="display:inline-block;border-radius:10px;background:#6d28d9;padding:14px 22px;color:#fff;text-decoration:none;font-weight:700">Crear nueva contraseña</a>
        </p>
        <p style="line-height:1.6">Este enlace vence en 30 minutos y solo se puede usar una vez.</p>
        <p style="line-height:1.6;color:#475569">Si no solicitaste este cambio, ignora este mensaje. Tu contraseña actual seguirá siendo la misma.</p>
      </div>
    </div>
  `;
}
