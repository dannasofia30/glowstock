import { REORDEN_GLOBAL } from '../config/intertiendas';

export function esCritico(stockTotal: number): boolean {
  return stockTotal <= REORDEN_GLOBAL;
}