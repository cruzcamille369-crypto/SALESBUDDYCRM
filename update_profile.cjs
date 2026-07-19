const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/forms/enrollment/wizard/Stage1Profile.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import \{ Mail, User, Phone, MapPin, Search \} from 'lucide-react';/, "import { Mail, User, Phone, MapPin, Search, ChevronDown, ChevronUp, ClipboardPaste, ArrowRight, Save } from 'lucide-react';");

// Remove Age from handleAgeChangeLocal and props if needed, but we can just ignore it.
content = content.replace(/const handleAgeChangeLocal =[\s\S]*?};\n\n/, '');

// Layout change: grid-cols-1 lg:grid-cols-2 to max-w-3xl flex-col
content = content.replace(
    /className="w-full max-w-\[1400px\] grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 pb-24"/,
    'className="w-full max-w-4xl flex flex-col gap-8 pb-24 mx-auto"'
);

// Autofill Paste button change
content = content.replace(
    /className="px-4 py-2 bg-blue-500\/10 hover:bg-blue-500\/20 text-blue-400 border border-blue-500\/30 rounded-lg text-sm font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"\n[\s\S]*?>\n[\s\S]*?🪄 AutoFill Paste\n[\s\S]*?<\/button>/,
    `className="px-4 py-2 text-text-muted hover:text-indigo-600 hover:bg-indigo-600/10 rounded-lg text-sm font-bold flex items-center gap-2 transition-all cursor-pointer"\n                                    title="Paste Customer Data from Clipboard"\n                                >\n                                    <ClipboardPaste size={16} /> AutoFill Paste\n                                </button>`
);

// Remove Age field and adjust grid
content = content.replace(
    /<div className="grid grid-cols-2 gap-6">\n\s*<div className="grid grid-cols-2 gap-4">\n\s*<div className="col-span-1">\n\s*<InputField label="Age" type="number" value=\{formData\.age \|\| ''\} onChange=\{\(e:any\) => handleAgeChangeLocal\(e\.target\.value\)\} placeholder="34" tabIndex=\{5\} \/>\n\s*<\/div>\n\s*<div className="col-span-1 space-y-1\.5 w-full">/,
    `<div className="grid grid-cols-3 gap-6">\n                                <div className="col-span-1 space-y-1.5 w-full">`
);
content = content.replace(
    /<\/div>\n\s*<\/div>\n\n\s*<div className="grid grid-cols-2 gap-4">\n\s*<div className="col-span-1 space-y-1\.5 w-full">\n\s*<label className="text-\[13px\] font-semibold text-text-muted px-1 tracking-wide">Height<\/label>\n\s*<CustomSelect name="height" value=\{formData\.height \|\| ''\} onChange=\{handleIdentityChange\} options=\{HEIGHT_OPTIONS\} placeholder="5'11&quot;" tabIndex=\{7\} \/>\n\s*<\/div>\n\s*<div className="col-span-1">\n\s*<InputField label="Weight" name="weight" value=\{formData\.weight \|\| ''\} onChange=\{handleIdentityChange\} placeholder="180" tabIndex=\{8\} \/>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>/,
    `</div>\n                                <div className="col-span-1 space-y-1.5 w-full">\n                                    <label className="text-[13px] font-semibold text-text-muted px-1 tracking-wide">Height</label>\n                                    <CustomSelect name="height" value={formData.height || ''} onChange={handleIdentityChange} options={HEIGHT_OPTIONS} placeholder="5'11&quot;" tabIndex={7} />\n                                </div>\n                                <div className="col-span-1">\n                                    <InputField label="Weight (lbs)" name="weight" value={formData.weight || ''} onChange={handleIdentityChange} placeholder="180" tabIndex={8} />\n                                </div>\n                            </div>`
);

// Add state for medical conditions disclosure
content = content.replace(
    /const \[newCondition, setNewCondition\] = React\.useState\(''\);/,
    `const [newCondition, setNewCondition] = React.useState('');\n    const [showMedical, setShowMedical] = React.useState(false);`
);

// Progressive disclosure for medical conditions
content = content.replace(
    /<div className="space-y-3 pt-2">\n\s*<label className="text-\[13px\] font-semibold text-text-muted px-1 tracking-wide">Pre-existing Medical Conditions<\/label>/,
    `<div className="space-y-3 pt-2 border-t border-border-subtle/50 mt-4">\n                            <button type="button" onClick={() => setShowMedical(!showMedical)} className="flex items-center gap-2 text-[13px] font-semibold text-text-muted px-1 tracking-wide hover:text-text-primary transition-colors">\n                                Pre-existing Medical Conditions {showMedical ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}\n                            </button>\n                            {showMedical && (`
);

content = content.replace(
    /No system conditions<\/span>\n\s*\)}/,
    `No system conditions</span>\n                                )}`
);

content = content.replace(
    /No system conditions<\/span>\n\s*\)}\n\s*<\/div>\n\s*<\/div>/,
    `No system conditions</span>\n                                )}\n                            </div>\n                            )}`
);

// Move billing address checkbox up
const checkboxRegex = /<div className="mt-6 flex items-center gap-3">\n\s*<input\s*type="checkbox"\s*id="sameAsShipping"\s*checked=\{useShippingForBilling !== false\}\s*onChange=\{\(e\) => setUseShippingForBilling\(e\.target\.checked\)\}\s*className="w-5 h-5 bg-surface-main border-border-strong rounded accent-\[#C4A470\] cursor-pointer"\n\s*\/>\n\s*<label htmlFor="sameAsShipping" className="text-sm font-semibold text-text-muted select-none cursor-pointer">\n\s*Billing Address is same as Shipping\n\s*<\/label>\n\s*<\/div>/;

content = content.replace(checkboxRegex, '');

content = content.replace(
    /<div className="space-y-6 flex-1">/,
    `<div className="flex items-center gap-3 mb-6 bg-surface-alt p-3 rounded-xl border border-border-subtle w-fit">\n                            <input \n                                type="checkbox" \n                                id="sameAsShipping"\n                                checked={useShippingForBilling !== false} \n                                onChange={(e) => setUseShippingForBilling(e.target.checked)} \n                                className="w-5 h-5 bg-surface-main border-border-strong rounded accent-indigo-600 cursor-pointer"\n                            />\n                            <label htmlFor="sameAsShipping" className="text-sm font-semibold text-text-primary select-none cursor-pointer pr-2">\n                                Billing Address is same as Shipping\n                            </label>\n                        </div>\n                        <div className="space-y-6 flex-1">`
);

// Change Proceed / Save Callback
content = content.replace(
    /<div className="pt-8 mt-8 border-t border-border-subtle flex gap-4">[\s\S]*?<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\);\n\}/,
    `</div>\n\n                    <div className="pt-8 mt-8 border-t border-border-subtle flex justify-between items-center">\n                        <button\n                            type="button"\n                            onClick={onCallback}\n                            className="px-6 py-3 flex items-center gap-2 text-text-muted hover:text-indigo-600 font-bold transition-all"\n                            tabIndex={14}\n                        >\n                            <Save size={18} /> Save Callback\n                        </button>\n                        <div className="flex items-center gap-4">\n                            {!isValid && <span className="text-sm font-medium text-amber-500">Please fill all required fields</span>}\n                            <button \n                                type="button"\n                                onClick={onNext} \n                                disabled={!isValid}\n                                className="px-8 py-3.5 bg-indigo-600 text-white font-bold text-lg rounded-full hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"\n                                tabIndex={15}\n                            >\n                                Proceed <ArrowRight size={20} />\n                            </button>\n                        </div>\n                    </div>\n                </div>\n            </div>\n        </div>\n    );\n}`
);

fs.writeFileSync(file, content);
console.log('Stage1Profile updated');
