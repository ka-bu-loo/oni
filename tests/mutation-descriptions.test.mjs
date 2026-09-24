import test from 'node:test';
import assert from 'node:assert/strict';
import { mutations, mutationDescription } from '../modifiers.js';

test('every mutation has a concise explanation matching its numerical factors', () => {
  for (const [name, mutation] of Object.entries(mutations)) {
    const description = mutationDescription(name);
    assert.ok(description.length > 15, name);
    if (mutation.yield)
      assert.ok(description.includes(`${Math.round(mutation.yield * 100)}% harvest yield`), name);
    if (mutation.cycle) assert.ok(description.includes(`${mutation.cycle}× growth time`), name);
    if (mutation.upkeep)
      assert.ok(
        description.includes(`${Math.round(mutation.upkeep * 100)}% fertilizer / irrigation use`),
        name,
      );
  }
  assert.match(mutationDescription('Licey'), /Only credited when Meal Lice is the target crop/);
  assert.match(mutationDescription('Leafy'), /above the plant’s normal light requirement/);
  assert.match(mutationDescription('Bountiful'), /above the plant’s normal light requirement/);
});
