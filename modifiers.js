// Sources: wiki.gg/wiki/Plant, /Pollination, /Critter. Rates remain unrounded.
export const mutations = {
  None: {},
  Blooming: { note: '+20 decor; no food-production boost.' },
  Easygoing: { upkeep: 0.5, yield: 0.75, note: 'Wider temperature range (+50%).' },
  Juicyfruit: { upkeep: 1.25, instant: true, note: 'Ripe crops drop immediately.' },
  Wildish: { upkeep: 0.1, cycle: 4.5 },
  Licey: {
    upkeep: 1.25,
    note: 'Adds 1 kg Meal Lice per harvest. Only credited when Meal Lice is the target crop.',
  },
  Exuberant: {
    upkeep: 1.5,
    cycle: 0.25,
    note: 'Requires darkness; harvest carries food-poisoning germs. Rot Pile coproduct not credited.',
  },
  Leafy: {
    upkeep: 1.25,
    cycle: 0.5,
    note: 'Requires 1,000 lux above the plant’s normal light requirement.',
  },
  Bountiful: {
    upkeep: 1.2,
    yield: 2,
    note: 'Requires 200 lux above the plant’s normal light requirement.',
  },
  Specialized: { yield: 1.5, note: 'Temperature range narrowed by 50%.' },
  Superspecialized: { yield: 2, note: 'Temperature range narrowed by 80%.' },
};
// Keep the menu's numerical explanations tied to the actual calculation factors.
export function mutationDescription(name) {
  if (name === 'None' || !Object.hasOwn(mutations, name))
    return 'Normal growth, harvest and resource use.';
  const m = mutations[name];
  const parts = [];
  if (m.yield) parts.push(`${Math.round(m.yield * 100)}% harvest yield`);
  if (m.cycle) parts.push(`${m.cycle}× growth time`);
  if (m.upkeep) parts.push(`${Math.round(m.upkeep * 100)}% fertilizer / irrigation use`);
  return [parts.length ? `${parts.join(' · ')}.` : '', m.note || ''].filter(Boolean).join(' ');
}
// Explicit allowlists: do not grant modifiers to trees, forage or seedless crops.
export const mutablePlants = new Set([
  'Mealwood',
  'Dusk Cap',
  'Bristle Blossom',
  'Waterweed',
  'Pincha Pepperplant',
  'Sleet Wheat',
  'Nosh Sprout',
  'Grubfruit Plant',
  'Spindly Grubfruit Plant',
  'Bog Bucket',
  'Pikeapple Bush',
  'Plume Squash Plant',
  'Sweatcorn Stalk',
  'Thimble Reed',
  'Balm Lily',
  'Dew Dripper',
  'Gas Grass',
  'Sodicane',
  'Pinpoket',
]);
export const pollinatablePlants = new Set([
  'Mealwood',
  'Dusk Cap',
  'Bristle Blossom',
  'Sleet Wheat',
  'Nosh Sprout',
  'Grubfruit Plant',
  'Spindly Grubfruit Plant',
  'Pikeapple Bush',
  'Plume Squash Plant',
  'Sweatcorn Stalk',
  'Thimble Reed',
  'Balm Lily',
  'Dew Dripper',
  'Gas Grass',
  'Sodicane',
]);
export const pollinators = { None: 0, Sweetle: 0.05, Mimika: 0.25, Grubgrub: 0.5 };
export function plantModifiers(p, s) {
  const mutation = s.mutationEnabled !== false && mutablePlants.has(p.name) ? s.mutation : 'None',
    m = mutations[mutation] || {};
  const flyingEligible = [
    'Waterweed',
    'Pincha Pepperplant',
    'Bog Bucket',
    'Ovagro Node',
    'Pinpoket',
  ].includes(p.name);
  let pollinator =
    s.pollinationEnabled !== false &&
    (pollinatablePlants.has(p.name) || (s.pollinator === 'Mimika' && flyingEligible))
      ? s.pollinator
      : 'None';
  // Required tending cannot be switched off while still claiming a renewable crop.
  if (p.name === 'Sweatcorn Stalk' && pollinator === 'None') pollinator = 'Mimika';
  if (p.name === 'Grubfruit Plant' && !['Sweetle', 'Grubgrub'].includes(pollinator))
    pollinator = 'Sweetle';
  // Divergents would convert this to a different crop, so don't credit their boost.
  if (p.name === 'Spindly Grubfruit Plant' && ['Sweetle', 'Grubgrub'].includes(pollinator))
    pollinator = 'None';
  const touch = s.fertilizer && p.fertilizable ? 1 : 0;
  return {
    mutation,
    pollinator,
    upkeep: m.upkeep || 1,
    yield: (m.yield || 1) * (mutation === 'Licey' && p.name === 'Mealwood' ? 2 : 1),
    instant: !!m.instant,
    note: m.note || '',
    growth: ((s.wild ? 4 : 1) * (m.cycle || 1)) / (1 + touch + (pollinators[pollinator] || 0)),
  };
}
export function eggInterval(critter, happiness) {
  return critter.fixedPeriod
    ? critter.period
    : (critter.period * 10) / (1 + 2.25 * Math.max(0, happiness));
}
