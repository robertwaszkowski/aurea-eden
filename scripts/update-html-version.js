import fs from 'fs';
import path from 'path';

const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const indexPath = path.resolve(process.cwd(), 'index.html');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const version = packageJson.version;

let indexHtml = fs.readFileSync(indexPath, 'utf-8');
indexHtml = indexHtml.replace(/<title>Aurea EDEN demo(.*)<\/title>/, `<title>Aurea EDEN demo v${version}</title>`);

fs.writeFileSync(indexPath, indexHtml);

console.log(`Updated index.html title with version ${version}`);
