# Claude Code'a Verilecek İlk Komut

Bu dosyayı sırasıyla okuyun, alttaki adımları takip edin.

---

## ADIM 1 — Claude Code'u kurun (zaten kuruluysa atlayın)

Terminal'de:

```bash
npm install -g @anthropic-ai/claude-code
```

Test edin:

```bash
claude --version
```

> Windows kullanıyorsanız WSL içinden çalıştırmanız gerekiyor. Mac/Linux'ta doğrudan terminalden çalışır.

---

## ADIM 2 — Yeni proje klasörünü hazırlayın

Terminal'de boş bir klasör oluşturup içine geçin:

```bash
mkdir ~/projects/opsiyon-dersi
cd ~/projects/opsiyon-dersi
```

Bu starter paketteki dosyaları klasöre kopyalayın:

```bash
# starter zip'i indirdiğiniz yerden
cp /path/to/SPEC.md .
cp /path/to/prototype.html .
```

Git başlatın (opsiyonel ama önerilen):

```bash
git init
echo "node_modules\n.next\n.env.local\n.DS_Store" > .gitignore
```

---

## ADIM 3 — Claude Code'u başlatın

Proje klasörünün içinde:

```bash
claude
```

İlk açılışta hesabınızla giriş yapmanız istenir, talimatları takip edin.

---

## ADIM 4 — İlk prompt

Claude Code açılınca aşağıdaki bloğu **olduğu gibi** kopyalayıp yapıştırın:

```
Bu projede senden Türkçe konuşan kullanıcılar için bir opsiyon dersi simülatörü kurmanı istiyorum. Tüm tasarım kararları, mimari ve davranışsal gereksinimler SPEC.md dosyasında detaylıca belgelendi. UI/UX referansı prototype.html dosyasında çalışır halde — bu prototip vanilla HTML/JS, sen bunu Next.js + TypeScript + Tailwind + Chart.js yapısına çeviriyor olacaksın.

Lütfen şu sırayla ilerle:

1. ÖNCE: SPEC.md dosyasını baştan sona oku. Sonra prototype.html'i tarayıcıda açmaya gerek olmadan kodunu oku ve davranışını anlamaya çalış. Belirsiz noktalar varsa bana sorular sor — kod yazmadan önce.

2. SONRA: Bana planı özetle. Hangi dosyaları oluşturacaksın, hangi paketleri kuracaksın, hangi sırayla. Onay verince başla.

3. UYGULAMA SIRASI önerim:
   a) Next.js 14 projesini App Router ile kur (TypeScript, Tailwind dahil). shadcn/ui'yi ekle.
   b) lib/black-scholes.ts'i yaz ve Jest ile birim testlerini ekle (put-call parity, bilinen referans değerler).
   c) lib/types.ts ile tüm tipleri (OptionContract, Greeks, Point, AppState) tanımla.
   d) lib/yahoo.ts ile yahoo-finance2 wrapper'ını (cache dahil) yaz.
   e) API route'larını yaz: /api/search, /api/quote, /api/options. Manuel olarak curl ile test et.
   f) Komponentleri yaz: ContractSummary, ControlBar, SliderPanel, TutorBox, GreekExplainer. Her birini ayrı commit yap.
   g) En kritik kısım: PriceChart ve ValueChart. Chart.js'i React'te react-chartjs-2 ile sar. Isı haritası için Chart.js plugin'i prototipteki gibi yaz. Tıklama, hover, t0 çizgisi davranışları prototipteki gibi olsun.
   h) useSimulator hook'u ile tüm state'i bağla. Bu hook prototipin script bölümündeki tüm mantığı içerecek.
   i) Preset dropdown ile başla, arama özelliğini sonra ekle. v1 için preset yeterli.
   j) Türkçe metinler her yerde, dark mode default.
   k) Vercel'e deploy için README.md hazırla.

4. KURALLAR:
   - SPEC.md ile uyuşmazlık olursa önce bana sor, kendin karar verme.
   - Her aşamada test et (npm run dev) ve gerçekten çalıştığından emin ol.
   - prototype.html'i SİLME — bu projenin yaşayan referansı. Onun yerine docs/ klasörüne taşı.
   - Yahoo Finance rate limit'lerine dikkat — agresif cache kullan.
   - Black-Scholes hesabını test etmeden ilerleme; küçük bir matematik hatası tüm uygulamayı yanıltır.
   - Türkçe metin yazarken: doğal Türkçe kullan, "Greek'ler" gibi yerleşmiş İngilizce terimleri bırak, ama "click" yerine "tıkla", "submit" yerine "gönder" gibi olanları çevir.

Önce SPEC.md ve prototype.html'i oku, sonra planını sun. Hadi başla.
```

---

## ADIM 5 — İterasyon

Claude Code planını sunduktan sonra:
- Plan tamamsa onayla, başlasın.
- Bir şeyleri değiştirmek istersen söyle, planı revize etsin.

Çalıştığı sırada **yaptığı her tool çağrısını izleyebilirsin** — yanlış bir şey yaparsa Ctrl+C ile durdur, düzelt, devam et.

Tipik akış:
1. Plan onayı → kurulum
2. Black-Scholes + testler → çalıştığını gör
3. API route'lar → curl ile test
4. Komponentler → `npm run dev` ile görsel kontrol
5. Tüm parçalar bağlanınca → uçtan uca test
6. Vercel deploy

---

## ADIM 6 — Vercel'e deploy

Proje hazır olduğunda:

```bash
npm install -g vercel
vercel
```

Vercel sorularına cevap ver, ilk deploy birkaç dakika.

---

## ÖNEMLİ İPUÇLARI

- **Claude Code'a tek seferde çok şey yaptırma.** Her büyük adımdan sonra dur, çalıştır, gör, sonra devam et.
- **SPEC.md'yi tek-doğru-kaynak tut.** Bir özelliği değiştirmek istediğinde önce SPEC.md'yi güncelle, sonra Claude Code'a "SPEC.md'yi okuyup şu bölümü uygulamayı güncelle" de.
- **Git commit'lerini sık at.** Claude Code yanlış yaparsa `git reset --hard HEAD` ile geri dön.
- **Yahoo Finance test ederken** dikkatli ol — çok sık istek atarsan rate limit yersin. `cache` çalıştığını doğrula.
- **Black-Scholes testleri kritik.** Bilinen referans değerlerle eşleşmiyorsa hiçbir şey doğru çalışmaz.

İyi şanslar!
