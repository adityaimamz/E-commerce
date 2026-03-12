const fs = require('fs');
const path = require('path');

function moveContentAndRemoveOldDir(oldPath, newPath) {
  if (fs.existsSync(oldPath)) {
    if (!fs.existsSync(newPath)) fs.mkdirSync(newPath, { recursive: true });
    
    const items = fs.readdirSync(oldPath);
    for (const item of items) {
      const src = path.join(oldPath, item);
      const dest = path.join(newPath, item);
      fs.renameSync(src, dest);
    }
    fs.rmSync(oldPath, { recursive: true, force: true });
  }
}

try {
  // 1. Fix nested ui component
  const nestedUi = 'src/components/ui/ui';
  if (fs.existsSync(nestedUi)) {
    moveContentAndRemoveOldDir(nestedUi, 'src/components/ui');
    console.log("Fixed nested UI components.");
  }

  // 2. Fix admin routes
  // Rename (admin) to admin
  if (fs.existsSync('src/app/(admin)')) {
    fs.renameSync('src/app/(admin)', 'src/app/admin');
    console.log("Renamed (admin) to admin route.");
    
    // Move dashboard page.tsx to index admin page.tsx
    if (fs.existsSync('src/app/admin/dashboard/page.tsx')) {
      fs.renameSync('src/app/admin/dashboard/page.tsx', 'src/app/admin/page.tsx');
      fs.rmSync('src/app/admin/dashboard', { recursive: true, force: true });
      console.log("Moved dashboard to /admin main page.");
    }
  }

} catch(e) {
  console.error("Fix script error:", e);
}
