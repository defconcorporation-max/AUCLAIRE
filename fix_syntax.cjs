const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/public/Formation.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// The original script failed to replace ')}\n</section>' because of \r\n on Windows.
content = content.replace(/ \r?\n\s*\)}\r?\n\s*<\/section>/g, '\n                            </section>\n                        )}');
content = content.replace(/\s*\)}\r?\n\s*<\/section>/g, '\n                            </section>\n                        )}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Syntax errors fixed.');
