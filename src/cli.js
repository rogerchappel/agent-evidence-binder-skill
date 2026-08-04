#!/usr/bin/env node
import {buildEvidencePack,readJson,writeEvidencePack} from './index.js';
const args=process.argv.slice(2);
const usage='Usage: agent-evidence-binder --repo <dir> --claims <claims.json> [--commands <commands.json>] [--out <dir>]';
function fail(message){console.error('Error: '+message+'\n'+usage);process.exit(2);}
function parseArgs(tokens){
  const values=new Map();
  let help=false;
  let version=false;
  for(let i=0;i<tokens.length;i+=1){
    const token=tokens[i];
    if(token==='--help'){help=true;continue;}
    if(token==='--version'){version=true;continue;}
    if(!['--repo','--claims','--commands','--out'].includes(token)){
      fail(token.startsWith('-')?'unknown option: '+token:'unexpected argument: '+token);
    }
    if(values.has(token))fail('duplicate option: '+token);
    const value=tokens[i+1];
    if(!value||value.startsWith('--'))fail(token+' requires a value');
    values.set(token,value);
    i+=1;
  }
  return {values,help,version};
}
const parsed=parseArgs(args);
if(parsed.help){console.log(usage);process.exit(0);}
if(parsed.version){const pkg=readJson(new URL('../package.json',import.meta.url));console.log(pkg.version);process.exit(0);}
const repoRoot=parsed.values.get('--repo'),claimsFile=parsed.values.get('--claims'),commandFile=parsed.values.get('--commands'),out=parsed.values.get('--out')||'evidence-out';
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
