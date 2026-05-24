# Opsiyon Dersi Simülatörü

Türkçe konuşan kullanıcılara opsiyon (options) ticareti kavramlarını — özellikle **Greek'leri (Delta, Theta, Vega)** — interaktif, görsel ve sezgisel bir şekilde öğreten tek sayfalık simülatör.

> ⚠ **Uyarı:** Buradaki veriler yalnızca deneme/eğitim amaçlıdır, geliştirme aşamasındadır; değerler ve hesaplamalarda yanlışlıklar olabilir. Yatırım tavsiyesi değildir.

## Özellikler

- **Canlı Yahoo Finance verisi**: ticker arama → vade seçimi → strike seçimi ile herhangi bir Amerikan opsiyonu yükle
- **Kontrat adedi**: 1–9999, tüm K/Z hesapları otomatik adetle çarpılır
- **İki fiyatlama modu**: Lineer (Greek'lerle yaklaşık) ve Black-Scholes (sıfırdan yeniden fiyatlama)
- **Üç grafik etkileşimi**: tıklayarak senaryo noktası ekle, hover ile canlı prim/K-Z, ısı haritası
- **Greek slider'ları**: Δ/Θ/ν canlı oynatılabilir (Lineer modda etkili, BS'te readonly)
- **Parametre slider'ları**: S/σ/T/r → Greek'ler BS ile yeniden hesaplanır
- **Dinamik öğretmen kutusu**: her etkileşimde bağlama uygun açıklama

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Chart.js (doğrudan `Chart` instance + custom plugin)
- `yahoo-finance2` v3 (server-side, in-memory cache)
- Black-Scholes kendi yazıldı (`lib/black-scholes.ts`, Abramowitz-Stegun normCdf)
- Jest birim testleri (Hull referans değerleri + put-call parity)

## Geliştirme

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # Black-Scholes Jest testleri
npm run lint
npm run build
```

## API Route'ları

| Endpoint | Açıklama |
|----------|----------|
| `GET /api/search?q=<query>` | Ticker/şirket adı autocomplete (10 dk cache) |
| `GET /api/quote?symbol=<sym>` | Spot fiyat, değişim % (60 sn cache) |
| `GET /api/options?symbol=<sym>` | Vade tarihi listesi (5 dk cache) |
| `GET /api/options?symbol=<sym>&expiry=<YYYY-MM-DD>` | İlgili vadenin calls/puts zinciri |
| `POST /api/track` | Ziyaret sayar, IP'yi tekil set'e ekler (KV varsa) |

429 (rate-limit) yiyince 30 sn otomatik backoff.

## Ziyaret istatistikleri (opsiyonel)

Anasayfa açıldığında client tarafı `/api/track`'a sessiz bir POST atar. Toplam ziyaret ve tekil IP sayısı **kullanıcıya gösterilmez**; veri **Upstash Redis** (Vercel Marketplace) üzerinde saklanır ve sadece `/stats` admin sayfasından okunur.

**Kurulum:**

1. Vercel proje sayfası → **Storage** → **Create Database** → Marketplace'ten **Upstash Redis** seç → projeyi bağla.
2. Entegrasyon `KV_REST_API_URL` ve `KV_REST_API_TOKEN` env değişkenlerini otomatik ekler.
3. (Opsiyonel) `STATS_KEY` env'i set edersen `/stats` sayfası `?key=<değer>` ister, yoksa 404 döner. Set etmezsen sayfa unlisted ama açık olur.
4. Bir sonraki deploy'da `/stats` (veya `/stats?key=...`) erişilebilir olur. KV yoksa özellik sessizce kapanır.

Aynı sekmede çift sayım olmasın diye client `sessionStorage` flag'i kullanır. Anahtarlar: `visits:total` (INCR sayaç) ve `visits:ips` (SADD tekil IP set'i).

## Vercel Deploy

```bash
npm install -g vercel
vercel              # ilk seferinde proje oluştur
vercel --prod       # production
```

Zorunlu env değişkeni yok; Yahoo Finance public, oturum açma gerekmiyor.

## Klasör yapısı

```
app/
  api/{search,quote,options}/route.ts
  layout.tsx, page.tsx, globals.css
components/
  charts/{PriceChart,ValueChart,chartSetup}.tsx
  ui/{Card,ToggleGroup}.tsx
  ContractPicker.tsx, ContractSummary.tsx, ControlBar.tsx,
  GreekExplainer.tsx, SliderPanel.tsx, SymbolSearch.tsx, TutorBox.tsx
hooks/useSimulator.ts        # tek hook'ta tüm state ve aksiyonlar
lib/
  black-scholes.ts + .test.ts
  pricing.ts, tutor.ts, types.ts, format.ts, constants.ts, yahoo.ts
docs/
  SPEC.md (tek-doğru-kaynak), prototype.html (v3 referans), CLAUDE_CODE_PROMPT.md
```

## Tasarım kararları

- **BS modunda Δ/Θ/ν ve S spot kilitli**: Bunlar BS hesabının *çıktısı*, girdisi değil. Slider'la oynatmak görsel yanılsama yaratır → disabled, açıklayıcı bilgi kutusu.
- **ΔIV slider'ı her iki modda etkili**: BS'te `state.iv + dIV` ile fiyatlama, Lineer'de `ν × ΔIV × 100`.
- **K/Z grafiği maliyete oran %'si**: pnl/(price0 × 100 × contracts). Kontrat adedi artarsa $ değeri büyür, % sabit kalır.
- **Heatmap doygunluk eşiği**: `max(price0 × 100 × contracts, 500)` — yüksek strike/düşük prim kontratlarında hep okunabilir renkler.
- **Hisse fiyatı 0'a kilitli**: Y range alt sınırı negatif olamaz.
- **Put delta range**: `[-1, 0]` (BS doğru output). Call ile çakışmadan slider min/max state.type'a göre.

## v1 dışı / yapılmayanlar

- Kullanıcı girişi / DB yok
- Spread / çoklu bacak yok
- Gamma, Rho ekranda yok (lib'de hesaplanabilir)
- Mobil optimizasyon yok
- Tek dil: Türkçe
