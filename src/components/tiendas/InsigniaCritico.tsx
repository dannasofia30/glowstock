import { Insignia } from '@/components/ui/Insignia';

interface PropiedadesInsigniaCritico {
  critico: boolean;
}

export function InsigniaCritico({ critico }: PropiedadesInsigniaCritico) {
  if (!critico) {
    return <span className="text-sm text-texto-suave">Normal</span>;
  }

  return <Insignia tono="critico">Crítico</Insignia>;
}
