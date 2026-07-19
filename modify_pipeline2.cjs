const fs = require('fs');
let col = fs.readFileSync('components/pipeline/PipelineColumn.tsx', 'utf8');

const oldClip = "clipPath: `polygon(${index === 0 ? '0 0' : '12px 50%, 0 0'}, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, ${index === 0 ? '0 100%' : '0 100%, 12px 50%'})`";

const newClip = "clipPath: `polygon(${index === 0 ? '0 0' : '12px 50%, 0 0'}, ${index === totalColumns - 1 ? '100% 0, 100% 100%' : 'calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%'}, ${index === 0 ? '0 100%' : '0 100%, 12px 50%'})`";

col = col.replace(oldClip, newClip);

fs.writeFileSync('components/pipeline/PipelineColumn.tsx', col);
