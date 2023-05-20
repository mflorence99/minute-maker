module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ['./src/app/**/*.ts', '!./src/app/**/module.ts'],
  coverageReporters: ['json-summary', 'text', 'html'],
  preset: 'jest-preset-angular',
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: './reports/junit' }]
  ],
  roots: ['./src'],
  setupFilesAfterEnv: [
    'jest-extended/all',
    'jest-preset-angular',
    'zone.js',
    'zone.js/testing',
    '<rootDir>/src/test.ts'
  ],
  testMatch: ['**/+(*.)+(spec).+(ts)'],
  testResultsProcessor: 'jest-junit'
};
