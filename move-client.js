const fs = require('fs');
const path = require('path');

const clientRoute = path.join('src', 'app', '(client)');
const appRoute = path.join('src', 'app');

if (fs.existsSync(clientRoute)) {
  const items = fs.readdirSync(clientRoute);
  
  for (const item of items) {
    const src = path.join(clientRoute, item);
    const dest = path.join(appRoute, item);
    
    // Check if dest exists, remove it if it's a file, rename if ok
    if (fs.existsSync(dest)) {
      if (fs.lstatSync(dest).isFile()) {
        fs.rmSync(dest);
      } else {
        fs.rmSync(dest, { recursive: true, force: true });
      }
    }
    fs.renameSync(src, dest);
  }
  
  fs.rmdirSync(clientRoute);
  console.log("Client files moved to root.");
} else {
  console.log("Client route group not found.");
}
