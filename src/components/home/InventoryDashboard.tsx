'use client';

const stats = [
  { label: 'Productos activos', value: '1,248', tone: 'violet' },
  { label: 'Bajo stock', value: '32', tone: 'amber' },
  { label: 'Valor total', value: '$84.5K', tone: 'emerald' },
  { label: 'Pedidos hoy', value: '18', tone: 'sky' },
];

const inventory = [
  { name: 'Laptop Dell XPS 13', sku: 'DT-3012', stock: 24, status: 'OK' },
  { name: 'Teclado mecánico', sku: 'KB-8804', stock: 8, status: 'Bajo' },
  { name: 'Monitor 27"', sku: 'MN-1520', stock: 15, status: 'OK' },
  { name: 'Disco SSD 1TB', sku: 'ST-9140', stock: 4, status: 'Bajo' },
];

function getStatusClasses(status: string) {
  if (status === 'Bajo') {
    return 'bg-amber-500/15 text-amber-300 border border-amber-400/30';
  }

  return 'bg-emerald-500/15 text-emerald-300 border border-emerald-400/30';
}

export function InventoryDashboard() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-300">
              GLOWSTOCK
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Inventario
            </h1>
          </div>

          <button
            type="button"
            className="rounded-xl border border-violet-500/40 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-200 transition hover:bg-violet-500/20"
          >
            + Nuevo movimiento
          </button>
        </header>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-200">Resumen general</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20"
              >
                <div
                  className={
                    'mb-4 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ' +
                    (stat.tone === 'violet'
                      ? 'bg-violet-500/15 text-violet-200'
                      : stat.tone === 'amber'
                        ? 'bg-amber-500/15 text-amber-200'
                        : stat.tone === 'emerald'
                          ? 'bg-emerald-500/15 text-emerald-200'
                          : 'bg-sky-500/15 text-sky-200')
                  }
                >
                  {stat.label}
                </div>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Productos destacados</h2>
            <span className="text-sm text-slate-400">Últimos 4 artículos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 pr-4 font-medium">Producto</th>
                  <th className="pb-3 pr-4 font-medium">SKU</th>
                  <th className="pb-3 pr-4 font-medium">Stock</th>
                  <th className="pb-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item.sku} className="border-b border-slate-800 last:border-b-0">
                    <td className="py-3 pr-4 font-medium text-white">{item.name}</td>
                    <td className="py-3 pr-4 text-slate-300">{item.sku}</td>
                    <td className="py-3 pr-4">{item.stock}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs ${getStatusClasses(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
