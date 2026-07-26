#!/usr/bin/env node
import {buildEvidencePack,readJson,writeEvidencePack} from './index.js';
const args=process.argv.slice(2);
const usage='Usage: agent-evidence-binder --repo <dir> --claims <claims.json> [--commands <commands.json>] [--out <dir>]';
if(args.includes('--help')){console.log(usage);process.exit(0);}
if(args.includes('--version')){const pkg=readJson(new URL('../package.json',import.meta.url));console.log(pkg.version);process.exit(0);}
function fail(message){console.error('Error: '+message+'\n'+usage);process.exit(2);}
function val(flag,defaultValue){
  const i=args.indexOf(flag);
  if(i===-1)return defaultValue;
  const value=args[i+1];
  if(!value||value.startsWith('--'))fail(flag+' requires a value');
  return value;
}
const repoRoot=val('--repo'),claimsFile=val('--claims'),commandFile=val('--commands'),out=val('--out','evidence-out');
if(!repoRoot)fail('--repo is required');
if(!claimsFile)fail('--claims is required');
try{
  const claimData=readJson(claimsFile);
  const commandData=commandFile?readJson(commandFile):[];
  const commands=commandData.commands||commandData;
  const pack=buildEvidencePack({repoRoot,claims:claimData.claims||claimData,commands});
  writeEvidencePack(pack,out);
  console.log('Wrote '+out+'/evidence-pack.json and '+out+'/evidence-summary.md');
}catch(error){
  fail(error instanceof Error?error.message:String(error));
}
