import fs from 'fs';

const filePath = '/home/jay/office-graffico-clone/_next/static/chunks/00mo9wt7jabwh.js';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = 'function eo(e){e._allowPartialStream?(e._closed=!0,e._chunks.forEach(function(e){"pending"===e.status?(e.status="halted",e.value=null,e.reason=null):"fulfilled"===e.status&&null!==e.reason&&e.reason.close(\'"$undefined"\')})):U(e,Error("Connection closed."))}';

const replacementStr = 'function eo(e){e._closed=!0,e._chunks.forEach(function(e){"pending"===e.status?(e.status="fulfilled",e.value=null,e.reason=null):"fulfilled"===e.status&&null!==e.reason&&e.reason.close(\'"$undefined"\')})}';

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched 00mo9wt7jabwh.js - Connection closed error eliminated!');
} else {
  console.log('Target string not exact, trying regex pattern...');
  const pattern = /function eo\(e\)\{e\._allowPartialStream\?.*?U\(e,Error\("Connection closed\."\)\)\}/;
  if (pattern.test(content)) {
    content = content.replace(pattern, replacementStr);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully patched 00mo9wt7jabwh.js via regex!');
  } else {
    console.error('Failed to find eo function in 00mo9wt7jabwh.js');
  }
}
