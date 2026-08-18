import re, os
from pathlib import Path

godaddy = Path(r"c:\prilok website assets\PRILOK_WEBSITE_PACKAGE\godaddy")
with open(godaddy / "catalogue.html", "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

img_srcs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', text)
print(f"Total images referenced in catalogue.html: {len(img_srcs)}")

missing = []
for src in img_srcs:
    clean_src = src.split("?")[0].split("#")[0]
    p = godaddy / clean_src
    if not p.exists():
        missing.append(src)

if missing:
    print(f"Missing images in catalogue.html ({len(missing)}):")
    for m in set(missing):
        print("  -", m)
else:
    print("100% of images referenced in catalogue.html exist on disk!")
