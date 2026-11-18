"""v406 — Compression des modèles 3D publiés (EXT_meshopt_compression) : géométrie et animations quantifiées puis compressées.
Gain ≈ 50 % sans différence visible (vérifié côte à côte). Les textures (déjà en WebP) ne sont pas touchées.
Le jeu lit ces fichiers grâce au décodeur intégré : assets/vendor/three/examples/jsm/libs/meshopt_decoder.module.js
(branché par défaut dans GLTFLoader) et assets/vendor/meshopt/meshopt_decoder.js (model-viewer, voir loadMV dans index.html).
Un fichier déjà compressé est laissé tel quel. Lancé automatiquement à la fin de optimize-models.py et build-character-assets.py.
Usage : python3 scripts/compress-models.py [chemin vers gltf-transform]"""
import pathlib, subprocess, sys, tempfile
ROOT = pathlib.Path(__file__).resolve().parents[1]
TOOL = sys.argv[1:] or ['npx', '--yes', '@gltf-transform/cli@4.5.1']
DIRS = [ROOT / 'assets' / 'models-web', ROOT / 'assets' / 'characters']

def compress_all(tool=TOOL):
    done = skipped = 0
    for d in DIRS:
        for f in sorted(d.glob('*.glb')):
            if b'EXT_meshopt_compression' in f.read_bytes()[:200000]:
                skipped += 1
                continue
            with tempfile.TemporaryDirectory() as tmp:
                out = pathlib.Path(tmp) / 'out.glb'
                subprocess.run([*tool, 'meshopt', str(f), str(out), '--level', 'medium'], check=True, capture_output=True)
                f.write_bytes(out.read_bytes())
            done += 1
    print(f'Modèles compressés : {done} (déjà compressés : {skipped})')

if __name__ == '__main__':
    compress_all()
