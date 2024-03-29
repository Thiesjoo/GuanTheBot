const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');

// Delete type mapping
const pathCopy = { ...compilerOptions.paths };
delete pathCopy['*'];

module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	moduleNameMapper: pathsToModuleNameMapper(pathCopy, {
		prefix: '<rootDir>/',
	}),
	setupFiles: [
		"./test/jest.startup.ts"
	],
	testPathIgnorePatterns: ['<rootDir>/node_modules', "<rootDir>/dist"]
};
