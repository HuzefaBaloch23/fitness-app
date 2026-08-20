"""
Generates every app icon from one vector-ish definition so the identity stays
consistent across iOS, Android adaptive, splash and web.

Run:  python scripts/make_icons.py
"""
from PIL import Image, ImageDraw
import math
import os

BG = (17, 17, 17, 255)          # #111111  - matches theme.dark.bg
TEAL = (20, 184, 166, 255)      # #14B8A6  - theme.dark.accent
TRACK = (32, 62, 58, 255)       # dim teal, the unfilled part of the ring
WHITE = (249, 250, 251, 255)    # #F9FAFB  - theme.dark.text

SS = 4                          # supersample factor for anti-aliasing
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets')


def draw_mark(size, ring_frac=0.82, arrow_color=WHITE, ring=True, mono=False):
    """
    The mark: an open progress ring (the day's calories) wrapped around an
    upward chevron (the gain). Reads as 'filling up' and 'going up' at 48px.
    """
    S = size * SS
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    cx = cy = S / 2
    R = S * 0.395                     # outer radius of the ring stroke
    w = S * 0.098                     # ring stroke width
    rc = R - w / 2                    # PIL strokes inward, so the centreline sits here

    if mono:
        ring_col, track_col, arr_col = WHITE, (255, 255, 255, 60), WHITE
    else:
        ring_col, track_col, arr_col = TEAL, TRACK, arrow_color

    if ring:
        box = [cx - R, cy - R, cx + R, cy + R]
        d.arc(box, 0, 360, fill=track_col, width=int(w))
        start, sweep = -90, 360 * ring_frac
        d.arc(box, start, start + sweep, fill=ring_col, width=int(w))
        # Round caps, placed on the stroke centreline rather than the bbox edge.
        for ang in (start, start + sweep):
            ex = cx + rc * math.cos(math.radians(ang))
            ey = cy + rc * math.sin(math.radians(ang))
            d.ellipse([ex - w / 2, ey - w / 2, ex + w / 2, ey + w / 2], fill=ring_col)

    # Upward arrow, optically centred inside the ring.
    aw = S * 0.088                    # arrow stroke width
    span = S * 0.118                  # half-width of the chevron
    top = cy - S * 0.115
    bot = cy + S * 0.005
    tail = cy + S * 0.150

    def stroke(pts):
        d.line(pts, fill=arr_col, width=int(aw), joint='curve')
        for px, py in pts:
            d.ellipse([px - aw / 2, py - aw / 2, px + aw / 2, py + aw / 2], fill=arr_col)

    stroke([(cx, tail), (cx, top)])                       # stem
    stroke([(cx - span, bot), (cx, top), (cx + span, bot)])  # head

    return img.resize((size, size), Image.LANCZOS)


def save(img, name):
    path = os.path.abspath(os.path.join(OUT, name))
    img.save(path)
    print(f'  {name:34s} {img.size[0]}x{img.size[1]}')


def main():
    print('Generating icons ->', os.path.abspath(OUT))

    # iOS: must be opaque and full-bleed; Apple applies the rounded mask.
    ios = Image.new('RGBA', (1024, 1024), BG)
    ios.alpha_composite(draw_mark(1024))
    save(ios.convert('RGB').convert('RGBA'), 'icon.png')

    # Android adaptive: logo must sit inside the middle 66% safe zone.
    fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    inner = draw_mark(int(1024 * 0.62))
    off = (1024 - inner.size[0]) // 2
    fg.alpha_composite(inner, (off, off))
    save(fg, 'android-icon-foreground.png')

    save(Image.new('RGBA', (1024, 1024), BG), 'android-icon-background.png')

    mono = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
    mono.alpha_composite(draw_mark(int(1024 * 0.62), mono=True), (off, off))
    save(mono, 'android-icon-monochrome.png')

    # Splash: transparent, the splash background colour comes from app.json.
    save(draw_mark(512), 'splash-icon.png')
    save(draw_mark(64), 'favicon.png')


if __name__ == '__main__':
    main()
