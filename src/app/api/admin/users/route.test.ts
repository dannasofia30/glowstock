import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { DELETE, GET, PATCH, POST } from './route';

describe('/api/admin/users', () => {
  it('rechaza peticiones sin token antes de acceder a Supabase', async () => {
    const requests = [
      GET(new Request('http://localhost/api/admin/users')),
      POST(new Request('http://localhost/api/admin/users', { method: 'POST' })),
      PATCH(new Request('http://localhost/api/admin/users', { method: 'PATCH' })),
      DELETE(new Request('http://localhost/api/admin/users?id=00000000-0000-4000-8000-000000000001', { method: 'DELETE' })),
    ];
    const responses = await Promise.all(requests);

    expect(responses.map((response) => response.status)).toEqual([401, 401, 401, 401]);
  });
});
