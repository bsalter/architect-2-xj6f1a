/**
 * PostCSS Configuration
 * 
 * This file configures the PostCSS processor with plugins that transform
 * CSS during the build process. It enables TailwindCSS functionality,
 * handles browser compatibility, and optimizes the final CSS output.
 * 
 * @version 1.0.0
 */

// tailwindcss v3.3.3 - Utility-first CSS framework
const tailwindcss = require('tailwindcss');

// autoprefixer v10.4.14 - Adds vendor prefixes for broader browser support
const autoprefixer = require('autoprefixer');

// postcss-import v15.1.0 - Resolves @import rules in CSS
const postcssImport = require('postcss-import');

module.exports = {
  plugins: [
    // Process @import statements first
    postcssImport(),
    
    // Process Tailwind directives and generate utility classes
    // This enables the responsive utilities (sm:, md:, lg:, etc.)
    tailwindcss,
    
    // Add necessary vendor prefixes for browser compatibility
    // Uses browserslist config from package.json
    autoprefixer,
  ]
};