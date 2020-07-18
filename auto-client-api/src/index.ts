import { notStrictEqual } from 'assert';
import { mkdir } from 'fs';
import { dirname, join, resolve } from 'path';
import * as ts from 'typescript';
import { promisify } from 'util';
import addAPI from './addAPI';
import apiCall from './apiCall';
import apiURL from './apiURL';
import generateAPITree from './generateAPITree';
import validator from './validator';

const args = process.argv.slice();
const argsWithoutOptions = args.filter(arg => arg !== '--watch');

const outputDirectory = argsWithoutOptions[2];
const inputConfigFile = argsWithoutOptions[3];

// const watch = args.includes('--watch');

if (require.main === module) {
	notStrictEqual(outputDirectory, undefined);
	notStrictEqual(inputConfigFile, undefined);

	(async (inputProjectConfigFile: string, programOutputDirectory: string) => {
		await promisify(mkdir)(programOutputDirectory, {
			recursive: true,
		});

		const host: ts.ParseConfigFileHost = ts.sys as any;
		host.onUnRecoverableConfigFileDiagnostic = () => void 0;
		const parsedCmd = ts.getParsedCommandLineOfConfigFile(inputProjectConfigFile, {}, host);
		// @ts-ignore
		host.onUnRecoverableConfigFileDiagnostic = undefined;

		if (!parsedCmd) {
			throw new Error('Could not get configuration');
		}

		const { options, fileNames } = parsedCmd;

		const program = ts.createProgram({
			rootNames: fileNames,
			options,
		});

		const transformers: ts.CustomTransformers = {
			before: [transformer(program)],
			after: [],
		};

		const { emitSkipped, diagnostics } = program.emit(
			undefined,
			undefined,
			undefined,
			false,
			transformers
		);

		if (emitSkipped) {
			throw new Error(diagnostics.map(diagnostic => diagnostic.messageText).join('\n'));
		}

		process.exit(0);
	})(inputConfigFile, outputDirectory).catch(err => {
		console.error(err);
		process.exit(1);
	});
}

const indexJs = join(__dirname, 'index.js');
const isImportExpression = (node: ts.Node): node is ts.ImportDeclaration => {
	if (!ts.isImportDeclaration(node)) {
		return false;
	}

	const module = (node.moduleSpecifier as ts.StringLiteral).text;

	try {
		return (
			indexJs ===
			require.resolve(
				module.startsWith('.')
					? resolve(dirname(node.getSourceFile().fileName), module)
					: module
			)
		);
	} catch (e) {
		return false;
	}
};

const indexDTs = resolve(__dirname, '..', 'index.d.ts');

const isFunctionCallExpression = (name: string) => (
	node: ts.Node,
	typeChecker: ts.TypeChecker
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

function visitNodeAndChildren(
	node: ts.SourceFile,
	program: ts.Program,
	context: ts.TransformationContext
): ts.SourceFile;
function visitNodeAndChildren(
	node: ts.Node,
	program: ts.Program,
	context: ts.TransformationContext
): ts.Node | undefined;

function visitNodeAndChildren(
	node: ts.Node,
	program: ts.Program,
	context: ts.TransformationContext
): ts.Node | undefined {
	return ts.visitEachChild(
		visitNode(node, program),
		childNode => visitNodeAndChildren(childNode, program, context),
		context
	);
}

function visitNode(node: ts.SourceFile, program: ts.Program): ts.SourceFile;
function visitNode(node: ts.Node, program: ts.Program): ts.Node | undefined;

function visitNode(node: ts.Node, program: ts.Program): ts.Node | undefined {
	if (isImportExpression(node)) {
		return node;
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

	return node;
}

export default function transformer(program: ts.Program): ts.TransformerFactory<ts.SourceFile> {
	return context => file => visitNodeAndChildren(file, program, context);
}
