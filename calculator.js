import { foods, recipes, plants, critters, foraged, units, defaults, choices } from './catalog.js';
import { mutations, pollinators, plantModifiers, eggInterval } from './modifiers.js';
import { diets, eggYields, happinessLimit } from './diets.js';

export function normalizeSettings(input = {}) {
  const s = { ...defaults, ...input };
  for (const k of ['normal', 'bottomless', 'margin'])
    s[k] = Math.min(100000, Math.max(0, Number(s[k]) || 0));
  s.margin = Math.min(100, s.margin);
  s.hunger = [-1000, -500, 0, 500, 1000].includes(Number(s.hunger)) ? Number(s.hunger) : 0;
  s.happiness = Math.min(12, Math.max(-1, Number(s.happiness) || 0));
  s.diets = Object.fromEntries(
    Object.entries(input.diets || {}).filter(([name, food]) =>
      diets[name]?.some(([n]) => n === food),
    ),
  );
  if (!Object.hasOwn(eggYields, s.egg)) s.egg = 'Hatch';
  s.ovagroVines = Math.min(24, Math.max(1, Math.floor(Number(s.ovagroVines) || 24)));
  if (!Object.hasOwn(mutations, s.mutation)) s.mutation = 'None';
  if (!Object.hasOwn(pollinators, s.pollinator)) s.pollinator = 'None';
  for (const [k, v] of Object.entries(choices)) if (!v.includes(s[k])) s[k] = v[0];
  return s;
}
export function calculate(foodName, input = {}) {
  const s = normalizeSettings(input),
    food = foods.find((f) => f.name === foodName);
  if (!food) throw new Error('Unknown food: ' + foodName);
  const kcal =
    s.hunger === -1000
      ? 0
      : (s.normal * Math.max(0, 1000 + s.hunger) + s.bottomless * Math.max(0, 1500 + s.hunger)) *
        (1 + s.margin / 100);
  const resources = {},
    resourceUnits = {},
    farm = {},
    ranch = {},
    stations = {},
    stationUnits = {},
    warnings = new Set(),
    used = new Set(),
    usedDiets = new Set(),
    feeding = new Set();
  let serial = 0,
    harvests = 0,
    lumbHarvests = 0;
  const add = (map, name, amount) => (map[name] = (map[name] || 0) + amount);
  const node = (name, amount, unit, kind, note = '', children = []) => ({
    id: ++serial,
    name,
    amount,
    unit,
    kind,
    note,
    children,
  });
  const resolve = (name) => {
    if (!name.startsWith('$')) return name;
    used.add(name.slice(1));
    return s[name.slice(1)];
  };
  const leaf = (name, amount, unit = 'kg/cycle', note = 'External resource supply') => {
    add(resources, name, amount);
    resourceUnits[name] = unit;
    return node(name, amount, unit, 'resource', note);
  };
  function plant(p, count, note = '') {
    const modifier = plantModifiers(p, s);
    add(farm, p.name, count);
    const children = (s.wild ? p.wildInputs || [] : p.inputs).map(([n, q]) =>
      walk(n, q * count * modifier.upkeep),
    );
    if (s.fertilizer && p.fertilizable)
      children.push(walk('Fertilizer', 5 * count * (p.branches || 1)));
    if (p.note) warnings.add(p.note);
    if (modifier.mutation !== 'None')
      warnings.add(
        `${p.name}: ${modifier.mutation}; requires Spaced Out and continuous 250 rads/cycle. ${modifier.note}`,
      );
    else if (s.mutationEnabled && s.mutation !== 'None')
      warnings.add(`${p.name}: mutation not applied; not in the verified eligible-plant list.`);
    if (modifier.pollinator !== 'None') {
      const species = modifier.pollinator,
        capacity = species === 'Mimika' ? 10 : 8,
        adults = (count * (p.branches || 1)) / capacity;
      add(ranch, species, adults);
      const upkeep =
        species === 'Mimika'
          ? walk('Mimika', adults / 5).children
          : [walk('Sulfur', adults * (species === 'Sweetle' ? 20 : 50))];
      children.push(
        node(
          species,
          adults,
          'keep alive',
          'pollinator',
          `Ideal coverage: up to ${capacity} plants or vines/cycle; add travel and feeding headroom${species === 'Mimika' ? `; replace ${adults / 5} per cycle (5-cycle lifespan)` : ''}`,
          upkeep,
        ),
      );
      warnings.add(
        `${p.name}: ${species} pollination, ideal ${capacity} plants/critter/cycle. Population and feed included; travel/feeding downtime needs extra headroom. Divergent herd replacements are not budgeted; Mimika replacement buds are included. Only one effect applies.`,
      );
      if (modifier.pollinator !== s.pollinator)
        warnings.add(
          `${p.name} requires pollination: ${species} supplied automatically. Mimika cannot convert Grubfruit.`,
        );
    }
    if (p.name === 'Spindly Grubfruit Plant' && ['Sweetle', 'Grubgrub'].includes(s.pollinator))
      warnings.add(
        'Divergent pollination is not applied to Spindly Grubfruit: it would convert the plant to full Grubfruit. Choose Grubfruit to plan that route.',
      );
    return node(
      p.name,
      count,
      p.branches ? `nodes · ${p.branches} vines each` : 'plants',
      'plant',
      [s.wild ? 'Wild' : 'Domestic', note, p.note].filter(Boolean).join(' · '),
      children,
    );
  }
  function graze(name, rate) {
    const grown = Object.values(plants).find((p) => p.name === name);
    if (grown && !['Mealwood', 'Bonbon Tree', 'Arbor Tree'].includes(name))
      return plant(
        grown,
        rate * grown.cycles * plantModifiers(grown, s).growth,
        'Live plant grazing; no harvested crop credited',
      );
    if (name === 'Balm Lily') {
      const p = { name, inputs: [], fertilizable: true };
      return plant(
        p,
        rate * 12 * plantModifiers(p, s).growth,
        'Live growth grazed; requires a suitable chlorine atmosphere',
      );
    }
    if (name === 'Starnacle') {
      const p = { name, inputs: [['Coquina', 20]], fertilizable: false };
      return plant(p, rate * 4 * (s.wild ? 4 : 1), 'Live growth grazed; 4-cycle domestic growth');
    }
    if (name === 'Mealwood')
      return plant(
        plants['Meal Lice'],
        rate * 3 * plantModifiers(plants['Meal Lice'], s).growth,
        'Live plant grazing; no harvested Meal Lice',
      );
    if (name === 'Thimble Reed') {
      const p = { name, inputs: [['Polluted Water', 160]], fertilizable: true };
      return plant(
        p,
        rate * 2 * plantModifiers(p, s).growth,
        'Live growth grazed; 2-cycle domestic growth',
      );
    }
    if (name === 'Gas Grass') {
      const p = {
        name,
        inputs: [
          ['Liquid Chlorine', 0.5],
          ['Dirt', 25],
        ],
        fertilizable: true,
      };
      return plant(
        p,
        rate * 4 * plantModifiers(p, s).growth,
        'Live growth grazed; 4-cycle domestic growth; requires 10,000 lux unless Exuberant',
      );
    }
    if (name === 'Tublia')
      return plant(
        {
          name,
          inputs: [
            ['Brine', 30],
            ['Sulfur', 20],
          ],
          fertilizable: true,
        },
        (rate * 8 * (s.wild ? 4 : 1)) / (s.fertilizer ? 2 : 1),
        'Live growth grazed; 8-cycle domestic growth',
      );
    if (name === 'Bonbon Tree') {
      warnings.add(
        'Bonbon Tree assumes all five branches continuously receive 10,000 lux. Do not harvest the nectar-producing branches for wood.',
      );
      return plant(
        { name, inputs: [['Snow', 100]], fertilizable: false },
        rate * (s.wild ? 4 : 1),
        'Five mature branches at 10,000 lux; nectar, not wood',
      );
    }
    throw new Error('Unmodeled graze ' + name);
  }
  function breed(name, harvestRate, product = 'offspring') {
    const c = critters[name];
    const happy = Math.min(s.happiness, happinessLimit(name));
    const interval = eggInterval(c, happy),
      net = 1 / interval - 1 / (c.life - c.baby),
      count = harvestRate / net;
    add(ranch, name, count);
    usedDiets.add(name);
    feeding.add(name);
    const selectedDiet = diets[name].find(([n]) => n === s.diets[name]) || diets[name][0];
    const [feed, rate] = selectedDiet,
      metabolism = happy < 0 ? 0.2 : 1;
    const children = [
      feed.startsWith('@')
        ? graze(feed.slice(1), count * rate * metabolism)
        : walk(feed, count * rate * metabolism),
    ];
    feeding.delete(name);
    const action = node(
      name,
      harvestRate,
      product === 'eggs' ? 'eggs/cycle' : c.fixedPeriod ? 'arrivals/cycle' : 'harvests/cycle',
      'harvest',
      product === 'eggs'
        ? 'Crack surplus eggs; retain replacements'
        : c.fixedPeriod
          ? 'Harvest surplus mooteor arrivals; retain replacements'
          : 'Harvest surplus hatchlings; retain replacements',
    );
    action.children = [
      node(
        name,
        count,
        'adult breeders',
        'critter',
        `Fed adults · happiness ${happy} · 1 ${c.fixedPeriod ? 'arrival' : 'egg'} / ${interval.toFixed(3)} cycles · ${c.space} tiles/adult`,
        children,
      ),
    ];
    if (s.happiness > happy)
      warnings.add(
        `${name}: using happiness ${happy}, the maximum from the bonuses supported here (grooming, condo and Brackene fountain; Pacu treats/Beakon fresh air where applicable).`,
      );
    if (c.fixedPeriod)
      warnings.add(
        `${name}: calls a mooteor every 16 cycles, rather than laying eggs. Requires sustained feeding, sunlight and a clear arrival area. Happiness does not accelerate arrivals; reserve replacements.`,
      );
    if (['Pacu', 'Tropical Pacu', 'Gulp Fish'].includes(name))
      warnings.add(
        'Pacu no longer get the old happiness bonus just from eating at a feeder. Use their actual happiness, including grooming or treats. The selected diet is included below; treats used on top of another diet need their own budget.',
      );
    warnings.add(
      'The default happiness of 4 means tame, fed and regularly groomed, with no extra boosters. Feeding alone leaves a tame critter at −1. Keep eggs moving out and give the herd enough room: cramped or starving ranches will not meet this estimate.',
    );
    warnings.add(
      'Keep the breeding adults; use their spare eggs or hatchlings for food. We reserve replacements, but do not include baby feed, incubator space, startup time or meat from old breeders. The estimate assumes eggs stay the same morph, so allow extra room if yours often change.',
    );
    return action;
  }
  function walk(name, amount, path = []) {
    name = resolve(name);
    if (path.includes(name)) throw new Error('Production cycle: ' + [...path, name].join(' → '));
    const unit = units.has(name) || name === 'Seeds' ? 'units/cycle' : 'kg/cycle';
    const n = node(name, amount, unit, 'ingredient');
    if (recipes[name]) {
      const r = recipes[name],
        industrial = ['Fertilizer', 'Ethanol', 'Snow'].includes(name);
      add(stations, r.station, industrial ? amount : amount / r.output);
      stationUnits[r.station] = industrial ? 'kg output / cycle' : 'batches / cycle';
      n.kind = 'recipe';
      n.note = r.station + (industrial ? ' · inputs per kg output' : ` · ${r.output} kg/batch`);
      if (r.note) warnings.add(r.note);
      n.children = r.inputs.map(([part, q]) =>
        walk(part, (amount * q) / r.output, [...path, name]),
      );
      return n;
    }
    if (plants[name]) {
      const p =
          name === 'Ovagro Fig'
            ? {
                ...plants[name],
                yield: s.ovagroVines,
                branches: s.ovagroVines,
                note: `${s.ovagroVines} productive vines per node; steady-state after establishment. Water is per node; tending and pollination are per vine.`,
              }
            : plants[name],
        modifier = plantModifiers(p, s),
        growth = p.cycles * modifier.growth,
        yield_ = p.yield * modifier.yield;
      const lumbEligible =
        !['Waterweed', 'Tower Kelp', 'Pinpoket', 'Seakomb', 'Saturn Critter Trap'].includes(
          p.name,
        ) && !p.selfHarvest;
      const lumb = s.lumbHarvest && lumbEligible;
      const delay = s.harvest || lumb || p.selfHarvest || p.mustHarvest || modifier.instant ? 0 : 4;
      if (lumb && !modifier.instant) lumbHarvests += (amount / yield_) * (p.branches || 1);
      if (!p.selfHarvest && !modifier.instant) harvests += (amount / yield_) * (p.branches || 1);
      n.note = `${yield_} ${unit.startsWith('units') ? 'units' : 'kg'} / ${growth + delay} cycles`;
      n.children = [
        plant(
          p,
          (amount / yield_) * (growth + delay),
          `${growth}-cycle growth${delay ? ' + 4-cycle drop delay' : ''}`,
        ),
      ];
      if (name === 'Plant Meat') n.children[0].children.push(breed('Hatch', amount / 10));
      if (p.mustHarvest && !s.harvest)
        warnings.add(
          'Saturn Critter Traps cannot self-harvest: dupe harvesting is still required.',
        );
      return n;
    }
    if (name === 'Mimillet') {
      n.note = 'One seed when a Mimika dies';
      n.children = [walk('Mimika', amount)];
      return n;
    }
    if (name === 'Nori') {
      n.note = '10 kg per Kelpole';
      n.children = [walk('Kelpole', amount / 10)];
      return n;
    }
    if (name === 'Meat') {
      used.add('meat');
      if (feeding.has(s.meat)) {
        warnings.add(
          'This diet feeds a ranch its own product. Its feed is shown as an external supply, not a self-sustaining loop.',
        );
        return leaf(name, amount, unit, 'External feed; circular ranch excluded');
      }
      n.children = [breed(s.meat, amount / critters[s.meat].drop)];
      return n;
    }
    const ranchChoices = {
      'Fish Fillet': 'fish',
      'Raw Shellfish': 'shellfish',
      'Tough Meat': 'tough',
    };
    if (ranchChoices[name]) used.add(ranchChoices[name]);
    const sources = {
      Calamari: 'Glo Squid',
      'Jawbo Fillet': 'Jawbo',
      'Fish Fillet': s.fish,
      'Raw Shellfish': s.shellfish,
      Tallow: 'Spigot Seal',
      'Tough Meat': s.tough,
    };
    if (sources[name]) {
      const c = sources[name];
      if (feeding.has(c)) {
        warnings.add(
          'This diet feeds a ranch its own product. Its feed is shown as an external supply, not a self-sustaining loop.',
        );
        return leaf(name, amount, unit, 'External feed; circular ranch excluded');
      }
      n.note = `${critters[c].drop} kg per harvested animal`;
      n.children = [breed(c, amount / critters[c].drop)];
      return n;
    }
    if (name === 'Raw Egg') {
      used.add('egg');
      n.note = `${s.egg}: ${eggYields[s.egg]} kg Raw Egg per egg; Egg Cracker`;
      n.children = [breed(s.egg, amount / eggYields[s.egg], 'eggs')];
      return n;
    }
    if (name === 'Tonic Root') {
      n.note = 'Shearing Station · 8 roots every 8 cycles';
      add(ranch, 'Delecta Vole', amount);
      n.children = [
        node('Delecta Vole', amount, 'adults', 'critter', 'Feed at 70–80 °C; prompt shearing', [
          walk('Regolith', 4800 * amount),
        ]),
      ];
      warnings.add(
        'Delecta Vole assumes ideal 8-cycle quill regrowth and an established herd; maintain replacement morphs separately.',
      );
      return n;
    }
    if (name === 'Sucrose') {
      add(ranch, 'Sweetle', amount / 10);
      n.note = 'Sweetle excretion: 20 kg sulfur → 10 kg sucrose per cycle';
      n.children = [
        node(
          'Sweetle',
          amount / 10,
          'adults',
          'critter',
          'Established, fed herd; replacements separate',
          [walk('Sulfur', amount * 2)],
        ),
      ];
      return n;
    }
    if (foraged[name]) {
      n.kind = 'limited';
      n.note = 'Finite supply — not a sustainable farm';
      n.children = [
        leaf(
          foraged[name],
          amount,
          'kg/cycle',
          'Forage / starting supplies; replenishment not guaranteed',
        ),
      ];
      warnings.add(`${name} is a finite foraged or starting supply, not a sustainable food plan.`);
      return n;
    }
    return leaf(name, amount, unit);
  }
  // The wiki rounds this calorie density to 2863; 11450 kcal / 4 kg is exact.
  const density = food.name === 'Veggie Poppers' ? 11450 / 4 : food.kcal;
  const tree = walk(food.name, kcal / density);
  if (harvests > 0)
    warnings.add(
      `Lumb harvesting: this plan needs about ${harvests.toFixed(2)} crop harvests/cycle. A Lumb stomps at most 10 times/cycle (60-second cooldown) and can harvest multiple ripe plants in its 2×2 footprint. At one ready crop per stomp, ${Math.ceil(harvests / 10)} Lumb(s) would cover the raw throughput; this is not a guaranteed staffing count. Walking, crop placement and accessible hanging crops matter. Lumb feed and replacements are not added for this optional service.`,
    );
  if (s.fertilizer)
    warnings.add(
      'Farmer’s Touch works on eligible wild and domestic plants. Fertilizer assumes 5 kg per application and a 1-cycle duration (0 Agriculture); skilled farmers can reduce consumption.',
    );
  if (s.lumbHarvest)
    warnings.add(
      `Lumb Harvest covers reachable land crops only, not aquatic crops. Plan for ${Math.ceil(lumbHarvests / 10)} wild Lumb(s) at one ripe crop per stomp, before travel headroom. They are harvest helpers, not breeders; their food and replacements are not included. Dupe Harvest still covers other crops when enabled.`,
    );
  return {
    tree,
    kcal,
    food,
    resources,
    resourceUnits,
    farm,
    ranch,
    stations,
    stationUnits,
    warnings: [...warnings],
    used: [...used],
    usedDiets: [...usedDiets],
    settings: s,
    lumbHarvests,
  };
}
