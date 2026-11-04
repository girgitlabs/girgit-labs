import os
from PIL import Image, ImageDraw, ImageFont

ROOT = "C:/Projects/Ability-GGL/website"

def create_og_card():
    W, H = 1200, 630
    img = Image.new("RGBA", (W, H), (247, 243, 236, 255)) # #F7F3EC
    draw = ImageDraw.Draw(img)

    # Outer border
    draw.rectangle([(24, 24), (W - 25, H - 25)], outline=(28, 26, 23, 255), width=3)
    # Accent color block behind badge
    draw.rectangle([(64, 60), (320, 94)], fill=(220, 255, 0, 255)) # Acid lime #DCFF00

    # Load system or standard fonts
    try:
        font_kicker = ImageFont.truetype("arialbd.ttf", 16)
        font_title = ImageFont.truetype("arialbd.ttf", 64)
        font_sub = ImageFont.truetype("arial.ttf", 26)
        font_tag = ImageFont.truetype("arialbd.ttf", 20)
        font_url = ImageFont.truetype("arialbd.ttf", 22)
    except:
        font_kicker = font_title = font_sub = font_tag = font_url = ImageFont.load_default()

    # Kicker
    draw.text((80, 68), "GIRGIT LABS · STUDIO", font=font_kicker, fill=(28, 26, 23, 255))

    # Headline
    draw.text((64, 130), "You missed it.", font=font_title, fill=(28, 26, 23, 255))
    draw.text((64, 210), "We didn't.", font=font_title, fill=(28, 26, 23, 255))

    # Subhead
    draw.text((64, 320), "A design studio with no house style.", font=font_sub, fill=(112, 107, 98, 255))
    draw.text((64, 360), "Websites designed, built and live in 7 days.", font=font_sub, fill=(112, 107, 98, 255))

    # Tags pill
    draw.rounded_rectangle([(64, 440), (560, 490)], radius=25, fill=(28, 26, 23, 255))
    draw.text((88, 453), "Branding · UI/UX · Websites · Motion", font=font_tag, fill=(247, 243, 236, 255))

    # URL
    draw.text((64, 535), "www.girgitlabs.design", font=font_url, fill=(28, 26, 23, 255))

    # Right side: Chameleon artwork
    cham_path = os.path.join(ROOT, "assets/img/girgit-skin.webp")
    if os.path.exists(cham_path):
        cham = Image.open(cham_path).convert("RGBA")
        # Scale down to fit ~520px height
        target_h = 480
        aspect = cham.width / cham.height
        target_w = int(target_h * aspect)
        cham_resized = cham.resize((target_w, target_h), Image.Resampling.LANCZOS)
        
        # Position on the right
        x_pos = W - target_w - 40
        y_pos = (H - target_h) // 2 + 10
        img.paste(cham_resized, (x_pos, y_pos), cham_resized)

    out_path = os.path.join(ROOT, "assets/img/og-card.png")
    img.save(out_path, "PNG", optimize=True)
    print(f"Created {out_path} ({os.path.getsize(out_path)} bytes)")

def create_icons():
    # Base icon: chameleon head or favicon
    cham_path = os.path.join(ROOT, "assets/img/cham-hero-eyes.png")
    if not os.path.exists(cham_path):
        cham_path = os.path.join(ROOT, "assets/img/cham-hero.webp")
    base_img = Image.open(cham_path).convert("RGBA")

    sizes = [
        ("assets/apple-touch-icon.png", 180),
        ("assets/icon-192.png", 192),
        ("assets/icon-512.png", 512),
    ]

    for rel_path, s in sizes:
        icon = Image.new("RGBA", (s, s), (247, 243, 236, 255)) # Ivory background
        # Scale base image to 75% of icon size
        pad = int(s * 0.12)
        fit_size = s - 2 * pad
        scaled = base_img.resize((fit_size, fit_size), Image.Resampling.LANCZOS)
        icon.paste(scaled, (pad, pad), scaled)
        out = os.path.join(ROOT, rel_path)
        icon.save(out, "PNG", optimize=True)
        print(f"Created {out} ({s}x{s})")

if __name__ == "__main__":
    create_og_card()
    create_icons()
