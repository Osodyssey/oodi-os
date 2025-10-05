#!/usr/bin/env node
import fs from 'fs';
import { compile } from './compiler.js';
import minimist from 'minimist';
import path from 'path';

const argv = minimist(process.argv.slice(2));
const cmd = argv._[0];

if (cmd === 'build') {
  const input = argv._[1];
  if (!input) {
    console.error('Usage: oodi build input.oodi -o out.js');
    process.exit(1);
  }
  const out = argv.o || argv.output || path.basename(input).replace(/\.oodi$/, '.js');
  const code = fs.readFileSync(input, 'utf8');
  const js = compile(code);
  fs.writeFileSync(out, js, 'utf8');
  console.log('Built', input, '->', out);
} else {
  console.log('Usage: oodi build input.oodi -o out.js');
}
