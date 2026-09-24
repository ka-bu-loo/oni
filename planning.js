import { calculate, normalizeSettings } from './calculator.js';
import { foods } from './catalog.js';

export function plan(foodName, settings, options = {}) {
  const food = foods.find((f) => f.name === foodName);
  if (!food) throw new Error(`Unknown food: ${foodName}`);
  const s = normalizeSettings(settings);
  const density = foodName === 'Veggie Poppers' ? 11450 / 4 : food.kcal;
  const amount = Math.min(1e12, Math.max(0, Number(options.amount) || 0));
  if (options.mode === 'mass') return calculate(foodName, s, amount * density);
  if (options.mode === 'energy') return calculate(foodName, s, amount);
  if (options.mode !== 'limited') return calculate(foodName, s);
  const basis = calculate(foodName, s, 1000);
  const constraints = (options.limits || []).map((limit) => {
    const group = ['resources', 'farm', 'ranch'].includes(limit.group) ? limit.group : 'resources';
    const usage = basis[group][limit.name] || 0;
    const massRate = group === 'resources' && basis.resourceUnits[limit.name] === 'kg/cycle';
    const budget =
      Math.min(1e12, Math.max(0, Number(limit.amount) || 0)) *
      (massRate && limit.perSecond ? 600 : 1);
    return { ...limit, group, budget, usage, capacity: usage > 0 ? budget / usage : null };
  });
  const active = constraints.filter((c) => c.capacity !== null);
  const capacity = active.length ? Math.min(...active.map((c) => c.capacity)) : 0;
  const result = calculate(foodName, s, capacity * 1000);
  result.constraints = constraints;
  result.bottlenecks = active
    .filter((c) => Math.abs(c.capacity - capacity) < 1e-9)
    .map((c) => c.name);
  const daily = Math.max(0, 1000 + s.hunger) * (1 + s.margin / 100);
  result.supportedDupes = daily > 0 && active.length ? result.kcal / daily : null;
  if (!active.length)
    result.warnings.push(
      'Add a limit used by this meal to calculate capacity. An unused resource does not constrain production.',
    );
  result.warnings.push(
    'Capacity assumes all other supplies, space and labour are available. Plant and breeder limits use steady-state averages; allow practical headroom.',
  );
  return result;
}
