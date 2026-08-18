import os, re, json, subprocess
from pathlib import Path

godaddy = Path(r"c:\prilok website assets\PRILOK_WEBSITE_PACKAGE\godaddy")

# 1. Load data.js
js_path = str(godaddy / "data.js").replace("\\", "/")
cmd = ["node", "-e", f'const fs=require("fs"); let window={{}}; eval(fs.readFileSync("{js_path}","utf8")); console.log(JSON.stringify(window.PRILOK_DATA));']
node_out = subprocess.check_output(cmd).decode("utf-8")
data = json.loads(node_out)

materials_in_data = {m['id']: m for m in data['materials']}
print(f"Materials in data.js: {len(materials_in_data)}")

# 2. Inspect catalogue.html
with open(godaddy / "catalogue.html", "r", encoding="utf-8", errors="ignore") as f:
    cat_html = f.read()

# Extract all SKUs mentioned in catalogue.html
skus_in_html = set(re.findall(r'<span class="prod-sku">([A-Z0-9_\-]+)</span>', cat_html, re.IGNORECASE))
# Convert to lowercase for comparison
skus_in_html_lower = {s.lower() for s in skus_in_html}
data_skus = set(materials_in_data.keys())

print(f"SKUs found in catalogue.html: {len(skus_in_html)}")

missing_in_catalogue = data_skus - skus_in_html_lower
extra_in_catalogue = skus_in_html_lower - data_skus

print(f"\nMissing in catalogue.html ({len(missing_in_catalogue)}):")
for m in sorted(missing_in_catalogue):
    print(f"  - {m} ({materials_in_data[m]['name']})")

print(f"\nExtra / Deprecated in catalogue.html ({len(extra_in_catalogue)}):")
for e in sorted(extra_in_catalogue):
    print(f"  - {e}")
