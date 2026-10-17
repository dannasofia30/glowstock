import { ChangePasswordForm } from '@/components/auth/ChangePasswordForm';
import { AppShell } from '@/components/layout/AppShell';

export default function ChangePasswordPage() {
  return (
    <AppShell activeHref="/settings/password">
      <ChangePasswordForm mode="change" />
    </AppShell>
  );
}