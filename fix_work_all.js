import fs from 'fs';
const file = '/app/applet/hooks/useWorkTimer.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/        \}\);\)/g, '        })');
content = content.replace(/        \}\); else/g, '        } else');
content = content.replace(/        \}\); catch/g, '        } catch');
content = content.replace(/        \}\);,/g, '        },');
content = content.replace(/            \}\);,/g, '            },');
content = content.replace(/            \}\);/g, '            }');
content = content.replace(/                    \}\);,/g, '                    },');
content = content.replace(/                    \}\); else/g, '                    } else');
content = content.replace(/                    \}\);/g, '                    }');
content = content.replace(/                        \}\);,/g, '                        },');
content = content.replace(/                        \}\);/g, '                        }');

// Just let me manually fix the syncState call block that started this.
content = content.replace(/syncState\(\{\n\s*is_on_break: true,\n\s*break_start_time: now,\n\s*total_break_time: totalBreakTime,\n\s*break_reason: reason \|\| null\n\s*\}\n/g, 'syncState({\n                is_on_break: true,\n                break_start_time: now,\n                total_break_time: totalBreakTime,\n                break_reason: reason || null\n            });\n');

content = content.replace(/        \}\);\n/g, '        }\n');

fs.writeFileSync(file, content);
