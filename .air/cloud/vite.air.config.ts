// Air cloud dev-server overlay: reuses the project's vite.config.ts and only
// makes the dev server reachable through the Air exposed-port proxy.
import { defineConfig, mergeConfig } from 'vite'
import base from '../../vite.config'

export default mergeConfig(
  base,
  defineConfig({
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      allowedHosts: true,
    },
  }),
)
