import fs from 'fs';

let filePath = '/home/jay/office-graffico-clone/_next/static/chunks/0ro772wcmsc4w.js';
let content = fs.readFileSync(filePath, 'utf8');

// Target the erroneous E117 error check that aborts RSC stream hydration
const errorPattern = /null===e\.desiredSize\|\|e\.desiredSize<0\?S\|\|e\.error\(Object\.defineProperty\(Error\("The connection to the page was unexpectedly closed.*?"E117".*?\)\):e\.close\(\)/;

if (errorPattern.test(content)) {
  content = content.replace(errorPattern, 'e.close()');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched 0ro772wcmsc4w.js to eliminate false-positive Connection Closed E117 error!');
} else {
  console.log('Pattern not matched directly, attempting substring replace...');
  let idx = content.indexOf('The connection to the page was unexpectedly closed');
  if (idx !== -1) {
    let start = content.lastIndexOf('null===e.desiredSize', idx);
    let end = content.indexOf(':e.close()', idx) + ':e.close()'.length;
    content = content.substring(0, start) + 'e.close()' + content.substring(end);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully patched via substring replace!');
  } else {
    console.error('Could not find target pattern in 0ro772wcmsc4w.js');
  }
}
