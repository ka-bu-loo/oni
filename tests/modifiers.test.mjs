import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, normalizeSettings } from '../calculator.js';
import { plants, critters, foods, choices } from '../catalog.js';
import { plantModifiers, eggInterval, mutations, pollinators } from '../modifiers.js';
import { layoutTree, createTreeView } from '../tree-view.js';
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);
test('U59 happiness scales base reproduction, not the already boosted rate', () => {
  near(eggInterval(critters.Hatch, 4), 6);
  near(eggInterval(critters.Hatch, 8), 60 / 19);
  near(eggInterval(critters['Longhair Slickster'], 4), 9);
  near(eggInterval(critters['Gassy Moo'], 20), 16);
  assert.ok(
    calculate('Barbeque', { happiness: 8 }).ranch.Hatch <
      calculate('Barbeque', { happiness: 4 }).ranch.Hatch,
  );
});
test('mutations affect growth, yield, upkeep and automatic harvest independently', () => {
  const basic = calculate('Meal Lice'),
    ex = calculate('Meal Lice', { mutation: 'Exuberant' });
  near(ex.farm.Mealwood, basic.farm.Mealwood / 4);
  near(ex.resources.Dirt, basic.resources.Dirt * 0.375);
  near(calculate('Meal Lice', { mutation: 'Licey' }).farm.Mealwood, basic.farm.Mealwood / 2);
  near(
    calculate('Meal Lice', { mutation: 'Juicyfruit', harvest: false }).farm.Mealwood,
    basic.farm.Mealwood,
  );
  near(calculate('Meal Lice', { mutation: 'Wildish' }).farm.Mealwood, basic.farm.Mealwood * 4.5);
});
test('pollination is exclusive, additive with tending, and never applied to seedless trees', () => {
  const s = normalizeSettings({ pollinator: 'Grubgrub', fertilizer: true, mutation: 'Exuberant' });
  near(plantModifiers(plants['Sleet Wheat Grain'], s).growth, 0.25 / 2.5);
  const tree = plantModifiers(plants['Megafrond Grain'], s);
  assert.equal(tree.mutation, 'None');
  assert.equal(tree.pollinator, 'None');
  assert.equal(normalizeSettings({ pollinator: ['Sweetle', 'Grubgrub'] }).pollinator, 'None');
});
test('all modes and expanded ranch options produce finite plans', () => {
  for (const mutation of Object.keys(mutations))
    for (const pollinator of Object.keys(pollinators))
      for (const food of foods) {
        const r = calculate(food.name, { mutation, pollinator, happiness: 0 });
        for (const map of [r.farm, r.ranch, r.resources])
          for (const n of Object.values(map)) assert.ok(Number.isFinite(n) && n >= 0);
      }
  for (const meat of choices.meat)
    assert.ok(Number.isFinite(calculate('Barbeque', { meat }).ranch[meat]));
  assert.ok(calculate('Barbeque', { meat: 'Dartle' }).farm['Dew Dripper'] > 0);
});
test('diagram has one breeder image and puts harvest metadata on food, without mutating calculations', () => {
  const r = calculate('Barbeque'),
    before = JSON.stringify(r.tree);
  for (const horizontal of [false, true]) {
    const diagram = layoutTree(r.tree, horizontal);
    assert.equal(diagram.nodes.filter((n) => n.node.name === 'Hatch').length, 1);
    assert.equal(diagram.nodes.find((n) => n.node.name === 'Meat').node.harvest.amount, 3);
    assert.equal(diagram.edges.length, diagram.nodes.length - 1);
    for (const a of diagram.nodes)
      for (const b of diagram.nodes)
        if (a !== b) assert.ok(Math.abs(a.x - b.x) >= 144 || Math.abs(a.y - b.y) >= 80);
  }
  assert.equal(JSON.stringify(r.tree), before);
});
test('required pollination is budgeted and divergent conversion is respected', () => {
  const sweat = calculate('Sweatcorn');
  assert.ok(sweat.ranch.Mimika > 0);
  assert.ok(sweat.farm['Mimika Bud'] > 0);
  assert.ok(sweat.resources.Dirt > 0);
  const grub = calculate('Grubfruit', { pollinator: 'Mimika' });
  assert.ok(grub.ranch.Sweetle > 0);
  assert.equal(grub.ranch.Mimika, undefined);
  const spindly = plantModifiers(
    plants['Spindly Grubfruit'],
    normalizeSettings({ pollinator: 'Grubgrub' }),
  );
  assert.equal(spindly.pollinator, 'None');
});
test('all diagrams retain a connected non-overlapping layout in both directions', () => {
  for (const food of foods)
    for (const horizontal of [false, true]) {
      const d = layoutTree(
        calculate(food.name, { pollinator: 'Mimika', mutation: 'Exuberant', fertilizer: true })
          .tree,
        horizontal,
      );
      assert.equal(d.edges.length, d.nodes.length - 1);
      for (let i = 0; i < d.nodes.length; i++)
        for (let j = i + 1; j < d.nodes.length; j++) {
          const a = d.nodes[i],
            b = d.nodes[j];
          assert.ok(Math.abs(a.x - b.x) >= 144 || Math.abs(a.y - b.y) >= 80, food.name);
        }
    }
});
test('canvas supports right-button pan, wheel zoom, fit and editable zoom', (t) => {
  const original = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    observe() {}
  };
  t.after(() => {
    if (original) globalThis.ResizeObserver = original;
    else delete globalThis.ResizeObserver;
  });
  const listeners = {},
    viewport = {
      clientWidth: 1000,
      clientHeight: 600,
      style: {},
      addEventListener: (name, fn) => (listeners[name] = fn),
      setPointerCapture() {},
      getBoundingClientRect: () => ({ left: 0, top: 0 }),
    };
  const canvas = { style: {}, innerHTML: '' },
    controls = {
      zoom: { value: 100 },
      fit: {},
      auto: { checked: true },
      direction: { value: 'vertical' },
    };
  const view = createTreeView(viewport, canvas, controls);
  view.render(calculate('Barbeque').tree, () => '<a></a>');
  const start = canvas.style.left;
  listeners.pointerdown({
    button: 2,
    pointerId: 1,
    clientX: 100,
    clientY: 100,
    preventDefault() {},
  });
  listeners.pointermove({ pointerId: 1, clientX: 140, clientY: 120 });
  assert.notEqual(canvas.style.left, start);
  assert.equal(controls.auto.checked, false);
  listeners.pointerup();
  controls.fit.onclick();
  assert.equal(canvas.style.left, start);
  assert.equal(controls.auto.checked, true);
  assert.equal(canvas.style.transform, 'none');
  controls.zoom.value = 80;
  controls.zoom.onchange();
  assert.equal(controls.zoom.value, 80);
  listeners.wheel({ ctrlKey: true, deltaY: -100, clientX: 200, clientY: 200, preventDefault() {} });
  assert.ok(controls.zoom.value > 80);
  listeners.keydown({ key: 'f', preventDefault() {} });
  assert.equal(controls.auto.checked, true);
});
test('wild tending, Waterweed pollination and remembered modifier toggles', () => {
  const wild = calculate('Lettuce', { wild: true }),
    tended = calculate('Lettuce', { wild: true, fertilizer: true });
  near(tended.farm.Waterweed, wild.farm.Waterweed / 2);
  assert.ok(tended.resources.Dirt > 0);
  const poll = calculate('Lettuce', { pollinator: 'Mimika' });
  assert.ok(poll.ranch.Mimika > 0);
  near(
    calculate('Lettuce', { pollinator: 'Mimika', pollinationEnabled: false }).farm.Waterweed,
    calculate('Lettuce').farm.Waterweed,
  );
  near(
    calculate('Meal Lice', { mutation: 'Exuberant', mutationEnabled: false }).farm.Mealwood,
    calculate('Meal Lice').farm.Mealwood,
  );
  near(
    calculate('Liceloaf', { mutation: 'Licey' }).farm.Mealwood,
    calculate('Liceloaf').farm.Mealwood / 2,
  );
});
test('Ovagro water is per node but pollination coverage is per productive vine', () => {
  const a = calculate('Tender Brisket', { ovagroVines: 24, pollinator: 'Mimika' }),
    b = calculate('Tender Brisket', { ovagroVines: 12, pollinator: 'Mimika' });
  near(b.farm['Ovagro Node'], a.farm['Ovagro Node'] * 2);
  near(a.ranch.Mimika, b.ranch.Mimika);
  assert.equal(normalizeSettings({ ovagroVines: 100 }).ovagroVines, 24);
});
