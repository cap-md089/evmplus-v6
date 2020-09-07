/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as ts from 'typescript';
import { getKeysForSymbol, getStringLiteralFromType, getBooleanLiteralFromType } from './util';

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

			return ts.createPropertyAssignment(name, value);
		})
		.filter((v): v is ts.PropertyAssignment => !!v);

	return ts.createObjectLiteral(objectProperties);
};

const convertEndpointToFunction = (
	type: ts.Type,
	typeChecker: ts.TypeChecker,
	argument: ts.Expression,
): ts.Expression => {
	const properties = type.getProperties();
	const callSignatures = type.getCallSignatures();

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
			.filter(item => !!item[0])
			.map(item => `${item[1]} is missing`)
			.join(',');

		console.error('Could not find required properties for generateAPITree<T>: ' + errors);

		return ts.createNull();
	}

	return ts.createCall(argument, undefined, [
		ts.createObjectLiteral(
			[
				ts.createPropertyAssignment(
					'paramKeys',
					ts.createArrayLiteral(paramKeys.map(ts.createStringLiteral)),
				),
				ts.createPropertyAssignment('url', ts.createLiteral(url)),
				ts.createPropertyAssignment('method', ts.createLiteral(method)),
				ts.createPropertyAssignment('requiresMember', ts.createLiteral(requiresMember)),
				ts.createPropertyAssignment('needsToken', ts.createLiteral(needsToken)),
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
		return ts.createNull();
	}
};
