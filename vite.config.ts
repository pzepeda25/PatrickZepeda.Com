import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

// Mock Netlify Functions for local testing
const netlifyFunctionsPlugin = () => ({
  name: 'netlify-functions',
  configureServer(server) {
    server.middlewares.use('/.netlify/functions/submit-form', (req, res, next) => {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', async () => {
          try {
            // Dynamically import to avoid top-level await issues
            const { handler } = await import('./netlify/functions/submit-form.js');
            const event = {
              httpMethod: req.method,
              body: body,
              headers: req.headers
            };
            const result = await handler(event);
            res.statusCode = result.statusCode || 200;
            if (result.headers) {
              for (const [key, value] of Object.entries(result.headers)) {
                res.setHeader(key, value as string);
              }
            }
            res.end(result.body);
          } catch (e: any) {
            console.error("Netlify Function Error:", e);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ 
              error: e.message, 
              note: "If this is a Netlify Blobs error, it means the NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN environment variables are missing in this preview environment." 
            }));
          }
        });
      } else {
        next();
      }
    });
  }
});

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [react(), tailwindcss(), netlifyFunctionsPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
