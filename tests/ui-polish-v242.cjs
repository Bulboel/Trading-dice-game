// v242 — Lisibilité : indicateurs de PA semi-transparents hors combat, vignettes sans étoiles blanches, portrait divin dans son cadre.
const fs=require('fs'),path=require('path'),assert=require('assert');const read=f=>fs.readFileSync(path.join(__dirname,'..',f),'utf8');
const cl=read('assets/clearing-v105.js'),css=read('assets/progression-v219.css'),html=read('index.html');
assert.ok(cl.includes("badge.style.opacity=String((pose?1-pose.defeat:1)*(i>=0?1:.88))"),'PA labels slightly translucent outside combat, opaque for fighters');
assert.ok(/\.creature-pa\{background:none!important;border:0!important/.test(css)&&css.includes('color:color-mix(in srgb,var(--pa,#9569c5) 62%,#fff)!important'),'v244: PA is plain text in the element colour, no frame or background');
assert.ok(/@media \(max-width:720px\)\{\.creature-pa\{font-size:10px!important/.test(css),'Smaller PA badges on phones');
assert.ok(css.includes('#app #hand .dc.hc.rar-6:not(.pure)::after{content:none!important'),'Divine hand cards lose the white ✦ ✧ ✦ stars');
assert.ok(css.includes('#app #hand .dc.hc.pure3 .hc-art::before')&&css.includes('#app #hand .dc.hc.rar-5:not(.pure) .hc-art::before'),'Energy and legendary cards lose their white star too');
assert.ok(css.includes('.hc-art::after{inset:-4px!important}')&&css.includes('#app #hand .dc.hc{overflow:hidden}'),'Portrait ring stays inside the card (Caleïzis)');
assert.ok(/progression-v219\.css\?v=2026\d{4}-v2\d\d/.test(html),'Stylesheet cache key bumped');
console.log('PASS: PA badges translucent (opaque in combat, smaller on phones); no more white stars on hand cards; divine portrait ring kept inside its frame.');
