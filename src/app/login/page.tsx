import { LoginForm } from '@/components/auth/LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ restablecida?: string | string[] }>;
}) {
  const parametros = await searchParams;

  return <LoginForm passwordChanged={parametros?.restablecida === '1'} />;
}
