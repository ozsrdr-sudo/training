export type OptionType = 'C' | 'P';

export interface Greeks {
  price: number;
  delta: number;
  theta: number;
  vega: number;
}

export interface OptionContract {
  symbol: string;
  expiry: string;
  strike: number;
  type: OptionType;
}

export interface Point {
  t: number;
  s: number;
}

export interface ContractData {
  spot: number;
  strike: number;
  days: number;
  iv: number;
  r: number;
  type: OptionType;
  price0: number;
  delta: number;
  theta: number;
  vega: number;
}

export type PricingMode = 'linear' | 'bs';
export type PointsMode = 'independent' | 'curve';
export type YRangePct = 15 | 30 | 50 | 100;
export type ActiveTab = 'greek' | 'param';

export interface SimulatorState {
  currentPresetKey: string;
  contractName: string;
  original: ContractData;
  state: ContractData;
  points: Point[];
  dIV: number;
  mode: PricingMode;
  ptsMode: PointsMode;
  heatmap: boolean;
  yRangePct: YRangePct;
  activeTab: ActiveTab;
}

export interface PriceResult {
  price: number;
  pnl: number;
}

export type TutorEvent =
  | 'init'
  | 'preset'
  | 'point_added'
  | 'point_cleared'
  | 'delta'
  | 'theta'
  | 'vega'
  | 'div'
  | 'spot'
  | 'iv'
  | 't'
  | 'r'
  | 'mode'
  | 'pts_mode'
  | 'y_range'
  | 'heatmap'
  | 'tab'
  | 'reset';
