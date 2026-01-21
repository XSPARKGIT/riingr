const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, 'www', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');

// Step 1: Check if cordova.js is already present, if not inject it
if (!html.includes('src="cordova.js"')) {
  const shimEnd = html.indexOf('</script>', html.indexOf('window.process'));
  if (shimEnd !== -1) {
    const insertPos = shimEnd + '</script>'.length;
    const cordovaScript = '\n    <script type="text/javascript" src="cordova.js"></script>';
    html = html.slice(0, insertPos) + cordovaScript + html.slice(insertPos);
    console.log('✓ Injected cordova.js script tag');
  } else {
    console.error('✗ Could not find insertion point for cordova.js');
    process.exit(1);
  }
}

// Step 2: Remove type="module" from script tags (ES modules don't work with file:// in WKWebView)
html = html.replace(/<script type="module"/g, '<script');
console.log('✓ Removed type="module" attributes for Cordova compatibility');

// Step 3: Rewrite bundle path to root index.js and copy it there
html = html.replace(/src="\.\/assets\/index\.js"/g, 'src="index.js"');
const bundleInAssets = path.join(__dirname, 'www', 'assets', 'index.js');
const bundleAtRoot = path.join(__dirname, 'www', 'index.js');
if (fs.existsSync(bundleInAssets)) {
  fs.copyFileSync(bundleInAssets, bundleAtRoot);
  console.log('✓ Copied assets/index.js to www/index.js');
}

fs.writeFileSync(htmlPath, html);
console.log('✓ Cordova HTML modifications complete');
