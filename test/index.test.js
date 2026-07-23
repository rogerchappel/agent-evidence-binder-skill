import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {promisify} from 'node:util';
import {buildEvidencePack,classifyClaim} from '../src/index.js';
const run=promisify(execFile);
test('requires every cited evidence path before sourcing a claim',()=>{
  const claims=[
    {id:'present',text:'Has complete evidence',evidence:['README.md','src/index.js']},
    {id:'missing',text:'Has no evidence',evidence:['missing.md']},
    {id:'mixed',text:'Has incomplete evidence',evidence:['README.md','missing.md']}
  ];
  const pack=buildEvidencePack({repoRoot:'fixtures/sample-repo',claims});
  assert.equal(pack.claims[0].status,'sourced');
  assert.equal(pack.claims[1].status,'needs-review');
  assert.equal(pack.claims[2].status,'needs-review');
});
test('rejects lexical traversal outside the repository',()=>{
  assert.throws(()=>classifyClaim('fixtures/sample-repo',{id:'x',text:'bad',evidence:['../secret']}),/escapes/);
});
test('rejects symlinked files and directories that escape the repository',t=>{
  const sandbox=fs.mkdtempSync(path.join(os.tmpdir(),'evidence-binder-'));
  t.after(()=>fs.rmSync(sandbox,{recursive:true,force:true}));
  const repo=path.join(sandbox,'repo');
  const outside=path.join(sandbox,'outside');
  fs.mkdirSync(repo);
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside,'secret.txt'),'secret');
  fs.symlinkSync(path.join(outside,'secret.txt'),path.join(repo,'outside-file'));
  fs.symlinkSync(outside,path.join(repo,'outside-dir'));

  assert.throws(
    ()=>classifyClaim(repo,{id:'file',text:'bad file link',evidence:['outside-file']}),
    /escapes/
  );
  assert.throws(
    ()=>classifyClaim(repo,{id:'dir',text:'bad directory link',evidence:['outside-dir/secret.txt']}),
    /escapes/
  );
});
test('accepts symlinks whose targets remain inside the repository',t=>{
  const repo=fs.mkdtempSync(path.join(os.tmpdir(),'evidence-binder-'));
  t.after(()=>fs.rmSync(repo,{recursive:true,force:true}));
  fs.writeFileSync(path.join(repo,'target.txt'),'evidence');
  fs.symlinkSync('target.txt',path.join(repo,'link.txt'));

  const claim=classifyClaim(repo,{id:'safe-link',text:'safe link',evidence:['link.txt']});

  assert.equal(claim.status,'sourced');
  assert.deepEqual(claim.evidence,[{path:'link.txt',exists:true}]);
});
test('CLI fixture output matches the committed expected evidence',async t=>{
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'evidence-binder-cli-'));
  t.after(()=>fs.rmSync(out,{recursive:true,force:true}));
  await run(process.execPath,[
    'src/cli.js',
    '--repo','fixtures/sample-repo',
    '--claims','fixtures/claims.json',
    '--commands','fixtures/commands.json',
    '--out',out
  ]);
  const actual=JSON.parse(fs.readFileSync(path.join(out,'evidence-pack.json'),'utf8'));
  const expected=JSON.parse(fs.readFileSync('fixtures/expected/evidence-pack.json','utf8'));

  assert.deepEqual(actual.claims,expected.claims);
  assert.deepEqual(actual.commands,expected.commands);
  const normalizeGeneratedAt=summary=>summary.replace(/^Generated: .*$/m,'Generated: <dynamic>');
  const actualSummary=fs.readFileSync(path.join(out,'evidence-summary.md'),'utf8');
  const expectedSummary=fs.readFileSync('fixtures/expected/evidence-summary.md','utf8');
  assert.equal(normalizeGeneratedAt(actualSummary),normalizeGeneratedAt(expectedSummary));
});
test('CLI exposes package version',async()=>{const {stdout}=await run(process.execPath,['src/cli.js','--version']);assert.match(stdout,/^0\.1\.0\n$/);});
test('CLI exposes usage help',async()=>{const {stdout}=await run(process.execPath,['src/cli.js','--help']);assert.match(stdout,/Usage: agent-evidence-binder/);assert.match(stdout,/--repo <dir>/);assert.match(stdout,/--claims <claims\.json>/);});
