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
test('rejects malformed claim collections with field-specific errors',()=>{
  assert.throws(
    ()=>buildEvidencePack({repoRoot:'fixtures/sample-repo',claims:{}}),
    /claims must be an array/
  );
  assert.throws(
    ()=>buildEvidencePack({repoRoot:'fixtures/sample-repo',claims:[null]}),
    /claims\[0\] must be an object/
  );
  assert.throws(
    ()=>buildEvidencePack({repoRoot:'fixtures/sample-repo',claims:[{id:'x',text:'x',evidence:{}}]}),
    /claims\[0\]\.evidence must be an array/
  );
  for(const [field,value] of [['id',''],['id',' \t '],['text',''],['text','\n']]){
    assert.throws(
      ()=>buildEvidencePack({repoRoot:'fixtures/sample-repo',claims:[{id:'id',text:'text',[field]:value}]}),
      new RegExp(`claims\\[0\\]\\.${field} must be a non-empty string`)
    );
  }
});
test('rejects malformed commands with entry-specific errors',()=>{
  const valid={name:'npm test',status:'pass'};
  for(const [commands,message] of [
    [{},/commands must be an array/],
    [[null],/commands\[0\] must be an object/],
    [[{...valid,name:''}],/commands\[0\]\.name must be a non-empty string/],
    [[{...valid,name:'  '}],/commands\[0\]\.name must be a non-empty string/],
    [[{...valid,status:7}],/commands\[0\]\.status must be a non-empty string/],
    [[{...valid,status:'\n'}],/commands\[0\]\.status must be a non-empty string/]
  ]){
    assert.throws(
      ()=>buildEvidencePack({repoRoot:'fixtures/sample-repo',claims:[],commands}),
      message
    );
  }
});
test('rejects malformed evidence entries with field-specific errors',()=>{
  for(const [evidence,message] of [
    [[''],/claim\.evidence\[0\] must be a non-empty string/],
    [[' \t\n '],/claim\.evidence\[0\] must be a non-empty string/],
    [[{}],/claim\.evidence\[0\]\.path must be a string/],
    [[{path:7}],/claim\.evidence\[0\]\.path must be a string/],
    [[{path:''}],/claim\.evidence\[0\]\.path must be a non-empty string/],
    [[{path:' \t\n '}],/claim\.evidence\[0\]\.path must be a non-empty string/],
    [[null],/claim\.evidence\[0\] must be a string or an object with a path/]
  ]){
    assert.throws(
      ()=>classifyClaim('fixtures/sample-repo',{id:'x',text:'x',evidence}),
      message
    );
  }
});
test('preserves valid file and directory evidence paths',()=>{
  const claim=classifyClaim('fixtures/sample-repo',{
    id:'valid-paths',
    text:'valid file and directory evidence',
    evidence:['README.md',{path:'src'}]
  });

  assert.equal(claim.status,'sourced');
  assert.deepEqual(claim.evidence,[
    {path:'README.md',exists:true},
    {path:'src',exists:true}
  ]);
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
test('accepts file and directory symlinks whose targets remain inside the repository',t=>{
  const repo=fs.mkdtempSync(path.join(os.tmpdir(),'evidence-binder-'));
  t.after(()=>fs.rmSync(repo,{recursive:true,force:true}));
  fs.writeFileSync(path.join(repo,'target.txt'),'evidence');
  fs.mkdirSync(path.join(repo,'target-dir'));
  fs.writeFileSync(path.join(repo,'target-dir','nested.txt'),'evidence');
  fs.symlinkSync('target.txt',path.join(repo,'link.txt'));
  fs.symlinkSync('target-dir',path.join(repo,'link-dir'));

  const claim=classifyClaim(repo,{
    id:'safe-link',
    text:'safe links',
    evidence:['link.txt','link-dir/nested.txt']
  });

  assert.equal(claim.status,'sourced');
  assert.deepEqual(claim.evidence,[
    {path:'link.txt',exists:true},
    {path:path.join('link-dir','nested.txt'),exists:true}
  ]);
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
for(const flag of ['--repo','--claims','--commands','--out']){
  test(`CLI rejects a missing value for ${flag}`,async()=>{
    const args=['src/cli.js','--repo','fixtures/sample-repo','--claims','fixtures/claims.json'];
    const index=args.indexOf(flag);
    if(index===-1)args.push(flag);
    else args.splice(index+1,1);
    await assert.rejects(run(process.execPath,args),error=>{
      assert.equal(error.code,2);
      assert.match(error.stderr,new RegExp(`Error: ${flag} requires a value`));
      assert.match(error.stderr,/Usage: agent-evidence-binder/);
      assert.doesNotMatch(error.stderr,/\n\s+at /);
      return true;
    });
  });
}
const invalidCliCases=[
  {name:'an unknown option',extra:['--bogus'],message:'unknown option: --bogus'},
  {name:'an unexpected positional argument',extra:['stray'],message:'unexpected argument: stray'},
  {name:'a duplicate value-taking flag',extra:['--repo','fixtures/sample-repo'],message:'duplicate option: --repo'}
];
for(const {name,extra,message} of invalidCliCases){
  test(`CLI rejects ${name} before creating output`,async t=>{
    const sandbox=fs.mkdtempSync(path.join(os.tmpdir(),'evidence-binder-invalid-cli-'));
    t.after(()=>fs.rmSync(sandbox,{recursive:true,force:true}));
    const out=path.join(sandbox,'output');
    const args=[
      path.resolve('src/cli.js'),
      '--repo',path.resolve('fixtures/sample-repo'),
      '--claims',path.resolve('fixtures/claims.json'),
      '--out',out,
      ...extra
    ];

    await assert.rejects(run(process.execPath,args,{cwd:sandbox}),error=>{
      assert.equal(error.code,2);
      assert.match(error.stderr,new RegExp(`Error: ${message}`));
      assert.match(error.stderr,/Usage: agent-evidence-binder/);
      assert.doesNotMatch(error.stderr,/\n\s+at /);
      return true;
    });
    assert.equal(fs.existsSync(out),false);
    assert.deepEqual(fs.readdirSync(sandbox),[]);
  });
}
test('CLI rejects malformed claims without creating output',async t=>{
  const sandbox=fs.mkdtempSync(path.join(os.tmpdir(),'evidence-binder-invalid-claims-'));
  t.after(()=>fs.rmSync(sandbox,{recursive:true,force:true}));
  const claims=path.join(sandbox,'claims.json');
  const out=path.join(sandbox,'output');
  fs.writeFileSync(claims,JSON.stringify({claims:[{id:'x',text:'x',evidence:[{}]}]}));

  await assert.rejects(run(process.execPath,[
    path.resolve('src/cli.js'),
    '--repo',path.resolve('fixtures/sample-repo'),
    '--claims',claims,
    '--out',out
  ],{cwd:sandbox}),error=>{
    assert.equal(error.code,2);
    assert.match(error.stderr,/Error: claims\[0\]\.evidence\[0\]\.path must be a string/);
    assert.doesNotMatch(error.stderr,/paths\[|\n\s+at /);
    return true;
  });
  assert.equal(fs.existsSync(out),false);
  assert.deepEqual(fs.readdirSync(sandbox),['claims.json']);
});
test('CLI rejects blank evidence paths without creating output',async t=>{
  const sandbox=fs.mkdtempSync(path.join(os.tmpdir(),'evidence-binder-blank-evidence-'));
  t.after(()=>fs.rmSync(sandbox,{recursive:true,force:true}));
  const claims=path.join(sandbox,'claims.json');
  const out=path.join(sandbox,'output');
  fs.writeFileSync(claims,JSON.stringify({claims:[{id:'x',text:'x',evidence:[{path:'  '}]}]}));

  await assert.rejects(run(process.execPath,[
    path.resolve('src/cli.js'),
    '--repo',path.resolve('fixtures/sample-repo'),
    '--claims',claims,
    '--out',out
  ],{cwd:sandbox}),error=>{
    assert.equal(error.code,2);
    assert.match(error.stderr,/Error: claims\[0\]\.evidence\[0\]\.path must be a non-empty string/);
    assert.doesNotMatch(error.stderr,/\n\s+at /);
    return true;
  });
  assert.equal(fs.existsSync(out),false);
  assert.deepEqual(fs.readdirSync(sandbox),['claims.json']);
});
for(const wrapped of [false,true]){
  test(`CLI rejects malformed ${wrapped?'wrapped':'unwrapped'} commands without creating output`,async t=>{
    const sandbox=fs.mkdtempSync(path.join(os.tmpdir(),'evidence-binder-invalid-commands-'));
    t.after(()=>fs.rmSync(sandbox,{recursive:true,force:true}));
    const commandsFile=path.join(sandbox,'commands.json');
    const out=path.join(sandbox,'output');
    const commands=[{name:'npm test',status:' '}];
    fs.writeFileSync(commandsFile,JSON.stringify(wrapped?{commands}:commands));

    await assert.rejects(run(process.execPath,[
      path.resolve('src/cli.js'),
      '--repo',path.resolve('fixtures/sample-repo'),
      '--claims',path.resolve('fixtures/claims.json'),
      '--commands',commandsFile,
      '--out',out
    ],{cwd:sandbox}),error=>{
      assert.equal(error.code,2);
      assert.match(error.stderr,/Error: commands\[0\]\.status must be a non-empty string/);
      assert.doesNotMatch(error.stderr,/\n\s+at /);
      return true;
    });
    assert.equal(fs.existsSync(out),false);
    assert.deepEqual(fs.readdirSync(sandbox),['commands.json']);
  });
}
