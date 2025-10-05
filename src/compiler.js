import fs from 'fs';
import peg from 'pegjs';
import path from 'path';

const grammarPath = new URL('./grammar.pegjs', import.meta.url);
const grammar = fs.readFileSync(grammarPath, 'utf8');
const parser = peg.generate(grammar);

function lint(code) {
  const warnings = [];
  const secretRegex = /secret\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
  const secrets = [];
  let m;
  while ((m = secretRegex.exec(code)) !== null) secrets.push(m[1]);
  const lines = code.split(/\n/);
  lines.forEach((line, idx) => {
    secrets.forEach(s => {
      if (line.includes('console.log') && line.includes(s)) {
        warnings.push({line: idx+1, text: `Possible exposure: console.log contains secret '${s}'`});
      }
      if (line.includes('JSON.stringify') && line.includes(s)) {
        warnings.push({line: idx+1, text: `Possible exposure: JSON.stringify contains secret '${s}'`});
      }
    });
  });
  return warnings;
}

export function compile(code) {
  const warnings = lint(code);
  if (warnings.length) {
    console.warn('Oodi compile warnings:');
    warnings.forEach(w => console.warn(`  line ${w.line}: ${w.text}`));
  }

  const ast = parser.parse(code);

  function gen(node) {
    switch(node.type) {
      case 'Program':
        return node.body.map(gen).join('\n');
      case 'SecretDeclaration':
        return `const ${node.name} = async () => __getSecret(${JSON.stringify(node.name)});`;
      case 'FunctionDeclaration':
        const params = node.params.join(', ');
        const body = node.body.map(gen).join('\n');
        return `export async function ${node.name}(${params}) {\n${indent(body)}\n}`;
      case 'ExpressionStatement':
        return gen(node.expression) + ';';
      case 'CallExpression':
        const dataObj = node.data || {};
        const parts = Object.entries(dataObj).map(([k,v])=>{
          if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(v)) return `${JSON.stringify(k)}: ${v}`;
          return `${JSON.stringify(k)}: ${JSON.stringify(v)}`;
        });
        const data = `{ ${parts.join(', ')} }`;
        return `await __call(${JSON.stringify(node.endpoint)}, ${data})`;
      default:
        throw new Error('Unknown node: ' + node.type);
    }
  }

  function indent(s) { return s.split('\n').map(l=>'  '+l).join('\n'); }

  const header = `import { __getSecret, __call, setAuthToken } from './runtime/oodi-runtime.js';\n\n`;
  return header + gen(ast);
}

// CLI helper
if (process.argv[1].endsWith('compiler.js')) {
  const input = process.argv[2];
  const out = process.argv[3];
  const code = fs.readFileSync(input, 'utf8');
  const js = compile(code);
  fs.writeFileSync(out, js, 'utf8');
  console.log('compiled', input, '->', out);
}
