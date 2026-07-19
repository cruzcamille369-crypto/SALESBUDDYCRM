const fs = require('fs');
let board = fs.readFileSync('components/pipeline/PipelineBoard.tsx', 'utf8');

board = board.replace(
    'stage={stage}',
    'stage={stage}\n                                index={index}\n                                totalColumns={PIPELINE_STAGES.length}'
);

board = board.replace(
    'PIPELINE_STAGES.map(stage => (',
    'PIPELINE_STAGES.map((stage, index) => ('
);

fs.writeFileSync('components/pipeline/PipelineBoard.tsx', board);

let col = fs.readFileSync('components/pipeline/PipelineColumn.tsx', 'utf8');

col = col.replace(
    'interface PipelineColumnProps {',
    'interface PipelineColumnProps {\n    index?: number;\n    totalColumns?: number;'
);

col = col.replace(
    'stage, sales, totalValue, focusMode, isDragOver,',
    'stage, sales, totalValue, focusMode, isDragOver, index = 0, totalColumns = 1,'
);

const oldHeaderStart = `            <div className="mb-1.5 p-1.5 sticky top-0 z-20 bg-inherit  rounded-t-[1.25rem]">
                <div className={\`p-2.5 rounded-xl border \${config.bg} \${config.accent}  shadow-sm relative overflow-hidden transition-all group\`}>`;

const newHeaderStart = `            <div className="mb-1.5 p-0 sticky top-0 z-20 bg-inherit">
                <div 
                    className={\`p-3 pb-4 border-b-2 \${config.bg} \${config.accent} relative overflow-hidden transition-all group\`}
                    style={{
                        clipPath: \`polygon(\${index === 0 ? '0 0' : '12px 50%, 0 0'}, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, \${index === 0 ? '0 100%' : '0 100%, 12px 50%'})\`,
                        paddingLeft: index === 0 ? '12px' : '24px',
                        paddingRight: '20px'
                    }}
                >`;

col = col.replace(oldHeaderStart, newHeaderStart);

fs.writeFileSync('components/pipeline/PipelineColumn.tsx', col);
