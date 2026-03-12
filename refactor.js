const fs = require("fs");
const path = require("path");

function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach((file) => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith(".tsx") || dirFile.endsWith(".ts")) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
}

function refactorAdminFiles() {
  const adminFiles = [
    ...walkSync("src/app/(admin)"),
    ...walkSync("src/components/admin"),
  ];

  adminFiles.forEach((f) => {
    let content = fs.readFileSync(f, "utf8");
    // Replace component imports that are direct children of components/
    content = content.replace(
      /from\s+["']@\/components\/([^/"']+)["']/g,
      'from "@/components/admin/$1"'
    );
    
    // In AppSidebar.tsx we need to fix the URLs for Admin routes
    if (f.includes("AppSidebar.tsx")) {
       content = content.replace(/url:\s*["']\/payments["']/g, 'url: "/admin/payments"');
       content = content.replace(/url:\s*["']\/products["']/g, 'url: "/admin/products"');
       content = content.replace(/url:\s*["']\/users["']/g, 'url: "/admin/users"');
       content = content.replace(/url:\s*["']\/["']/g, 'url: "/admin"'); 
    }

    // router.push("/") -> router.push("/admin")
    content = content.replace(/router\.push\(["']\/["']\)/g, 'router.push("/admin")');

    fs.writeFileSync(f, content, "utf8");
  });
  console.log("Admin files refactored:", adminFiles.length);
}

function refactorClientFiles() {
  const clientFiles = [
    ...walkSync("src/app/(client)"),
    ...walkSync("src/components/client"),
  ];

  clientFiles.forEach((f) => {
    let content = fs.readFileSync(f, "utf8");
    // Replace component imports
    content = content.replace(
      /from\s+["']@\/components\/([^/"']+)["']/g,
      'from "@/components/client/$1"'
    );
    fs.writeFileSync(f, content, "utf8");
  });
  console.log("Client files refactored:", clientFiles.length);
}

try {
  refactorAdminFiles();
  refactorClientFiles();
  console.log("Refactoring complete");
} catch(e) {
  console.error("error", e)
}
