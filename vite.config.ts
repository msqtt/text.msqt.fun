import { defineConfig } from 'vite';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Content-Security-Policy': "frame-ancestors 'self' http://localhost:* http://127.0.0.1:* https://recycle.msqt.fun",
};

export default defineConfig({
  server: { headers },
  preview: { headers },
});