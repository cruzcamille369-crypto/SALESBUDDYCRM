const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'src/index.css');
let content = fs.readFileSync(file, 'utf8');

const newCss = `.sidebar-tab-trigger-active {
  background-color: transparent !important;
  border-color: transparent !important;
  border-left: 3px solid #2D6AFF !important;
  border-radius: 0 !important;
  color: #0F1D35 !important;
}

.sidebar-tab-trigger-inactive {
  background-color: transparent !important;
  border-color: transparent !important;
  color: #6B7A99 !important;
}
`;

content = content.replace(
    /\.sidebar-tab-trigger-active \{[\s\S]*?\}/,
    newCss
);

fs.writeFileSync(file, content);
console.log('CSS updated');
