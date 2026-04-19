const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
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
  let changed = false;
  let importGetAuthToken = false;
  let importLogoutUser = false;

  if (content.includes("localStorage.getItem('sacme_token')") || content.includes('localStorage.getItem("sacme_token")')) {
    content = content.replace(/localStorage\.getItem\(['"]sacme_token['"]\)/g, 'getAuthToken()');
    changed = true;
    importGetAuthToken = true;
  }

  if (content.includes("localStorage.removeItem('sacme_token')") || content.includes('localStorage.removeItem("sacme_token")')) {
    content = content.replace(/localStorage\.removeItem\(['"]sacme_token['"]\)/g, 'logoutUser()');
    changed = true;
    importLogoutUser = true;
  }

  if (changed) {
    // Add import statement if not present class-based or functional
    if (importGetAuthToken || importLogoutUser) {
       const imports = [];
       if (importGetAuthToken) imports.push('getAuthToken');
       if (importLogoutUser) imports.push('logoutUser');
       const importStr = `import { ${imports.join(', ')} } from '@/lib/auth';\n`;
       
       // Try to insert after the last import, or at the top
       if (!content.includes(`@/lib/auth`)) {
           // Insert right at the top
           content = importStr + content;
       }
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log("Updated: " + filePath);
  }
});
