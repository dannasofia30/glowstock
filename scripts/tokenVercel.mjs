import { execSync } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const pulledEnvPath = new URL('../.env.vercel.local', import.meta.url);
const localEnvPath = new URL('../.env.local', import.meta.url);

try {
  execSync('npx vercel env pull .env.vercel.local --yes', {
    cwd: projectRoot,
    stdio: 'ignore',
    timeout: 30_000,
    windowsHide: true,
  });

  const pulledEnv = await readFile(pulledEnvPath, 'utf8');
  const tokenLine = pulledEnv
    .split(/\r?\n/)
    .find((line) => /^VERCEL_OIDC_TOKEN\s*=/.test(line));

  if (!tokenLine) {
    throw new Error('No se encontró el token de Vercel.');
  }

  const localEnv = await readFile(localEnvPath, 'utf8');
  const newline = localEnv.includes('\r\n') ? '\r\n' : '\n';
  const localLines = localEnv.split(/\r\n|\n/);
  const tokenIndex = localLines.findIndex((line) => /^VERCEL_OIDC_TOKEN\s*=/.test(line));

  if (tokenIndex >= 0) {
    localLines[tokenIndex] = tokenLine;
    for (let index = localLines.length - 1; index > tokenIndex; index -= 1) {
      if (/^VERCEL_OIDC_TOKEN\s*=/.test(localLines[index] ?? '')) {
        localLines.splice(index, 1);
      }
    }
    await writeFile(localEnvPath, localLines.join(newline), 'utf8');
  } else {
    const separator = localEnv && !localEnv.endsWith('\n') ? newline : '';
    await writeFile(localEnvPath, `${localEnv}${separator}${tokenLine}${newline}`, 'utf8');
  }
} catch {
  console.warn(
    'Aviso: no se pudo renovar la conexión con Vercel. El envío de correos no funcionará en local.',
  );
} finally {
  try {
    await rm(pulledEnvPath, { force: true });
  } catch {
    console.warn(
      'Aviso: no se pudo renovar la conexión con Vercel. El envío de correos no funcionará en local.',
    );
  }
}
