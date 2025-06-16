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
import { getBooleanLiteralFromType, getStringLiteralFromType, getTypeNodeForSymbol } from './util';

export default (node: ts.CallExpression, typeChecker: ts.TypeChecker): ts.Node | undefined => {
	const typeArgument = node.typeArguments?.[0];
	const [
		testConnectionArg,
		accountArg,
		paramsArg,
		bodyArg,
		confArg,
		memberArg,
		sessionArg,
	] = node.arguments;

	if (!typeArgument) {
		return node;
	}

	if (!typeArgument || !testConnectionArg || !accountArg || !paramsArg || !bodyArg || !confArg) {
		return node;
	}

	const type = typeChecker.getTypeAtLocation(typeArgument);

	const properties = type.getProperties();
	const callSignatures = type.getCallSignatures();

	const bodyType = getTypeNodeForSymbol(callSignatures[0]?.parameters?.[1]);
	const url = getStringLiteralFromType(properties.find(sym => sym.name === 'url'));
	const method = getStringLiteralFromType(properties.find(sym => sym.name === 'method'));
	const requiresMember = getStringLiteralFromType(
		properties.find(sym => sym.name === 'requiresMember'),
	);
	const needsToken = getBooleanLiteralFromType(properties.find(sym => sym.name === 'needsToken'));
	const usesValidator = getBooleanLiteralFromType(
		properties.find(sym => sym.name === 'useValidator'),
	);

	if (
		bodyType === undefined ||
		url === undefined ||
		method === undefined ||
		requiresMember === undefined ||
		needsToken === undefined ||
		usesValidator === undefined
	) {
		console.error('Could not find required properties for generateRequest<T>');

		return node;
	}

	const basicProperties = [
		ts.factory.createPropertyAssignment('body', bodyArg),
		ts.factory.createPropertyAssignment('params', paramsArg),
		ts.factory.createPropertyAssignment('method', ts.factory.createStringLiteral(method)),
		ts.factory.createPropertyAssignment(
			'headers',
			ts.factory.createObjectLiteralExpression([]),
		),
		ts.factory.createPropertyAssignment('hostname', ts.factory.createStringLiteral('')),
		ts.factory.createPropertyAssignment('originalName', ts.factory.createStringLiteral('')),
		ts.factory.createPropertyAssignment('_originalName', ts.factory.createStringLiteral('')),
	];

	const mysqlProperties = [
		ts.factory.createPropertyAssignment(
			'mysqlx',
			ts.factory.createCallExpression(
				ts.factory.createPropertyAccessExpression(
					ts.factory.createPropertyAccessExpression(testConnectionArg, 'session'),
					'getSchema',
				),
				undefined,
				[ts.factory.createPropertyAccessExpression(testConnectionArg, 'schema')],
			),
		),
		ts.factory.createPropertyAssignment(
			'mysqlxSession',
			ts.factory.createPropertyAccessExpression(testConnectionArg, 'session'),
		),
	];

	const sessionArgs = [
		ts.factory.createPropertyAssignment('configuration', confArg),
		ts.factory.createPropertyAssignment('account', accountArg),
	];

	const memberArgs = memberArg
		? [
				ts.factory.createPropertyAssignment('member', memberArg),
				ts.factory.createPropertyAssignment('session', sessionArg),
		  ]
		: [];

	return ts.factory.createObjectLiteralExpression([
		...basicProperties,
		...mysqlProperties,
		...sessionArgs,
		...memberArgs,
	]);
};
