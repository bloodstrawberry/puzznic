/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../out');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

function findWebRoot(filePath, baseDir) {
  let curr = path.dirname(filePath);
  while (curr.startsWith(baseDir) || curr === baseDir) {
    if (fs.existsSync(path.join(curr, '_next'))) {
      return curr;
    }
    const nextCurr = path.dirname(curr);
    if (nextCurr === curr) break;
    curr = nextCurr;
  }
  if (fs.existsSync(path.join(baseDir, 'web', '_next'))) {
    return path.join(baseDir, 'web');
  }
  return baseDir;
}

if (fs.existsSync(outDir)) {
  console.log('Post-build: Creating .nojekyll file...');
  fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
  if (fs.existsSync(path.join(outDir, 'web'))) {
    fs.writeFileSync(path.join(outDir, 'web', '.nojekyll'), '');
  }

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const escapedBasePath = basePath ? basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') : '';
  const basePathPrefixPattern = escapedBasePath ? `(?:${escapedBasePath})?` : '';

  const reNextDouble = new RegExp(`(src|href|content|action)="${basePathPrefixPattern}\\/_next\\/`, 'g');
  const reNextSingle = new RegExp(`(src|href|content|action)='${basePathPrefixPattern}\\/_next\\/`, 'g');
  const reFavDouble = new RegExp(`(src|href)="${basePathPrefixPattern}\\/(favicon\\.ico|manifest\\.json)"`, 'g');
  const reFavSingle = new RegExp(`(src|href)='${basePathPrefixPattern}\\/(favicon\\.ico|manifest\\.json)'`, 'g');
  const reRawNext = new RegExp(`([,\\[:\\("'])${basePathPrefixPattern}\\/_next\\/`, 'g');
  const reEscapedNext = new RegExp(`([,\\[:\\("'])${basePathPrefixPattern}\\\\/\\_next\\/`, 'g');

  console.log('Post-build: Converting absolute paths to relative paths in HTML files...');
  walkDir(outDir, (filePath) => {
    if (path.extname(filePath) === '.html') {
      const webRoot = findWebRoot(filePath, outDir);
      const rel = path.relative(path.dirname(filePath), webRoot);
      const prefix = rel ? (rel.replace(/\\/g, '/') + '/') : './';

      let content = fs.readFileSync(filePath, 'utf8');
      
      let updatedContent = content
        .replace(reNextDouble, `$1="${prefix}_next/`)
        .replace(reNextSingle, `$1='${prefix}_next/`)
        .replace(reFavDouble, `$1="${prefix}$2"`)
        .replace(reFavSingle, `$1='${prefix}$2'`)
        .replace(reRawNext, `$1${prefix}_next/`)
        .replace(reEscapedNext, `$1\\/${prefix}_next/`);

      if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`Updated (${prefix}): ${path.relative(outDir, filePath)}`);
      }
    }
  });
  console.log('Post-build process completed.');
} else {
  console.warn(`Post-build: 'out' directory not found at ${outDir}`);
}
