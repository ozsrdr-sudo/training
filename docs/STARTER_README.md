# Opsiyon Dersi Simülatörü — Starter Paketi

Bu paket, Claude Code ile geliştirmeye hazır olan **Opsiyon Dersi Simülatörü** projesinin başlangıç dosyalarını içerir.

## Dosyalar

| Dosya | Ne işe yarar |
|-------|---------------|
| `SPEC.md` | Projenin **tek-doğru-kaynak** spesifikasyonu. Stack, mimari, davranışlar, kararlar. Claude Code bunu okuyacak. |
| `prototype.html` | Tarayıcıda doğrudan açıp çalıştırabileceğin **v3 prototipi**. Tüm UI ve hesaplama mantığı çalışır halde — Yahoo Finance hariç. |
| `CLAUDE_CODE_PROMPT.md` | Claude Code'a verilecek **ilk talimat** ve kurulum adımları. |
| `README.md` | Bu dosya. |

## Nasıl başlanır?

1. **prototype.html'i tarayıcıda aç** — tasarımın son halini gör, test et.
2. **CLAUDE_CODE_PROMPT.md'yi oku** — adım adım kurulum + ilk prompt.
3. **SPEC.md'yi referans olarak kullan** — sorular çıkarsa cevap orada.

## Hızlı başlangıç

```bash
# Claude Code'u kur
npm install -g @anthropic-ai/claude-code

# Yeni proje klasörü
mkdir ~/projects/opsiyon-dersi && cd ~/projects/opsiyon-dersi

# Bu paketteki dosyaları kopyala
cp /path/to/SPEC.md .
cp /path/to/prototype.html .

# Claude Code'u başlat
claude

# CLAUDE_CODE_PROMPT.md'deki "ADIM 4 — İlk prompt" bölümünü kopyala-yapıştır
```

## Bilinmesi gerekenler

- v1'de **veritabanı yok**, kullanıcı kaydı yok, tek dil (Türkçe).
- **Yahoo Finance** veri kaynağı (`yahoo-finance2` npm paketi, server-side).
- **Black-Scholes** kendimiz hesaplıyoruz (temettüsüz, Avrupa-tarzı).
- **Üç preset kontrat** ile başla: META 750C (kısa), MSTR 165C (orta), TSLA 750C (uzun vade).
- **Vercel'e deploy** edilecek.

İyi geliştirmeler.
