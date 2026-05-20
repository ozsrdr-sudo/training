'use client';

import { useCallback, useMemo, useState } from 'react';
import { blackScholes } from '@/lib/black-scholes';
import { DEFAULT_RISK_FREE_RATE, getPreset, PRESETS } from '@/lib/presets';
import { priceAt as priceAtFn, type PriceAtArgs } from '@/lib/pricing';
import { buildTutorMessage } from '@/lib/tutor';
import type {
  ActiveTab,
  ContractData,
  Point,
  PointsMode,
  PriceResult,
  PricingMode,
  TutorEvent,
  YRangePct,
} from '@/lib/types';

function buildContractData(presetKey: string): { contractName: string; data: ContractData } {
  const p = getPreset(presetKey);
  const r = DEFAULT_RISK_FREE_RATE;
  const g = blackScholes(p.spot, p.strike, p.days / 365, r, p.iv, p.type);
  return {
    contractName: p.name,
    data: {
      spot: p.spot,
      strike: p.strike,
      days: p.days,
      iv: p.iv,
      r,
      type: p.type,
      price0: g.price,
      delta: g.delta,
      theta: g.theta,
      vega: g.vega,
    },
  };
}

export function useSimulator(initialPresetKey: string = PRESETS[0].key) {
  const initial = useMemo(() => buildContractData(initialPresetKey), [initialPresetKey]);

  const [currentPresetKey, setCurrentPresetKey] = useState(initialPresetKey);
  const [contractName, setContractName] = useState(initial.contractName);
  const [original, setOriginal] = useState<ContractData>(initial.data);
  const [state, setState] = useState<ContractData>({ ...initial.data });
  const [points, setPoints] = useState<Point[]>([]);
  const [dIV, setDIV] = useState(0);
  const [mode, setMode] = useState<PricingMode>('linear');
  const [ptsMode, setPtsMode] = useState<PointsMode>('independent');
  const [heatmap, setHeatmap] = useState(true);
  const [yRangePct, setYRangePct] = useState<YRangePct>(30);
  const [activeTab, setActiveTab] = useState<ActiveTab>('greek');
  const [tutorEvent, setTutorEvent] = useState<TutorEvent>('init');

  const loadPreset = useCallback((key: string) => {
    const { contractName: name, data } = buildContractData(key);
    setCurrentPresetKey(key);
    setContractName(name);
    setOriginal(data);
    setState({ ...data });
    setPoints([]);
    setDIV(0);
    setTutorEvent('preset');
  }, []);

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
    (args: Omit<PriceAtArgs, 'mode' | 'dIV' | 'original' | 'state'>): PriceResult | null => {
      return priceAtFn({ ...args, mode, dIV, original, state });
    },
    [mode, dIV, original, state]
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
      }),
    [tutorEvent, original, state, points, dIV, mode, ptsMode, heatmap, yRangePct, contractName]
  );

  return {
    currentPresetKey,
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
    tutorMessage,
    loadPreset,
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
