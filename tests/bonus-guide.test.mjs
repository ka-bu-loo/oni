import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../calculator.js';
import { bonusGuide } from '../bonus-guide.js';

test('baseline happiness needs grooming but no fountain supplies', () => {
  const [b] = bonusGuide(calculate('Barbeque'));
  assert.equal(b.total, 4);
  assert.equal(b.groom, 5);
  assert.equal(b.liquid, 0);
});

test('Brackene and Moo estimates cover rounded adult populations', () => {
  const result = calculate('Barbeque', { happiness: 10 });
  const [b] = bonusGuide(result);
  assert.equal(b.total, 10);
  assert.equal(b.condo, 1);
  assert.equal(b.drink, 5);
  assert.equal(b.liquid, Math.ceil(result.ranch.Hatch) * 5);
  assert.equal(b.moos, Math.ceil(b.liquid / 50));
  assert.equal(result.resources.Brackene, undefined);
});

test('supported targets receive sufficient example bonuses', () => {
  for (let happiness = -1; happiness <= 12; happiness++) {
    for (const fish of ['Pacu', 'Beakon', 'Seaquine']) {
      for (const b of bonusGuide(calculate('Cooked Seafood', { happiness, fish }))) {
        assert.ok(b.total >= b.target);
        assert.ok(Number.isFinite(b.liquid));
      }
    }
  }
});
