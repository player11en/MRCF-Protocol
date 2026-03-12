/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleNameMapper: {
        '^@mrcf/parser$': '<rootDir>/parser/src/index.ts',
        '^@mrcf/parser/(.*)$': '<rootDir>/parser/src/$1',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/__tests__/**',
        '!src/**/index.ts',
    ],
};
