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

import { join, resolve } from 'path';
import * as ts from 'typescript';
import generateRequest from './generateRequest';
import addAPI from './addAPI';
import apiCall from './apiCall';
import apiURL from './apiURL';
import generateAPITree from './generateAPITree';
import validator from './validator';

const isMacroImportExpression = (node: ts.Node): node is ts.ImportDeclaration => {
	if (!ts.isImportDeclaration(node)) {
		return false;
	}

	const module = (node.moduleSpecifier as ts.StringLiteral).text;

	try {
		return module === 'auto-client-api';
	} catch (e) {
		return false;
	}
};

const indexDTs = resolve(__dirname, '..', 'index.d.ts');

const isFunctionCallExpression = (name: string) => (
	node: ts.Node,
	typeChecker: ts.TypeChecker,
): node is ts.CallExpression => {
	if (!ts.isCallExpression(node)) {
		return false;
	}

	const signature = typeChecker.getResolvedSignature(node);

	if (signature === undefined) {
		return false;
	}

	const { declaration } = signature;
	return (
		!!declaration &&
		!ts.isJSDocSignature(declaration) &&
		join(declaration.getSourceFile().fileName.replace(/lib\/node_modules\//, '')) ===
			indexDTs &&
		!!declaration.name &&
		declaration.name.getText() === name
	);
};

const isAPIURLCallExpression = isFunctionCallExpression('apiURL');
const isAPICallExpression = isFunctionCallExpression('apiCall');
const isValidatorCallExpression = isFunctionCallExpression('validator');
const isAddAPICallExpression = isFunctionCallExpression('addAPI');
const isGenerateAPITreeCallExpression = isFunctionCallExpression('generateAPITree');
const isGenerateRequestCallExpression = isFunctionCallExpression('generateRequest');

function visitNodeAndChildren(
	node: ts.SourceFile,
	program: ts.Program,
	context: ts.TransformationContext,
): ts.SourceFile;
function visitNodeAndChildren(
	node: ts.Node,
	program: ts.Program,
	context: ts.TransformationContext,
): ts.Node | undefined;

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function visitNodeAndChildren(
	node: ts.Node,
	program: ts.Program,
	context: ts.TransformationContext,
): ts.Node | undefined {
	return ts.visitEachChild(
		visitNode(node, program, context),
		childNode => visitNodeAndChildren(childNode, program, context),
		context,
	);
}

function visitNode(
	node: ts.SourceFile,
	program: ts.Program,
	context: ts.TransformationContext,
): ts.SourceFile;
function visitNode(
	node: ts.Node,
	program: ts.Program,
	context: ts.TransformationContext,
): ts.Node | undefined;

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
function visitNode(node: ts.Node, program: ts.Program): ts.Node | undefined {
	if (isMacroImportExpression(node)) {
		return undefined;
	}
	const typeChecker = program.getTypeChecker();
	if (isAPICallExpression(node, typeChecker)) {
		return apiCall(node, typeChecker);
	}
	if (isAPIURLCallExpression(node, typeChecker)) {
		return apiURL(node, typeChecker);
	}
	if (isValidatorCallExpression(node, typeChecker)) {
		return validator(node, typeChecker);
	}
	if (isAddAPICallExpression(node, typeChecker)) {
		return addAPI(node, typeChecker);
	}
	if (isGenerateAPITreeCallExpression(node, typeChecker)) {
		return generateAPITree(node, typeChecker);
	}
	if (isGenerateRequestCallExpression(node, typeChecker)) {
		return generateRequest(node, typeChecker);
	}

	return node;
}

const transformer = (
	program: ts.Program,
): ts.TransformerFactory<ts.SourceFile> => context => file =>
	visitNodeAndChildren(file, program, context);

export default transformer;
