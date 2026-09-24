import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate } from '../calculator.js';
import { plan } from '../planning.js';
import { foods } from '../catalog.js';
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);

test('U59 Waterweed uses 20 kg salt water and no bleach stone across all lettuce recipes', () => {
  // U59-736649 + current Waterweed page: 12 kg lettuce / 12 cycles.
  const lettuce = calculate('Lettuce', { normal: 1 });
  near(lettuce.farm.Waterweed, 2.5);
  near(lettuce.resources['Salt Water'], 50);
  const burger = calculate('Frost Burger');
  near(burger.farm.Waterweed, 2);
  near(burger.resources['Salt Water'], 40);
  for (const food of foods) {
    const result = calculate(food.name);
    assert.equal(result.resources['Bleach Stone'], undefined, food.name);
  }
  const wild = calculate('Lettuce', { normal: 1, wild: true });
  near(wild.farm.Waterweed, 10);
  assert.equal(wild.resources['Salt Water'], undefined);
});
test('independent crop settings leave other crops unchanged', () => {
  const base = calculate('Frost Burger');
  const mixed = calculate('Frost Burger', { crops: { Waterweed: { wild: true } } });
  near(mixed.farm.Waterweed, 8);
  near(mixed.farm['Sleet Wheat'], base.farm['Sleet Wheat']);
  near(mixed.resources.Water, base.resources.Water);
  assert.equal(mixed.resources['Salt Water'], undefined);
  const mutant = calculate('Frost Burger', { crops: { Waterweed: { mutation: 'Bountiful' } } });
  near(mutant.farm.Waterweed, 1);
  near(mutant.resources['Salt Water'], 24);
  near(mutant.farm['Sleet Wheat'], 6);
});
test('Agriculture lengthens tending without changing crop yield', () => {
  // Farm Station: 5 kg fertilizer, 1 + Agriculture/10 cycles per application.
  const a = calculate('Lettuce', { normal: 1, fertilizer: true, breakdownFertilizer: false });
  const b = calculate('Lettuce', {
    normal: 1,
    fertilizer: true,
    farmerSkill: 15,
    breakdownFertilizer: false,
  });
  near(a.farm.Waterweed, 1.25);
  near(a.resources.Fertilizer, 6.25);
  near(b.resources.Fertilizer, 2.5);
  near(a.farm.Waterweed, b.farm.Waterweed);
  const c = calculate('Frost Burger', {
    crops: { Waterweed: { fertilizer: true } },
    breakdownFertilizer: false,
  });
  near(c.resources.Fertilizer, 5);
  near(c.farm['Sleet Wheat'], 6);
});
test('direct production targets use exact calorie density and ignore colony surplus', () => {
  const a = plan('Frost Burger', { margin: 50 }, { mode: 'mass', amount: 2 });
  near(a.kcal, 12000);
  near(a.tree.amount, 2);
  const b = plan('Veggie Poppers', {}, { mode: 'mass', amount: 4 });
  near(b.kcal, 11450);
  near(b.tree.amount, 4);
});
test('multiple constraints choose the bottleneck and account for safety surplus', () => {
  const r = plan(
    'Lettuce',
    { margin: 25 },
    {
      mode: 'limited',
      limits: [
        { group: 'resources', name: 'Salt Water', amount: 100 },
        { group: 'farm', name: 'Waterweed', amount: 2.5 },
      ],
    },
  );
  near(r.kcal, 1000);
  near(r.supportedDupes, 0.8);
  assert.deepEqual(r.bottlenecks, ['Waterweed']);
  near(r.resources['Salt Water'], 50);
  const seconds = plan(
    'Lettuce',
    {},
    {
      mode: 'limited',
      limits: [{ group: 'resources', name: 'Salt Water', amount: 1, perSecond: true }],
    },
  );
  near(seconds.kcal, 12000);
});
test('unused and zero budgets cannot produce unbounded plans', () => {
  for (const limits of [
    [],
    [{ name: 'Bleach Stone', amount: 10 }],
    [{ name: 'Salt Water', amount: 0 }],
  ]) {
    const r = plan('Lettuce', {}, { mode: 'limited', limits });
    near(r.kcal, 0);
    assert.ok(Number.isFinite(r.tree.amount));
  }
});
test('resource-limited plans round-trip every food without rounding intermediate capacity', () => {
  for (const food of foods) {
    const forward = calculate(food.name, { normal: 3 });
    const entry = Object.entries(forward.resources).find(([, value]) => value > 0);
    if (!entry) continue;
    const [name, amount] = entry;
    const reverse = plan(
      food.name,
      {},
      { mode: 'limited', limits: [{ group: 'resources', name, amount }] },
    );
    near(reverse.kcal, 3000);
    near(reverse.supportedDupes, 3);
  }
});
test('20 wild Mealwood plants feed one regular dupe with prompt harvesting', () => {
  const r = plan(
    'Meal Lice',
    { wild: true },
    { mode: 'limited', limits: [{ group: 'farm', name: 'Mealwood', amount: 20 }] },
  );
  near(r.kcal, 1000);
  near(r.supportedDupes, 1);
});
