import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('production telemetry guard', () => {
  it('does not contain the local debug ingest endpoint', () => {
    const appSource = readFileSync(join(process.cwd(), 'src', 'App.tsx'), 'utf8');

    expect(appSource).not.toContain('127.0.0.1:7357');
  });
});
