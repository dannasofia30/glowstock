import { UserManagement } from '@/components/users/UserManagement';
import { AppShell } from '@/components/layout/AppShell';

export default function UsersPage() {
  return (
    <AppShell activeHref="/users">
      <UserManagement />
    </AppShell>
  );
}
