// v226 — Application Android (Capacitor) : identité, aucune dépendance externe, adaptations natives, construction.
const fs=require('fs'),path=require('path'),assert=require('assert');const root=path.join(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const cap=JSON.parse(read('capacitor.config.json'));assert.equal(cap.appId,'com.hackenia.dicegame');assert.equal(cap.appName,'Hackénia');assert.equal(cap.webDir,'www');
assert.ok(read('android/app/src/main/res/values/strings.xml').includes('<string name="app_name">Hackénia</string>'));assert.ok(read('android/app/build.gradle').includes('applicationId "com.hackenia.dicegame"'));
// Aucune bibliothèque chargée depuis Internet (l'app doit fonctionner hors ligne dès le premier lancement).
const files=['index.html',...fs.readdirSync(path.join(root,'assets')).filter(f=>f.endsWith('.js')).map(f=>'assets/'+f)];
for(const f of files){const s=read(f);assert.ok(!/cdn\.jsdelivr|unpkg\.com|fonts\.googleapis|raw\.githubusercontent/.test(s),f+' still loads something from the internet')}
for(const f of['assets/vendor/three/build/three.module.min.js','assets/vendor/three/examples/jsm/loaders/GLTFLoader.js','assets/vendor/three/examples/jsm/utils/BufferGeometryUtils.js','assets/vendor/three/examples/jsm/utils/SkeletonUtils.js','assets/vendor/three/examples/jsm/controls/OrbitControls.js','assets/vendor/model-viewer/model-viewer.min.js','assets/vendor/supabase/supabase.js','assets/vendor/fonts/cinzel.css','assets/audio/musique-en-duel.mp3'])assert.ok(fs.existsSync(path.join(root,f)),'Missing '+f);
assert.ok(read('index.html').includes('"three":"./assets/vendor/three/build/three.module.min.js"'));
// Adaptations natives.
const nat=read('assets/native-v226.js');assert.ok(nat.includes("addListener('backButton'")&&nat.includes('Haptics')&&nat.includes('hackenia-app-state'));
assert.ok(read('assets/settings-v171.js').includes("vibration:s.vibration!==false")&&read('assets/settings-v171.js').includes("'hackenia-app-state'"));
assert.ok(read('assets/offline-v225.js').includes('ok=!native&&'),'No service worker inside the app');
// Construction : www sans les sources 3D, signature hors du dépôt, icônes.
const www=read('scripts/build-www.mjs');assert.ok(/Models\|characters\\\/cutouts/.test(www));const g=read('android/app/build.gradle');assert.ok(g.includes('System.getenv("HACKENIA_KEYSTORE")')&&!/storePassword\s+"/.test(g),'Signing secrets never in the repository');
const wf=read('.github/workflows/android.yml');assert.ok(wf.includes('assembleDebug')&&wf.includes('bundleRelease')&&wf.includes('secrets.HACKENIA_KEYSTORE_BASE64'));
for(const d of['mdpi','hdpi','xhdpi','xxhdpi','xxxhdpi'])for(const f of['ic_launcher.png','ic_launcher_round.png','ic_launcher_foreground.png'])assert.ok(fs.existsSync(path.join(root,`android/app/src/main/res/mipmap-${d}/${f}`)));
assert.ok(read('_config.yml').includes('- android'),'Android project not published on the website');
console.log('PASS: com.hackenia.dicegame « Hackénia », no internet libraries, back button/vibrations/background music, no service worker in the app, signed build from secrets, icons, excluded from the website.');
