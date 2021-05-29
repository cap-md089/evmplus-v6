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

export const createBooleanLiteral = (bool: boolean): ts.BooleanLiteral =>
	bool
		? ts.factory.createToken(ts.SyntaxKind.TrueKeyword)
		: ts.factory.createToken(ts.SyntaxKind.FalseKeyword);

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
	types: ts.TypeChecker,
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
			expr.push(ts.factory.createPropertyAssignment(key, obj[key]));
		}
	}

	return ts.factory.createObjectLiteralExpression(expr, multiLine);
};

export const toNLExpression = toExpression();
