// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ["src/schemas/*", "bin/*", "build/*", "dist/*", "docs/*", "scripts/*", "test/playground.js", "test/playground-samples.js", "test/browser/playground-samples.js", "test/browser/APRender.min.js", "test/browser/serve.mjs", "**/*.config.js"],
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
        "@typescript-eslint/no-explicit-any": "warn",
    },
  }
);


