import { notFound } from 'next/navigation';
import { FormularioPruebaCorreo } from './FormularioPruebaCorreo';

export default function PruebaCorreoPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <FormularioPruebaCorreo />;
}
