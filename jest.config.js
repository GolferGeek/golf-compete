// jest.config.js
const nextJest = require('next/jest');

// Providing the path to your Next.js app to load next.config.js and .env files in your test environment
const createJestConfig = nextJest({
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Use ts-jest for TypeScript files
  preset: 'ts-jest',
  
  // Test environment setup
  testEnvironment: 'jest-environment-jsdom',

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates which provider should be used to instrument code for coverage
  coverageProvider: 'v8',

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured by nextJest)
    // Example: '@/components/(.*)': '<rootDir>/src/components/$1',
    // Add any other aliases from tsconfig.json here if needed
     '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
     '^@/services/(.*)$': '<rootDir>/src/services/$1',
     '^@/types/(.*)$': '<rootDir>/src/types/$1',
     '^@/components/(.*)$': '<rootDir>/src/components/$1',
     '^@/app/(.*)$': '<rootDir>/src/app/$1',
  },

  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[tj]s?(x)'
  ],

  // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/playwright-report/',
    '<rootDir>/playwright/.cache/',
  ],

  // Indicates whether each individual test should be reported during the run
  verbose: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig); 