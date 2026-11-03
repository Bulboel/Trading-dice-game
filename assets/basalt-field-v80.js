/* One continuous fracture field. Broad molten junctions and hairline seams share the same warped plate boundaries. */
export function createBasaltField(seed=9167){
 let state=seed>>>0;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const cols=9,rows=10,sites=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)sites.push({x:(x+.1+random()*.8)/cols,y:(y+.1+random()*.8)/rows,shade:random()});
 const hash=(x,y)=>{let n=Math.imul(x,374761393)^Math.imul(y,668265263)^seed;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967295};
 const smooth=t=>t*t*(3-2*t),lerp=(a,b,t)=>a+(b-a)*t;
 function noise(x,y){const X=Math.floor(x),Y=Math.floor(y),u=smooth(x-X),v=smooth(y-Y);return lerp(lerp(hash(X,Y),hash(X+1,Y),u),lerp(hash(X,Y+1),hash(X+1,Y+1),u),v)}
 function warp(u,v){return{x:u+(noise(u*5+13,v*5)-.5)*.064+(noise(u*19,v*19+7)-.5)*.017+(noise(u*67+11,v*67)-.5)*.0045,y:v+(noise(u*5+71,v*5+9)-.5)*.064+(noise(u*21+3,v*21)-.5)*.017+(noise(u*63,v*63+19)-.5)*.0045}}
 function unwarp(x,y){let u=x,v=y;for(let i=0;i<4;i++){const p=warp(u,v);u+=x-p.x;v+=y-p.y}return{x:u,y:v}}
 const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),ramp=(a,b,x)=>smooth(clamp((x-a)/(b-a)));
 function sample(u,v,out={}){
  const p=warp(u,v),gx=Math.floor(p.x*cols),gy=Math.floor(p.y*rows);let d1=Infinity,d2=Infinity,a=0,b=0;
  for(let y=Math.max(0,gy-2);y<=Math.min(rows-1,gy+2);y++)for(let x=Math.max(0,gx-2);x<=Math.min(cols-1,gx+2);x++){const id=y*cols+x,s=sites[id],d=(p.x-s.x)**2+(p.y-s.y)**2;if(d<d1){d2=d1;b=a;d1=d;a=id}else if(d<d2){d2=d;b=id}}
  const A=sites[a],B=sites[b],span=Math.hypot(A.x-B.x,A.y-B.y)||1,edge=Math.max(0,(d2-d1)/(2*span)),branch=hash(Math.min(a,b)+31,Math.max(a,b)+17),flow=noise(u*28+9,v*28),broad=branch>.71;
  const width=(broad?.006:.0021)+(broad?.006:.0025)*noise(u*11+5,v*11+37),t=edge/width,crack=1-ramp(.72,1.12,t),core=1-ramp(.05,.95,t),halo=1-ramp(width,width+.009,edge),bevel=ramp(width*.75,width+.006,edge),grain=noise(u*650,v*650)-.5,stone=noise(u*58,v*58),micro=Math.abs(noise(u*90+23,v*90+13)-.5);
  out.edge=edge;out.width=width;out.crack=crack;out.core=core;out.heat=clamp(.4+core*.48+(flow-.5)*.22);out.halo=halo;out.bevel=bevel;out.grain=grain;out.shade=A.shade;out.stone=stone;out.micro=micro<.012&&noise(u*15,v*15)>.5?(1-micro/.012):0;out.edgeLight=((B.x-A.x)*-.6+(B.y-A.y)*-.8)/span;return out;
 }
 // Clipped cells provide raised, bevelled crust at the board's outer edge.
 function cells(){return sites.map((site,id)=>{let poly=[[0,0],[1,0],[1,1],[0,1]];for(let j=0;j<sites.length&&poly.length;j++){if(j===id)continue;const q=sites[j],nx=q.x-site.x,ny=q.y-site.y,limit=(q.x*q.x+q.y*q.y-site.x*site.x-site.y*site.y)/2,next=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=a[0]*nx+a[1]*ny-limit,db=b[0]*nx+b[1]*ny-limit;if(da<=0)next.push(a);if((da<0)!==(db<0)){const t=da/(da-db);next.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t])}}poly=next}const points=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];for(let k=0;k<4;k++){const t=k/4,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,p=unwarp(site.x+(x-site.x)*.91,site.y+(y-site.y)*.91);points.push(p)}}return{site,points}})}
 return{sites,sample,cells,noise};
}
