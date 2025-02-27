import { defineConfig } from 'vite'; // vite@4.4.6
import react from '@vitejs/plugin-react'; // @vitejs/plugin-react@4.0.3
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM context (required for import.meta.url with Node.js)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Define and export Vite configuration
export default defineConfig({
  // React plugin with Fast Refresh for development
  plugins: [
    react(),
  ],
  
  // Resolve configuration for imports and aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@types': path.resolve(__dirname, './src/types'),
      '@contexts': path.resolve(__dirname, './src/contexts'),
    },
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  
  // Development server configuration
  server: {
    port: 3000,
    host: true, // Listen on all addresses
    open: true, // Open browser on start
    cors: true, // Enable CORS for API requests
  },
  
  // Production build configuration
  build: {
    outDir: 'dist',
    sourcemap: true, // Generate source maps for debugging production issues
    minify: 'terser', // Use terser for better minification results
    target: 'es2015', // Target ES2015 for better browser compatibility
    cssCodeSplit: true, // Split CSS by chunk for better loading performance
  },
  
  // Testing configuration
  test: {
    globals: true, // Make test variables available globally
    environment: 'jsdom', // Use jsdom for DOM testing
  },
  
  // Dependencies to pre-bundle for faster development loading
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'date-fns',
    ],
  },
});