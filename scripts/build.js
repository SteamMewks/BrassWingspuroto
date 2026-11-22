const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, 'src', name), 'utf8');

function assemble() {
  const order = JSON.parse(read('script-order.json'));
  const sections = {
    STYLES: read('styles/main.css'),
    SCRIPTS: order.map(read).join('')
  };
  return read('index.template.html').replace(/\{\{(STYLES|SCRIPTS)\}\}/g, (_, key) => sections[key]);
}

if (require.main === module) {
  const html = assemble();
  for (const name of ['BrassWings-preview.html', 'Brass_Wings_Homeward (5).html']) {
    fs.writeFileSync(path.join(root, name), html);
  }
}

module.exports = { assemble };
