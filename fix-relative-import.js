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

const files = [
  ...walkSync("src/components/admin"),
  ...walkSync("src/components/client")
];

files.forEach(f => {
  let content = fs.readFileSync(f, "utf8");
  // Change './ui/...' to '@/components/ui/...'
  content = content.replace(/from\s+["']\.\/ui\/([^/"']+)["']/g, 'from "@/components/ui/$1"');
  // Also change '../ui/...' to '@/components/ui/...' just in case
  content = content.replace(/from\s+["']\.\.\/ui\/([^/"']+)["']/g, 'from "@/components/ui/$1"');
  
  fs.writeFileSync(f, content, "utf8");
});

console.log(`Replaced relative imports in ${files.length} component files.`);
