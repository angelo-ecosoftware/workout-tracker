import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('browser storage inventory', () => {
  it('documents ownership rules for local and session storage', () => {
    const inventory = readFileSync(
      join(process.cwd(), 'docs', 'storage-inventory.md'),
      'utf8',
    );

    expect(inventory).toContain('# Browser storage inventory');
    expect(inventory).toContain('## `localStorage`');
    expect(inventory).toContain('## `sessionStorage`');
    expect(inventory).toContain('source of truth for user');
    expect(inventory).toContain('New keys must be added to this inventory');
  });
});
