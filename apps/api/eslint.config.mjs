import { baseConfig } from "@x-pure/config/eslint";

export default [
  ...baseConfig,
  {
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];
