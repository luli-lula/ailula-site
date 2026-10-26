// lula's visits, read from src/data/footprints.json (edited with /map/edit/ while developing).
import footprints from '../data/footprints.json';
import { toVisits } from './footprint';

export const visits = () => toVisits(footprints);
