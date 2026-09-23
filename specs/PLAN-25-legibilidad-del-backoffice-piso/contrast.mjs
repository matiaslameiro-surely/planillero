// Contraste WCAG 2.1 y escaneo de colores de texto del backoffice.
import fs from 'node:fs'; import path from 'node:path';
export function hex(h){h=h.replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');if(h.length===8)h=h.slice(0,6);return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16));}
const lin=c=>{c/=255;return c<=0.03928?c/12.92:((c+0.055)/1.055)**2.4;};
export const L=h=>{const [r,g,b]=hex(h);return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b);};
export const ratio=(a,b)=>{const x=L(a),y=L(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);};
if (process.argv[2]==='scan'){
  const root=process.argv[3]; const out=[];
  const walk=d=>{for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory())walk(p);else if(/\.(scss|css|ts)$/.test(f)&&!/spec/.test(f))scan(p);}};
  const scan=p=>{const s=fs.readFileSync(p,'utf8');
    // bloques "selector { decls }" planos (sirve para scss simple y css minificado)
    const re=/([^{};]+)\{([^{}]*)\}/g;let m;
    while((m=re.exec(s))){const decl=m[2];const c=decl.match(/(?:^|[;\s])color:\s*(#[0-9a-fA-F]{3,8})/);if(!c)continue;
      const bg=decl.match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,8})/);const fsz=decl.match(/font-size:\s*([^;]+)/);
      const b=bg?bg[1]:'#ffffff';const r=ratio(c[1],b);
      const line=s.slice(0,m.index).split('\n').length;
      out.push({file:path.relative(root,p),line,sel:m[1].trim().split('\n').pop().trim().slice(0,40),color:c[1],bg:b+(bg?'':' (supuesto)'),size:fsz?fsz[1].trim():'',ratio:r.toFixed(2)});}};
  walk(root); out.filter(o=>+o.ratio<4.5).sort((a,b)=>a.ratio-b.ratio).forEach(o=>console.log(`${o.ratio}\t${o.color} / ${o.bg}\t${o.size}\t${o.file}:${o.line}\t${o.sel}`));
  console.log('total pares con color:',out.length,' fallan <4.5:',out.filter(o=>+o.ratio<4.5).length);
}
