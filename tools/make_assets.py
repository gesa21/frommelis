"""Builds the Meli's image and print assets.

  python tools/make_assets.py images            og-image.png and apple-touch-icon.png
  python tools/make_assets.py print URL         melis-qr.png and melis-a4-poster.pdf for URL

Needs Pillow and ReportLab. Fonts are fetched once from Google Fonts into tools/.fonts.
Only point the QR at an address you have just checked returns 200.
"""

import os
import sys
import urllib.request

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
FONT_DIR = os.path.join(HERE, ".fonts")

CREAM = (247, 241, 229)
INK = (33, 29, 24)
FROST = (63, 111, 142)
WARM = (151, 64, 31)

FONTS = {
    "Playfair-500": "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKd3vUDQ.ttf",
    "Playfair-600": "https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKebukDQ.ttf",
    "Inter-400": "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZg.ttf",
    "Inter-500": "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fMZg.ttf",
    "Inter-600": "https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf",
}

H1 = "Meal planning for your whole family, done."
SPECIFICS = [
    "Cooked Sunday morning. In the freezer within the hour.",
    "An adults’ menu and a children’s menu, new choices every week.",
    "No cooking. Reheat and eat.",
    "Delivered to your door on Sunday evening.",
]


def font_path(name):
    os.makedirs(FONT_DIR, exist_ok=True)
    path = os.path.join(FONT_DIR, name + ".ttf")
    if os.path.exists(path) is False:
        urllib.request.urlretrieve(FONTS[name], path)
    return path


def mix(colour, alpha, base=CREAM):
    return tuple(round(c * alpha + b * (1 - alpha)) for c, b in zip(colour, base))


def bezier(p0, p1, p2, p3, steps=40):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0]
        y = u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1]
        pts.append((x, y))
    return pts


def stroke(draw, pts, width, colour):
    draw.line(pts, fill=colour, width=width, joint="curve")
    r = width / 2
    for x, y in (pts[0], pts[-1]):
        draw.ellipse((x - r, y - r, x + r, y + r), fill=colour)


def draw_bowl(draw, ox, oy, s, steam=True):
    """The hero bowl from index.html, drawn at scale s with its 160 by 136 box at ox, oy."""

    def P(x, y):
        return (ox + x * s, oy + y * s)

    w = max(2, round(2.2 * s))
    if steam:
        for x0, top in ((62, 9), (80, 5), (98, 9)):
            a = bezier(P(x0, 56), P(x0 - 7, 48), P(x0 + 7, 42), P(x0, 33))
            b = bezier(P(x0, 33), P(x0 - 6, 24), P(x0 + 6, 18), P(x0, top))
            stroke(draw, a + b[1:], max(2, round(2 * s)), mix(INK, 0.32))
    stroke(draw, bezier(P(36, 71), P(48, 62), P(66, 59), P(80, 59)) + bezier(P(80, 59), P(94, 59), P(112, 62), P(124, 71))[1:], w, INK)
    cx, cy = P(80, 74)
    draw.ellipse((cx - 62 * s, cy - 9 * s, cx + 62 * s, cy + 9 * s), outline=INK, width=w)
    body = bezier(P(18, 74), P(21, 104), P(46, 122), P(80, 122)) + bezier(P(80, 122), P(114, 122), P(139, 104), P(142, 74))[1:]
    stroke(draw, body, w, INK)
    stroke(draw, [P(64, 122), P(67, 130), P(93, 130), P(96, 122)], w, INK)
    fw = max(2, round(1.8 * s))
    stroke(draw, [P(148, 98), P(148, 120)], fw, FROST)
    stroke(draw, [P(138.5, 103.5), P(157.5, 114.5)], fw, FROST)
    stroke(draw, [P(138.5, 114.5), P(157.5, 103.5)], fw, FROST)


def wrap(text, font, width):
    words = text.split()
    lines, line = [], ""
    for word in words:
        trial = (line + " " + word).strip()
        if font.getlength(trial) <= width or line == "":
            line = trial
        else:
            lines.append(line)
            line = word
    lines.append(line)
    return lines


def make_images():
    S = 2
    W, H = 1200 * S, 630 * S
    img = Image.new("RGB", (W, H), CREAM)
    d = ImageDraw.Draw(img)

    mark = ImageFont.truetype(font_path("Playfair-600"), 46 * S)
    head = ImageFont.truetype(font_path("Playfair-500"), 74 * S)
    body = ImageFont.truetype(font_path("Inter-400"), 27 * S)
    label = ImageFont.truetype(font_path("Inter-500"), 17 * S)
    button = ImageFont.truetype(font_path("Inter-600"), 25 * S)

    left = 84 * S
    d.text((left, 54 * S), "Meli’s", font=mark, fill=INK)
    place = "TWICKENHAM"
    x = W - 84 * S
    for ch in reversed(place):
        x -= label.getlength(ch) + 3.2 * S
        d.text((x, 72 * S), ch, font=label, fill=mix(INK, 0.72))

    y = 150 * S
    for line in wrap(H1, head, 760 * S):
        d.text((left, y), line, font=head, fill=INK)
        y += 80 * S

    y += 50 * S
    d.text((left, y), SPECIFICS[0], font=body, fill=mix(INK, 0.84))

    by = y + 60 * S
    text = "Register your interest"
    tw = button.getlength(text)
    bw, bh = tw + 64 * S, 66 * S
    d.rounded_rectangle((left, by, left + bw, by + bh), radius=bh / 2, fill=WARM)
    d.text((left + bw / 2, by + bh / 2), text, font=button, fill=CREAM, anchor="mm")

    draw_bowl(d, 850 * S, 250 * S, 1.75 * S)

    small = img.resize((1200, 630), Image.LANCZOS)
    small.quantize(colors=128, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(os.path.join(REPO, "og-image.png"), optimize=True)

    icon = Image.new("RGB", (720, 720), CREAM)
    di = ImageDraw.Draw(icon)
    draw_bowl(di, 8, 82, 4.0, steam=True)
    icon = icon.resize((180, 180), Image.LANCZOS)
    icon.quantize(colors=48, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(os.path.join(REPO, "apple-touch-icon.png"), optimize=True)
    print("wrote og-image.png and apple-touch-icon.png")


def qr_matrix(url):
    from reportlab.graphics.barcode import qrencoder
    level = qrencoder.QRErrorCorrectLevel.Q
    for version in range(1, 11):
        try:
            qr = qrencoder.QRCode(version, level)
            qr.addData(url)
            qr.make()
            n = qr.getModuleCount()
            return [[qr.isDark(r, c) for c in range(n)] for r in range(n)]
        except Exception:
            continue
    raise SystemExit("URL too long for the QR sizes tried")


def make_print(url):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.pdfgen import canvas

    rows = qr_matrix(url)
    n = len(rows)
    box, quiet = 24, 4
    size = (n + quiet * 2) * box
    qr = Image.new("RGB", (size, size), CREAM)
    dq = ImageDraw.Draw(qr)
    for r, row in enumerate(rows):
        for c, dark in enumerate(row):
            if dark:
                x, y = (c + quiet) * box, (r + quiet) * box
                dq.rectangle((x, y, x + box - 1, y + box - 1), fill=(0, 0, 0))
    qr_path = os.path.join(REPO, "melis-qr.png")
    qr.save(qr_path, optimize=True)

    for name in ("Playfair-500", "Playfair-600", "Inter-400", "Inter-500", "Inter-600"):
        pdfmetrics.registerFont(TTFont(name, font_path(name)))

    pdf_path = os.path.join(REPO, "melis-a4-poster.pdf")
    W, H = A4
    c = canvas.Canvas(pdf_path, pagesize=A4)
    c.setTitle("Meli’s. Register your interest")
    c.setAuthor("Meli’s")
    c.setSubject("Frozen family meals, Twickenham")

    def rgb(t):
        return (t[0] / 255, t[1] / 255, t[2] / 255)

    c.setFillColorRGB(*rgb(CREAM))
    c.rect(0, 0, W, H, stroke=0, fill=1)

    margin = 22 * mm
    c.setFillColorRGB(*rgb(INK))
    c.setFont("Playfair-600", 40)
    c.drawString(margin, H - margin - 30, "Meli’s")
    c.setFont("Inter-500", 9.5)
    c.drawRightString(W - margin, H - margin - 22, "T W I C K E N H A M")

    c.setFont("Playfair-500", 38)
    y = H - margin - 30 - 72
    for line in wrap(H1, ImageFont.truetype(font_path("Playfair-500"), 38), W - 2 * margin):
        c.drawString(margin, y, line)
        y -= 44

    y -= 12
    c.setStrokeColorRGB(*rgb(INK))
    c.setLineWidth(0.6)
    c.line(margin, y, W - margin, y)
    c.setFont("Inter-400", 13.5)
    for item in SPECIFICS:
        y -= 26
        c.circle(margin + 3, y + 4.2, 2.2, stroke=0, fill=1)
        c.drawString(margin + 16, y, item)
        y -= 12
        c.line(margin, y, W - margin, y)

    q = 92 * mm
    qx = (W - q) / 2
    qy = 36 * mm
    c.drawImage(qr_path, qx, qy, width=q, height=q)
    c.setFont("Inter-600", 19)
    c.drawCentredString(W / 2, qy - 10, "Scan to register your interest")
    c.setFont("Playfair-500", 11)
    c.drawCentredString(W / 2, 14 * mm, "Meli’s. Twickenham.")

    c.showPage()
    c.save()
    print("wrote melis-qr.png and melis-a4-poster.pdf for " + url)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "images":
        make_images()
    elif len(sys.argv) > 2 and sys.argv[1] == "print":
        make_print(sys.argv[2])
    else:
        print(__doc__)
