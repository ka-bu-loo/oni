import { foods, asset, wiki, defaults, choices } from './catalog.js';
import { calculate, normalizeSettings } from './calculator.js';
import { availableAssets } from './asset-status.js';
import { createTreeView } from './tree-view.js';
import { mutations, pollinators } from './modifiers.js';
import { diets, dietLabel } from './diets.js';
import { bonusGuide } from './bonus-guide.js';
const $ = (id) => document.getElementById(id),
  fmt = (n) => Math.max(0, Math.ceil(n - 1e-10)).toLocaleString(),
  exact = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 4 });
const diagram = createTreeView($('tree-viewport'), $('tree'), {
  zoom: $('zoom'),
  fit: $('fit'),
  auto: $('auto-fit'),
  direction: $('direction'),
});
const compactScreen = matchMedia('(max-width:600px)');
$('direction').value = compactScreen.matches ? 'vertical' : 'horizontal';
$('colony-options').open = !compactScreen.matches;
compactScreen.addEventListener('change', (event) => {
  $('colony-options').open = !event.matches;
});
const esc = (s) =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
let settings = { ...defaults },
  selected = 'Frost Burger',
  result;
let pack = 'all';
const packImages = {
  'Spaced Out': 'Spaced Out Logo',
  Frosty: 'Frosty Planet Logo',
  Prehistoric: 'Prehistoric Logo',
  Aquatic: 'Aquatic Planet Logo',
  Base: 'Hatch',
  'All packs': 'Frost Burger',
};
const query = new URLSearchParams(location.search);
for (const key of Object.keys(defaults))
  if (query.has(key))
    settings[key] = typeof defaults[key] === 'boolean' ? query.get(key) === 'true' : query.get(key);
settings = normalizeSettings(settings);
if (foods.some((f) => f.name === query.get('food'))) selected = query.get('food');
$('mutation').innerHTML = Object.keys(mutations)
  .map((m) => `<option>${m}</option>`)
  .join('');
const controlKeys = [
  'normal',
  'bottomless',
  'hunger',
  'margin',
  'wild',
  'harvest',
  'lumbHarvest',
  'fertilizer',
  'happiness',
  'mutation',
  'pollinationEnabled',
  'mutationEnabled',
  'ovagroVines',
];
for (const key of controlKeys) {
  if (typeof defaults[key] === 'boolean') $(key).checked = settings[key];
  else $(key).value = settings[key];
}
function sprite(name) {
  const path = asset(name);
  return `<span class="sprite">${
    availableAssets.has(path)
      ? `<img src="${path}" alt="">`
      : `<span class="fallback" title="${esc(name)} — image not downloaded">${esc(
          name
            .split(' ')
            .map((x) => x[0])
            .join('')
            .slice(0, 3),
        )}</span>`
  }</span>`;
}
// Also handle files removed after the image inventory was generated.
document.addEventListener(
  'error',
  (event) => {
    if (event.target instanceof HTMLImageElement) {
      event.target.parentElement.innerHTML =
        '<span class="fallback" title="Image unavailable">?</span>';
    }
  },
  true,
);
function renderFoods() {
  const list = foods
    .filter(
      (f) =>
        f.name.toLowerCase().includes($('search').value.toLowerCase()) &&
        (pack === 'all' || f.dlc === pack),
    )
    .sort((a, b) => b.q - a.q || a.name.localeCompare(b.name));
  $('food-count').textContent = `${list.length} foods · highest quality first`;
  $('foods').innerHTML = list.length
    ? list
        .map(
          (f) =>
            `<button class="food ${selected === f.name ? 'selected' : ''}" data-food="${esc(f.name)}" aria-pressed="${selected === f.name}" title="${esc(f.name)} · ${f.kcal} kcal/kg · ${f.dlc}">${sprite(f.name)}<span>${esc(f.name)}</span><span class="quality">${f.q > 0 ? '+' : ''}${f.q}</span></button>`,
        )
        .join('')
    : '<p class="muted">No matching foods.</p>';
}
const labels = {
  egg: 'Egg ranch',
  meat: 'Meat ranch',
  fish: 'Fish ranch',
  shellfish: 'Shellfish ranch',
  tough: 'Tough Meat ranch',
  grain: 'Grain source',
  seafood: 'Cooked Seafood ingredient',
  fillet: 'Smoked Fish ingredient',
  vegetable: 'Veggie Poppers ingredient',
  fuel: 'Smoker fuel',
};
function renderNode(n, x, y) {
  const harvest = n.harvest;
  return `<a class="node ${n.kind}" style="left:${x}px;top:${y}px" href="${wiki(n.name)}" target="_blank" rel="noreferrer" title="${esc(`${exact(n.amount)} ${n.unit} · ${n.note}${harvest ? ` · ${exact(harvest.amount)} ${harvest.name} ${harvest.unit}` : ''}`)}">${sprite(n.name)}<span class="node-name">${esc(n.name)}</span><span class="node-value">${fmt(n.amount)}</span><span class="node-unit">${n.kind === 'critter' ? 'ADULTS · KEEP ALIVE' : n.unit}</span>${harvest ? `<span class="harvest-label">${fmt(harvest.amount)} ${harvest.unit === 'eggs/cycle' ? 'eggs cracked' : harvest.unit === 'arrivals/cycle' ? 'arrivals harvested' : 'offspring harvested'}/cycle</span>` : ''}</a>`;
}
function row(name, value, detail) {
  return `<div class="summary-row">${sprite(name)}<span>${esc(name)}</span><strong>${value}<small>${esc(detail)}</small></strong></div>`;
}
function render() {
  settings = normalizeSettings(settings);
  result = calculate(selected, settings);
  $('pollinator').innerHTML =
    `${settings.pollinator === 'None' ? '' : sprite(settings.pollinator)}${esc(settings.pollinator)} ▾`;
  $('pollinator').disabled = !settings.pollinationEnabled;
  $('mutation').disabled = !settings.mutationEnabled;
  $('vine-control').style.display = result.farm['Ovagro Node'] ? 'grid' : 'none';
  $('live-impact').textContent = Object.entries(result.ranch)
    .map(([name, count]) => `${name}: ${fmt(count)} kept alive (${exact(count)} calculated)`)
    .join(' · ');
  $('selected-name').textContent = selected;
  $('selected-detail').textContent =
    `${result.food.dlc} · Quality ${result.food.q > 0 ? '+' : ''}${result.food.q} · ${fmt(result.tree.amount)} kg/cycle`;
  $('kcal').textContent = fmt(result.kcal);
  $('meal-label').innerHTML = `<span>${esc(selected)}</span>${sprite(selected)}`;
  $('routes').innerHTML = result.used
    .map(
      (key) =>
        `<label>${labels[key]}<button class="route-choice" data-route="${key}">${sprite(settings[key])}${esc(settings[key])} ▾</button></label>`,
    )
    .join('');
  $('diets').innerHTML = result.usedDiets
    .map((name) => {
      const feed = settings.diets[name] || diets[name][0][0];
      return `<label>${esc(name)} diet<button class="route-choice" data-diet="${esc(name)}">${sprite(feed.replace('@', ''))}${esc(dietLabel(feed))} ▾</button></label>`;
    })
    .join('');
  diagram.render(result.tree, renderNode);
  $('capacity').innerHTML =
    Object.entries(result.farm)
      .map(([n, v]) => row(n, Math.ceil(v - 1e-10), `${fmt(v)} plants minimum`))
      .join('') +
      Object.entries(result.ranch)
        .map(([n, v]) => row(n, Math.ceil(v - 1e-10), `${fmt(v)} adults minimum`))
        .join('') || '<p class="muted">No renewable capacity in this plan.</p>';
  if (settings.lumbHarvest && result.lumbHarvests > 0)
    $('capacity').insertAdjacentHTML(
      'beforeend',
      row('Lumb', fmt(result.lumbHarvests / 10), 'wild harvest helpers · before travel headroom'),
    );
  $('resources').innerHTML =
    Object.entries(result.resources)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([n, v]) => row(n, fmt(v), result.resourceUnits[n]))
      .join('') || '<p class="muted">No external resource input.</p>';
  $('stations').innerHTML =
    Object.entries(result.stations)
      .map(([n, v]) => row(n, fmt(v), result.stationUnits[n]))
      .join('') || '<p class="muted">No cooking required.</p>';
  $('warnings').innerHTML = result.warnings.map((w) => `<li>${esc(w)}</li>`).join('');
  $('bonus-guide').hidden = !result.usedDiets.length;
  $('bonus-content').innerHTML = bonusGuide(result)
    .map(
      (b) =>
        `<p><strong>${esc(b.name)}</strong>: ${b.parts.map(esc).join(' + ')} = ${b.total} happiness${b.total !== b.target ? ` (covers the entered ${b.target})` : ''}.${b.liquid ? ` For ${fmt(b.adults)} adults: <strong>${fmt(b.liquid)} kg ${b.drink === 5 ? 'Brackene' : 'Squid Ink'}/cycle</strong>.` : ''}${b.moos ? ` That is about <strong>${fmt(b.moos)} regularly milked Gassy Moo${b.moos === 1 ? '' : 's'}</strong> at 50 kg/cycle each.` : ''}${b.extra && b.name !== 'Beakon' ? ' Keep the Pacu Treat buff active; extra treats are not added to the selected diet.' : ''}</p>`,
    )
    .join('');
  syncSelectButtons();
}
$('foods').addEventListener('click', (e) => {
  const b = e.target.closest('[data-food]');
  if (!b) return;
  selected = b.dataset.food;
  document.querySelector('.food-section').open = false;
  renderFoods();
  render();
});
$('routes').addEventListener('click', (e) => {
  const b = e.target.closest('[data-route]');
  if (!b) return;
  pick(labels[b.dataset.route], choices[b.dataset.route], (value) => {
    settings[b.dataset.route] = value;
    render();
  });
});
$('diets').addEventListener('click', (e) => {
  const b = e.target.closest('[data-diet]');
  if (!b) return;
  const name = b.dataset.diet;
  pick(
    `${name} diet`,
    diets[name].map(([n]) => dietLabel(n)),
    (value) => {
      settings.diets[name] = diets[name].find(([n]) => dietLabel(n) === value)[0];
      render();
    },
    Object.fromEntries(diets[name].map(([n]) => [dietLabel(n), n.replace('@', '')])),
  );
});
function pick(title, values, choose, images = {}) {
  $('picker-title').textContent = title;
  $('picker-options').innerHTML = values
    .map(
      (v, i) =>
        `<button class="food" data-pick="${i}">${v === 'None' ? '<span class="sprite">—</span>' : sprite(images[v] || v)}<span>${esc(v)}</span></button>`,
    )
    .join('');
  $('picker-options').onclick = (e) => {
    const b = e.target.closest('[data-pick]');
    if (b) {
      choose(values[Number(b.dataset.pick)]);
      $('picker').close();
    }
  };
  $('picker').showModal();
}
$('about-open').onclick = () => $('about').showModal();
document.querySelectorAll('dialog').forEach((dialog) => {
  const close = document.createElement('button');
  close.className = 'popup-close';
  close.type = 'button';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Close dialog');
  close.onclick = () => dialog.close();
  dialog.prepend(close);
});
$('meal-close').onclick = () => {
  document.querySelector('.food-section').open = false;
  document.querySelector('.food-section > summary').focus();
};
const selectButtons = [];
function syncSelectButtons() {
  for (const { select, button } of selectButtons) {
    button.textContent = `${select.selectedOptions[0]?.textContent || 'None'} ▾`;
    button.disabled = select.disabled;
  }
}
for (const id of ['hunger', 'mutation', 'direction']) {
  const select = $(id),
    button = document.createElement('button');
  button.type = 'button';
  button.className = 'select-trigger';
  button.setAttribute('aria-haspopup', 'dialog');
  button.setAttribute(
    'aria-label',
    id === 'hunger' ? 'Hunger' : id === 'mutation' ? 'Plant mutation' : 'Tree direction',
  );
  select.hidden = true;
  select.after(button);
  selectButtons.push({ select, button });
  button.onclick = () => {
    $('choice-title').textContent = button.getAttribute('aria-label');
    $('choice-options').innerHTML = [...select.options]
      .map(
        (o, i) =>
          `<button type="button" data-option="${i}" aria-pressed="${o.selected}">${esc(o.textContent)}${o.selected ? ' ✓' : ''}</button>`,
      )
      .join('');
    $('choice-options').onclick = (e) => {
      const option = e.target.closest('[data-option]');
      if (!option) return;
      select.selectedIndex = Number(option.dataset.option);
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
      syncSelectButtons();
      $('choice-dialog').close();
    };
    $('choice-dialog').showModal();
    $('choice-options').querySelector('[aria-pressed="true"]')?.focus();
  };
}
for (const key of controlKeys)
  $(key).addEventListener('input', () => {
    settings[key] = typeof defaults[key] === 'boolean' ? $(key).checked : $(key).value;
    render();
  });
$('pollinator').onclick = () =>
  pick(
    'One pollination effect · Sweetle +5%, Mimika +25%, Grubgrub +50%',
    Object.keys(pollinators),
    (value) => {
      settings.pollinator = value;
      render();
    },
  );
$('search').addEventListener('input', renderFoods);
$('dlc').onclick = () =>
  pick(
    'Filter meals by game pack',
    Object.keys(packImages),
    (value) => {
      pack = value === 'All packs' ? 'all' : value;
      $('dlc').innerHTML = `${sprite(packImages[value])}${esc(value)} ▾`;
      renderFoods();
    },
    packImages,
  );
renderFoods();
render();
