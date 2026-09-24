// Rates per fed adult per cycle. References: each species' ONI Wiki diet table.
// One selected diet per species; gases and minerals remain external supplies.
import {critters,foods} from './catalog.js';
const same=(names,rate)=>names.map(name=>[name,rate]);
const calories=(name,kcal)=>[name,kcal/foods.find(f=>f.name===name).kcal];
export const diets=Object.fromEntries(Object.entries(critters).map(([name,c])=>[name,c.diet]));
Object.assign(diets,{
 Hatch:same(['Sedimentary Rock','Sandstone','Crushed Rock','Shale','Clay','Dirt','Sand'],140).concat([calories('Meal Lice',700)]),
 'Stone Hatch':same(['Igneous Rock','Sedimentary Rock','Granite','Obsidian','Copper Ore','Iron Ore'],140),
 'Sage Hatch':same(['Dirt','Slime','Algae','Fertilizer','Polluted Dirt','Corallium'],140).concat([calories('Meal Lice',700)]),
 'Smooth Hatch':same(['Iron Ore','Copper Ore','Gold Amalgam','Wolframite','Aluminum Ore','Cobalt Ore','Nickel Ore','Cinnabar Ore'],100),
 Drecko:[['@Mealwood',.25],['@Balm Lily',.0625],['@Pincha Pepperplant',.09375]],
 'Glossy Drecko':[['@Mealwood',1/3],['@Bristle Blossom',1/6]],
 'Puft Prince':same(['Polluted Oxygen','Oxygen','Chlorine Gas'],30),
 'Shove Vole':same(['Regolith','Dirt','Iron Ore'],4800),
 'Delecta Vole':same(['Regolith','Dirt','Iron Ore'],4800),
 Sanishell:same(['Polluted Dirt','Rot Pile','Slime'],15),
 Blowter:[['Lettuce',1],['@Waterweed',1/12]],
 Beakon:[['Phosphorite',10],['@Starnacle',.125]],
 Orehull:[['Nori',20],['Kelpole',2]],
 Rhex:[['Meat',.5],['Tough Meat',.5]],
 Lumb:['Ovagro Fig','Bristle Berry','Bog Jelly'].map(name=>calories(name,1300))
});
for(const name of ['Pacu','Tropical Pacu','Gulp Fish'])diets[name]=[['Algae',7.5],['Seeds',1],['Sleet Wheat Grain',1],['Nosh Bean',1],['Seakomb Leaf',20],['@Seakomb',.4],['Pacu Treat',1]];
for(const name of ['Plug Slug','Smog Slug','Sponge Slug'])diets[name]=same(['Iron Ore','Copper Ore','Gold Amalgam','Cobalt Ore','Aluminum Ore','Iron','Copper','Gold','Cobalt','Aluminum'],name==='Plug Slug'?60:30);
for(const name of ['Flox','Shatter Flox'])diets[name]=[['Pikeapple',.2],calories('Bristle Berry',160),['@Pikeapple Bush',.2],['@Bristle Blossom',.1],...(name==='Shatter Flox'?[['Abyssalite',20]]:[])];
for(const name of ['Bammoth','Regal Bammoth'])diets[name]=[['Nosh Bean',1.6],calories('Plume Squash',1777.8),calories('Squash Fries',1349.8),['@Plume Squash Plant',4/9],['@Nosh Sprout',17/120]];
export const dietLabel=name=>name.startsWith('@')?`${name.slice(1)} (grazing)`:name;
// Raw Egg kg per cracked egg, not total egg mass. Egg Cracker table, U59.
export const eggYields=Object.fromEntries(Object.entries(critters).filter(([,c])=>!c.fixedPeriod).map(([n])=>[n,1]));
Object.assign(eggYields,{'Bammoth':4,'Regal Bammoth':4,'Lumb':4,'Rhex':4,'Pacu':.75,'Tropical Pacu':.75,'Gulp Fish':.75,'Beakon':.75,'Puft':.25,'Puft Prince':.25,'Dense Puft':.25,'Squeaky Puft':.25,'Jawbo':2,'Orehull':2,'Glo Squid':2,'Slogo':.5,'Gildgo':.5});
export const happinessLimit=name=>['Pacu','Tropical Pacu','Gulp Fish','Beakon'].includes(name)?12:10;
