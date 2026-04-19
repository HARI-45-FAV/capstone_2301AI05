const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath, callback);
    } else {
      if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        callback(fullPath);
      }
    }
  });
}

walk(path.join(__dirname, 'src'), (filePath) => {
  let content = fs.readFileSync(filePath, 'utf-8');
  let lines = content.split('\n');
  
  let useClientIndex = -1;
  let hasUseClient = false;
  
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === '"use client";' || trimmed === "'use client';") {
      hasUseClient = true;
      useClientIndex = i;
      break;
    }
  }

  // If 'use client' is found but not on the very first line
  if (hasUseClient && useClientIndex > 0) {
      const exactMatch = lines[useClientIndex];
      lines.splice(useClientIndex, 1); // remove from current position
      lines.unshift(exactMatch); // add to the top
      
      fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
      console.log("Fixed 'use client' in " + filePath);
  }
});
