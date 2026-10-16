import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    // Agent worktrees live under .claude/ and carry their own node_modules.
    exclude: [...configDefaults.exclude, '.claude/**'],
  },
}));
