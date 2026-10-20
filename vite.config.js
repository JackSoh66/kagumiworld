import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  plugins: [{
    name: 'standalone-experiment-pages',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        const url = new URL(request.url, 'http://vite.local');
        if (/^\/experiments\/[a-z0-9-]+\/$/.test(url.pathname)) {
          request.url = `${url.pathname}index.html${url.search}`;
        }
        next();
      });
    },
  }],
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true },
});
