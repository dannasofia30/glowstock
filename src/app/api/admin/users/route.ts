import { z } from 'zod';
import { requireAdmin } from '@/lib/supabase/admin';

const userFields = 'id, nombre_completo, email, rol, activo, created_at';
const createUserSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(72),
  nombre_completo: z.string().trim().min(1).max(100),
  rol: z.enum(['admin', 'usuario']),
});
const updateUserSchema = z
  .object({
    id: z.string().uuid(),
    nombre_completo: z.string().trim().min(1).max(100).optional(),
    rol: z.enum(['admin', 'usuario']).optional(),
    activo: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).some((key) => key !== 'id'));

export async function GET(request: Request): Promise<Response> {
  const access = await requireAdmin(request);
  if ('response' in access) return access.response;

  const { data, error } = await access.client
    .from('usuarios')
    .select(userFields)
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ error: 'No se pudo cargar la lista de usuarios.' }, { status: 500 });
  }

  return Response.json(data);
}

export async function POST(request: Request): Promise<Response> {
  const access = await requireAdmin(request);
  if ('response' in access) return access.response;

  const parsed = createUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: 'Revisa los datos y usa una contraseña de 12 caracteres o más.' },
      { status: 400 },
    );
  }

  const { email, password, nombre_completo, rol } = parsed.data;
  const { data: created, error: createError } = await access.client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: nombre_completo },
  });

  if (createError || !created.user) {
    return Response.json(
      { error: 'No se pudo crear la cuenta; revisa si el correo ya está registrado.' },
      { status: 409 },
    );
  }

  const { data: profile, error: profileError } = await access.client
    .from('usuarios')
    .upsert(
      {
        id: created.user.id,
        email,
        nombre_completo,
        rol,
        activo: true,
      },
      { onConflict: 'id' },
    )
    .select(userFields)
    .single();

  if (profileError || !profile) {
    await access.client.auth.admin.deleteUser(created.user.id);
    return Response.json(
      { error: 'No se pudo guardar el perfil; se eliminó la cuenta incompleta.' },
      { status: 500 },
    );
  }

  return Response.json(profile, { status: 201 });
}

export async function PATCH(request: Request): Promise<Response> {
  const access = await requireAdmin(request);
  if ('response' in access) return access.response;

  const parsed = updateUserSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: 'Los cambios de usuario no son válidos.' }, { status: 400 });
  }

  const { id, ...changes } = parsed.data;
  const { data: current, error: currentError } = await access.client
    .from('usuarios')
    .select('id, rol, activo')
    .eq('id', id)
    .maybeSingle();

  if (currentError) {
    return Response.json({ error: 'No se pudo validar el usuario.' }, { status: 500 });
  }
  if (!current) {
    return Response.json({ error: 'Usuario no encontrado.' }, { status: 404 });
  }

  const losesAdminAccess =
    current.rol === 'admin' &&
    current.activo &&
    (changes.rol === 'usuario' || changes.activo === false);

  if (losesAdminAccess) {
    if (id === access.user.id) {
      return Response.json(
        { error: 'No puedes quitarte tus propios permisos de administrador.' },
        { status: 409 },
      );
    }

    const { data: activeAdmins, error: adminsError } = await access.client
      .from('usuarios')
      .select('id')
      .eq('rol', 'admin')
      .eq('activo', true);

    if (adminsError) {
      return Response.json(
        { error: 'No se pudo validar el último administrador.' },
        { status: 500 },
      );
    }
    if (activeAdmins.length <= 1) {
      return Response.json(
        { error: 'Debe quedar al menos un administrador activo.' },
        { status: 409 },
      );
    }
  }

  const { data: updated, error: updateError } = await access.client
    .from('usuarios')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(userFields)
    .single();

  if (updateError) {
    return Response.json({ error: 'No se pudieron guardar los cambios.' }, { status: 500 });
  }

  return Response.json(updated);
}

export async function DELETE(request: Request): Promise<Response> {
  const access = await requireAdmin(request);
  if ('response' in access) return access.response;

  const id = new URL(request.url).searchParams.get('id');
  if (!id || !z.string().uuid().safeParse(id).success) {
    return Response.json({ error: 'Identificador de usuario no válido.' }, { status: 400 });
  }
  if (id === access.user.id) {
    return Response.json({ error: 'No puedes eliminar tu propia cuenta.' }, { status: 409 });
  }

  const { data: target, error: targetError } = await access.client
    .from('usuarios')
    .select('id, rol, activo')
    .eq('id', id)
    .maybeSingle();

  if (targetError) {
    return Response.json({ error: 'No se pudo validar el usuario.' }, { status: 500 });
  }
  if (!target) {
    return Response.json({ error: 'Usuario no encontrado.' }, { status: 404 });
  }

  if (target.rol === 'admin' && target.activo) {
    const { data: activeAdmins, error: adminsError } = await access.client
      .from('usuarios')
      .select('id')
      .eq('rol', 'admin')
      .eq('activo', true);

    if (adminsError) {
      return Response.json(
        { error: 'No se pudo validar el último administrador.' },
        { status: 500 },
      );
    }
    if (activeAdmins.length <= 1) {
      return Response.json(
        { error: 'Debe quedar al menos un administrador activo.' },
        { status: 409 },
      );
    }
  }

  const { error: deleteError } = await access.client.auth.admin.deleteUser(id);
  if (deleteError) {
    return Response.json({ error: 'No se pudo eliminar el usuario.' }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
