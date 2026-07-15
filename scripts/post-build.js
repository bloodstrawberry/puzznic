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

if (fs.existsSync(outDir)) {
  console.log('Post-build: Converting absolute paths to relative paths in HTML files...');
  walkDir(outDir, (filePath) => {
    if (path.extname(filePath) === '.html') {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace absolute paths starting with /_next/ to relative ./_next/
      let updatedContent = content
        .replace(/(src|href|content)="\/\_next\//g, '$1="./_next/')
        .replace(/(src|href|content)='\/_next\//g, "$1='./_next/")
        .replace(/(src|href)="\/(favicon\.ico|manifest\.json)"/g, '$1="./$2"')
        .replace(/(src|href)='\/(favicon\.ico|manifest\.json)'/g, "$1='./$2'");

      if (content !== updatedContent) {
        fs.writeFileSync(filePath, updatedContent, 'utf8');
        console.log(`Updated: ${path.relative(outDir, filePath)}`);
      }
    }
  });
  console.log('Post-build process completed.');
} else {
  console.warn(`Post-build: 'out' directory not found at ${outDir}`);
}
