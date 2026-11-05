/* One-time, responsive opening. The SVG layers are the same artwork as the menu logo. */
(()=>{'use strict';const KEY='hackenia-intro-v1',LOGO='assets/hackenia-logo-v112.svg?v=20261105-v163';let active=null,logoPromise;
function logo(){return logoPromise??=fetch(LOGO).then(r=>{if(!r.ok)throw Error('logo');return r.text()})}
function createSmoke(canvas){
 let gl;try{gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,premultipliedAlpha:false,failIfMajorPerformanceCaveat:true,powerPreference:'low-power'})}catch{}if(!gl)return null;
 const vertex='attribute vec2 position;void main(){gl_Position=vec4(position,0.,1.);}';
 const fragment=`#ifdef GL_FRAGMENT_PRECISION_HIGH
 precision highp float;
 #else
 precision mediump float;
 #endif
 uniform vec2 resolution;uniform float time;uniform float progress;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(.8,.6,-.6,.8);for(int i=0;i<4;i++){v+=a*noise(p);p=m*p*2.03+vec2(5.2,1.3);a*=.5;}return v;}
 void main(){vec2 p=(gl_FragCoord.xy-.5*resolution)/resolution.y;p.y-=.07;float t=time*.18;
 vec2 q=vec2(fbm(p*2.+vec2(t,-t*.7)),fbm(p*2.+vec2(4.1+t*.3,2.7-t)));
 vec2 r=vec2(fbm(p*3.+2.7*q+vec2(1.7,-t)),fbm(p*3.+2.9*q+vec2(-t*.6,8.3)));
 float n=fbm(p*4.+3.8*r+vec2(t*.35,-t*.6));float radius=length(p*vec2(.85,1.1));
 float band=exp(-pow((radius-.42-.09*sin(atan(p.y,p.x)*3.+t))/.32,2.));
 float strands=pow(smoothstep(.28,.8,n),2.)+pow(smoothstep(.60,.86,n),3.)*.8;
 float veil=smoothstep(0.,.12,progress)*(1.-smoothstep(.7,1.,progress));
 vec3 jade=vec3(.28,.53,.46),plum=vec3(.43,.33,.48),gold=vec3(.63,.49,.28);
 vec3 color=mix(jade,plum,smoothstep(-.5,.6,p.x+q.y*.25));color=mix(color,gold,pow(smoothstep(.5,.85,r.x),2.)*.7);
 float beam=exp(-pow((p.x+.35*p.y)/.12,2.))*.09;
 float alpha=(strands*band*.64+beam)*veil;gl_FragColor=vec4(color,clamp(alpha,0.,.65));}`;
 function shader(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);throw Error('shader')}return shader}
 let program,buffer,vs,fs;try{vs=shader(gl.VERTEX_SHADER,vertex);fs=shader(gl.FRAGMENT_SHADER,fragment);program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('link');gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0)}catch{gl.getExtension('WEBGL_lose_context')?.loseContext();return null}
 const uniforms={resolution:gl.getUniformLocation(program,'resolution'),time:gl.getUniformLocation(program,'time'),progress:gl.getUniformLocation(program,'progress')};
 return{draw(elapsed,progress){const dpr=Math.min(devicePixelRatio||1,1)*.7,width=Math.floor(innerWidth*dpr),height=Math.floor(innerHeight*dpr);if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height)}gl.uniform2f(uniforms.resolution,width,height);gl.uniform1f(uniforms.time,elapsed/1000);gl.uniform1f(uniforms.progress,progress);gl.drawArrays(gl.TRIANGLES,0,6)},dispose(){gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);gl.getExtension('WEBGL_lose_context')?.loseContext()}};
}
function namespacePaint(svg){const ids=new Map();for(const node of svg.querySelectorAll('defs [id]')){const id=node.getAttribute('id'),next='intro-'+id;ids.set(id,next);node.setAttribute('id',next)}for(const node of svg.querySelectorAll('*'))for(const attribute of [...node.attributes]){if(attribute.value.includes('url(#'))node.setAttribute(attribute.name,attribute.value.replace(/url\(#([^)]*)\)/g,(_,id)=>'url(#'+(ids.get(id)||id)+')'))}}
async function play({force=false}={}){
 if(active)return active.done;
 const panel=document.createElement('section');panel.id='launch-intro';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Bienvenue dans Dice of Hackenia');panel.tabIndex=-1;
 panel.innerHTML='<div class="intro-fallback-mist" aria-hidden="true"></div><canvas class="intro-smoke" aria-hidden="true"></canvas><button type="button" class="intro-skip" aria-label="Passer l’introduction">Passer</button><div class="intro-content"><div class="intro-emblem" aria-hidden="true"></div><h1 class="intro-title">Dice of Hackenia</h1><p class="intro-subtitle">Trading Dice Game</p><span class="intro-rule" aria-hidden="true"></span><button type="button" class="intro-enter">Entrer dans Hackenia</button></div>';
 const previous=document.activeElement,inert=[];for(const element of document.body.children){if(element.tagName==='SCRIPT')continue;inert.push([element,element.inert]);element.inert=true}
 document.body.append(panel);document.documentElement.classList.add('intro-active');document.documentElement.classList.remove('intro-pending');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||window.HackeniaSettings?.get().motion===false;panel.classList.toggle('is-reduced',reduced);panel.querySelector('.intro-enter').disabled=!reduced;
 let frame=0,smoke,dead=false,elapsed=0,previousTime,lastDraw=0,resolveDone;const done=new Promise(r=>resolveDone=r);active={done};
 function finish(){if(dead)return;dead=true;cancelAnimationFrame(frame);smoke?.dispose();try{localStorage.setItem(KEY,'1')}catch{}document.removeEventListener('keydown',key);document.removeEventListener('visibilitychange',visibility);panel.classList.add('is-leaving');for(const [element,value]of inert)element.inert=value;document.documentElement.classList.remove('intro-active','intro-pending');setTimeout(()=>{panel.remove();if(previous?.isConnected)previous.focus({preventScroll:true});active=null;resolveDone()},reduced?180:700)}
 function key(event){if(event.key==='Escape'){event.preventDefault();finish()}if(event.key==='Tab'){const buttons=[...panel.querySelectorAll('button')].filter(button=>!button.disabled),index=buttons.indexOf(document.activeElement);event.preventDefault();buttons[(index+(event.shiftKey?-1:1)+buttons.length)%buttons.length].focus()}}
 function visibility(){panel.dataset.paused=String(document.hidden);previousTime=undefined}
 document.addEventListener('keydown',key);document.addEventListener('visibilitychange',visibility);panel.querySelectorAll('button').forEach(b=>b.onclick=finish);panel.querySelector('.intro-skip').focus({preventScroll:true});
 try{const text=await Promise.race([logo(),new Promise((_,reject)=>setTimeout(()=>reject(Error('timeout')),2500))]);if(dead)return done;const svg=new DOMParser().parseFromString(text,'image/svg+xml').documentElement;if(svg.localName!=='svg')throw Error('svg');namespacePaint(svg);svg.querySelectorAll('#logo-frame path').forEach(path=>{path.setAttribute('pathLength','1000');path.style.setProperty('--final-fill',path.getAttribute('fill-opacity')||'1')});panel.querySelector('.intro-emblem').append(document.importNode(svg,true))}catch{if(dead)return done;const image=document.createElement('img');image.src=LOGO;image.alt='';panel.querySelector('.intro-emblem').append(image)}
 if(dead)return done;
 // Start every layer together after the small vector logo is ready.
 panel.classList.add('is-playing');if(!reduced)smoke=createSmoke(panel.querySelector('canvas'));
 for(let i=0;i<(reduced?0:28);i++){const mote=document.createElement('i');mote.className='intro-mote';mote.style.cssText=`--x:${12+(i*47%76)}%;--y:${24+(i*31%57)}%;--size:${1+i%3*.6}px;--delay:${i%9*.14}s;--drift:${(i%2?1:-1)*(15+i%17)}px`;panel.append(mote)}
 const duration=reduced?1900:7200;
 function tick(now){if(dead)return;frame=requestAnimationFrame(tick);if(document.hidden){previousTime=undefined;return}if(previousTime!==undefined)elapsed+=Math.max(0,now-previousTime);previousTime=now;if(elapsed>=5200)panel.querySelector('.intro-enter').disabled=false;if(now-lastDraw>33){smoke?.draw(elapsed,Math.min(1,elapsed/duration));lastDraw=now}if(elapsed>=duration)finish()}
 frame=requestAnimationFrame(tick);return done;
}
window.HackeniaIntro={play:()=>play({force:true}),get active(){return!!active}};
if(window.hackeniaNeedsIntro)play();else document.documentElement.classList.remove('intro-pending');
})();
