import test from 'node:test';
import assert from 'node:assert/strict';
import {buildEvidencePack,classifyClaim} from '../src/index.js';
test('classifies sourced and review claims',()=>{const pack=buildEvidencePack({repoRoot:'fixtures/sample-repo',claims:[{id:'c1',text:'Has README',evidence:['README.md']},{id:'c2',text:'Unknown',evidence:['missing.md']}]});assert.equal(pack.claims[0].status,'sourced');assert.equal(pack.claims[1].status,'needs-review');});
test('rejects escaping paths',()=>{assert.throws(()=>classifyClaim('fixtures/sample-repo',{id:'x',text:'bad',evidence:['../secret']}),/escapes/);});
