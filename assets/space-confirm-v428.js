/* v428 — Sur ordinateur, la barre Espace valide le choix affiché : « Bloquer ? » (Oui), choix d'un pouvoir, fiches et dialogues
   (bouton principal), scènes de l'Histoire (Suivant). En partie sans choix affiché, Espace garde
   son rôle habituel (lancer le dé posé, valider le déplacement, finir le tour). */
(()=>{'use strict';
const SEL=['#block-ask button[data-b="1"]','#power-choice button:not(.cancel)','#power-sheet [data-ps="use"]','dialog[open]:not(.match-end) .portal-primary:not([data-me])','dialog[open] [data-sk="learn"]','dialog[open] [data-sd="go"]','.story-scene:not([hidden]) [data-ss="next"]','#story-scene:not([hidden]) [data-ss="next"]'];
const visible=el=>!!el&&el.offsetParent!==null&&!el.disabled&&el.getAttribute('aria-disabled')!=='true';
addEventListener('keydown',e=>{if(e.code!=='Space'&&e.key!==' ')return;const t=e.target;if(t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable))return;if(e.repeat)return;
 /* un bouton déjà focalisé : comportement natif du navigateur */if(t&&t.tagName==='BUTTON'&&t!==document.body)return;
 for(const s of SEL){const el=[...document.querySelectorAll(s)].find(visible);if(el){e.preventDefault();e.stopImmediatePropagation();el.click();return}}},true);
})();
