import fs from 'fs';
const file = '/app/applet/hooks/useWorkTimer.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/            syncState\(\{\n                is_on_break: false,\n                break_start_time: null,\n                total_break_time: newTotal,\n                break_reason: null\n            \}\n        \}/g, '            syncState({\n                is_on_break: false,\n                break_start_time: null,\n                total_break_time: newTotal,\n                break_reason: null\n            });\n        }');

content = content.replace(/            syncState\(\{\n                is_on_break: true,\n                break_start_time: now,\n                total_break_time: totalBreakTime,\n                break_reason: reason \|\| null\n            \}\n        \}/g, '            syncState({\n                is_on_break: true,\n                break_start_time: now,\n                total_break_time: totalBreakTime,\n                break_reason: reason || null\n            });\n');

content = content.replace(/        syncState\(\{\n            is_on_break: false,\n            break_start_time: null,\n            total_break_time: 0,\n            break_reason: null\n        \}\n    \}/g, '        syncState({\n            is_on_break: false,\n            break_start_time: null,\n            total_break_time: 0,\n            break_reason: null\n        });\n    }');

fs.writeFileSync(file, content);
