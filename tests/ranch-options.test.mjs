import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate,normalizeSettings} from '../calculator.js';
import {diets,eggYields} from '../diets.js';
import {plantModifiers} from '../modifiers.js';
import {plants} from '../catalog.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const flatten=n=>[n,...n.children.flatMap(flatten)];
test('all egg species use actual cracked Raw Egg mass, including cooked recipes',()=>{
 for(const [egg,yield_] of Object.entries(eggYields))for(const meal of ['Raw Egg','Omelette','Mushroom Quiche','Soufflé Pancakes']){
  const r=calculate(meal,{egg});const nodes=flatten(r.tree),raw=nodes.find(n=>n.name==='Raw Egg');
  near(raw.children[0].amount,raw.amount/yield_);assert.ok(r.used.includes('egg'));assert.ok(r.ranch[egg]>=0);
 }
 assert.equal(eggYields.Lumb,4);assert.equal(eggYields.Pacu,.75);assert.equal(eggYields.Puft,.25);
});
test('egg sources do not replace meat sources in nested feed recipes',()=>{
 const r=calculate('Omelette',{egg:'Rhex',meat:'Stone Hatch'});
 assert.ok(r.used.includes('egg')&&r.used.includes('meat'));assert.ok(r.ranch.Rhex>0&&r.ranch['Stone Hatch']>0);
});
test('every offered diet resolves, with explicit external feed for circular diets',()=>{
 for(const [egg,options] of Object.entries(diets))if(eggYields[egg])for(const [feed] of options){
  const r=calculate('Omelette',{egg,diets:{[egg]:feed}});
  for(const n of flatten(r.tree))assert.ok(Number.isFinite(n.amount)&&n.amount>=0,`${egg}: ${feed}`);
 }
 const circular=calculate('Tender Brisket',{tough:'Rhex',diets:{Rhex:'Tough Meat'}});
 assert.ok(circular.warnings.some(w=>w.includes('external supply')));
});
test('Pacu seeds use counts and grain diets include upstream farms',()=>{
 const r=calculate('Cooked Seafood',{diets:{Pacu:'Seeds'}});near(r.resources.Seeds,r.ranch.Pacu);assert.equal(r.resourceUnits.Seeds,'units/cycle');assert.equal(r.resources.Algae,undefined);
 assert.ok(calculate('Cooked Seafood',{diets:{Pacu:'Sleet Wheat Grain'}}).farm['Sleet Wheat']>0);
 assert.ok(calculate('Cooked Seafood',{diets:{Pacu:'Pacu Treat'}}).resources.Seeds>0);
});
test('Lumb mode removes land-crop drop delay, not aquatic crop delay',()=>{
 near(calculate('Meal Lice',{harvest:false,lumbHarvest:true}).farm.Mealwood,calculate('Meal Lice').farm.Mealwood);
 near(calculate('Lettuce',{harvest:false,lumbHarvest:true}).farm.Waterweed,calculate('Lettuce',{harvest:false}).farm.Waterweed);
 assert.equal(calculate('Lettuce',{lumbHarvest:true}).lumbHarvests,0);
 assert.ok(calculate('Meal Lice',{lumbHarvest:true}).lumbHarvests>0);
});
test('happiness supported bounds, fed-only metabolism, and no Arbor mutations',()=>{
 assert.equal(normalizeSettings({happiness:100}).happiness,12);assert.equal(normalizeSettings({happiness:-100}).happiness,-1);
 const r=calculate('Barbeque',{happiness:-1});near(r.resources['Sedimentary Rock'],r.ranch.Hatch*28);
 assert.equal(plantModifiers(plants.Wood,normalizeSettings({mutation:'Exuberant'})).mutation,'None');
 assert.equal(calculate('Barbeque',{hunger:-1000,bottomless:5}).kcal,0);
});
