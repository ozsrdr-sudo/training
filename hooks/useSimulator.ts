'use client';

import { useCallback, useMemo, useState } from 'react';
import { blackScholes } from '@/lib/black-scholes';
import { DEFAULT_RISK_FREE_RATE, EMPTY_CONTRACT_NAME } from '@/lib/constants';
import { priceAt as priceAtFn, type PriceAtArgs } from '@/lib/pricing';
import { buildTutorMessage } from '@/lib/tutor';
import type {
  ActiveTab,
  ContractData,
  OptionType,
  Point,
  PointsMode,
  PriceResult,
  PricingMode,
  TutorEvent,
  YRangePct,
} from '@/lib/types';

const EMPTY_CONTRACT: ContractData = {
  spot: 0,
  strike: 0,
  days: 0,
  iv: 0,
  r: DEFAULT_RISK_FREE_RATE,
  type: 'C',
  price0: 0,
  delta: 0,
  theta: 0,
  vega: 0,
};

export function useSimulator() {
  const [hasContract, setHasContract] = useState(false);
  const [contractName, setContractName] = useState(EMPTY_CONTRACT_NAME);
  const [original, setOriginal] = useState<ContractData>(EMPTY_CONTRACT);
  const [state, setState] = useState<ContractData>(EMPTY_CONTRACT);
  const [points, setPoints] = useState<Point[]>([]);
  const [dIV, setDIV] = useState(0);
  const [mode, setMode] = useState<PricingMode>('linear');
  const [ptsMode, setPtsMode] = useState<PointsMode>('independent');
  const [heatmap, setHeatmap] = useState(true);
  const [yRangePct, setYRangePct] = useState<YRangePct>(100);
  const [activeTab, setActiveTab] = useState<ActiveTab>('greek');
  const [contracts, setContracts] = useState<number>(1);
  const [tutorEvent, setTutorEvent] = useState<TutorEvent>('init');

  const loadCustomContract = useCallback(
    (params: {
      name: string;
      spot: number;
      strike: number;
      days: number;
      iv: number;
      type: OptionType;
      r?: number;
    }) => {
      const r = params.r ?? DEFAULT_RISK_FREE_RATE;
      const g = blackScholes(params.spot, params.strike, params.days / 365, r, params.iv, params.type);
      const data: ContractData = {
        spot: params.spot,
        strike: params.strike,
        days: params.days,
        iv: params.iv,
        r,
        type: params.type,
        price0: g.price,
        delta: g.delta,
        theta: g.theta,
        vega: g.vega,
      };
      setHasContract(true);
      setContractName(params.name);
      setOriginal(data);
      setState({ ...data });
      setPoints([]);
      setDIV(0);
      setTutorEvent('preset');
    },
    []
  );

  const reset = useCallback(() => {
    setState({ ...original });
    setDIV(0);
    setTutorEvent('reset');
  }, [original]);

  const addPoint = useCallback((t: number, s: number) => {
    setPoints((prev) => [...prev, { t: Math.round(t), s: parseFloat(s.toFixed(2)) }]);
    setTutorEvent('point_added');
  }, []);

  const clearPoints = useCallback(() => {
    setPoints([]);
    setTutorEvent('point_cleared');
  }, []);

  const setDelta = useCallback((v: number) => {
    setState((s) => ({ ...s, delta: v }));
    setTutorEvent('delta');
  }, []);
  const setTheta = useCallback((v: number) => {
    setState((s) => ({ ...s, theta: v }));
    setTutorEvent('theta');
  }, []);
  const setVega = useCallback((v: number) => {
    setState((s) => ({ ...s, vega: v }));
    setTutorEvent('vega');
  }, []);
  const setDIVWithEvent = useCallback((v: number) => {
    setDIV(v);
    setTutorEvent('div');
  }, []);

  const recalcAndSet = useCallback((patch: Partial<ContractData>, ev: TutorEvent) => {
    setState((s) => {
      const next = { ...s, ...patch };
      const g = blackScholes(next.spot, next.strike, next.days / 365, next.r, next.iv, next.type);
      return { ...next, price0: g.price, delta: g.delta, theta: g.theta, vega: g.vega };
    });
    setTutorEvent(ev);
  }, []);

  const setSpot = useCallback((v: number) => recalcAndSet({ spot: v }, 'spot'), [recalcAndSet]);
  const setIV = useCallback((v: number) => recalcAndSet({ iv: v }, 'iv'), [recalcAndSet]);
  const setDays = useCallback((v: number) => recalcAndSet({ days: v }, 't'), [recalcAndSet]);
  const setR = useCallback((v: number) => recalcAndSet({ r: v }, 'r'), [recalcAndSet]);

  const setModeWithEvent = useCallback((m: PricingMode) => {
    setMode(m);
    setTutorEvent('mode');
  }, []);
  const setPtsModeWithEvent = useCallback((m: PointsMode) => {
    setPtsMode(m);
    setTutorEvent('pts_mode');
  }, []);
  const setHeatmapWithEvent = useCallback((v: boolean) => {
    setHeatmap(v);
    setTutorEvent('heatmap');
  }, []);
  const setYRangeWithEvent = useCallback((v: YRangePct) => {
    setYRangePct(v);
    setTutorEvent('y_range');
  }, []);
  const setActiveTabWithEvent = useCallback((t: ActiveTab) => {
    setActiveTab(t);
    setTutorEvent('tab');
  }, []);

  const priceAt = useCallback(
    (args: Omit<PriceAtArgs, 'mode' | 'dIV' | 'original' | 'state' | 'contracts'>): PriceResult | null => {
      if (!hasContract) return null;
      return priceAtFn({ ...args, mode, dIV, original, state, contracts });
    },
    [hasContract, mode, dIV, original, state, contracts]
  );

  const tutorMessage = useMemo(
    () =>
      buildTutorMessage({
        event: tutorEvent,
        original,
        state,
        points,
        dIV,
        mode,
        ptsMode,
        heatmap,
        yRangePct,
        contractName,
        contracts,
      }),
    [tutorEvent, original, state, points, dIV, mode, ptsMode, heatmap, yRangePct, contractName, contracts]
  );

  return {
    hasContract,
    contractName,
    original,
    state,
    points,
    dIV,
    mode,
    ptsMode,
    heatmap,
    yRangePct,
    activeTab,
    contracts,
    setContracts,
    tutorMessage,
    loadCustomContract,
    reset,
    addPoint,
    clearPoints,
    setDelta,
    setTheta,
    setVega,
    setDIV: setDIVWithEvent,
    setSpot,
    setIV,
    setDays,
    setR,
    setMode: setModeWithEvent,
    setPtsMode: setPtsModeWithEvent,
    setHeatmap: setHeatmapWithEvent,
    setYRangePct: setYRangeWithEvent,
    setActiveTab: setActiveTabWithEvent,
    priceAt,
  };
}

export type UseSimulator = ReturnType<typeof useSimulator>;
