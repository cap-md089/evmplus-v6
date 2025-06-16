/**
 * Copyright (C) 2020 Andrew Rioux
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

import * as ts from 'typescript';
import {
	getKeysForSymbol,
	getStringLiteralFromType,
	getBooleanLiteralFromType,
	createBooleanLiteral,
} from './util';

const convertObjectToMap = (
	type: ts.Type,
	typeChecker: ts.TypeChecker,
	argument: ts.Expression,
): ts.Expression => {
	const properties = type.getProperties();

	const objectProperties = properties
		.map(prop => {
			if (!ts.isPropertySignature(prop.valueDeclaration)) {
				return undefined;
			}

			const { valueDeclaration, name } = prop;

			if (!valueDeclaration.type) {
				return undefined;
			}

			const value = ts.isTypeReferenceNode(valueDeclaration.type)
				? convertEndpointToFunction(
						typeChecker.getTypeFromTypeNode(valueDeclaration.type),
						typeChecker,
						argument,
				  )
				: convertObjectToMap(
						typeChecker.getTypeFromTypeNode(valueDeclaration.type),
						typeChecker,
						argument,
				  );

			return ts.factory.createPropertyAssignment(name, value);
		})
		.filter((v): v is ts.PropertyAssignment => !!v);

	return ts.factory.createObjectLiteralExpression(objectProperties);
};

const convertEndpointToFunction = (
	type: ts.Type,
	typeChecker: ts.TypeChecker,
	argument: ts.Expression,
): ts.Expression => {
	const properties = type.getProperties();
	const callSignatures = type.getCallSignatures();

	if (callSignatures.length !== 1) {
		console.log('Invalid API:', typeChecker.typeToString(type));
		throw new Error('Invalid API');
	}

	const paramKeys = getKeysForSymbol(callSignatures[0].parameters[0], typeChecker);
	const url = getStringLiteralFromType(properties.find(sym => sym.name === 'url'));
	const method = getStringLiteralFromType(properties.find(sym => sym.name === 'method'));
	const requiresMember = getStringLiteralFromType(
		properties.find(sym => sym.name === 'requiresMember'),
	);
	const needsToken = getBooleanLiteralFromType(properties.find(sym => sym.name === 'needsToken'));

	if (
		paramKeys === undefined ||
		url === undefined ||
		method === undefined ||
		requiresMember === undefined ||
		needsToken === undefined
	) {
		const errors = [
			[paramKeys, 'paramKeys'],
			[url, 'url'],
			[method, 'method'],
			[requiresMember, 'requiresMember'],
			[needsToken, 'needsToken'],
		]
			.filter((item): item is Array<string | string[]> | Array<string | boolean> => !!item[0])
			.map(item => `${item[1].toString()} is missing`)
			.join(',');

		console.error('Could not find required properties for generateAPITree<T>: ' + errors);

		return ts.factory.createNull();
	}

	return ts.factory.createCallExpression(argument, undefined, [
		ts.factory.createObjectLiteralExpression(
			[
				ts.factory.createPropertyAssignment(
					'paramKeys',
					ts.factory.createArrayLiteralExpression(
						paramKeys.map(key => ts.factory.createStringLiteral(key)),
					),
				),
				ts.factory.createPropertyAssignment('url', ts.factory.createStringLiteral(url)),
				ts.factory.createPropertyAssignment(
					'method',
					ts.factory.createStringLiteral(method),
				),
				ts.factory.createPropertyAssignment(
					'requiresMember',
					ts.factory.createStringLiteral(requiresMember),
				),
				ts.factory.createPropertyAssignment('needsToken', createBooleanLiteral(needsToken)),
			],
			true,
		),
	]);
};

export default (node: ts.CallExpression, typeChecker: ts.TypeChecker): ts.Node => {
	const typeArgument = node.typeArguments?.[0];
	const argument = node.arguments[0];

	if (!typeArgument || !argument) {
		return node;
	}

	if (ts.isTypeReferenceNode(typeArgument)) {
		const aliasedType = typeChecker.getTypeAtLocation(typeArgument.typeName);

		return convertObjectToMap(aliasedType, typeChecker, argument);
	} else {
		return ts.factory.createNull();
	}
};
