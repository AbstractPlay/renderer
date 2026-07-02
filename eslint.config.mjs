// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ["src/schemas/*", "bin/*", "build/*", "dist/*", "docs/*", "scripts/*", "**/*.config.js"],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
        "@typescript-eslint/no-explicit-any": "warn",
    },
  }
);


