import { LoginForm } from '@/components/auth/LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ restablecida?: string | string[]; siguiente?: string | string[] }>;
}) {
  const parametros = await searchParams;
  const siguiente =
    typeof parametros?.siguiente === 'string' ? parametros.siguiente : undefined;

  return (
    <LoginForm
      passwordChanged={parametros?.restablecida === '1'}
      {...(siguiente ? { siguiente } : {})}
    />
  );
}
