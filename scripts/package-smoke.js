#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const projectRoot=fileURLToPath(new URL('../',import.meta.url));
const output=execFileSync('npm',['pack','--json'],{cwd:projectRoot,encoding:'utf8'});
const [pack]=JSON.parse(output);
const files=new Set((pack.files||[]).map((entry)=>entry.path));
const required=[
  'src/cli.js',
  'src/index.js',
  'scripts/build.js',
  'scripts/check.js',
  'fixtures/claims.json',
  'fixtures/commands.json',
  'fixtures/expected/evidence-pack.json',
  'fixtures/expected/evidence-summary.md',
  'docs/API.md',
  'docs/EXAMPLES.md',
  'docs/RELEASE_CANDIDATE.md',
  'docs/RELEASE_CHECKLIST.md',
  'README.md',
  'SKILL.md',
  'LICENSE',
  'SECURITY.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md'
];
const missing=required.filter((file)=>!files.has(file));
if(missing.length){
  console.error('Missing package files: '+missing.join(', '));
  process.exit(1);
}
const tarball=path.join(projectRoot,pack.filename);
const consumer=fs.mkdtempSync(path.join(os.tmpdir(),'evidence-binder-package-'));
try{
  execFileSync('npm',['init','--yes'],{cwd:consumer,stdio:'ignore'});
  execFileSync('npm',['install',tarball],{cwd:consumer,stdio:'ignore'});
  execFileSync(process.execPath,[
    '--input-type=module',
    '--eval',
    'import {classifyClaim} from "agent-evidence-binder-skill"; if(typeof classifyClaim!=="function")process.exit(1)'
  ],{cwd:consumer,stdio:'inherit'});
  const bin=path.join(consumer,'node_modules','.bin','agent-evidence-binder');
  execFileSync(bin,['--help'],{cwd:consumer,stdio:'ignore'});
  execFileSync(bin,['--version'],{cwd:consumer,stdio:'ignore'});
}finally{
  fs.rmSync(consumer,{recursive:true,force:true});
  fs.rmSync(tarball,{force:true});
}
console.log('package smoke ok: installed '+pack.filename+' and verified import/help/version');
