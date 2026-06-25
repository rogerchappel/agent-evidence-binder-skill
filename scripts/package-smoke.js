#!/usr/bin/env node
import {execFileSync} from 'node:child_process';

const output=execFileSync('npm',['pack','--dry-run','--json'],{encoding:'utf8'});
const [pack]=JSON.parse(output);
const files=new Set((pack.files||[]).map((entry)=>entry.path));
const required=[
  'src/cli.js',
  'src/index.js',
  'scripts/build.js',
  'scripts/check.js',
  'fixtures/claims.json',
  'fixtures/commands.json',
  'README.md',
  'SKILL.md',
  'LICENSE',
  'SECURITY.md'
];
const missing=required.filter((file)=>!files.has(file));
if(missing.length){
  console.error('Missing package files: '+missing.join(', '));
  process.exit(1);
}
console.log('package smoke ok: '+pack.filename);
