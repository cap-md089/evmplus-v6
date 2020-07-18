import * as ts from 'typescript';
import { getStringLiteralFromType } from './util';

export default (node: ts.CallExpression, typeChecker: ts.TypeChecker) => {
	const typeArgument = node.typeArguments?.[0];

	if (!typeArgument) {
		return node;
	}

	const type = typeChecker.getTypeFromTypeNode(typeArgument);
	const properties = typeChecker.getPropertiesOfType(type);

	const url = getStringLiteralFromType(properties.find(sym => sym.name === 'url'));

	if (!url) {
		console.error('Could not get APIEndpoint interface to replace with URL');

		return node;
	}

	return ts.createLiteral(url);
};
