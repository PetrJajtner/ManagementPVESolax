/* eslint-disable no-undef */
/**
 * Nahradi obsah souboru src/app/app.settings.ts sablonou se statickou konfiguraci
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

Date.prototype.toLocalJSON = function() {
  const
    pad = (n, len = 2) => `${Math.floor(Math.abs(n))}`.padStart(len, '0'),
    offset = -this.getTimezoneOffset(),
    tz = 0 === offset ? 'Z' : ((offset > 0 ? '+' : '-') + pad(offset / 60) + ':' + pad(offset % 60))
  ;
  return this.getFullYear() + '-' + pad(this.getMonth() + 1) + '-' + pad(this.getDate()) + 'T' +
         pad(this.getHours()) + ':' + pad(this.getMinutes()) + ':' + pad(this.getSeconds()) + '.' + pad(this.getMilliseconds(), 3) + tz;
};

const
  baseDir = path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  encoding = 'utf8',
  angularJson = JSON.parse(fs.readFileSync(path.join(baseDir, 'angular.json'), {encoding})),
  packageJson = JSON.parse(fs.readFileSync(path.join(baseDir, 'package.json'), {encoding})),
  settingsFile = path.join(baseDir, '/src/app/app.settings.ts')
;

let template = `/**
 * POZOR!!! Tento soubor je generovan AUTOMATICKY. Jakekoliv upravy tohoto
 * souboru budou ztraceny. Pro stalou upravu jdete do /bin/app.settings.js.
 */

/**
 * Staticka konfigurace aplikace
 */
export const APPLICATION_BUILD   = '%APP_BUILD%';
export const APPLICATION_DATE    = '%APP_DATE%';
export const APPLICATION_NAME    = '%APP_NAME%';
export const APPLICATION_VERSION = '%APP_VERSION%';
`;

try {
  const
    name = Object.keys(angularJson.projects)[0],
    [version, build] = packageJson.version.split('-'),
    date = (new Date()).toLocalJSON()
  ;

  template = template.replace(/%APP_BUILD%/g, build ?? '');
  template = template.replace(/%APP_DATE%/g, date ?? '');
  template = template.replace(/%APP_NAME%/g, name ?? '');
  template = template.replace(/%APP_VERSION%/g, version ?? '');

  if (!fs.existsSync(settingsFile) || (template !== fs.readFileSync(settingsFile, {encoding}))) {
    fs.writeFileSync(settingsFile, template, {encoding});

    console.log(`SETTINGS: Soubor „${settingsFile}“ uspesne pregenerovan\n`);
  }
} catch (err) {
  console.error(err);
}
