# Opsiyon Dersi Simülatörü — Proje Spesifikasyonu

> Bu doküman projenin tek-doğru-kaynak (single source of truth) referansıdır. Tasarım kararları, mimari ve davranışsal gereksinimler burada belgelenmiştir. Kod yazarken bu dokümana sadık kalınmalı; uyuşmazlık olursa bu doküman güncellenip sonra kod yazılmalıdır.

## 1. Proje amacı

Türkçe konuşan kullanıcılara opsiyon (options) ticareti kavramlarını — özellikle **Greek'leri (Delta, Theta, Vega)** — interaktif, görsel ve sezgisel bir şekilde öğretmek. Hedef kitle: opsiyon dersi öğrencileri, opsiyon işlemlerine yeni başlayan yatırımcılar.

Uygulama tek sayfalık (single-page) bir simülatördür:
1. Kullanıcı bir hisse seçer (ticker veya şirket adı ile arama, ya da preset).
2. Mevcut opsiyon zincirinden (Yahoo Finance) bir call/put kontrat seçer.
3. Grafik üzerinde tıklayarak "X gün sonra hisse Y dolar olursa ne olur?" senaryoları üretir.
4. Slider'larla Greek'leri (veya Greek'leri etkileyen parametreleri) değiştirip etkilerini canlı gözlemler.

## 2. Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 14 (App Router) |
| Dil | TypeScript |
| Stil | Tailwind CSS + shadcn/ui |
| Grafikler | Chart.js (`react-chartjs-2`) |
| Veri sağlayıcı | `yahoo-finance2` npm paketi |
| Backend | Next.js API Routes (ayrı sunucu yok) |
| Matematik | Kendi yazılmış Black-Scholes (`lib/black-scholes.ts`) |
| Deploy | Vercel |
| DB | **Yok** (v1) — tüm state client-side |
| Dil/lokalizasyon | Türkçe (tek dil, v1) |

## 3. Mimari

```
opsiyon-dersi/
├── app/
│   ├── layout.tsx              # Kök layout (Türkçe lang, dark mode default)
│   ├── page.tsx                # Tek sayfa: simülatör
│   ├── api/
│   │   ├── search/route.ts     # Ticker/şirket adı araması
│   │   ├── quote/route.ts      # Hisse quote (spot, change%)
│   │   └── options/route.ts    # Opsiyon zinciri (expiry → calls/puts)
│   └── globals.css             # Tailwind + dark mode renkler
├── components/
│   ├── SearchBar.tsx           # Ticker arama + preset dropdown
│   ├── ContractSummary.tsx     # Spot/Strike/Prim/BE/Gün/IV kartları
│   ├── ControlBar.tsx          # Mode, senaryo, Y ekseni, ısı, sil
│   ├── PriceChart.tsx          # Üst grafik: S vs t + ısı haritası + noktalar
│   ├── ValueChart.tsx          # Alt grafik: opsiyon değeri/K-Z eğrisi
│   ├── SliderPanel.tsx         # Greek Play / Greek Parametre Play tab'ları
│   ├── TutorBox.tsx            # Dinamik öğretmen yorumu
│   └── GreekExplainer.tsx      # Açılır Greek açıklamaları
├── lib/
│   ├── black-scholes.ts        # BS fiyat, Delta, Theta, Vega hesabı
│   ├── option-symbol.ts        # "META 15JAN27 750 C" → Yahoo sembolü parse
│   ├── yahoo.ts                # yahoo-finance2 wrapper'ı (cache dahil)
│   └── types.ts                # OptionContract, Greeks, Point, AppState
├── hooks/
│   └── useSimulator.ts         # Tüm state ve hesap mantığı (tek hook)
├── SPEC.md                     # Bu doküman
├── prototype.html              # v3 prototipi referans (silinmez)
└── README.md
```

## 4. Veri katmanı

### 4.1 Yahoo Finance entegrasyonu

`yahoo-finance2` paketi kullanılır. API route'larında server-side çağrı yapılır (CORS engelinden kaçınmak için).

**`/api/search?q=META`** — ticker veya şirket adı arar. `yahooFinance.search(q)` kullan, sonuçları `{symbol, shortname, exchange}` formatına filtrele. Sadece equity sonuçlarını dön.

**`/api/quote?symbol=META`** — `yahooFinance.quote(symbol)` ile spot, regularMarketChange, regularMarketChangePercent al.

**`/api/options?symbol=META&expiry=YYYY-MM-DD`** — `yahooFinance.options(symbol, { date: expiry })` ile opsiyon zinciri al. Expiry verilmezse mevcut expiry listesini dön.

**Cache stratejisi:**
- Quote: 60 saniye in-memory
- Options chain: 5 dakika in-memory (key: `symbol|expiry`)
- Tüm cache `lib/yahoo.ts` içinde `Map` ile yönetilir

**Hata durumları:**
- Yahoo erişilemez → kullanıcıya hata mesajı + "Preset bir kontrat ile dene" butonu
- Yahoo opsiyon priminin `lastPrice`'ı null gelirse → bid/ask ortalamasını kullan, o da yoksa "Veri yok, manuel gir" UI'ı göster
- Rate limit (429) → 30 saniye geri çekilme, sonra tekrar dene

### 4.2 IBKR formatı parse (opsiyonel ekleme)

URL'de `?symbol=MSTR 15JAN27 165 C` gibi IBKR formatlı bir parametre gelirse `lib/option-symbol.ts:parseIbkrOption` ile parçala (underlying, expiry, strike, right) ve Yahoo sembolüne çevir. Bu özellik v1 için **opsiyonel**, ama altyapı hazır olsun.

## 5. Matematik katmanı: Black-Scholes

`lib/black-scholes.ts` içinde temettüsüz Black-Scholes (`q = 0`).

```typescript
export type OptionType = 'C' | 'P';

export interface Greeks {
  price: number;   // Opsiyon teorik fiyatı ($/share)
  delta: number;   // [0, 1] call için, [-1, 0] put için
  theta: number;   // $/gün (zaten 365'e bölünmüş)
  vega: number;    // $/(%1 IV değişimi)
}

export function blackScholes(
  S: number,      // spot
  K: number,      // strike
  T: number,      // yıl cinsinden (gün/365)
  r: number,      // risksiz faiz, ondalık (0.045 = 4.5%)
  sigma: number,  // IV, ondalık (0.32 = 32%)
  type: OptionType
): Greeks
```

**Önemli detaylar:**
- `normCdf` için Abramowitz-Stegun yaklaşımı (prototipte var, aynısı)
- `theta` çıktısı **günlük** olacak şekilde `/365` bölünmüş döner
- `vega` çıktısı **IV'nin yüzde puanı başına** olacak şekilde `/100` bölünmüş döner
- `T <= 0` ise: içsel değer döner, Greek'ler sıfırlanır (vade sonu)

## 6. State yönetimi

Tek bir `useSimulator()` hook'u tüm state'i yönetir. Redux/Zustand gerekmiyor.

```typescript
interface SimulatorState {
  // Veri
  current: ContractRef;          // { symbol, expiry, strike, type }
  original: ContractData;        // İlk yüklenen veriler (referans)
  state: ContractData;           // Kullanıcı slider'larla değiştirdiği değerler
  
  // Senaryo
  points: Point[];               // [{ t: gün, s: hisse }]
  dIV: number;                   // ΔIV slider'ı (lineer mod için)
  
  // UI tercihleri
  mode: 'linear' | 'bs';         // Fiyatlama modu
  ptsMode: 'independent' | 'curve'; // Nokta gösterim
  heatmap: boolean;
  yRangePct: 15 | 30 | 50 | 100;
  activeTab: 'greek' | 'param';
}

interface ContractData {
  spot: number;
  strike: number;
  days: number;
  iv: number;
  r: number;
  type: 'C' | 'P';
  price0: number;
  delta: number;
  theta: number;
  vega: number;
}
```

## 7. UI/UX davranışı

### 7.1 Sayfa düzeni (tek sayfa, dikey akış)

1. **Header** — başlık + preset dropdown
2. **Search bar** (genişletme, v1.1) — ticker/şirket adı arar, autocomplete
3. **Contract summary** — 6 kart (Spot, Strike, Prim, Breakeven, Kalan gün, IV)
4. **Control bar** — Mode, Senaryo, Y ekseni, Isı haritası, Noktaları sil
5. **Tutor box** — dinamik öğretmen yorumu (sticky değil, normal akış)
6. **Price chart** (üst, ana) — S vs t, ısı haritası arka plan, tıklanabilir
7. **Value chart** (alt) — opsiyon değeri zaman serisi, t₀ referans çizgisi, iki eğri (orijinal vs mevcut Greek)
8. **Slider panel** — tab'lı: Greek Play / Greek Parametre Play + Orijinale Dön butonu
9. **Greek explainer** — collapsible, default kapalı

### 7.2 Üç fiyatlama modu

| Mod | Açıklama | Formül |
|-----|----------|--------|
| **Lineer (Greek)** | Greek'ler sabit kabul edilip lineer tahmin | `P ≈ P₀ + Δ·ΔS + Θ·Δt + ν·ΔIV` |
| **Black-Scholes** | Her nokta için sıfırdan yeniden fiyatlama | `bs(S, K, T_remaining/365, r, σ, type)` |

> v3'te "Karşılaştır" üçüncü mod olarak başlatıldı ama kaldırıldı (alt grafikte zaten iki eğri var: orijinal gri + mevcut yeşil, bu zaten karşılaştırma). v1'de sadece iki mod.

### 7.3 İki slider modu

**Greek Play tab'ı:**
- Δ slider [0, 1], step 0.01
- Θ slider [-0.50, 0], step 0.01
- ν slider [0, 2], step 0.01
- **ΔIV sim slider [-0.20, 0.20], step 0.01** — Vega'nın etkisini görmek için (kritik!)
- Slider'lar `state.delta/theta/vega`'yı doğrudan değiştirir
- Lineer modda kullanılır. BS modunda etkisi yok (BS Greek'leri kendi hesaplar).

**Greek Parametre Play tab'ı:**
- S spot, σ IV, T gün, r faiz slider'ları
- Slider değişince `recalcFromParams()` çağrılır: BS yeniden hesaplanır, `state.delta/theta/vega/price0` güncellenir
- Δ/Θ/ν hesaplanmış değerleri readonly kutularda gösterilir

**Orijinale Dön butonu:** `state = { ...original }; dIV = 0;` — tüm değerler ilk yüklenene reset.

Her slider'ın altında **kısa açıklama metni** vardır (örn. "Hisse $1 hareket ettiğinde primin kaç dolar hareket eder").

### 7.4 Grafik 1: Hisse fiyatı senaryosu (üst)

- **X ekseni:** Zaman, gün cinsinden, 0'dan `state.days`'e
- **Y ekseni:** Hisse fiyatı $, etiket formatı `$755 (+0%)` çift gösterim (mutlak + spot'a göre yüzde)
- **Y range hesabı:** `Math.min(spot·(1-r/100), be·0.9)` ile `Math.max(spot·(1+r/100), be·1.1)` arasında — yani kullanıcı seçimi VE breakeven her zaman görünür
- **Çizgiler:**
  - Spot bugün — düz mavi (#378ADD)
  - Strike — mor kesik (#7F77DD)
  - Breakeven — düz turuncu/sarı (#EF9F27)
- **Isı haritası:** Arka planda 36x26 grid, her hücrenin K/Z değerine göre yeşil (kâr) veya kırmızı (zarar) yarı şeffaf boyama. Mevcut Greek'lere göre hesaplanır. Toggle ile kapatılabilir.
- **Tıklama:** Grafik alanına tıklama bir nokta ekler `{t, s}`. Vade dışına tıklama engelli.
- **Hover:** Sağ üstte canlı `t = Xg / S = $Y (+Z%) / Prim ≈ $W / K/Z: ±$V` gösterimi.
- **Senaryo eğrisi modu:** Noktalar t'ye göre sıralanıp mor kesik çizgi ile birleştirilir.

### 7.5 Grafik 2: Opsiyon değeri (alt)

- **X ekseni:** Zaman, gün
- **Y ekseni:** Opsiyon değeri $ — otomatik aralık (tüm noktalar + t₀ çizgisi sığar)
- **İki eğri:**
  - Gri kesik (#888780): Orijinal Greek'lerle hesaplanmış değer (sabit referans)
  - Yeşil düz (#1D9E75): Mevcut Greek'lerle hesaplanmış değer (slider'lardan)
- **t₀ referans çizgisi:** Turuncu kesik yatay çizgi (#D85A30) `y = original.price0` seviyesinde, sağ uçta etiket "t₀ maliyet: $X.XX"
- **Tooltip:** Bir noktanın üzerinde `Opsiyon değeri: $X (K/Z ±$Y)`
- **Boş durum:** Henüz nokta yoksa "Önce yukarıdaki grafiğe tıkla" mesajı, eğriler boş.

### 7.6 Tutor box (öğretmen yorumu)

Dinamik içerik. Her etkileşim tipinde farklı metin:
- `point_added` — yeni nokta için K/Z ve ITM/OTM açıklaması
- `delta`, `theta`, `vega`, `div` — slider değişimleri için
- `spot`, `iv`, `t`, `r` — parametre değişimleri için, BS sonucu Greek'lerin nasıl değiştiğini açıklar
- `mode` — mod değişimleri
- `reset` — orijinale dönüş
- Varsayılan: kontrat özeti

Toplam ~15 yorum kuralı, hepsi `useSimulator` veya ayrı `tutor.ts` modülünde.

### 7.7 Tasarım sistemi

- **Dark mode default**, light mode de çalışmalı (Tailwind `dark:` prefix kullan)
- **Renkler:**
  - Kâr: yeşil (`#10b981` / `#1D9E75`)
  - Zarar: kırmızı (`#ef4444` / `#E24B4A`)
  - Strike: mor (`#7F77DD`)
  - Spot: mavi (`#378ADD`)
  - Breakeven: turuncu (`#EF9F27`)
  - t₀ maliyet: turuncu-kırmızı (`#D85A30`)
  - Orijinal eğri: gri (`#888780`)
  - Mevcut eğri: yeşil (`#1D9E75`)
- **Yazı tipleri:** Sistem sans-serif (Inter benzeri), mono font sayısal değerler için
- **Border radius:** 8px (md), 12px (lg)
- **Spacing:** rem tabanlı (1, 1.25, 1.5)
- **Desktop-first**, mobil sonra (v2)

## 8. Çıkmaz sokaklar / yapmayacaklarımız (v1)

- ❌ Kullanıcı girişi / auth — yok
- ❌ Veritabanı — yok, supabase v2
- ❌ Senaryo kaydetme / paylaşma — yok
- ❌ Spread veya çoklu-bacak stratejiler (covered call, vertical spread vb.) — yok, sadece tek bacak (single leg)
- ❌ Gamma, Rho ekranda — yok (lib'de hesaplanabilir ama UI'da gösterilmez)
- ❌ Temettü (q) — yok, sabit 0
- ❌ Amerikan opsiyon erken egzersizi — yok, Avrupa-tarzı Black-Scholes
- ❌ Mobil optimizasyonu — v2
- ❌ Çoklu dil — sadece Türkçe v1

## 9. Deploy ve env

**Deploy hedefi:** Vercel.
**Domain:** Vercel'in verdiği subdomain (custom domain v2).

**Env değişkenleri (.env.local):**
- `YAHOO_USER_AGENT=Mozilla/5.0 ...` — opsiyonel, Yahoo bazen UA'ya bakıyor

Vercel'de `next dev` ve `next build` standart akış. `node` 20+ gerekli.

## 10. Test stratejisi (v1 için minimum)

- `lib/black-scholes.ts` için birim testleri (Jest):
  - Bilinen değerlere göre referans: örn. `bs(100, 100, 1, 0.05, 0.20, 'C').price ≈ 10.45`
  - Put-call parity: `C - P = S - K·e^(-rT)`
- API route'ları manuel test (curl)
- UI etkileşimleri: manuel smoke test (preset değiştirme, nokta ekleme, slider'lar)

## 11. Sıradaki adımlar (v1 sonrası)

1. **Arama özelliği** — ticker/şirket adı autocomplete
2. **Opsiyon zinciri ekranı** — kontrat tablosu, satır seçme
3. **Senaryo paylaşımı** — URL'e state encode et
4. **Mobil layout**
5. **Spread'ler** — iki bacaklı stratejiler
6. **Supabase** — kullanıcı senaryoları kaydet
7. **i18n** — İngilizce

---

**Doküman versiyonu:** 1.0
**Son güncelleme:** Mayıs 2026
**Referans prototipi:** `prototype.html` (v3)
