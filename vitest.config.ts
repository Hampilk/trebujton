/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// Copy aliases from main vite config
const ALIASES = {
  "@": path.resolve(__dirname, "./src"),
  "@components": path.resolve(__dirname, "./src/components"),
  "@ui": path.resolve(__dirname, "./src/ui"),
  "@pages": path.resolve(__dirname, "./src/pages"),
  "@assets": path.resolve(__dirname, "./src/assets"),
  "@styles": path.resolve(__dirname, "./src/styles"),
  "@db": path.resolve(__dirname, "./src/db"),
  "@hooks": path.resolve(__dirname, "./src/hooks"),
  "@layout": path.resolve(__dirname, "./src/layout"),
  "@fonts": path.resolve(__dirname, "./src/fonts"),
  "@utils": path.resolve(__dirname, "./src/utils"),
  "@widgets": path.resolve(__dirname, "./src/widgets"),
  "@contexts": path.resolve(__dirname, "./src/contexts"),
  "@constants": path.resolve(__dirname, "./src/constants"),
  "@features": path.resolve(__dirname, "./src/features"),
  "@providers": path.resolve(__dirname, "./src/providers"),
  "@services": path.resolve(__dirname, "./src/services"),
  "@cms": path.resolve(__dirname, "./src/cms"),
  "@redux": path.resolve(__dirname, "./src/redux"),
  "@app": path.resolve(__dirname, "./src/app"),
  "@types": path.resolve(__dirname, "./src/types"),
  "@lib": path.resolve(__dirname, "./src/lib"),
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: ALIASES,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'src/test/',
        'dist/',
        'coverage/',
        'docs/',
        '*.d.ts',
        '*.config.*',
        'vite.config.ts',
        'vitest.config.ts',
        'tailwind.config.ts',
        'postcss.config.js',
        'craco.config.js',
        'babel-plugin-macros.config.js',
        'components.json',
        'eslint.config.js',
        'jsconfig.json',
        'tsconfig.json',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
})