import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      css: {
        postcss: './postcss.config.js'
      },
      build: {
        cssCodeSplit: false,
        rollupOptions: {
          output: {
            assetFileNames: (assetInfo) => {
              if (assetInfo.name && assetInfo.name.endsWith('.css')) {
                return 'assets/style.css';
              }
              return 'assets/[name]-[hash][extname]';
            }
          }
        }
      }
    };
});
