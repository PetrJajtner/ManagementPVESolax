/**
 * Poupravi obsahy souboru v node_modules
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const
  baseDir = path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  encoding = 'utf8',
  mods = [
    /* {
      file: baseDir + '/cesta/k/souboru.js',
      search: /regularni-vyraz/,
      replace: 'nahrazeni'
    } */
  ]
;

for (const mod of mods) {
  try {
    const
      original = fs.readFileSync(mod.file, {encoding}),
      modified = original.replace(mod.search, mod.replace)
    ;
    if (original !== modified) {
      fs.writeFileSync(mod.file, modified, {encoding});

      console.log(`FIX: Soubor „${mod.file}“ uspesne upraven\n`);
    } else {
      console.log(`FIX: U souboru „${mod.file}“ nebyly provedeny zadne zmeny\n`);
    }
  } catch (err) {
    console.error(err);
  }
}
if (!mods.length) {
  console.log('FIX: Nebyly provedeny zadne zmeny');
}
