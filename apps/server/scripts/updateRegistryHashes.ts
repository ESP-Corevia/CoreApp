import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const registryFile = path.resolve(__dirname, '../src/ai/tools/registry.ts');

function hashValue(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 12);
}

async function main() {
  const registryContent = await readFile(registryFile, 'utf8');
  const rolesMatch = registryContent.match(
    /export const ROLES: Record<'patient' \| 'doctor' \| 'admin', RoleDefinition> = (\{[\s\S]*?\n\});/,
  );

  if (!rolesMatch) {
    throw new Error('Could not locate ROLES block in registry.ts');
  }

  const roles = Function(`"use strict"; return (${rolesMatch[1]});`)() as Record<string, unknown>;
  const hashes = Object.keys(roles)
    .map(role => `  ${role}: '${hashValue(roles[role])}',`)
    .join('\n');

  process.stdout.write(
    `const EXPECTED_HASHES: Record<'patient' | 'doctor' | 'admin', string> = {\n${hashes}\n};\n`,
  );
}

main().catch(error => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
