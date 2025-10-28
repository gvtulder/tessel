/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "jsdom",
  transform: {
    //  "^.+.tsx?$": ["ts-jest",{}],
    "^.+.tsx?$": [
      "@swc/jest",
      {
        jsc: { experimental: { plugins: [["@lingui/swc-plugin", {}]] } },
      },
    ],
  },
  setupFiles: ["./src/i18n-test-setup.ts"],
  moduleNameMapper: {
    "^bundle-text:.+": "<rootDir>/src/ui/svgs/svg-stub.ts",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":
      "identity-obj-proxy",
  },
};
