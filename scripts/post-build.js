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
  console.log('Post-build: Converting absolute paths to relative paths in HTML files...');
  walkDir(outDir, (filePath) => {
    if (path.extname(filePath) === '.html') {
      const webRoot = findWebRoot(filePath, outDir);
      const rel = path.relative(path.dirname(filePath), webRoot);
      const prefix = rel ? (rel.replace(/\\/g, '/') + '/') : './';

      let content = fs.readFileSync(filePath, 'utf8');
      
      let updatedContent = content
        .replace(/(src|href|content|action)="\/\_next\//g, `$1="${prefix}_next/`)
        .replace(/(src|href|content|action)='\/_next\//g, `$1='${prefix}_next/`)
        .replace(/(src|href)="\/(favicon\.ico|manifest\.json)"/g, `$1="${prefix}$2"`)
        .replace(/(src|href)='\/(favicon\.ico|manifest\.json)'/g, `$1='${prefix}$2'`)
        .replace(/([,\[:\("'])\/\_next\//g, `$1${prefix}_next/`)
        .replace(/([,\[:\("'])\\\/\_next\//g, `$1\\/${prefix}_next/`);

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
