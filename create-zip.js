const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

const zip = new JSZip();

function addFolderToZip(folderPath, zipFolder, ignoreDirs = ['node_modules', '.git', 'dist', '.venv', '.cache', '.upm', '.config', '.local']) {
  try {
    const files = fs.readdirSync(folderPath);
    
    files.forEach(file => {
      if (file.startsWith('.') && !['package.json', '.gitignore', '.env'].includes(file)) {
        if (!ignoreDirs.includes(file)) return;
      }
      
      const filePath = path.join(folderPath, file);
      const stat = fs.statSync(filePath);
      
      if (ignoreDirs.includes(file)) return;
      
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

console.log('Creating ZIP file...');
addFolderToZip('.', zip);

zip.generateAsync({ type: 'nodebuffer' }).then(buffer => {
  fs.writeFileSync('/home/runner/voxelhub-code.zip', buffer);
  console.log('✅ ZIP file created: voxelhub-code.zip');
  console.log('Size:', (buffer.length / 1024 / 1024).toFixed(2), 'MB');
  console.log('Location: /home/runner/voxelhub-code.zip');
}).catch(err => {
  console.error('Error creating ZIP:', err);
});
