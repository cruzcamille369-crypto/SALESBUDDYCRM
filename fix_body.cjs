const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf8');
css = css.replace('font-normal font-sans', 'font-medium font-sans');
fs.writeFileSync('src/index.css', css);
