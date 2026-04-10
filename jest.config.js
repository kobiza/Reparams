module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testPathIgnorePatterns: ['/node_modules/', '<rootDir>/tests/e2e/'],
    moduleNameMapper: {
        '\\.(scss|css)$': '<rootDir>/tests/__mocks__/styleMock.js',
    },
};