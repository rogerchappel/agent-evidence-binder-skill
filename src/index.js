import fs from 'node:fs';
import path from 'node:path';
export function readJson(file){return JSON.parse(fs.readFileSync(file,'utf8'));}
export function ensureInside(root,target){const base=path.resolve(root);const resolved=path.resolve(base,target);if(resolved!==base&&!resolved.startsWith(base+path.sep)) throw new Error('Path escapes repository root: '+target);return resolved;}
function inspectEvidencePath(repoRoot,target){
  const base=path.resolve(repoRoot);
  const file=ensureInside(base,target);
  const realBase=fs.realpathSync(base);
  let existing=file;
  const missing=[];
  let realExisting;
  while(!realExisting){
    try{
      realExisting=fs.realpathSync(existing);
    }catch(error){
      if(error.code!=='ENOENT'&&error.code!=='ENOTDIR') throw error;
      const parent=path.dirname(existing);
      if(parent===existing) throw error;
      missing.unshift(path.basename(existing));
      existing=parent;
    }
  }
  const realFile=path.resolve(realExisting,...missing);
  ensureInside(realBase,realFile);
  return {path:path.relative(base,file),exists:missing.length===0};
}
export function classifyClaim(repoRoot,claim){const evidence=Array.isArray(claim.evidence)?claim.evidence:[];const checked=evidence.map((item)=>{const p=typeof item==='string'?item:item.path;return inspectEvidencePath(repoRoot,p);});const complete=checked.length>0&&checked.every((x)=>x.exists);const status=complete?'sourced':(claim.inference?'inferred':'needs-review');return {id:claim.id,text:claim.text,status,evidence:checked,note:claim.note||''};}
export function buildEvidencePack({repoRoot,claims=[],commands=[]}){return {generatedAt:new Date().toISOString(),repoRoot:path.resolve(repoRoot),claims:claims.map((c)=>classifyClaim(repoRoot,c)),commands};}
export function renderSummary(pack){const counts=pack.claims.reduce((a,c)=>{a[c.status]=(a[c.status]||0)+1;return a;},{});const lines=['# Evidence Summary','','Generated: '+pack.generatedAt,'','## Status Counts'];for(const k of ['sourced','inferred','needs-review']) lines.push('- '+k+': '+(counts[k]||0));lines.push('','## Claims');for(const c of pack.claims) lines.push('- ['+c.status+'] '+c.id+': '+c.text);return lines.join('\n')+'\n';}
export function writeEvidencePack(pack,outDir){fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(path.join(outDir,'evidence-pack.json'),JSON.stringify(pack,null,2)+'\n');fs.writeFileSync(path.join(outDir,'evidence-summary.md'),renderSummary(pack));}
