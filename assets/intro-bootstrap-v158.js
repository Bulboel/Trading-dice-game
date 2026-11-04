/* Every page opening starts with the logo, then reveals the start menu. */
(()=>{'use strict';window.hackeniaNeedsIntro=true;document.documentElement.classList.add('intro-pending');setTimeout(()=>{if(!document.getElementById('launch-intro'))document.documentElement.classList.remove('intro-pending')},12000)})();
