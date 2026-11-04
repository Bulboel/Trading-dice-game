/* Match completion emits once in the engine; only the two playable AI modes pay out. */
(()=>{'use strict';function amount(won,mode){return['quick','play'].includes(mode)?won?30:5:0}function plan(profile,won,mode){const gold=amount(won,mode);if(!gold)return null;const next=structuredClone(profile);next.gold+=gold;return next}window.HackeniaMatchRewards={amount,plan};})();
