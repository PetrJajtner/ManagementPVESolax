/**
 * Zformatuje vystupni soubor index.html
 */
import fs from 'fs';
import path from 'path';
import pretty from 'pretty';
import { fileURLToPath } from 'url';

const
  baseDir = path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  encoding = 'utf8',

  angularJson = JSON.parse(fs.readFileSync(path.join(baseDir, 'angular.json'), encoding)),
  packageJson = JSON.parse(fs.readFileSync(path.join(baseDir, 'package.json'), encoding)),

  options = angularJson.projects[Object.keys(angularJson.projects)[0]].architect.build.options,

  sourceDir = path.join(baseDir, options.outputPath.base),
  scriptDir = path.join(sourceDir, 'scripts'),
  stylesDir = path.join(sourceDir, 'styles'),

  indexFile = path.join(sourceDir, 'index.html'),

  searchForJS = /src=\"(.*?)(\.js).*?\"/g,
  searchForCSS = /href=\"(.*?)(\.css).*?\"/g
;

try {
  if (!fs.existsSync(scriptDir)) {
    fs.mkdirSync(scriptDir);
  }
  if (!fs.existsSync(stylesDir)) {
    fs.mkdirSync(stylesDir);
  }

  const
    build = packageJson.version.split('-')[1] ?? '0',
    files = (fs.readdirSync(sourceDir, {encoding}) || []),
    jsFiles = files.filter((file) => '.js' === path.extname(file)),
    cssFiles = files.filter((file) => '.css' === path.extname(file)),
    renameToBN = (basename, extension) => {
      const
        from = path.join(sourceDir, `${basename}${extension}`),
        to = path.join(sourceDir, `${basename}.${build}${extension}`)
      ;
      fs.existsSync(from) && fs.renameSync(from, to);
    }
  ;
  if (jsFiles.length) {
    jsFiles.forEach((jsFile) => fs.renameSync(path.join(sourceDir, jsFile), path.join(scriptDir, jsFile)));
  }
  if (cssFiles.length) {
    cssFiles.forEach((cssFile) => fs.renameSync(path.join(sourceDir, cssFile), path.join(stylesDir, cssFile)));
  }

  const original = fs.readFileSync(indexFile, {encoding});
  let modified = (pretty(original, {ocd: true}) || '').replace(/^\s+/, '') + '\n';

  modified = modified.replace(/<meta(.*[^\/])?>/g, '<meta$1 />');
  modified = modified.replace(/<base(.*[^\/])?>/g, '<base$1 />');
  modified = modified.replace(/<link(.*[^\/])?>/g, '<link$1 />');

  modified = modified.replace(/(<link\s+rel="stylesheet")\s+(href=)/g, '$1 type="text/css" $2');

  modified = modified.replace(searchForJS, (...matches) => {
    renameToBN(matches[1], matches[2]);
    !matches[1].startsWith('scripts/') && (matches[1] = 'scripts/' + matches[1]);
    renameToBN(matches[1], matches[2]);
    return `src="${matches[1]}.${build}${matches[2]}"`;
  });
  modified = modified.replace(searchForCSS, (...matches) => {
    !matches[1].startsWith('styles/') && (matches[1] = 'styles/' + matches[1]);
    !matches[1].includes('theme-') && renameToBN(matches[1], matches[2]);
    return `href="${matches[1]}.${build}${matches[2]}"`;
  });

  if (original !== modified) {
    console.log(`PRETTIFY: Cislo buildu: ${build}\n`);

    fs.writeFileSync(indexFile, modified, {encoding});

    console.log(`PRETTIFY: Soubor „${indexFile}“ uspesne upraven\n`);
  } else {
    console.log(`PRETTIFY: U souboru „${indexFile}“ nebyly provedeny zadne zmeny\n`);
  }

  const filesToRemove = [
    '3rdpartylicenses.txt',
    'prerendered-routes.json'
  ];
  for (const fileToRemove of filesToRemove) {
    const filename = path.normalize(path.join(sourceDir, fileToRemove));
    if (fs.existsSync(filename)) {
      fs.unlinkSync(filename);

      console.log(`PRETTIFY: Soubor „${filename}“ uspesne odstranen\n`);
    }
  }
} catch (err) {
  console.error(err);
}
