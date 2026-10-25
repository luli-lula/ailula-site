// Everything in the valley besides the sequoia, in build order.
import type { PartBuilder } from './createValley';
import { createFlora } from './flora';
import { createIsland } from './island';
import { createParticles } from './particles';
import { createStructures } from './structures';

export const VALLEY_PARTS: PartBuilder[] = [createIsland, createFlora, createStructures, createParticles];
