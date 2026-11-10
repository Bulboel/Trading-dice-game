"""Versions légères des modèles 3D chargés en jeu (v201).

Pour chaque modèle référencé par assets/manifest.json dans Models/Characters/ :
textures redimensionnées à 1024 px et converties en WebP (EXT_texture_webp, lu par Three.js et model-viewer).
La géométrie, les squelettes, les noms d'os et les animations ne sont pas modifiés : les clips extraits
dans assets/characters/ restent compatibles. Les sources restent dans assets/Models/Characters/ (non publiées).

Usage : python3 scripts/optimize-models.py [chemin vers gltf-transform]
         (par défaut : npx @gltf-transform/cli@4.5.1, qui installe aussi sharp)
Puis relancer : node tests/character-assets.cjs et les autres tests.
"""
import json, pathlib, subprocess, sys, tempfile, unicodedata
ROOT = pathlib.Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets'
OUT = ASSETS / 'models-web'
TOOL = sys.argv[1:] or ['npx', '--yes', '@gltf-transform/cli@4.5.1']
SIZE, QUALITY = 1024, 88

def main():
    manifest_path = ASSETS / 'manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    OUT.mkdir(exist_ok=True)
    done = {}
    for key, info in manifest['creatures'].items():
        glb = info.get('glb', '')
        if glb.startswith('models-web/'):
            source_name = glb.split('/', 1)[1]
        elif glb.startswith('Models/Characters/'):
            source_name = glb.split('/', 2)[2]
        else:
            continue
        source = ASSETS / 'Models/Characters' / source_name
        if not source.exists():
            match = [p for p in (ASSETS / 'Models/Characters').iterdir() if unicodedata.normalize('NFC', p.name) == unicodedata.normalize('NFC', source_name)]
            if not match:
                print('absent :', source_name); continue
            source = match[0]
        target = OUT / source.name
        if source.name not in done:
            if not target.exists() or target.stat().st_mtime < source.stat().st_mtime:
                with tempfile.TemporaryDirectory() as tmp:
                    resized = pathlib.Path(tmp) / 'resized.glb'
                    subprocess.run([*TOOL, 'resize', str(source), str(resized), '--width', str(SIZE), '--height', str(SIZE)], check=True, capture_output=True)
                    subprocess.run([*TOOL, 'webp', str(resized), str(target), '--quality', str(QUALITY)], check=True, capture_output=True)
                print(f'{source.name} : {source.stat().st_size/1e6:.1f} Mo → {target.stat().st_size/1e6:.1f} Mo')
            done[source.name] = True
        info['glb'] = 'models-web/' + source.name
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    total = sum(p.stat().st_size for p in OUT.glob('*.glb'))
    print(f'{len(done)} modèles · {total/1e6:.0f} Mo au total dans assets/models-web/')

if __name__ == '__main__':
    main()
