import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, normalizeSettings } from '../calculator.js';
import { foods, choices, asset } from '../catalog.js';
import { availableAssets } from '../asset-status.js';
import fs from 'node:fs';
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
function flatten(n) {
  return [n, ...n.children.flatMap(flatten)];
}
test('all 65 foods have finite, connected, nonempty upstream plans in every farm mode', () => {
  assert.equal(foods.length, 65);
  for (const food of foods)
    for (const wild of [false, true])
      for (const fertilizer of [false, true])
        for (const harvest of [false, true]) {
          const r = calculate(food.name, { wild, fertilizer, harvest });
          const nodes = flatten(r.tree);
          assert.ok(nodes.length > 1, food.name);
          assert.equal(new Set(nodes.map((n) => n.id)).size, nodes.length);
          for (const n of nodes) {
            assert.ok(Number.isFinite(n.amount) && n.amount >= 0, `${food.name}: ${n.name}`);
            assert.ok(!n.name.startsWith('$'));
          }
          for (const x of Object.values(r.resources)) assert.ok(Number.isFinite(x) && x >= 0);
        }
});
test('all alternative ingredient and meat routes resolve', () => {
  for (const [key, values] of Object.entries(choices))
    for (const value of values)
      for (const food of foods) {
        const r = calculate(food.name, { [key]: value });
        assert.ok(flatten(r.tree).every((n) => Number.isFinite(n.amount)));
      }
});
test('Calamari uses 800 kcal/kg, 12 kg per squid, and grazed Tublia', () => {
  const r = calculate('Calamari', { normal: 12 });
  near(r.tree.amount, 15);
  near(r.ranch['Glo Squid'], 1.25 / (1 / 6 - 1 / 95));
  near(r.farm.Tublia, r.ranch['Glo Squid'] * 2);
  near(r.resources.Brine, r.farm.Tublia * 30);
  near(r.resources.Sulfur, r.farm.Tublia * 20);
  assert.ok(flatten(r.tree).some((n) => n.unit === 'harvests/cycle'));
});
test('Frost Burger production is recursive and combines farm requirements', () => {
  const r = calculate('Frost Burger');
  near(r.tree.amount, 2);
  near(r.farm['Sleet Wheat'], 6);
  near(r.farm.Waterweed, 2);
  near(r.resources.Water, 120);
  near(r.resources.Dirt, 30);
  near(r.ranch.Hatch, 2 / (1 / 6 - 1 / 95));
});
test('new foods include their full food-source chains and smoker fuel', () => {
  const a = calculate('Smoked Fish', { normal: 11200, fillet: 'Jawbo Fillet', fuel: 'Peat' });
  near(a.tree.amount, 4000);
  near(a.resources.Peat, 100000);
  assert.ok(a.ranch.Jawbo > 0 && a.ranch.Pacu > 0);
  const b = calculate('Toasted Mimillet');
  near(b.farm['Mimika Bud'], 40);
  assert.ok(flatten(b.tree).some((n) => n.name === 'Mimika'));
  const c = calculate('Tender Brisket', { fuel: 'Peat' });
  near(c.tree.amount, 2.4);
  near(c.resources.Peat, 75);
  assert.ok(c.ranch.Lumb > 0 && c.farm['Ovagro Node'] > 0);
  assert.ok(calculate('Nigiri').farm['Tower Kelp'] > 0);
  assert.ok(calculate('Uni').farm.Pinpoket > 0);
});
test('wild and fertilizer settings respect special plant behavior', () => {
  const a = calculate('Calamari', { wild: true });
  assert.equal(a.resources.Brine, undefined);
  near(a.farm.Tublia, calculate('Calamari').farm.Tublia * 4);
  const meal = calculate('Meal Lice', { fertilizer: true });
  near(meal.resources.Dirt, 600);
  const meg = calculate('Frost Bun', { grain: 'Megafrond Grain', wild: true });
  assert.ok(meg.resources['Chlorine Gas'] > 0);
  const mim = calculate('Toasted Mimillet', { harvest: false });
  near(mim.farm['Mimika Bud'], 40);
});
test('known recipe corrections', () => {
  const r = calculate('Stuffed Berry', { normal: 4.4 });
  near(r.farm['Bristle Blossom'], 12);
  near(calculate('Veggie Poppers', { normal: 11.45, fuel: 'Peat' }).tree.amount, 4);
});
test('zero, negative, nonnumeric and invalid settings are safe', () => {
  for (const name of foods.map((f) => f.name))
    assert.ok(flatten(calculate(name, { normal: 0 }).tree).every((n) => n.amount === 0));
  near(calculate('Barbeque', { normal: -12 }).kcal, 0);
  assert.equal(normalizeSettings({ normal: 'NaN', meat: 'Pacu' }).meat, 'Hatch');
  near(calculate('Barbeque', { normal: 12, bottomless: 2, margin: 10 }).kcal, 16500);
});
test('declared available assets are real PNGs and all food icons exist', () => {
  for (const file of availableAssets) {
    assert.ok(fs.existsSync(file), file);
    assert.equal(fs.readFileSync(file).subarray(1, 4).toString(), 'PNG');
  }
  for (const food of foods) assert.ok(availableAssets.has(asset(food.name)), food.name);
});
