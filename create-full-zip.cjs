const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const zip = new JSZip();

function addFolderToZip(folderPath, zipFolder, ignoreDirs = ['.cache', '.upm', '.config', '.local']) {
  try {
    const files = fs.readdirSync(folderPath);
    
    files.forEach(file => {
      if (ignoreDirs.includes(file)) return;
      
      const filePath = path.join(folderPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        addFolderToZip(filePath, zipFolder.folder(file), ignoreDirs);
      } else {
        const content = fs.readFileSync(filePath);
        zipFolder.file(file, content);
      }
    });
  } catch(e) {
    console.error('Error:', e.message);
  }
}

console.log('Creating FULL ZIP with everything...');
addFolderToZip('.', zip);

zip.generateAsync({ type: 'nodebuffer' }).then(buffer => {
  fs.writeFileSync('/home/runner/voxelhub-COMPLETO.zip', buffer);
  console.log('✅ FULL ZIP created!');
  console.log('Size:', (buffer.length / 1024 / 1024).toFixed(2), 'MB');
  console.log('File: voxelhub-COMPLETO.zip');
}).catch(err => {
  console.error('Error:', err);
});
