import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

const eslintConfig = defineConfig([
  ...tseslint.configs.recommended,
  {
    rules: {
      // Matches eslint-config-next's default leniency.
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
]);

export default eslintConfig;
