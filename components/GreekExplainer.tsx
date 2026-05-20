'use client';

export function GreekExplainer() {
  return (
    <details className="bg-bg-secondary rounded-md px-3.5 py-3 mt-4">
      <summary className="cursor-pointer text-sm font-medium">Greek&apos;ler nedir? (Tıkla, aç)</summary>
      <div className="mt-3 text-[13px] leading-relaxed space-y-3">
        <p>
          <strong>Delta (Δ):</strong> Dayanak varlık fiyatındaki 1 birimlik değişimin opsiyon fiyatını ne kadar etkileyeceğini gösterir. 0 ile 1 arasında değer alır. Alım opsiyonlarında pozitiftir.
        </p>
        <p>
          <strong>Theta (Θ):</strong> Vade tarihine kadar geçen her bir günde opsiyonun zaman değerinden ne kadar kaybedeceğini gösterir. Süre kısaldıkça erime hızlanır.
        </p>
        <p>
          <strong>Vega (ν):</strong> Zımni volatilitenin %1 artması durumunda opsiyon priminin ne kadar değer kazanacağını ölçer. Bilanço gibi kritik dönemlerde belirleyici.
        </p>
      </div>
    </details>
  );
}
