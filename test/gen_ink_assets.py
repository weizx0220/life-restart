# 程序化水墨素材生成器（PIL）：为都市地点生成水墨场景图
# 输出到 assets/chahua/place_*.jpg
import math, random
from PIL import Image, ImageDraw, ImageFilter

W, H = 800, 400
PAPER = (243, 237, 224)
INK = (42, 42, 46)
CINNABAR = (165, 40, 27)

def base_paper():
    img = Image.new('RGB', (W, H), PAPER)
    d = ImageDraw.Draw(img)
    random.seed()
    # 宣纸噪点
    for _ in range(2600):
        x, y = random.randint(0, W - 1), random.randint(0, H - 1)
        v = random.randint(-12, 8)
        p = img.getpixel((x, y))
        img.putpixel((x, y), tuple(max(0, min(255, c + v)) for c in p))
    # 顶部淡光
    for y in range(H // 2):
        a = int(18 * (1 - y / (H / 2)))
        d.line([(0, y), (W, y)], fill=(min(255, PAPER[0] + a), min(255, PAPER[1] + a), min(255, PAPER[2] + a)))
    return img

def mountain(d, y_base, amp, alpha, seed, color=(60, 72, 84)):
    random.seed(seed)
    phase = random.uniform(0, 6)
    pts = [(0, H)]
    for x in range(0, W + 10, 10):
        y = y_base - abs(math.sin(x * 0.008 + phase)) * amp - math.sin(x * 0.02 + phase * 2) * amp * 0.3
        pts.append((x, y))
    pts.append((W, H))
    col = color + (alpha,)
    return pts, col

def draw_mountains(img, seed=0, n=3):
    overlay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for i in range(n):
        pts, col = mountain(d, 190 + i * 55, 90 - i * 22, 40 + i * 30, seed + i * 7)
        d.polygon(pts, fill=col)
    # 雾带
    for i in range(2):
        y = 210 + i * 60
        d.ellipse([-100, y, W + 100, y + 70], fill=(243, 237, 224, 90))
    overlay = overlay.filter(ImageFilter.GaussianBlur(6))
    img.paste(Image.alpha_composite(Image.new('RGBA', (W, H), (0, 0, 0, 0)), overlay).convert('RGB'), (0, 0), overlay)

def brush_line(d, x0, y0, x1, y1, w, color=INK, alpha=200):
    steps = int(max(abs(x1 - x0), abs(y1 - y0)) / 3) + 1
    for i in range(steps + 1):
        t = i / steps
        x = x0 + (x1 - x0) * t
        y = y0 + (y1 - y0) * t
        r = max(1, w * (0.4 + 0.6 * math.sin(t * math.pi)))
        d.ellipse([x - r, y - r, x + r, y + r], fill=color + (alpha,))

def seal(d, x, y, text_box=34, color=CINNABAR):
    d.rounded_rectangle([x, y, x + text_box, y + text_box], 5, fill=color + (230,))

def silhouette_building(d, x, y, w, h, color=INK, alpha=170):
    d.rectangle([x, y - h, x + w, y], fill=color + (alpha,))
    # 檐
    d.polygon([(x - 8, y - h), (x + w + 8, y - h), (x + w - 4, y - h - 12), (x + 4, y - h - 12)], fill=color + (alpha,))

def pagoda(d, x, y, tiers=3, color=INK, alpha=180):
    for t in range(tiers):
        w = 70 - t * 14
        yy = y - t * 46
        d.rectangle([x - w // 2, yy - 34, x + w // 2, yy], fill=color + (alpha,))
        d.polygon([(x - w // 2 - 10, yy - 34), (x + w // 2 + 10, yy - 34), (x, yy - 50)], fill=color + (alpha,))
    d.polygon([(x - 3, y - tiers * 46 + 12), (x + 3, y - tiers * 46 + 12), (x, y - tiers * 46)], fill=color + (alpha,))

def tree(d, x, y, s=1.0, color=(40, 50, 44), alpha=190):
    brush_line(d, x, y, x + 6 * s, y - 60 * s, 5 * s, color, alpha)
    for dx, dy, r in [(-26, -70, 24), (8, -84, 28), (28, -62, 20)]:
        d.ellipse([x + (dx - r) * s, y + (dy - r) * s, x + (dx + r) * s, y + (dy + r) * s], fill=color + (alpha - 60,))

def lantern(d, x, y, color=CINNABAR):
    d.line([x, y - 26, x, y - 14], fill=INK + (200,), width=2)
    d.ellipse([x - 12, y - 14, x + 12, y + 14], fill=color + (220,))
    d.line([x - 12, y, x + 12, y], fill=color + (255,), width=2)

def figure(d, x, y, s=1.0, color=INK, alpha=200):
    d.ellipse([x - 7 * s, y - 58 * s, x + 7 * s, y - 44 * s], fill=color + (alpha,))
    d.polygon([(x, y - 44 * s), (x - 14 * s, y), (x + 14 * s, y)], fill=color + (alpha,))

def save(img, name):
    img.convert('RGB').save('assets/chahua/' + name, 'JPEG', quality=85, optimize=True)
    print('生成', name)

def scene(name, draw_fn, seed=1):
    img = base_paper()
    draw_mountains(img, seed=seed)
    ov = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    draw_fn(d)
    ov = ov.filter(ImageFilter.GaussianBlur(0.6))
    img.paste(Image.alpha_composite(Image.new('RGBA', (W, H), (0, 0, 0, 0)), ov).convert('RGB'), (0, 0), ov)
    seal(ImageDraw.Draw(img), W - 60, H - 58)
    save(img, name)

# ---------- 各地点构图 ----------
def s_school(d):  # 学校·图书馆
    silhouette_building(d, 200, 330, 110, 130)
    silhouette_building(d, 330, 330, 150, 180)
    silhouette_building(d, 500, 330, 110, 110)
    for i in range(3):
        lantern(d, 250 + i * 130, 200 + (i % 2) * 20)
def s_office(d):  # 写字楼
    silhouette_building(d, 260, 340, 90, 220, alpha=150)
    silhouette_building(d, 380, 340, 110, 260, alpha=170)
    silhouette_building(d, 520, 340, 80, 170, alpha=140)
def s_gym(d):  # 健身房：杠铃剪影
    brush_line(d, 300, 240, 500, 240, 4)
    for x in (290, 500):
        d.ellipse([x - 26, 214, x + 26, 266], outline=INK + (220,), width=10)
    d.line([300, 300, 500, 300], fill=INK + (120,), width=2)
def s_shop(d):  # 商业街
    for i, x in enumerate(range(180, 620, 110)):
        silhouette_building(d, x, 330, 80, 90 + (i % 3) * 30, alpha=150)
        lantern(d, x + 40, 330 - 90 - (i % 3) * 30 - 16)
def s_plaza(d):  # 中央广场：树+人
    tree(d, 240, 320, 1.2); tree(d, 560, 330, 1.0)
    figure(d, 360, 330, 0.9); figure(d, 420, 330, 0.8); figure(d, 390, 322, 0.7)
def s_beauty(d):  # 美容院：镜+簪
    d.ellipse([330, 120, 470, 300], outline=INK + (200,), width=5)
    brush_line(d, 340, 300, 460, 300, 3)
    d.polygon([(400, 130), (395, 90), (405, 90)], fill=CINNABAR + (200,))
def s_finance(d):  # 金融街：铜钱+高楼
    silhouette_building(d, 300, 340, 100, 200, alpha=160)
    silhouette_building(d, 430, 340, 90, 240, alpha=180)
    d.ellipse([520, 180, 590, 250], outline=CINNABAR + (200,), width=6)
    d.rectangle([545, 205, 575, 245], outline=CINNABAR + (200,), width=4)
def s_home(d):  # 家：小屋+炊烟
    silhouette_building(d, 330, 330, 150, 110)
    d.polygon([(315, 220), (495, 220), (405, 150)], fill=INK + (190,))
    brush_line(d, 430, 140, 442, 100, 4, INK, 100)
    brush_line(d, 442, 100, 452, 70, 3, INK, 70)
def s_rift(d):  # 虚空裂隙
    d.ellipse([330, 90, 470, 320], outline=INK + (220,), width=6)
    d.ellipse([350, 120, 450, 300], outline=CINNABAR + (180,), width=3)
    for a in range(8):
        ang = a * 0.785
        brush_line(d, 400 + math.cos(ang) * 80, 200 + math.sin(ang) * 110, 400 + math.cos(ang) * 110, 200 + math.sin(ang) * 150, 2, INK, 90)
def s_bag(d):  # 随身行囊
    d.rounded_rectangle([330, 180, 470, 300], 18, outline=INK + (220,), width=6)
    d.arc([360, 150, 440, 220], 180, 360, fill=INK + (220,), width=6)
    seal(d, 386, 226, 28)

PLACES = {
    'place_school.jpg': (s_school, 11), 'place_office.jpg': (s_office, 22),
    'place_gym.jpg': (s_gym, 33), 'place_shop.jpg': (s_shop, 44),
    'place_plaza.jpg': (s_plaza, 55), 'place_beauty.jpg': (s_beauty, 66),
    'place_finance.jpg': (s_finance, 77), 'place_home.jpg': (s_home, 88),
    'place_rift.jpg': (s_rift, 99), 'place_bag.jpg': (s_bag, 111),
}
for name, (fn, seed) in PLACES.items():
    scene(name, fn, seed)
print('全部完成')
