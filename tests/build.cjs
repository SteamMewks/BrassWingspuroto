const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Script } = require('node:vm');
const { assemble } = require('../scripts/build');

const html = assemble();
for (const name of ['BrassWings-preview.html', 'Brass_Wings_Homeward (5).html']) {
  assert.equal(fs.readFileSync(path.resolve(__dirname, '..', name), 'utf8') === html, true,
    name + ' is stale. Run node scripts/build.js.');
}
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1);
new Script(scripts[0][1]);
console.log('Both tracked HTML files match the assembled classic script and template.');
