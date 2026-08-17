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
function validateClaim(claim,label){
  if(claim===null||typeof claim!=='object'||Array.isArray(claim)){
    throw new TypeError(label+' must be an object');
  }
  if(typeof claim.id!=='string'||claim.id.trim()==='') throw new TypeError(label+'.id must be a non-empty string');
  if(typeof claim.text!=='string'||claim.text.trim()==='') throw new TypeError(label+'.text must be a non-empty string');
  if(claim.inference!==undefined&&typeof claim.inference!=='boolean'){
    throw new TypeError(label+'.inference must be a boolean');
  }
  if(claim.evidence!==undefined&&!Array.isArray(claim.evidence)){
    throw new TypeError(label+'.evidence must be an array');
  }
  const evidence=claim.evidence||[];
  return evidence.map((item,index)=>{
    const itemLabel=label+'.evidence['+index+']';
    if(typeof item==='string'){
      if(item.trim()==='') throw new TypeError(itemLabel+' must be a non-empty string');
      return item;
    }
    if(item===null||typeof item!=='object'||Array.isArray(item)){
      throw new TypeError(itemLabel+' must be a string or an object with a path');
    }
    if(typeof item.path!=='string') throw new TypeError(itemLabel+'.path must be a string');
    if(item.path.trim()==='') throw new TypeError(itemLabel+'.path must be a non-empty string');
    return item.path;
  });
}
function validateCommands(commands){
  if(!Array.isArray(commands)) throw new TypeError('commands must be an array');
  for(const [index,command] of commands.entries()){
    const label='commands['+index+']';
    if(command===null||typeof command!=='object'||Array.isArray(command)){
      throw new TypeError(label+' must be an object');
    }
    if(typeof command.name!=='string'||command.name.trim()===''){
      throw new TypeError(label+'.name must be a non-empty string');
    }
    if(typeof command.status!=='string'||command.status.trim()===''){
      throw new TypeError(label+'.status must be a non-empty string');
    }
  }
}
function classifyValidatedClaim(repoRoot,claim,label){
  const evidence=validateClaim(claim,label);
  const checked=evidence.map(target=>inspectEvidencePath(repoRoot,target));
  const complete=checked.length>0&&checked.every(x=>x.exists);
  const status=complete?'sourced':(claim.inference?'inferred':'needs-review');
  return {id:claim.id,text:claim.text,status,evidence:checked,note:claim.note||''};
}
export function classifyClaim(repoRoot,claim){return classifyValidatedClaim(repoRoot,claim,'claim');}
export function buildEvidencePack({repoRoot,claims=[],commands=[]}){
  if(!Array.isArray(claims)) throw new TypeError('claims must be an array');
  validateCommands(commands);
  return {generatedAt:new Date().toISOString(),repoRoot:path.resolve(repoRoot),claims:claims.map((claim,index)=>classifyValidatedClaim(repoRoot,claim,'claims['+index+']')),commands};
}
export function renderSummary(pack){const counts=pack.claims.reduce((a,c)=>{a[c.status]=(a[c.status]||0)+1;return a;},{});const lines=['# Evidence Summary','','Generated: '+pack.generatedAt,'','## Status Counts'];for(const k of ['sourced','inferred','needs-review']) lines.push('- '+k+': '+(counts[k]||0));lines.push('','## Claims');for(const c of pack.claims) lines.push('- ['+c.status+'] '+c.id+': '+c.text);return lines.join('\n')+'\n';}
export function writeEvidencePack(pack,outDir){fs.mkdirSync(outDir,{recursive:true});fs.writeFileSync(path.join(outDir,'evidence-pack.json'),JSON.stringify(pack,null,2)+'\n');fs.writeFileSync(path.join(outDir,'evidence-summary.md'),renderSummary(pack));}
