# Community release notes

## What changed

Material 3-inspired dark theme, spacious settings pane, collapsible meal picker and manifest. Desktop defaults to a horizontal staircase; phones default to vertical. Auto-fit is enabled and preserves readable sizing rather than shrinking everything to a fixed height. Large diagrams scroll. Zoom lays out text and sprites at actual pixel sizes, without scaling an ancestor layer. Ctrl + wheel zooms; ordinary scrolling remains available. Right/middle-button dragging, arrow-key panning and F to fit are supported. Breeding herds appear once, while food outputs carry the surplus harvest rate. Display values round upward; exact population estimates are also visible above the tree.

Farmer’s Touch applies to eligible wild as well as domestic plants; Dew Dripper is excluded. Waterweed supports Mimika. Ovagro has configurable productive vines (1–24): water is per node, tending and pollination per vine. Lumb harvesting advice uses the 60-second stomp cooldown and explicitly does not guarantee coverage. Pollination and mutation switches retain selections for comparison. Licey Mealwood yield is credited throughout Meal Lice recipes; Meal Lice coproduct from other plant species is not reused across branches.

References: [Farm Station](https://oxygennotincluded.wiki.gg/wiki/Farm_Station), [Ovagro Node](https://oxygennotincluded.wiki.gg/wiki/Ovagro_Node), [Lumb](https://oxygennotincluded.wiki.gg/wiki/Lumb).

Picture pickers cover ingredient routes, ranch species, pollinators and game packs. The pack picker filters meals, not all production-route availability. Meal quality is not morale: duplicant morale bonuses depend on expectations.

## Calculation scope

- Happy reproduction uses base rate × (1 + 2.25 × happiness). The default of 4 reproduces the familiar groomed rate. Enter actual in-game happiness, not the sum of positive buffs. Cramped, starving and negative-happiness ranches are outside this model. Sources: [Critter](https://oxygennotincluded.wiki.gg/wiki/Critter), [U59 changes](https://oxygennotincluded.wiki.gg/wiki/Versions/U59-731233).
- Adults reserve replacements. Juvenile maturation is five cycles. Baby feed, incubation space, startup delays, breeder death meat and mixed-morph egg probabilities are excluded. This is a conservative steady-state estimate, not a starvation-ranch simulation.
- Moos use 16-cycle calls, unaffected by reproduction happiness. They require feeding, sunlight and a mooteor arrival area. [Moo reference](https://oxygennotincluded.wiki.gg/wiki/Gassy_Moo).
- Only one pollination bonus applies: Sweetle 5%, Mimika 25%, Grubgrub 50%. Continuous coverage is assumed. Ideal pollinator populations and feed are included (8 plants per Divergent or 10 per Mimika); allow headroom for feeding and travel. Mimika replacements trace back to their buds. Divergent breeding/replacements are not added to the pollinator estimate. Required tending is supplied automatically for Grubfruit and Sweatcorn; Divergent bonuses are excluded from Spindly Grubfruit because they would change the crop. Eligibility is deliberately conservative for hanging, aquatic and branched plants. [Pollination](https://oxygennotincluded.wiki.gg/wiki/Pollination), [Divergent](https://oxygennotincluded.wiki.gg/wiki/Divergent), [Mimika](https://oxygennotincluded.wiki.gg/wiki/Mimika).
- Mutations change harvest yield, growth time and upkeep separately. Juicyfruit removes automatic-drop delay. Licey coproduct is credited only for Mealwood; other coproducts are not credited. Mutants require Spaced Out and 250 rads/cycle; light, temperature and germ conditions are noted. Seedless/branched plants are not assigned mutations. Settings currently apply globally to eligible plants, not individually. [Plant](https://oxygennotincluded.wiki.gg/wiki/Plant), [mutation guide](https://oxygennotincluded.wiki.gg/wiki/Guide/Mutant_agriculture_(Spaced_Out!)).
- Species diets use one documented feed option each, not every possible diet. External resources such as Pearl and Brine Ice remain explicit supply endpoints.

Before presenting this as definitive on Reddit, compare representative farms and ranches against a current unmodded save, especially aquatic plant eligibility, sustained pollination and morph probabilities. Present it as a fan-made planner with documented assumptions and welcome reproducible corrections.

## Credits

A public frontend can technically be copied. GitHub permits viewing and forking public repositories; permission to redistribute or host copies depends on the applicable licence and rights. An open-source licence generally permits reuse and cannot guarantee exclusive hosting. Keep your canonical repository and creator identity clear. Do not relicense third-party wiki material or Klei artwork as your own.

The persistent asset checklist and attribution-page link have been removed from the app. About retains source, licence and non-affiliation notices. The repository keeps the image inventory for provenance and maintenance.

Klei's [Player Creation Guidelines](https://support.klei.com/hc/en-us/articles/360029880791-Player-Creation-Guidelines) govern fan use of game artwork. Wiki content has separate [CC BY-NC-SA conditions](https://creativecommons.org/licenses/by-nc-sa/4.0/).

Inspired by [ONI Assistant's food calculator](https://web.archive.org/web/20241125080815/https://oni-assistant.com/tools/foodcalculator). This is an independent fan project, not an official continuation. Built with assistance from OpenAI Codex.

Old plan links still load. Auto-fit fits the whole diagram width; large trees may need manual zoom to inspect.

## September 24 additions

Independent egg and meat sources, species-specific Raw Egg yields, selectable documented diets, seed counts, and optional wild-Lumb harvesting. Lumb harvesting excludes aquatic plants and assumes reachable ripe crops. Travel throughput still needs in-game checks. Some diets have only one modeled option; live prey selection and incidental seed yields remain outside the model. See [Egg Cracker](https://oxygennotincluded.wiki.gg/wiki/Egg_Cracker) and each critter's diet table.

Happiness defaults to 4 (tame, fed and groomed). Fed-only is −1. Supported positive bonuses reach 10, or 12 for Pacu/Beakon. This is a supported-buff limit, not a claim about an engine-wide hard cap or modded games.
