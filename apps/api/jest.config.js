// ESM project: run through `node --experimental-vm-modules` (see the "test" script).
// SWC compiles the TypeScript and emits decorator metadata, which Nest's DI relies on.
export default {
  testEnvironment: "node",
  testRegex: ".*\\.spec\\.ts$",
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  transform: {
    "^.+\\.ts$": [
      "@swc/jest",
      {
        jsc: {
          target: "es2023",
          parser: { syntax: "typescript", decorators: true },
          transform: { legacyDecorator: true, decoratorMetadata: true },
        },
        module: { type: "es6" },
      },
    ],
  },
};
