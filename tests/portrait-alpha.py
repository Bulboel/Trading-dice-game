"""Guard against opaque background rectangles returning to collectible portraits."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]
for path in (root/'assets/characters').glob('*-*.webp'):
 with Image.open(path).convert('RGBA') as image:
  w,h=image.size
  assert all(image.getpixel(p)[3]==0 for p in [(0,0),(w-1,0),(0,h-1),(w-1,h-1)]),path.name
  assert image.getextrema()[3]==(0,255),path.name
  assert sum(n>0 for n in image.getchannel('A').histogram())>8,'Antialiased edge alpha must survive export'
svg=(root/'assets/hackenia-logo-v106.svg').read_text()
assert '<rect x="0" y="0" width="240" height="240"' not in svg
print(f'PASS: {len(list((root/"assets/characters").glob("*-*.webp")))} portraits have transparent corners, opaque subjects and antialiased edges; logo has no background rectangle.')
