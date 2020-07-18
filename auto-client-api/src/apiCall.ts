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
		properties.find(sym => sym.name === 'requiresMember')
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
					ts.createArrayLiteral(paramKeys.map(ts.createStringLiteral))
				),
				ts.createPropertyAssignment('url', ts.createLiteral(url)),
				ts.createPropertyAssignment('method', ts.createLiteral(method)),
				ts.createPropertyAssignment('requiresMember', ts.createLiteral(requiresMember)),
				ts.createPropertyAssignment('needsToken', ts.createLiteral(needsToken)),
			],
			true
		),
	]);
};
