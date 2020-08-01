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

import { Validator } from 'common-lib';
import * as ts from 'typescript';
import { toNLExpression } from './util';

const call = (identifier: ts.Expression) => <
	T extends keyof typeof Validator = keyof typeof Validator
>(
	name: T,
	args: ts.Expression[]
) => ts.createCall(ts.createPropertyAccess(identifier, name as string), undefined, args);

const get = (identifier: ts.Expression) => <
	T extends keyof typeof Validator = keyof typeof Validator
>(
	name: T
) => ts.createPropertyAccess(identifier, name as string);

const getName = (identifier: ts.EntityName) =>
	ts.isQualifiedName(identifier) ? identifier.right.text : identifier.text;

const getFullGenericType = (
	typeNode: ts.Node | undefined,
	typeChecker: ts.TypeChecker
): [ts.TypeNode, ts.TypeNode[]] | undefined => {
	if (!typeNode) {
		return undefined;
	}

	if (ts.isArrayTypeNode(typeNode)) {
		return [typeNode.elementType, []];
	}

	if (!ts.isTypeReferenceNode(typeNode)) {
		return undefined;
	}

	const typeName = getName(typeNode.typeName);

	if (typeName !== 'Array' && typeName !== 'Required' && typeName !== 'Partial') {
		return undefined;
	}

	return typeNode.typeArguments ? [typeNode.typeArguments[0], []] : undefined;
};

const getGenericParameter = (
	typeParameterList: readonly ts.TypeNode[] | ts.Symbol[] | undefined
) => (inputParameterList: readonly ts.TypeNode[] | undefined) => (parameter: ts.Symbol) => {
	if (!inputParameterList || !typeParameterList) {
		return undefined;
	}

	if (!ts.isPropertySignature(parameter.valueDeclaration)) {
		return undefined;
	}

	if (
		!parameter.valueDeclaration.type ||
		!ts.isTypeReferenceNode(parameter.valueDeclaration.type)
	) {
		return undefined;
	}

	const typeName = getName(parameter.valueDeclaration.type.typeName);

	const index = typeParameterList.findIndex((typeNode: ts.Symbol | ts.TypeNode) =>
		'kind' in typeNode
			? ts.isTypeReferenceNode(typeNode)
				? getName(typeNode.typeName) === typeName
				: false
			: typeNode.name === typeName
	);

	return inputParameterList[index];
};

const getObjectValidatorProperties = (
	validatorIdentifier: ts.Expression,
	validatorCreator: (
		typeNode: ts.TypeNode,
		typeParameters: readonly ts.TypeNode[] | undefined
	) => ts.Expression,
	typeChecker: ts.TypeChecker
) => (
	properties: ts.Symbol[],
	inputTypeParameters: readonly ts.TypeNode[] | undefined,
	typeParameters: readonly ts.TypeNode[] | ts.Symbol[] | undefined
) => {
	const caller = call(validatorIdentifier);

	const objectProperties: { [key: string]: ts.Expression } = {};

	const parameterGetter = getGenericParameter(typeParameters)(inputTypeParameters);

	for (const property of properties) {
		const decl = property.valueDeclaration ?? property.declarations[0];
		if (decl !== undefined && ts.isPropertySignature(decl) && decl.type) {
			const type = typeChecker.getTypeFromTypeNode(decl.type);

			if (decl.questionToken) {
				if (type.flags === ts.TypeFlags.TypeParameter) {
					const parameter = parameterGetter(property);

					if (!parameter) {
						continue;
					}

					objectProperties[property.name] = caller('Optional', [
						validatorCreator(parameter, inputTypeParameters)
					]);
				} else {
					objectProperties[property.name] = caller('Optional', [
						validatorCreator(decl.type, inputTypeParameters)
					]);
				}
			} else {
				if (type.flags === ts.TypeFlags.TypeParameter) {
					const parameter = parameterGetter(property);

					if (!parameter) {
						continue;
					}

					objectProperties[property.name] = validatorCreator(
						parameter,
						inputTypeParameters
					);
				} else {
					objectProperties[property.name] = validatorCreator(
						decl.type,
						inputTypeParameters
					);
				}
			}
		} else {
			// console.log('Weird property', property);
		}
	}

	return objectProperties;
};

const createObjectValidator = (
	validatorIdentifier: ts.Expression,
	validatorCreator: (
		typeNode: ts.TypeNode,
		typeParameters: readonly ts.TypeNode[] | undefined
	) => ts.Expression,
	typeChecker: ts.TypeChecker
) => (
	properties: ts.Symbol[],
	inputTypeParameters: readonly ts.TypeNode[] | undefined,
	typeParameters: readonly ts.TypeNode[] | ts.Symbol[] | undefined
) => {
	const objectProperties = getObjectValidatorProperties(
		validatorIdentifier,
		validatorCreator,
		typeChecker
	)(properties, inputTypeParameters, typeParameters);

	return ts.createNew(validatorIdentifier, undefined, [toNLExpression(objectProperties)]);
};

const createRequiredValidator = (
	validatorIdentifier: ts.Expression,
	validatorCreator: (
		typeNode: ts.TypeNode,
		typeParameters: readonly ts.TypeNode[] | undefined
	) => ts.Expression,
	typeChecker: ts.TypeChecker
) => (
	properties: ts.Symbol[],
	inputTypeParameters: readonly ts.TypeNode[] | undefined,
	typeParameters: readonly ts.TypeNode[] | ts.Symbol[] | undefined
) => {
	const objectProperties = getObjectValidatorProperties(
		validatorIdentifier,
		validatorCreator,
		typeChecker
	)(properties, inputTypeParameters, typeParameters);

	return call(validatorIdentifier)('Required', [toNLExpression(objectProperties)]);
};

const createPartialValidator = (
	validatorIdentifier: ts.Expression,
	validatorCreator: (
		typeNode: ts.TypeNode,
		typeParameters: readonly ts.TypeNode[] | undefined
	) => ts.Expression,
	typeChecker: ts.TypeChecker
) => (
	properties: ts.Symbol[],
	inputTypeParameters: readonly ts.TypeNode[] | undefined,
	typeParameters: readonly ts.TypeNode[] | ts.Symbol[] | undefined
) => {
	const objectProperties = getObjectValidatorProperties(
		validatorIdentifier,
		validatorCreator,
		typeChecker
	)(properties, inputTypeParameters, typeParameters);

	return call(validatorIdentifier)('Partial', [toNLExpression(objectProperties)]);
};

export const createValidator = (
	parent: ts.Node,
	validatorIdentifier: ts.Expression,
	typeChecker: ts.TypeChecker
) => (typeNode: ts.TypeNode, typeParameters: readonly ts.TypeNode[] = []): ts.Expression => {
	const caller = call(validatorIdentifier);
	const getter = get(validatorIdentifier);

	const subValidator = createValidator(parent, validatorIdentifier, typeChecker);

	const type = typeChecker.getTypeFromTypeNode(typeNode);

	if (ts.isUnionTypeNode(typeNode)) {
		if (
			typeNode.types
				.map(subType => typeChecker.getTypeFromTypeNode(subType))
				.filter(item => item.flags === ts.TypeFlags.Undefined).length > 0
		) {
			return caller('Optional', [
				caller('Or', [
					ts.createLiteral(typeChecker.typeToString(type)),
					...typeNode.types
						.filter(
							subTypeNode =>
								typeChecker.getTypeFromTypeNode(subTypeNode).flags !==
								ts.TypeFlags.Undefined
						)
						.map(subType => subValidator(subType))
				])
			]);
		}

		return caller('Or', [
			ts.createLiteral(typeChecker.typeToString(type)),
			...typeNode.types.map(subType => subValidator(subType, typeParameters))
		]);
	}

	if (ts.isIntersectionTypeNode(typeNode)) {
		return caller('And', [
			ts.createLiteral(typeChecker.typeToString(type)),
			...typeNode.types.map(subType => subValidator(subType, typeParameters))
		]);
	}

	// tslint:disable-next-line: no-bitwise
	if ((type.flags & ts.TypeFlags.EnumLiteral) !== 0 && ts.isTypeReferenceNode(typeNode)) {
		if (typeNode.typeName.kind === ts.SyntaxKind.QualifiedName && 'value' in type) {
			return caller('StrictValue', [ts.createLiteral((type as ts.LiteralType).value)]);
		}
	}

	if (
		ts.isLiteralExpression(typeNode) ||
		ts.isStringLiteral(typeNode) ||
		ts.isNumericLiteral(typeNode)
	) {
		return caller('StrictValue', [ts.createLiteral(typeNode.text)]);
	}

	if (ts.isLiteralTypeNode(typeNode)) {
		if (typeNode.literal.kind === ts.SyntaxKind.TrueKeyword) {
			return caller('StrictValue', [ts.createLiteral(true)]);
		}

		if (typeNode.literal.kind === ts.SyntaxKind.FalseKeyword) {
			return caller('StrictValue', [ts.createLiteral(false)]);
		}

		if (typeNode.literal.kind === ts.SyntaxKind.StringLiteral) {
			return caller('StrictValue', [ts.createLiteral(typeNode.literal.text)]);
		}
	}

	if (ts.isArrayTypeNode(typeNode)) {
		const arrayTypeArg = getFullGenericType(typeNode, typeChecker);
		if (arrayTypeArg) {
			return caller('ArrayOf', [
				createValidator(
					parent,
					validatorIdentifier,
					typeChecker
				)(arrayTypeArg[0], arrayTypeArg[1])
			]);
		}
	}

	if (type.flags === ts.TypeFlags.Any || type.flags === ts.TypeFlags.Unknown) {
		return getter('Anything');
	}

	if (type.flags === ts.TypeFlags.String || type.flags === ts.TypeFlags.StringLike) {
		return getter('String');
	}

	if (type.flags === ts.TypeFlags.Number || type.flags === ts.TypeFlags.NumberLike) {
		return getter('Number');
	}

	if (type.flags === ts.TypeFlags.Boolean || type.flags === ts.TypeFlags.BooleanLike) {
		return getter('Boolean');
	}

	if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) {
		return getter('Boolean');
	}

	if (type.flags === ts.TypeFlags.Null) {
		return getter('Null');
	}

	if (ts.isTypeReferenceNode(typeNode)) {
		// console.log(typeNode.typeName.getText());
		const aliasedType = typeChecker.getTypeAtLocation(typeNode.typeName) as
			| ts.Type
			| ts.InterfaceType;
		const aliasSymbol = aliasedType.aliasSymbol;

		const typeName = getName(typeNode.typeName);

		if (!aliasSymbol) {
			return createObjectValidator(validatorIdentifier, subValidator, typeChecker)(
				aliasedType.getProperties(),
				typeParameters,
				'localTypeParameters' in aliasedType
					? aliasedType.localTypeParameters?.map(p => p.symbol) ?? []
					: []
			);
		}

		if (typeName === 'Required') {
			// TODO: FIXME
			if (!getFullGenericType(typeNode, typeChecker)) {
				// TODO: FIXME
			} else {
				const [subTypeNode, typeNodeArguments] = getFullGenericType(typeNode, typeChecker)!;
				const properties = typeChecker.getTypeAtLocation(subTypeNode);
				return createRequiredValidator(validatorIdentifier, subValidator, typeChecker)(
					properties.getProperties(),
					typeParameters,
					typeNodeArguments
				);
			}
		}

		if (typeName === 'Partial') {
			// TODO: FIXME
			if (!getFullGenericType(typeNode, typeChecker)) {
				// TODO: FIXME
			} else {
				const [subTypeNode, typeNodeArguments] = getFullGenericType(typeNode, typeChecker)!;
				const properties = typeChecker.getTypeAtLocation(subTypeNode);
				return createPartialValidator(validatorIdentifier, subValidator, typeChecker)(
					properties.getProperties(),
					typeParameters,
					typeNodeArguments
				);
			}
		}

		if (typeName === 'Array') {
			const arrayTypeArg = getFullGenericType(typeNode, typeChecker);
			return caller('ArrayOf', [
				createValidator(
					parent,
					validatorIdentifier,
					typeChecker
				)(arrayTypeArg![0], arrayTypeArg?.[1] ?? [])
			]);
		}

		const declaration = aliasSymbol.declarations[0];

		if (ts.isEnumDeclaration(declaration)) {
			const enumType = typeChecker.getTypeAtLocation(declaration);

			if (!enumType.symbol.exports) {
				throw new Error('Cannot handle enum ' + enumType.symbol.name);
			}

			const members: ts.Expression[] = [];

			enumType.symbol.exports.forEach((value, key) => {
				if (!ts.isEnumMember(value.valueDeclaration)) {
					throw new Error('Invalid enum member field');
				}
				// console.log(key, value.valueDeclaration);

				const initializer = value.valueDeclaration.initializer;

				if (!initializer) {
					throw new Error('Enum field is not inialized: ' + key);
				}

				members.push(
					initializer.kind === ts.SyntaxKind.NumericLiteral
						? ts.createNumericLiteral(initializer.getText())
						: initializer
				);
			});

			return caller(
				'OneOfStrict',
				[ts.createLiteral(typeChecker.typeToString(type)), ...members]
				// declaration.members.map(enumMember => enumMember).map(ts.createLiteral)
			);
		}

		if (ts.isTypeAliasDeclaration(declaration)) {
			return subValidator(declaration.type, typeNode.typeArguments);
		}

		throw new Error(
			'Cannot handle type ' + aliasSymbol.name + ' of type ' + ts.SyntaxKind[declaration.kind]
		);
	}

	if (ts.isObjectLiteralElement(typeNode)) {
		return createObjectValidator(validatorIdentifier, subValidator, typeChecker)(
			type.getProperties(),
			typeParameters,
			typeParameters
		);
	}

	if (ts.isTypeLiteralNode(typeNode)) {
		const indexSignature = typeNode.members[0];
		if (indexSignature && ts.isIndexSignatureDeclaration(indexSignature)) {
			const mapType = indexSignature.parameters[0].type;

			if (mapType) {
				return caller('Values', [subValidator(mapType, typeParameters)]);
			}
		} else {
			return createObjectValidator(validatorIdentifier, subValidator, typeChecker)(
				type.getProperties(),
				typeParameters,
				typeParameters
			);
		}
	}

	if (ts.isMappedTypeNode(typeNode)) {
		// console.log(type.getApparentProperties());
		// console.log({
		// 	kind: typeNode.kind,
		// 	readonlyToken: typeNode.readonlyToken,
		// 	typeParameter: typeNode.typeParameter,
		// 	questionToken: typeNode.questionToken,
		// 	type: typeNode.type,
		// });
		// console.log(typeParameters);
		// const subType = typeNode.typeParameter;
		// console.log(stripProp('parent')(stripProp('nextContainer')(typeNode.parent)));
		// console.log((typeNode.type as ts.IndexedAccessTypeNode)?.indexType);
		return createObjectValidator(validatorIdentifier, subValidator, typeChecker)(
			type.getProperties(),
			typeParameters,
			typeParameters
		);
	}

	throw new Error(
		'Unrecognized type: ' + ts.TypeFlags[type.flags] + ' (' + ts.SyntaxKind[typeNode.kind] + ')'
	);
};

export default (node: ts.CallExpression, typeChecker: ts.TypeChecker) => {
	const typeArgument = node.typeArguments?.[0];
	const argument = node.arguments[0];

	if (!typeArgument || !argument) {
		return node;
	}

	return createValidator(
		node,
		argument,
		typeChecker
	)(typeArgument, ts.isTypeReferenceNode(typeArgument) ? typeArgument.typeArguments ?? [] : []);
};
