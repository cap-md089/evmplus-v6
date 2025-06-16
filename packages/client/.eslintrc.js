/**
 * Copyright (C) 2021 Andrew Rioux
 *
 * This file is part of Event Manager.
 * 
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 * 
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

module.exports = {
	env: {
		browser: true,
		es6: true,
	},
	extends: [
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
		'prettier',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: 'tsconfig.json',
		sourceType: 'module',
	},
	plugins: [
		'eslint-plugin-import',
		'eslint-plugin-jsdoc',
		'eslint-plugin-prefer-arrow',
		'@typescript-eslint',
	],
	rules: {
		'@typescript-eslint/ban-ts-comment': [
			'error',
			{
				'ts-expect-error': 'allow-with-description',
				'ts-ignore': 'allow-with-description',
				'ts-nocheck': true,
				'ts-check': false,
				'minimumDescriptionLength': 3,
			},
		],
		'@typescript-eslint/adjacent-overload-signatures': 'error',
		'@typescript-eslint/array-type': [
			'error',
			{
				default: 'array-simple',
			},
		],
		'@typescript-eslint/ban-types': [
			'error',
			{
				types: {
					'Object': {
						message: 'Avoid using the `Object` type. Did you mean `object`?',
					},
					'Function': {
						message:
							'Avoid using the `Function` type. Prefer a specific function type, like `() => void`.',
					},
					'Boolean': {
						message: 'Avoid using the `Boolean` type. Did you mean `boolean`?',
					},
					'Number': {
						message: 'Avoid using the `Number` type. Did you mean `number`?',
					},
					'String': {
						message: 'Avoid using the `String` type. Did you mean `string`?',
					},
					'Symbol': {
						message: 'Avoid using the `Symbol` type. Did you mean `symbol`?',
					},
					'{}': false,
					'object': false,
				},
				extendDefaults: true,
			},
		],
		'@typescript-eslint/consistent-type-assertions': 'error',
		'@typescript-eslint/consistent-type-definitions': 'error',
		'@typescript-eslint/dot-notation': 'off',
		'@typescript-eslint/explicit-function-return-type': [
			'error',
			{
				allowExpressions: true,
				allowTypedFunctionExpressions: true,
				allowHigherOrderFunctions: true,
				allowDirectConstAssertionInArrowFunctions: true,
				allowConciseArrowFunctionExpressionsStartingWithVoid: true,
			},
		],
		'@typescript-eslint/explicit-member-accessibility': [
			'error',
			{
				accessibility: 'explicit',
			},
		],
		'@typescript-eslint/indent': 'off',
		'@typescript-eslint/member-delimiter-style': [
			'off',
			{
				multiline: {
					delimiter: 'none',
					requireLast: true,
				},
				singleline: {
					delimiter: 'semi',
					requireLast: false,
				},
			},
		],
		'@typescript-eslint/member-ordering': 'off',
		'@typescript-eslint/naming-convention': 'off',
		'@typescript-eslint/no-empty-function': 'error',
		'@typescript-eslint/no-empty-interface': 'error',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-misused-new': 'error',
		'@typescript-eslint/no-misused-promises': 'off',
		'@typescript-eslint/no-namespace': 'error',
		'@typescript-eslint/no-parameter-properties': 'off',
		'@typescript-eslint/no-shadow': [
			'error',
			{
				hoist: 'all',
			},
		],
		'@typescript-eslint/no-unused-expressions': 'error',
		'@typescript-eslint/no-use-before-define': 'off',
		'@typescript-eslint/no-var-requires': 'error',
		'@typescript-eslint/prefer-for-of': 'error',
		'@typescript-eslint/prefer-function-type': 'error',
		'@typescript-eslint/prefer-namespace-keyword': 'error',
		'@typescript-eslint/quotes': 'off',
		'@typescript-eslint/semi': ['off', null],
		'@typescript-eslint/triple-slash-reference': [
			'error',
			{
				path: 'always',
				types: 'prefer-import',
				lib: 'always',
			},
		],
		'@typescript-eslint/type-annotation-spacing': 'off',
		'@typescript-eslint/unified-signatures': 'error',
		'arrow-body-style': ['error', 'as-needed'],
		'arrow-parens': ['off', 'always'],
		'brace-style': ['off', 'off'],
		'comma-dangle': 'off',
		'complexity': 'off',
		'constructor-super': 'error',
		'curly': 'error',
		'dot-notation': 'error',
		'eol-last': 'off',
		'eqeqeq': ['error', 'smart'],
		'guard-for-in': 'error',
		'id-blacklist': [
			'error',
			'any',
			'Number',
			'number',
			'String',
			'string',
			'Boolean',
			'boolean',
			'Undefined',
			'undefined',
		],
		'id-match': 'error',
		'import/order': 'off',
		'indent': 'off',
		'jsdoc/check-alignment': 'error',
		'jsdoc/check-indentation': 'off',
		'jsdoc/newline-after-description': 'error',
		'linebreak-style': 'off',
		'max-classes-per-file': 'off',
		'max-len': 'off',
		'new-parens': 'off',
		'newline-per-chained-call': 'off',
		'no-bitwise': 'error',
		'no-caller': 'error',
		'no-cond-assign': 'error',
		'no-console': 'off',
		'no-debugger': 'error',
		'no-empty': 'error',
		'no-empty-function': 'error',
		'no-eval': 'error',
		'no-extra-semi': 'off',
		'no-fallthrough': 'off',
		'no-invalid-this': 'off',
		'no-irregular-whitespace': 'off',
		'no-multiple-empty-lines': 'off',
		'no-new-wrappers': 'error',
		'no-shadow': 'off',
		'no-throw-literal': 'error',
		'no-trailing-spaces': 'off',
		'no-undef-init': 'error',
		'no-underscore-dangle': 'off',
		'no-unsafe-finally': 'error',
		'no-unused-expressions': 'error',
		'no-unused-labels': 'error',
		'no-use-before-define': 'off',
		'no-var': 'error',
		'object-shorthand': 'error',
		'one-var': ['off', 'never'],
		'padded-blocks': [
			'off',
			{
				blocks: 'never',
			},
			{
				allowSingleLineBlocks: true,
			},
		],
		'prefer-arrow/prefer-arrow-functions': [
			'error',
			{
				singleReturnOnly: true,
				disallowPrototype: false,
				classPropertiesAllowed: true,
				allowStandaloneDeclarations: true,
			},
		],
		'prefer-const': 'error',
		'quote-props': 'off',
		'quotes': 'off',
		'radix': 'error',
		'react/jsx-curly-spacing': 'off',
		'react/jsx-equals-spacing': 'off',
		'react/jsx-no-bind': 'off',
		'react/jsx-tag-spacing': [
			'off',
			{
				afterOpening: 'allow',
				closingSlash: 'allow',
			},
		],
		'react/jsx-wrap-multilines': 'off',
		'semi': 'off',
		'space-before-function-paren': 'off',
		'space-in-parens': ['off', 'never'],
		'spaced-comment': [
			'error',
			'always',
			{
				markers: ['/'],
			},
		],
		'use-isnan': 'error',
		'valid-typeof': 'off',
	},
};
