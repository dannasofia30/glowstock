import type { ReactNode } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/' },
  { label: 'Productos', href: '/products' },
  { label: 'Usuarios', href: '/users' },
  { label: 'Movimientos', href: '#' },
  { label: 'Reportes', href: '#' },
];

export function AppShell({
  children,
  activeHref = '/',
}: {
  children: ReactNode;
  activeHref?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 font-bold text-white">
              G
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-violet-300">GLOWSTOCK</p>
              <p className="text-sm text-slate-400">Sistema de inventario</p>
            </div>
          </div>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  item.href === activeHref
                    ? 'bg-violet-500/15 text-violet-200'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-sm text-slate-200"
            >
              ☼
            </button>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-violet-200">
              AD
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 lg:block">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-slate-400">Navegación</p>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                  item.href === activeHref
                    ? 'bg-violet-500/15 text-violet-200'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{item.label}</span>
                <span className="text-xs text-slate-500">→</span>
              </a>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
