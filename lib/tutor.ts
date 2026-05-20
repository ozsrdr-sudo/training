import { priceAt } from './pricing';
import type { ContractData, Point, PricingMode, PointsMode, TutorEvent, YRangePct } from './types';

export interface TutorContext {
  event: TutorEvent;
  original: ContractData;
  state: ContractData;
  points: Point[];
  dIV: number;
  mode: PricingMode;
  ptsMode: PointsMode;
  heatmap: boolean;
  yRangePct: YRangePct;
  contractName: string;
  contracts: number;
}

function fmt(n: number, d = 2): string {
  return n.toFixed(d);
}

function sign(n: number): string {
  return n >= 0 ? '+' : '';
}

export function buildTutorMessage(ctx: TutorContext): string {
  const { event, original, state, points, dIV, mode, contractName, contracts } = ctx;

  switch (event) {
    case 'point_added': {
      if (points.length === 0) return defaultMsg(ctx);
      const last = points[points.length - 1];
      const rO = priceAt({ S_new: last.s, days_passed: last.t, useOriginal: true, mode, dIV, original, state, contracts });
      const rC = priceAt({ S_new: last.s, days_passed: last.t, useOriginal: false, mode, dIV, original, state, contracts });
      if (!rO || !rC) return defaultMsg(ctx);
      const itm = state.type === 'C' ? last.s > state.strike : last.s < state.strike;
      return `<strong>${points.length}. nokta:</strong> t=${last.t}g, S=$${fmt(last.s)} → orijinal Greek'lerle prim $${fmt(rO.price)} (K/Z ${sign(rO.pnl)}$${rO.pnl.toFixed(0)}). Pozisyon ${itm ? 'ITM' : 'OTM'}.`;
    }

    case 'point_cleared':
      return `<strong>Noktalar silindi.</strong> Üst grafiğe tıklayarak yeni senaryolar ekle.`;

    case 'delta':
      return `<strong>Delta değişti:</strong> ${fmt(original.delta)} → ${fmt(state.delta)}. Hisse $1 hareket ettiğinde prim ≈ $${fmt(state.delta)} hareket eder.`;

    case 'theta':
      return `<strong>Theta değişti:</strong> ${fmt(original.theta)} → ${fmt(state.theta)}/gün. Her geçen gün primden $${Math.abs(state.theta).toFixed(2)} erir.`;

    case 'vega':
      return `<strong>Vega değişti:</strong> ${fmt(original.vega)} → ${fmt(state.vega)}. IV %1 değiştiğinde prim $${fmt(state.vega)} hareket eder. Etkiyi görmek için ΔIV slider'ını oynat.`;

    case 'div': {
      const impact = state.vega * dIV * 100;
      return `<strong>IV ${sign(dIV)}${(dIV * 100).toFixed(0)}% senaryosu:</strong> Lineer modda prim ≈ $${fmt(impact)} hareket eder. BS modunda eğri yeniden hesaplanır.`;
    }

    case 'spot':
      return `<strong>Spot $${fmt(state.spot, 0)}:</strong> Greek'ler yeniden hesaplandı — Δ=${fmt(state.delta)}, ν=${fmt(state.vega)}.`;

    case 'iv':
      return `<strong>IV ${(state.iv * 100).toFixed(0)}%:</strong> Yüksek IV = pahalı opsiyon. Yeni prim $${fmt(state.price0)}, ν=${fmt(state.vega)}.`;

    case 't':
      return `<strong>${state.days} gün kaldı:</strong> Vade kısaldıkça Theta büyür. Yeni Θ=${fmt(state.theta)}/gün.`;

    case 'r':
      return `<strong>Faiz ${(state.r * 100).toFixed(1)}%:</strong> Risksiz faiz Call primlerini hafif artırır, Put'ları azaltır.`;

    case 'reset':
      return `<strong>Orijinale döndün.</strong> Δ=${fmt(original.delta)}, Θ=${fmt(original.theta)}, ν=${fmt(original.vega)}, ΔIV=0.`;

    case 'mode':
      return mode === 'linear'
        ? `<strong>Lineer mod:</strong> Prim ≈ P₀ + Δ·ΔS + Θ·Δt + ν·ΔIV. Greek'ler sabit varsayılır — küçük hareketlerde doğru, büyük hareketlerde yanıltıcı.`
        : `<strong>Black-Scholes mod:</strong> Her nokta için sıfırdan yeniden fiyatlama. Greek'ler hisseye/zamana göre değişir; eğri doğrusal değil.`;

    case 'pts_mode':
      return ctx.ptsMode === 'curve'
        ? `<strong>Eğri modu:</strong> Noktalar zamana göre sıralanıp birleştirildi — bir senaryo eğrisi gibi.`
        : `<strong>Bağımsız modu:</strong> Her nokta ayrı bir "ya şöyle olursa" senaryosu.`;

    case 'y_range':
      return `<strong>Y ekseni ±%${ctx.yRangePct}:</strong> Görünür hisse aralığı genişledi/daraldı. Breakeven hattı her zaman görünür kalır.`;

    case 'heatmap':
      return ctx.heatmap
        ? `<strong>Isı haritası açık:</strong> Yeşil = kâr, kırmızı = zarar. Arka plan mevcut Greek'lere göre canlı hesaplanır.`
        : `<strong>Isı haritası kapalı:</strong> Sadece çizgiler ve noktalar görünür.`;

    case 'tab':
      return ctx.state === ctx.original
        ? defaultMsg(ctx)
        : `<strong>Sekme değişti.</strong> Greek Play: Δ/Θ/ν doğrudan oynatılır. Param Play: S/σ/T/r değiştirilir, Greek'ler yeniden hesaplanır.`;

    case 'preset':
      return `<strong>${contractName}.</strong> Spot $${fmt(state.spot)}, prim $${fmt(state.price0)}, BE $${fmt(state.strike + state.price0)}, kalan ${state.days}g.`;

    case 'init':
    default:
      return defaultMsg(ctx);
  }
}

function defaultMsg(ctx: TutorContext): string {
  const { state, contractName } = ctx;
  return `<strong>Hoş geldin!</strong> ${contractName}. Spot $${fmt(state.spot)}, prim $${fmt(state.price0)}, BE $${fmt(state.strike + state.price0)}. Grafiğe tıkla, slider'ları oynat.`;
}
