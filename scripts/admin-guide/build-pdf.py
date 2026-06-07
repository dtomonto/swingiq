#!/usr/bin/env python
"""Build docs/SwingVantage-Admin-Dashboard-Guide.pdf from sections.json + captured screenshots.

Prereqs:  python -m pip install reportlab Pillow
Inputs :  scripts/admin-guide/sections.json  and  scripts/admin-guide/.cache/shots/<id>.png
          (run capture.mjs first; missing screenshots render as a placeholder).
Run    :  python scripts/admin-guide/build-pdf.py
Env    :  ADMIN_GUIDE_SHOTS, ADMIN_GUIDE_OUT, ADMIN_GUIDE_DATE  (all optional)
"""
import os
import json
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Image, Table,
    TableStyle, PageBreak, NextPageTemplate, KeepTogether,
)
from reportlab.platypus.tableofcontents import TableOfContents
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily
from PIL import Image as PILImage

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
DATA = json.load(open(os.path.join(HERE, "sections.json"), encoding="utf-8"))
META = DATA["meta"]
SHOTS = os.environ.get("ADMIN_GUIDE_SHOTS") or os.path.join(HERE, ".cache", "shots")
OUT = os.environ.get("ADMIN_GUIDE_OUT") or os.path.join(REPO, "docs", "SwingVantage-Admin-Dashboard-Guide.pdf")
_today = datetime.date.today()
DATE = os.environ.get("ADMIN_GUIDE_DATE") or (_today.strftime("%B ") + str(_today.day) + _today.strftime(", %Y"))

BRAND = HexColor("#0E7C66")
BRAND_DARK = HexColor("#0B2E25")
INK = HexColor("#1F2937")
MUTED = HexColor("#6B7280")
CHIP_BG = HexColor("#ECFDF5")
CHIP_INK = HexColor("#065F46")
BORDER = HexColor("#D1D5DB")

PAGE_W, PAGE_H = letter
LM = RM = 0.72 * inch
TM = 0.95 * inch
BM = 0.78 * inch
CONTENT_W = PAGE_W - LM - RM

FONTS = "C:\\Windows\\Fonts"
def _try(name, filename):
    p = os.path.join(FONTS, filename)
    if os.path.exists(p):
        pdfmetrics.registerFont(TTFont(name, p))
        return True
    return False

BODY_F, BOLD_F, IT_F, BIT_F, MONO_F = "Helvetica", "Helvetica-Bold", "Helvetica-Oblique", "Helvetica-BoldOblique", "Courier"
if _try("SegoeUI", "segoeui.ttf") and _try("SegoeUI-Bold", "segoeuib.ttf"):
    BODY_F, BOLD_F = "SegoeUI", "SegoeUI-Bold"
    IT_F = "SegoeUI-It" if _try("SegoeUI-It", "segoeuii.ttf") else BODY_F
    BIT_F = "SegoeUI-BoldIt" if _try("SegoeUI-BoldIt", "segoeuiz.ttf") else BOLD_F
    registerFontFamily("SegoeUI", normal=BODY_F, bold=BOLD_F, italic=IT_F, boldItalic=BIT_F)
if _try("Consolas", "consola.ttf"):
    MONO_F = "Consolas"

ss = getSampleStyleSheet()
body = ParagraphStyle("Body", parent=ss["BodyText"], fontName=BODY_F, fontSize=10.5, leading=15.5, textColor=INK, spaceAfter=6)
body_intro = ParagraphStyle("BodyIntro", parent=body, fontSize=11, leading=16.5)
bullet = ParagraphStyle("Bullet", parent=body, leftIndent=14, spaceAfter=4)
sect_title = ParagraphStyle("SectionTitle", parent=ss["Heading1"], fontName=BOLD_F, fontSize=19, leading=22, textColor=BRAND_DARK, spaceAfter=2)
h2 = ParagraphStyle("H2", parent=ss["Heading2"], fontName=BOLD_F, fontSize=14.5, leading=18, textColor=BRAND_DARK, spaceBefore=4, spaceAfter=8)
chip = ParagraphStyle("Chip", parent=body, fontName=MONO_F, fontSize=9.5, textColor=CHIP_INK, leading=12)
caption = ParagraphStyle("Caption", parent=body, fontName=IT_F, fontSize=8.5, textColor=MUTED, leading=11)
toc_h = ParagraphStyle("TOCH", parent=ss["Heading1"], fontName=BOLD_F, fontSize=18, textColor=BRAND_DARK, spaceAfter=12)


def chip_para(route):
    return Table([[Paragraph(route, chip)]], colWidths=[CONTENT_W], style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), CHIP_BG),
        ("LEFTPADDING", (0, 0), (-1, -1), 8), ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 2, BRAND),
    ]), hAlign="LEFT")


PREP = os.path.join(os.path.dirname(SHOTS), "shots_small")

def prepare(path, maxw=1500):
    os.makedirs(PREP, exist_ok=True)
    out = os.path.join(PREP, os.path.basename(path))
    if not os.path.exists(out):
        with PILImage.open(path) as im:
            im = im.convert("RGB")
            w, h = im.size
            if w > maxw:
                im = im.resize((maxw, round(h * maxw / w)), PILImage.LANCZOS)
            im.save(out, "PNG", optimize=True)
    return out


def framed_image(path, max_w, max_h):
    spath = prepare(path)
    with PILImage.open(spath) as im:
        pw, ph = im.size
    ratio = pw / ph
    w = max_w
    h = w / ratio
    if h > max_h:
        h = max_h
        w = h * ratio
    img = Image(spath, width=w, height=h)
    return Table([[img]], colWidths=[w], style=TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.75, BORDER),
        ("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
    ]), hAlign="CENTER")


def draw_cover(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BRAND_DARK); canvas.rect(0, PAGE_H - 3.5 * inch, PAGE_W, 3.5 * inch, fill=1, stroke=0)
    canvas.setFillColor(BRAND); canvas.rect(0, PAGE_H - 3.62 * inch, PAGE_W, 0.12 * inch, fill=1, stroke=0)
    canvas.setFillColor(white); canvas.setFont(BOLD_F, 13); canvas.drawString(LM, PAGE_H - 0.85 * inch, META["wordmark"])
    canvas.setFont(BODY_F, 10.5); canvas.setFillColor(HexColor("#A7F3D0")); canvas.drawString(LM, PAGE_H - 1.1 * inch, META["tagline"])
    canvas.setFillColor(white); canvas.setFont(BOLD_F, 31)
    canvas.drawString(LM, PAGE_H - 2.15 * inch, META["title1"]); canvas.drawString(LM, PAGE_H - 2.62 * inch, META["title2"])
    canvas.setFillColor(INK); canvas.setFont(BODY_F, 11.5)
    y = 1.55 * inch
    for line in META["subtitle"]:
        canvas.drawString(LM, y, line); y -= 17
    canvas.setFillColor(BRAND_DARK); canvas.setFont(BOLD_F, 10)
    canvas.drawString(LM, 1.05 * inch, "Updated " + DATE + "    •    %d sections" % len(DATA["sections"]))
    canvas.restoreState()


def draw_main(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(BRAND_DARK); canvas.setFont(BOLD_F, 9)
    canvas.drawString(LM, PAGE_H - 0.55 * inch, META["runningHeader"])
    canvas.setStrokeColor(BORDER); canvas.setLineWidth(0.5); canvas.line(LM, PAGE_H - 0.62 * inch, PAGE_W - RM, PAGE_H - 0.62 * inch)
    canvas.setFillColor(MUTED); canvas.setFont(BODY_F, 8.5)
    canvas.drawCentredString(PAGE_W / 2, 0.45 * inch, "%d" % doc.page)
    canvas.drawRightString(PAGE_W - RM, 0.45 * inch, META["footerRight"])
    canvas.restoreState()


class GuideDoc(BaseDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == "SectionTitle":
            self.notify("TOCEntry", (0, flowable.getPlainText(), self.page))


def build():
    cover_frame = Frame(0, 0, PAGE_W, PAGE_H, id="cover")
    main_frame = Frame(LM, BM, CONTENT_W, PAGE_H - TM - BM, id="main")
    doc = GuideDoc(OUT, pagesize=letter, title=META["title1"] + " " + META["title2"], author=META["wordmark"],
                   pageTemplates=[
                       PageTemplate(id="Cover", frames=[cover_frame], onPage=draw_cover),
                       PageTemplate(id="Main", frames=[main_frame], onPage=draw_main),
                   ])
    story = [NextPageTemplate("Main"), PageBreak()]

    story.append(Paragraph("Contents", toc_h))
    toc = TableOfContents()
    toc.levelStyles = [ParagraphStyle("TOCL0", fontName=BODY_F, fontSize=10.5, leading=18, textColor=INK)]
    story.append(toc)
    story.append(PageBreak())

    for blk in DATA["intro"]:
        story.append(Paragraph(blk["heading"], h2))
        for i, p in enumerate(blk.get("paras", [])):
            story.append(Paragraph(p, body_intro if (blk is DATA["intro"][0] and i == 0) else body))
        for b in blk.get("bullets", []):
            story.append(Paragraph("• " + b, bullet))
        if blk.get("after"):
            story.append(Spacer(1, 6)); story.append(Paragraph(blk["after"], body))
        story.append(Spacer(1, 12))
    story.append(PageBreak())

    for s in DATA["sections"]:
        img = os.path.join(SHOTS, s["id"] + ".png")
        block = [Paragraph(s["title"], sect_title), Spacer(1, 3), chip_para(s["route"]), Spacer(1, 9)]
        if os.path.exists(img):
            block.append(framed_image(img, CONTENT_W, 5.15 * inch))
            block.append(Spacer(1, 4)); block.append(Paragraph("Screen: " + s["route"], caption))
        else:
            block.append(Paragraph("[screenshot unavailable — run capture.mjs]", caption))
        block.append(Spacer(1, 9)); block.append(Paragraph(s["blurb"], body))
        story.append(KeepTogether(block)); story.append(PageBreak())

    for key in ("security", "troubleshooting"):
        blk = DATA[key]
        story.append(Paragraph(blk["heading"], sect_title)); story.append(Spacer(1, 10))
        for b in blk["bullets"]:
            story.append(Paragraph("• " + b, bullet))
        story.append(PageBreak() if key == "security" else Spacer(1, 16))

    about = DATA["about"]
    story.append(Paragraph(about["heading"], h2))
    story.append(Paragraph(about["text"].replace("{date}", DATE), body))

    doc.multiBuild(story)
    print("PDF written:", OUT)


if __name__ == "__main__":
    build()
