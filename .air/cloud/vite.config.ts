import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Environment-setup-only Vite config.
//
// It is identical to the app's root vite.config.ts but additionally lets the
// dev server accept any Host header, so the server is reachable through the
// Air proxy (which forwards its own public hostname). The app's own
// vite.config.ts is left untouched; this file is selected explicitly from
// .air/cloud/startup.sh via `vite --config`. Vite's `root` still defaults to
// the process cwd (the repo root), so index.html and src/ resolve normally.
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: true,
  },
})
