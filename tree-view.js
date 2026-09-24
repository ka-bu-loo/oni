// Deterministic diagram coordinates, independent of DOM measurements.
export function layoutTree(root,horizontal=false){
 // Fold the harvest step into its food output; show each breeding herd only once.
 function compact(n){
  const harvest=n.children.length===1&&n.children[0].kind==='harvest'?n.children[0]:null;
  return {...n,harvest:harvest?{name:harvest.name,amount:harvest.amount,unit:harvest.unit}:null,children:(harvest?harvest.children:n.children).map(compact)};
 }
 root=compact(root);
 const nodes=[],edges=[];let cursor=0,maxDepth=0;
 function visit(n,depth){
  maxDepth=Math.max(maxDepth,depth);
  const entry={node:n,x:0,y:0};nodes.push(entry);
  if(horizontal){entry.x=depth*216;entry.y=cursor*128;if(!n.children.length)cursor++;}
  const children=n.children.map(c=>visit(c,depth+1));
  if(!horizontal){entry.x=children.length?(children[0].x+children.at(-1).x)/2:cursor++*200;entry.y=depth*136;}
  for(const child of children)edges.push({from:entry,to:child});
  return entry;
 }
 visit(root,0);
 return {nodes,edges,width:Math.max(...nodes.map(n=>n.x))+176,height:Math.max(...nodes.map(n=>n.y))+112};
}
export function createTreeView(viewport,canvas,controls){
 let plan,renderNode,size={width:1,height:1},scale=1,x=0,y=0,drag;
 const apply=()=>{canvas.style.left=`${Math.round(x)}px`;canvas.style.top=`${Math.round(y)}px`;canvas.style.transform='none';controls.zoom.value=Math.round(scale*100);};
 function paint(){
  const horizontal=controls.direction.value==='horizontal',px=n=>Math.round(n*scale);
  canvas.style.width=`${px(size.width)}px`;canvas.style.height=`${px(size.height)}px`;
  for(const [key,value] of Object.entries({'node-width':176,'node-height':96,'sprite-size':40,'node-font':14,'number-font':20,'unit-font':11,'node-padding':8,'node-gap':10,'value-height':24,'unit-height':18}))canvas.style.setProperty?.(`--${key}`,`${px(value)}px`);
  viewport.style.height=`${Math.max(420,px(size.height)+48)}px`;
  canvas.innerHTML=`<svg width="${px(size.width)}" height="${px(size.height)}" aria-hidden="true"><defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10" fill="currentColor"/></marker></defs>${size.edges.map(({from:a,to:b})=>{const ax=px(a.x+(horizontal?176:88)),ay=px(a.y+(horizontal?48:96)),bx=px(b.x+(horizontal?0:88)),by=px(b.y+(horizontal?48:0));return `<path class="tree-edge" marker-start="url(#flow-arrow)" d="${horizontal?`M${ax},${ay} H${ax+px(20)} V${by} H${bx}`:`M${ax},${ay} V${ay+px(20)} H${bx} V${by}`}"/>`;}).join('')}</svg>`+size.nodes.map(({node,x,y})=>renderNode(node,px(x),px(y))).join('');
  apply();
 }
 function fit(){scale=Math.max(.01,Math.min(1,(viewport.clientWidth-48)/size.width));x=Math.max(24,(viewport.clientWidth-size.width*scale)/2);y=24;paint();}
 function draw(){if(!plan)return;size=layoutTree(plan,controls.direction.value==='horizontal');const horizontal=controls.direction.value==='horizontal';
  if(controls.auto.checked)fit();else paint();
 }
 function zoom(next,cx=viewport.clientWidth/2,cy=viewport.clientHeight/2){next=Math.min(2,Math.max(.01,next));x=cx-(cx-x)*next/scale;y=cy-(cy-y)*next/scale;scale=next;controls.auto.checked=false;paint();}
 controls.fit.onclick=()=>{controls.auto.checked=true;fit();};controls.auto.onchange=()=>{if(controls.auto.checked)fit();};controls.zoom.onchange=()=>zoom(Number(controls.zoom.value)/100);controls.direction.onchange=draw;
 let lastWidth=0;new ResizeObserver(()=>{if(lastWidth!==viewport.clientWidth){lastWidth=viewport.clientWidth;if(controls.auto.checked&&plan)fit();}}).observe(viewport);
 viewport.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();const r=viewport.getBoundingClientRect();zoom(scale*Math.exp(-e.deltaY*.0015),e.clientX-r.left,e.clientY-r.top);},{passive:false});
 viewport.addEventListener('contextmenu',e=>e.preventDefault());
 viewport.addEventListener('pointerdown',e=>{if(e.button!==1&&e.button!==2)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};viewport.setPointerCapture(e.pointerId);viewport.style.cursor='grabbing';e.preventDefault();});
 viewport.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;x+=e.clientX-drag.x;y+=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;controls.auto.checked=false;apply();});
 const end=()=>{drag=null;viewport.style.cursor='';};viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
 viewport.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='f'){controls.auto.checked=true;fit();}else if(e.key==='+'||e.key==='=')zoom(scale*1.1);else if(e.key==='-')zoom(scale/1.1);else if(e.key.startsWith('Arrow')){x+=e.key==='ArrowLeft'?40:e.key==='ArrowRight'?-40:0;y+=e.key==='ArrowUp'?40:e.key==='ArrowDown'?-40:0;controls.auto.checked=false;apply();}else return;e.preventDefault();});
 return {render(root,renderer){plan=root;renderNode=renderer;draw();}};
}
