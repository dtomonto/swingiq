import type {
  SwingIQSlice,
  SwingIQStore,
  TennisRacket,
  BaseballBat,
  SoftballBat,
} from '../types';
import { DEFAULT_SPORT_EQUIPMENT, newId } from '../types';

export const createEquipmentSlice: SwingIQSlice<
  Pick<
    SwingIQStore,
    | 'sportEquipment'
    | 'addTennisRacket'
    | 'removeTennisRacket'
    | 'addBaseballBat'
    | 'removeBaseballBat'
    | 'addSoftballBat'
    | 'removeSoftballBat'
  >
> = (set) => ({
  sportEquipment: DEFAULT_SPORT_EQUIPMENT,

  addTennisRacket: (racket) => {
    const item: TennisRacket = { ...racket, id: newId('racket'), created_at: new Date().toISOString() };
    set((s) => ({ sportEquipment: { ...s.sportEquipment, tennis: [...s.sportEquipment.tennis, item] } }));
  },
  removeTennisRacket: (id) =>
    set((s) => ({ sportEquipment: { ...s.sportEquipment, tennis: s.sportEquipment.tennis.filter((r) => r.id !== id) } })),

  addBaseballBat: (bat) => {
    const item: BaseballBat = { ...bat, id: newId('bat'), created_at: new Date().toISOString() };
    set((s) => ({ sportEquipment: { ...s.sportEquipment, baseball: [...s.sportEquipment.baseball, item] } }));
  },
  removeBaseballBat: (id) =>
    set((s) => ({ sportEquipment: { ...s.sportEquipment, baseball: s.sportEquipment.baseball.filter((b) => b.id !== id) } })),

  addSoftballBat: (sport, bat) => {
    const item: SoftballBat = { ...bat, id: newId('sbat'), created_at: new Date().toISOString() };
    set((s) => ({ sportEquipment: { ...s.sportEquipment, [sport]: [...s.sportEquipment[sport], item] } }));
  },
  removeSoftballBat: (sport, id) =>
    set((s) => ({ sportEquipment: { ...s.sportEquipment, [sport]: s.sportEquipment[sport].filter((b: SoftballBat) => b.id !== id) } })),
});
