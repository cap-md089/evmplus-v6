/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as ts from 'typescript';
import { getStringLiteralFromType, getBooleanLiteralFromType, getKeysForSymbol } from './util';

export default (node: ts.CallExpression, typeChecker: ts.TypeChecker) => {
	const typeArgument = node.typeArguments?.[0];
	const argument = node.arguments[0];

	if (!typeArgument || !argument) {
		return node;
	}

	const type = typeChecker.getTypeFromTypeNode(typeArgument);
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
		console.error('Could not find required properties for apiCall<T>', typeArgument);

		return node;
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
