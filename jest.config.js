module.exports = {
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.json'
        }
    },
    'coverageDirectory': undefined,
    'collectCoverage': false,
    'collectCoverageFrom': [
        '**/src/**/*.{ts,js}'
    ],
    moduleFileExtensions: [
        'ts',
        'js'
    ],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    testMatch: [
        '**/test/**/*.test.(ts|js)'
    ],
    testEnvironment: 'node'
};