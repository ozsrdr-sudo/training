"""
Opsiyon Dersi Simülatörü — Tek Sayfa PDF Leaflet (A4 dikey)
"""

import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor, white
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit

# Türkçe karakter destekli font kaydı (Windows Arial)
FONT_DIR = r"C:\Windows\Fonts"
REGULAR = "Arial"
BOLD = "Arial-Bold"
pdfmetrics.registerFont(TTFont(REGULAR, os.path.join(FONT_DIR, "arial.ttf")))
pdfmetrics.registerFont(TTFont(BOLD, os.path.join(FONT_DIR, "arialbd.ttf")))

# Renkler
NAVY = HexColor('#0B1F3A')
ACCENT = HexColor('#1D9E75')
DANGER = HexColor('#D85A30')
INFO = HexColor('#3B82F6')
GRAY_LIGHT = HexColor('#F5F5F4')
GRAY_TEXT = HexColor('#57534E')
GRAY_BORDER = HexColor('#D6D3D1')

PAGE_W, PAGE_H = A4  # 210 x 297 mm

OUT = "docs/opsiyon-simulator-leaflet.pdf"
c = canvas.Canvas(OUT, pagesize=A4)

# --------- yardımcılar ---------
def fill(color):
    c.setFillColor(color)

def stroke(color):
    c.setStrokeColor(color)

def rect_filled(x, y, w, h, color, radius=0):
    fill(color)
    if radius > 0:
        c.roundRect(x, y, w, h, radius, fill=1, stroke=0)
    else:
        c.rect(x, y, w, h, fill=1, stroke=0)

def text(x, y, txt, size=10, bold=False, color=NAVY):
    name = BOLD if bold else REGULAR
    c.setFont(name, size)
    fill(color)
    c.drawString(x, y, txt)

def text_centered(x, y, w, txt, size=10, bold=False, color=NAVY):
    name = BOLD if bold else REGULAR
    c.setFont(name, size)
    fill(color)
    c.drawCentredString(x + w / 2, y, txt)

def wrapped(x, y, w, txt, size=9, bold=False, color=GRAY_TEXT, leading=11):
    name = BOLD if bold else REGULAR
    c.setFont(name, size)
    fill(color)
    lines = simpleSplit(txt, name, size, w)
    for i, line in enumerate(lines):
        c.drawString(x, y - i * leading, line)
    return len(lines) * leading

# --------- HEADER ---------
HEADER_H = 28 * mm
rect_filled(0, PAGE_H - HEADER_H, PAGE_W, HEADER_H, NAVY)
rect_filled(15 * mm, PAGE_H - HEADER_H + 21 * mm, 10 * mm, 1.2 * mm, ACCENT)

text(15 * mm, PAGE_H - HEADER_H + 13 * mm, "Opsiyon Dersi Simülatörü", size=22, bold=True, color=white)
text(15 * mm, PAGE_H - HEADER_H + 6 * mm,
     "Greek'lerin opsiyon fiyatına etkisini interaktif olarak öğren",
     size=10, color=HexColor('#C8CCD4'))

text(PAGE_W - 15 * mm - 35 * mm, PAGE_H - HEADER_H + 6 * mm,
     "Eğitim Leaflet'i", size=8, color=HexColor('#9CA3AF'))

# --------- AMAÇ ---------
y_cursor = PAGE_H - HEADER_H - 8 * mm

text(15 * mm, y_cursor, "AMAÇ", size=11, bold=True, color=ACCENT)
y_cursor -= 5 * mm
used = wrapped(15 * mm, y_cursor, PAGE_W - 30 * mm,
               "Gerçek para riske etmeden, gerçek piyasa verisiyle opsiyon fiyatının "
               "Delta · Theta · Vega · IV · zaman ve spot değişimlerine nasıl tepki verdiğini "
               "görsel olarak dene. \"Eğer şu olursa primim ne olur?\" sorusunun cevabını bul.",
               size=9, color=GRAY_TEXT, leading=12)
y_cursor -= used + 5 * mm

# --------- KULLANIM AKIŞI (4 adım) ---------
text(15 * mm, y_cursor, "KULLANIM AKIŞI", size=11, bold=True, color=ACCENT)
y_cursor -= 6 * mm

steps = [
    ("1", "Sembol Ara",       "TSLA, AAPL, NVDA…\nşirket adı da olur",        INFO),
    ("2", "Kontrat Seç",      "Vade · Call/Put\nStrike (30/100/200)",          ACCENT),
    ("3", "Nokta İşaretle",   "Grafiğe mouse ile tıkla:\ntarih + spot değerleri", DANGER),
    ("4", "Slider Oyna",      "Spot/IV/gün veya\nDelta/Theta/Vega → K/Z",      NAVY),
]
step_w = (PAGE_W - 30 * mm - 3 * 3 * mm) / 4
step_h = 22 * mm
for i, (num, title, desc, accent) in enumerate(steps):
    x = 15 * mm + i * (step_w + 3 * mm)
    rect_filled(x, y_cursor - step_h, step_w, step_h, GRAY_LIGHT, radius=2)
    # numara dairesi
    c.setFillColor(accent)
    c.circle(x + 6 * mm, y_cursor - 6 * mm, 3.5 * mm, fill=1, stroke=0)
    text_centered(x + 6 * mm - 3.5 * mm, y_cursor - 7.2 * mm, 7 * mm, num,
                  size=11, bold=True, color=white)
    text(x + 12 * mm, y_cursor - 7 * mm, title, size=10, bold=True, color=NAVY)
    # desc multiline
    for j, line in enumerate(desc.split("\n")):
        text(x + 3 * mm, y_cursor - 13 * mm - j * 4 * mm, line, size=8, color=GRAY_TEXT)

y_cursor -= step_h + 6 * mm

# --------- TEMEL TERİMLER ---------
text(15 * mm, y_cursor, "TEMEL TERİMLER", size=11, bold=True, color=ACCENT)
y_cursor -= 6 * mm

terms = [
    ("Strike",   "Opsiyonu kullandığında alım/satım yapacağın fiyat",            INFO),
    ("Prim",     "1 hisse başına opsiyon fiyatı. Kontrat maliyeti = Prim × 100", ACCENT),
    ("ITM",      "In The Money — kârda taraf (Call: spot > strike)",             ACCENT),
    ("ATM",      "At The Money — strike ≈ spot (±%1)",                           INFO),
    ("OTM",      "Out of The Money — kârsız taraf",                              DANGER),
    ("IV",       "Implied Volatility — örtük yıllık oynaklık (% yüksek = pahalı)", NAVY),
    ("Delta Δ",  "Spot 1$ artarsa prim ne kadar değişir (Call: 0..1)",           ACCENT),
    ("Theta Θ",  "Günlük zaman erimesi (negatif). OTM'de daha hızlı",            DANGER),
    ("Vega ν",   "IV 1 puan artarsa prim ne kadar değişir. ATM'de en yüksek",    INFO),
    ("Breakeven","Vade sonunda kâra geçiş seviyesi = Strike + Prim (Call)",      NAVY),
]
term_w = (PAGE_W - 30 * mm - 2 * mm) / 2
term_h = 9 * mm
for i, (t, desc, accent) in enumerate(terms):
    row, col = divmod(i, 2)
    x = 15 * mm + col * (term_w + 2 * mm)
    y = y_cursor - row * (term_h + 1.5 * mm)
    rect_filled(x, y - term_h, term_w, term_h, white)
    stroke(GRAY_BORDER)
    c.setLineWidth(0.4)
    c.rect(x, y - term_h, term_w, term_h, fill=0, stroke=1)
    # sol renk barı
    rect_filled(x, y - term_h, 1.2 * mm, term_h, accent)
    text(x + 3 * mm, y - 3.5 * mm, t, size=9, bold=True, color=accent)
    text(x + 3 * mm, y - 7 * mm, desc, size=7.5, color=GRAY_TEXT)

y_cursor -= 5 * (term_h + 1.5 * mm) + 5 * mm

# --------- KONTROL LİSTESİ ---------
text(15 * mm, y_cursor, "KONTROL LİSTESİ (Call için)", size=11, bold=True, color=ACCENT)
y_cursor -= 6 * mm

checks = [
    ("Spot ↑",                  "Prim artar (Delta pozitif) — eğri sola/yukarı kayar"),
    ("Kalan gün ↓",             "Prim azalır (Theta erimesi) — OTM'de daha hızlı"),
    ("IV ↑",                    "Prim artar (Vega pozitif) — ATM'de en güçlü"),
    ("Spot = Strike",           "Delta ≈ 0.5 olur"),
    ("Vade günü spot = strike", "Zaman değeri 0 → tüm prim kayıp"),
]
check_h = 6.5 * mm
for i, (cond, expected) in enumerate(checks):
    y = y_cursor - i * (check_h + 1 * mm)
    rect_filled(15 * mm, y - check_h, PAGE_W - 30 * mm, check_h, GRAY_LIGHT)
    # check kutusu
    stroke(ACCENT)
    c.setLineWidth(0.8)
    c.rect(17 * mm, y - 4.5 * mm, 2.5 * mm, 2.5 * mm, fill=0, stroke=1)
    text(22 * mm, y - 4 * mm, cond, size=9, bold=True, color=NAVY)
    text(60 * mm, y - 4 * mm, expected, size=8.5, color=GRAY_TEXT)

y_cursor -= len(checks) * (check_h + 1 * mm) + 4 * mm

# --------- UYARI ---------
rect_filled(15 * mm, y_cursor - 14 * mm, PAGE_W - 30 * mm, 14 * mm, HexColor('#FEF2F0'))
rect_filled(15 * mm, y_cursor - 14 * mm, 1.5 * mm, 14 * mm, DANGER)
text(20 * mm, y_cursor - 4.5 * mm, "⚠ EĞİTİM AMAÇLIDIR", size=10, bold=True, color=DANGER)
wrapped(20 * mm, y_cursor - 8.5 * mm, PAGE_W - 40 * mm,
        "Gerçek alım-satım kararı için kullanma. Black-Scholes basitleştirilmiş bir modeldir; "
        "kâr payı, faiz, Amerikan tipi erken kullanım hariç. Yahoo'nun IV/bid-ask verisi gecikmeli olabilir.",
        size=7.5, color=GRAY_TEXT, leading=9)

# --------- FOOTER ---------
text(15 * mm, 8 * mm, "Yahoo Finance · Black-Scholes · Next.js 14",
     size=7, color=HexColor('#9CA3AF'))
text(PAGE_W - 15 * mm - 28 * mm, 8 * mm, "opsiyon-dersi-simulatoru",
     size=7, color=HexColor('#9CA3AF'))

c.showPage()
c.save()
print(f"OK -> {OUT}")
