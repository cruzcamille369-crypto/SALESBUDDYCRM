const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf8');

const typographyBlock = `/* Soften typography */
@layer utilities {
  .uppercase {
    text-transform: none !important;
    @apply tracking-normal font-semibold;
  }
  .tracking-widest, .tracking-wider, .tracking-wide {
    letter-spacing: normal !important;
  }
}`;

css = css.replace(typographyBlock, '');

// Increase contrast of base fonts by removing overriding of fonts
css = css.replace(
    '  button, .btn {\n    @apply transition-transform active:scale-95 font-bold tracking-wide;\n  }',
    '  button, .btn {\n    @apply transition-all active:scale-95 font-bold tracking-wide hover:brightness-110;\n  }'
);

fs.writeFileSync('src/index.css', css);
