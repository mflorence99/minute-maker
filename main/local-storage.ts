import isDev from 'electron-is-dev';
import Store from 'electron-store';

// 👇 local config storage
export const store = new Store({
  name: isDev ? 'config.dev' : 'config.prod'
});
