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
import { getStringLiteralFromType } from './util';

export default (node: ts.CallExpression, typeChecker: ts.TypeChecker): ts.Node | undefined => {
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

	return ts.factory.createStringLiteral(url);
};
