import { AppShell } from '@/components/layout/AppShell';

const productCards = [
  { label: 'Inventario total', value: '1,248', tone: 'violet' },
  { label: 'Disponibles', value: '986', tone: 'emerald' },
  { label: 'En tránsito', value: '142', tone: 'sky' },
  { label: 'Sin stock', value: '24', tone: 'amber' },
];

const products = [
  { name: 'Laptop Dell XPS 13', category: 'Tecnología', stock: 24, status: 'Disponible' },
  { name: 'Monitor LG 27"', category: 'Tecnología', stock: 8, status: 'Disponible' },
  { name: 'Teclado mecánico', category: 'Accesorios', stock: 3, status: 'Bajo' },
  { name: 'USB-C Hub', category: 'Accesorios', stock: 0, status: 'Sin stock' },
];

function getStatusClasses(status: string) {
  if (status === 'Bajo') {
    return 'bg-amber-500/15 text-amber-200 border border-amber-400/20';
  }

  if (status === 'Sin stock') {
    return 'bg-red-500/15 text-red-200 border border-red-400/20';
  }

  return 'bg-emerald-500/15 text-emerald-200 border border-emerald-400/20';
}

export default function ProductsPage() {
  return (
    <AppShell activeHref="/products">
      <div className="space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-violet-300">Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-white">Productos</h1>
          </div>
          <button
            type="button"
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500"
          >
            + Agregar producto
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {productCards.map((card) => (
            <article key={card.label} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div
                className={`mb-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                  card.tone === 'violet'
                    ? 'bg-violet-500/15 text-violet-200'
                    : card.tone === 'emerald'
                      ? 'bg-emerald-500/15 text-emerald-200'
                      : card.tone === 'sky'
                        ? 'bg-sky-500/15 text-sky-200'
                        : 'bg-amber-500/15 text-amber-200'
                }`}
              >
                {card.label}
              </div>
              <p className="text-3xl font-bold text-white">{card.value}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-white">Inventario actual</h2>
            <span className="text-sm text-slate-400">Última actualización hoy</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm text-slate-200">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 pr-4 font-medium">Producto</th>
                  <th className="pb-3 pr-4 font-medium">Categoría</th>
                  <th className="pb-3 pr-4 font-medium">Stock</th>
                  <th className="pb-3 font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.name} className="border-b border-slate-800 last:border-b-0">
                    <td className="py-3 pr-4 font-medium text-white">{product.name}</td>
                    <td className="py-3 pr-4 text-slate-300">{product.category}</td>
                    <td className="py-3 pr-4">{product.stock}</td>
                    <td className="py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs ${getStatusClasses(product.status)}`}>
                        {product.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
