#!/usr/bin/env node
import {buildEvidencePack,readJson,writeEvidencePack} from './index.js';
const args=process.argv.slice(2);if(args.includes('--help')){console.log('Usage: agent-evidence-binder --repo <dir> --claims <claims.json> [--commands commands.json] --out <dir>');process.exit(0);}
function val(f,d){const i=args.indexOf(f);return i===-1?d:args[i+1];}
const repoRoot=val('--repo'), claimsFile=val('--claims'), commandFile=val('--commands'), out=val('--out','evidence-out');if(!repoRoot||!claimsFile){console.error('Missing --repo or --claims');process.exit(2);}
const claimData=readJson(claimsFile);const commands=commandFile?(readJson(commandFile).commands||readJson(commandFile)):[];const pack=buildEvidencePack({repoRoot,claims:claimData.claims||claimData,commands});writeEvidencePack(pack,out);console.log('Wrote '+out+'/evidence-pack.json and '+out+'/evidence-summary.md');
