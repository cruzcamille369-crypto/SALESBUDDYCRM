const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'components/forms/enrollment/wizard/Stage1Profile.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add touched state
content = content.replace(
    /const \[showMedical, setShowMedical\] = React\.useState\(false\);/,
    `const [showMedical, setShowMedical] = React.useState(false);\n    const [touched, setTouched] = React.useState<Record<string, boolean>>({});`
);

// handleBlur function
content = content.replace(
    /const handleZipChange/,
    `const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setTouched(prev => ({ ...prev, [e.target.name]: true }));
    };

    const handleZipChange`
);

// Add onBlur to InputField and add required checks
content = content.replace(/<InputField(.*?)name="(.*?)"(.*?)onChange=\{handleIdentityChange\}(.*?)\/>/g, (match, p1, name, p3, p4) => {
    // If it has error property already (like email), don't inject error
    if (match.includes('error=')) {
        return `<InputField${p1}name="${name}"${p3}onChange={handleIdentityChange} onBlur={handleBlur}${p4}/>`;
    }
    
    // Define required fields
    const requiredFields = ['firstName', 'lastName', 'phone', 'shippingAddress', 'shippingCity', 'shippingState', 'shippingZip'];
    let errorProp = '';
    if (requiredFields.includes(name)) {
        errorProp = ` error={touched['${name}'] && !formData.${name} ? 'Required' : ''}`;
    }
    return `<InputField${p1}name="${name}"${p3}onChange={handleIdentityChange} onBlur={handleBlur}${errorProp}${p4}/>`;
});

// Update handleSmartAddressInput for onBlur
content = content.replace(
    /<InputField label="Street Address" name="shippingAddress"(.*?)onChange=\{handleSmartAddressInput\}(.*?)\/>/,
    `<InputField label="Street Address" name="shippingAddress"$1onChange={handleSmartAddressInput} onBlur={handleBlur} error={touched['shippingAddress'] && !formData.shippingAddress ? 'Required' : ''}$2/>`
);

content = content.replace(
    /<InputField label="ZIP Code" name="shippingZip"(.*?)onChange=\{handleZipChange\}(.*?)\/>/,
    `<InputField label="ZIP Code" name="shippingZip"$1onChange={handleZipChange} onBlur={handleBlur} error={touched['shippingZip'] && !formData.shippingZip ? 'Required' : ''}$2/>`
);

content = content.replace(
    /<InputField label="State" name="shippingState"(.*?)onChange=\{\(e: any\) => handleStateChange\(e\)\}(.*?)\/>/,
    `<InputField label="State" name="shippingState"$1onChange={(e: any) => handleStateChange(e)} onBlur={handleBlur} error={touched['shippingState'] && !formData.shippingState ? 'Required' : ''}$2/>`
);

fs.writeFileSync(file, content);
console.log('Added inline validation');
