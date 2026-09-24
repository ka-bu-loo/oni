import { happinessLimit } from './diets.js';

// A support estimate only: do not feed these figures back into the food tree.
export function bonusGuide(result) {
  return result.usedDiets.map((name) => {
    const target = Math.min(result.settings.happiness, happinessLimit(name));
    const adults = Math.ceil(result.ranch[name] - 1e-10);
    const special = ['Pacu', 'Tropical Pacu', 'Gulp Fish'].includes(name)
      ? 'Pacu Treat'
      : name === 'Beakon'
        ? 'Breath of Fresh Air'
        : null;
    const combinations = [];
    for (const groom of [0, 5])
      for (const condo of [0, 1])
        for (const drink of [0, 3, 5])
          for (const extra of special ? [0, 2] : [0]) {
            const total = -1 + groom + condo + drink + extra;
            if (total >= target) combinations.push({ groom, condo, drink, extra, total });
          }
    combinations.sort(
      (a, b) => a.total - b.total || a.drink - b.drink || a.extra - b.extra || b.groom - a.groom,
    );
    const plan = combinations[0];
    const parts = ['Tame −1'];
    if (plan.groom) parts.push('Grooming +5');
    if (plan.condo) parts.push('Condo +1');
    if (plan.drink)
      parts.push(`${plan.drink === 5 ? 'Brackene' : 'Squid Ink'} fountain +${plan.drink}`);
    if (plan.extra) parts.push(`${special} +2`);
    return {
      name,
      adults,
      target,
      ...plan,
      parts,
      liquid: plan.drink ? adults * 5 : 0,
      moos: plan.drink === 5 ? Math.ceil(adults / 10) : 0,
    };
  });
}
