import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    envPrefix: ['VITE_', 'WXT_', 'NOTION_'],
  }),
  manifest: {
    host_permissions: ['https://api.notion.com/*'],
  },
});
