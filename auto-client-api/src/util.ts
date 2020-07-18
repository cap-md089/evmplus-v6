import * as ts from 'typescript';

export const getStringLiteralFromType = (sym?: ts.Symbol): string | undefined => {
	if (
		!sym ||
		!sym.valueDeclaration ||
		!ts.isPropertySignature(sym.valueDeclaration) ||
		!sym.valueDeclaration.type ||
		!ts.isLiteralTypeNode(sym.valueDeclaration.type) ||
		!ts.isStringLiteral(sym.valueDeclaration.type.literal)
	) {
		if (!sym || !sym.declarations || sym.declarations.length === 0) {
			return undefined;
		} else {
			const declaration = sym.declarations[sym.declarations.length - 1];

			if (
				!ts.isPropertySignature(declaration) ||
				!declaration.type ||
				!ts.isLiteralTypeNode(declaration.type) ||
				!ts.isStringLiteral(declaration.type.literal)
			) {
				return undefined;
			} else {
				return declaration.type.literal.text;
			}
		}
	}

	return sym.valueDeclaration.type.literal.text;
};

export const getBooleanLiteralFromType = (sym?: ts.Symbol): boolean | undefined => {
	if (
		!sym ||
		!sym.valueDeclaration ||
		!ts.isPropertySignature(sym.valueDeclaration) ||
		!sym.valueDeclaration.type ||
		!ts.isLiteralTypeNode(sym.valueDeclaration.type) ||
		!(
			sym.valueDeclaration.type.literal.kind === ts.SyntaxKind.FalseKeyword ||
			sym.valueDeclaration.type.literal.kind === ts.SyntaxKind.TrueKeyword
		)
	) {
		if (!sym || !sym.declarations || sym.declarations.length === 0) {
			return undefined;
		} else {
			const declaration = sym.declarations[sym.declarations.length - 1];

			if (
				!ts.isPropertySignature(declaration) ||
				!declaration.type ||
				!ts.isLiteralTypeNode(declaration.type) ||
				!(
					declaration.type.literal.kind === ts.SyntaxKind.TrueKeyword ||
					declaration.type.literal.kind === ts.SyntaxKind.FalseKeyword
				)
			) {
				return undefined;
			} else {
				return declaration.type.literal.kind === ts.SyntaxKind.TrueKeyword;
			}
		}
	}

	return sym.valueDeclaration.type.literal.kind === ts.SyntaxKind.TrueKeyword;
};

export const getTypeNodeForSymbol = (sym: ts.Symbol | undefined): ts.TypeNode | undefined => {
	if (
		!sym ||
		!sym.valueDeclaration ||
		!ts.isParameter(sym.valueDeclaration) ||
		!sym.valueDeclaration.type ||
		!ts.isTypeNode(sym.valueDeclaration.type)
	) {
		return undefined;
	}

	return sym.valueDeclaration.type;
};

export const getKeysForSymbol = (
	sym: ts.Symbol | undefined,
	types: ts.TypeChecker
): string[] | undefined => {
	if (
		!sym ||
		!sym.valueDeclaration ||
		!ts.isParameter(sym.valueDeclaration) ||
		!sym.valueDeclaration.type ||
		!ts.isTypeNode(sym.valueDeclaration.type)
	) {
		return undefined;
	}

	const symbolType = types.getTypeFromTypeNode(sym.valueDeclaration.type);

	return symbolType.getProperties().map(({ name }) => name);
};

export const toExpression = (multiLine = true) => (obj: {
	[key: string]: ts.Expression;
}): ts.ObjectLiteralExpression => {
	const expr: ts.ObjectLiteralElementLike[] = [];

	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			expr.push(ts.createPropertyAssignment(key, obj[key]));
		}
	}

	return ts.createObjectLiteral(expr, multiLine);
};

export const toNLExpression = toExpression();
