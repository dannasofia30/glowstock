'use client';

import { FormEvent, useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type ManagedUser = {
  id: string;
  nombre_completo: string;
  email: string;
  rol: 'admin' | 'usuario';
  activo: boolean;
  created_at: string;
};

type UserDraft = {
  nombre_completo: string;
  email: string;
  password: string;
  rol: ManagedUser['rol'];
};

const initialDraft: UserDraft = {
  nombre_completo: '',
  email: '',
  password: '',
  rol: 'usuario',
};

async function requestUsers(path: string, init: RequestInit = {}) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;

  if (error || !accessToken) {
    throw new Error('Inicia sesión para administrar usuarios.');
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...init.headers,
    },
    cache: 'no-store',
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.error ?? 'No se pudo completar la operación.');
  }

  return body;
}

export function UserManagement() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [draft, setDraft] = useState<UserDraft>(initialDraft);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [pendingUserId, setPendingUserId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isMounted = true;

    requestUsers('/api/admin/users')
      .then((loadedUsers: ManagedUser[]) => {
        if (isMounted) setUsers(loadedUsers);
      })
      .catch((requestError: Error) => {
        if (isMounted) setError(requestError.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsCreating(true);

    try {
      const user = (await requestUsers('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(draft),
      })) as ManagedUser;
      setUsers((current) => [user, ...current]);
      setDraft(initialDraft);
      setNotice(`Cuenta creada para ${user.email}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo crear el usuario.');
    } finally {
      setIsCreating(false);
    }
  };

  const updateUser = async (user: ManagedUser, changes: Partial<ManagedUser>) => {
    setError('');
    setNotice('');
    setPendingUserId(user.id);

    try {
      const updated = (await requestUsers('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ id: user.id, ...changes }),
      })) as ManagedUser;
      setUsers((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setNotice(`Cambios guardados para ${updated.email}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron guardar los cambios.');
    } finally {
      setPendingUserId('');
    }
  };

  const deleteUser = async (user: ManagedUser) => {
    if (!window.confirm(`¿Eliminar la cuenta de ${user.email}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setError('');
    setNotice('');
    setPendingUserId(user.id);

    try {
      await requestUsers(`/api/admin/users?id=${encodeURIComponent(user.id)}`, { method: 'DELETE' });
      setUsers((current) => current.filter((item) => item.id !== user.id));
      setNotice(`Se eliminó la cuenta de ${user.email}.`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudo eliminar el usuario.');
    } finally {
      setPendingUserId('');
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-300">Administración</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Usuarios</h1>
        </div>
        <p className="text-sm text-slate-400">
          {users.length} {users.length === 1 ? 'cuenta' : 'cuentas'}
        </p>
      </header>

      <section className="border-y border-slate-800 py-6">
        <h2 className="text-lg font-semibold text-white">Crear cuenta</h2>
        <form className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" onSubmit={handleCreate}>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Nombre completo</span>
            <input
              required
              maxLength={100}
              value={draft.nombre_completo}
              onChange={(event) => setDraft({ ...draft, nombre_completo: event.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              autoComplete="name"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Correo electrónico</span>
            <input
              required
              type="email"
              maxLength={254}
              value={draft.email}
              onChange={(event) => setDraft({ ...draft, email: event.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              autoComplete="email"
            />
          </label>
          <label className="space-y-2 text-sm text-slate-300">
            <span>Contraseña inicial</span>
            <input
              required
              type="password"
              minLength={12}
              maxLength={72}
              value={draft.password}
              onChange={(event) => setDraft({ ...draft, password: event.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              autoComplete="new-password"
            />
          </label>
          <div className="flex items-end gap-3">
            <label className="min-w-0 flex-1 space-y-2 text-sm text-slate-300">
              <span>Rol</span>
              <select
                value={draft.rol}
                onChange={(event) => setDraft({ ...draft, rol: event.target.value as ManagedUser['rol'] })}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-white focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              >
                <option value="usuario">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
            <button
              type="submit"
              disabled={isCreating}
              className="shrink-0 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-wait disabled:opacity-60"
            >
              {isCreating ? 'Creando…' : 'Crear'}
            </button>
          </div>
        </form>
      </section>

      {error ? (
        <p className="border-l-2 border-red-400 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p className="border-l-2 border-emerald-400 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200" role="status">
          {notice}
        </p>
      ) : null}

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Cuentas registradas</h2>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 transition hover:bg-slate-800"
          >
            Actualizar
          </button>
        </div>

        <div className="overflow-x-auto border-y border-slate-800">
          <table className="min-w-[640px] w-full text-left text-sm text-slate-200">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase text-slate-400">
                <th className="py-3 pr-4 font-medium">Usuario</th>
                <th className="py-3 pr-4 font-medium">Rol</th>
                <th className="py-3 pr-4 font-medium">Estado</th>
                <th className="hidden py-3 pr-4 font-medium xl:table-cell">Creado</th>
                <th className="py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-slate-800 last:border-0">
                  <td className="py-4 pr-4">
                    <p className="font-medium text-white">{user.nombre_completo || 'Sin nombre'}</p>
                    <p className="mt-1 text-slate-400">{user.email}</p>
                  </td>
                  <td className="py-4 pr-4">
                    <select
                      aria-label={`Rol de ${user.email}`}
                      value={user.rol}
                      disabled={pendingUserId === user.id}
                      onChange={(event) =>
                        void updateUser(user, { rol: event.target.value as ManagedUser['rol'] })
                      }
                      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-200 disabled:opacity-50"
                    >
                      <option value="usuario">Usuario</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td className="py-4 pr-4">
                    <span className={user.activo ? 'text-emerald-300' : 'text-slate-500'}>
                      {user.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="hidden py-4 pr-4 text-slate-400 xl:table-cell">
                    {new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(user.created_at))}
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        disabled={pendingUserId === user.id}
                        onClick={() => void updateUser(user, { activo: !user.activo })}
                        className="rounded-md border border-slate-700 px-2.5 py-1.5 text-xs text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
                      >
                        {user.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        disabled={pendingUserId === user.id}
                        onClick={() => void deleteUser(user)}
                        className="rounded-md border border-red-900 px-2.5 py-1.5 text-xs text-red-300 transition hover:bg-red-950 disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && users.length === 0 ? (
                <tr>
                  <td className="py-8 text-center text-slate-400" colSpan={5}>
                    No hay otros usuarios registrados.
                  </td>
                </tr>
              ) : null}
              {isLoading ? (
                <tr>
                  <td className="py-8 text-center text-slate-400" colSpan={5}>
                    Cargando usuarios…
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
