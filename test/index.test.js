import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {buildEvidencePack,classifyClaim} from '../src/index.js';
const run=promisify(execFile);
test('classifies sourced and review claims',()=>{const pack=buildEvidencePack({repoRoot:'fixtures/sample-repo',claims:[{id:'c1',text:'Has README',evidence:['README.md']},{id:'c2',text:'Unknown',evidence:['missing.md']}]});assert.equal(pack.claims[0].status,'sourced');assert.equal(pack.claims[1].status,'needs-review');});
test('rejects escaping paths',()=>{assert.throws(()=>classifyClaim('fixtures/sample-repo',{id:'x',text:'bad',evidence:['../secret']}),/escapes/);});
test('CLI exposes package version',async()=>{const {stdout}=await run(process.execPath,['src/cli.js','--version']);assert.match(stdout,/^0\.1\.0\n$/);});
