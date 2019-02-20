import {
	AtomicBlockUtils,
	ContentBlock,
	ContentState,
	DraftHandleValue,
	Editor,
	EditorState,
	RichUtils,
	CompositeDecorator
} from 'draft-js';
import * as React from 'react';
import { Link } from 'react-router-dom';
import urlFormat from '../../lib/urlFormat';
import Dialogue, { DialogueButtons } from '../dialogues/Dialogue';
import FileDialogue from '../dialogues/FileDialogue';
import { InputProps } from './Input';
import { FileObject } from 'common-lib';

export let index = 0;

export const mediaRenderFunction = (
	block: ContentBlock,
	contentState: ContentState
) => {
	if (block.getType() === 'atomic') {
		const entity = block.getEntityAt(0);
		if (!entity) {
			return null;
		}
		const type = contentState.getEntity(entity).getType();

		switch (type) {
			case 'IMAGE':
				return {
					component: Media,
					editable: false
				};

			case 'HYPERLINK':
				return {
					component: HyperLink,
					editable: true
				};

			default:
				return null;
		}
	} else {
		return null;
	}
};

export const blockStyleFunction = (block: ContentBlock) => {
	switch (block.getType() as string) {
		case 'leftalign':
			return 'textarea-leftalign';
		case 'centeralign':
			return 'textarea-centeralign';
		case 'rightalign':
			return 'textarea-rightalign';
	}

	return null;
};

const HyperLink: React.SFC<any> = ({ block, contentState }) => {
	const { href, text } = contentState
		.getEntity(block.getEntityAt(0))
		.getData();

	if (
		!!href.match(/^(https?\:\/\/)?(www\.)?capunit\.com\/?/) ||
		href[0] === '/'
	) {
		return <Link to={href}>{text}</Link>;
	} else {
		return (
			<a href={href} target="_blank">
				{text}
			</a>
		);
	}
};

const Media: React.SFC<any> = ({ block, contentState }) => {
	const { src } = contentState.getEntity(block.getEntityAt(0)).getData();

	return (
		<div>
			<img
				style={{
					width: '100%'
				}}
				src={src}
			/>
		</div>
	);
};

const headerID: React.SFC<any> = props => {
	return <span id={`content-${props.offsetKey}`}>{props.children}</span>;
};

const headerStrategy: (
	block: ContentBlock,
	callback: (start: number, end: number) => void,
	contentState: ContentState
) => void = (block, callback) => {
	if (block.getType().substr(0, 6) === 'header') {
		callback(0, block.getText().length);
	}
};

export const HeaderDecorator = new CompositeDecorator([
	{
		strategy: headerStrategy,
		component: headerID
	}
]);

export interface TextAreaProps extends InputProps<EditorState> {
	/**
	 * Whether or not to make the input span the entire width of the row.
	 */
	fullWidth?: boolean;
}

/**
 * To use values generated here, use the following code:
 *
 * 		<Editor
 * 			editorState={EditorState.createWithContent(
 * 				convertFromRaw(text)
 * 			)}
 * 			readOnly={true}
 * 			onChange={() => null}
 * 		/>
 */
export default class TextArea extends React.Component<
	TextAreaProps,
	{
		fileDialogueOpen: boolean;
	}
> {
	public state = {
		fileDialogueOpen: false,
		draft: null
	};

	private imagePromise = {
		resolve: null as null | ((obj: FileObject[]) => void),
		getPromise: () =>
			new Promise<FileObject[]>((res, rej) => {
				this.imagePromise.resolve = (data: FileObject[]) => {
					res(data);
					this.imagePromise.resolve = null;
				};
			})
	};

	constructor(props: TextAreaProps) {
		super(props);

		this.onChange = this.onChange.bind(this);
		this.handleKeyCommand = this.handleKeyCommand.bind(this);

		this.toggleBold = this.toggleBold.bind(this);
		this.toggleItalic = this.toggleItalic.bind(this);
		this.toggleUnderline = this.toggleUnderline.bind(this);
		this.toggleHeading1 = this.toggleHeading1.bind(this);
		this.toggleHeading2 = this.toggleHeading2.bind(this);
		this.toggleHeading3 = this.toggleHeading3.bind(this);
		this.toggleHeading4 = this.toggleHeading4.bind(this);
		this.toggleHeading5 = this.toggleHeading5.bind(this);
		this.toggleHeading6 = this.toggleHeading6.bind(this);
		this.toggleUL = this.toggleUL.bind(this);
		this.toggleOL = this.toggleOL.bind(this);
		this.addImage = this.addImage.bind(this);
		this.toggleLeftAlign = this.toggleLeftAlign.bind(this);
		this.toggleCenterAlign = this.toggleCenterAlign.bind(this);
		this.toggleRightAlign = this.toggleRightAlign.bind(this);

		this.onFileSelect = this.onFileSelect.bind(this);
		this.filterImageFiles = this.filterImageFiles.bind(this);

		this.closeErrorDialogue = this.closeErrorDialogue.bind(this);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: this.props.value || EditorState.createEmpty()
			});
		}
	}

	public render() {
		if (!this.props.account) {
			throw new Error('Account not specified');
		}

		if (typeof this.props.member === 'undefined') {
			throw new Error(
				'No member variable passed, will not work when people are signed in. ' +
					'If this is intentional, pass `null` to member'
			);
		}

		index = 0;

		const editorState = EditorState.set(this.editorState, {
			decorator: HeaderDecorator
		});

		return (
			<div
				className={`formbox${this.props.fullWidth ? ' fullWidth' : ''}`}
				style={{
					marginBottom: 10,
					width: this.props.fullWidth ? '90%' : undefined,
					clear: this.props.fullWidth ? 'both' : undefined,
					...this.props.boxStyles
				}}
			>
				{this.props.member ? (
					<FileDialogue
						open={this.state.fileDialogueOpen}
						onReturn={this.onFileSelect}
						filter={this.filterImageFiles}
						multiple={false}
						member={this.props.member}
						account={this.props.account}
					/>
				) : (
					<Dialogue
						open={this.state.fileDialogueOpen}
						displayButtons={DialogueButtons.OK}
						onClose={this.closeErrorDialogue}
						title="Please sign in"
					>
						Please sign in
					</Dialogue>
				)}
				<div className="textarea-box">
					<div className="textarea-box-controls">
						<span
							onMouseDown={this.toggleHeading1}
							style={{
								fontWeight:
									this.getBlockType() === 'header-one'
										? 'bold'
										: 'normal'
							}}
						>
							H1
						</span>
						<span
							onMouseDown={this.toggleHeading2}
							style={{
								fontWeight:
									this.getBlockType() === 'header-two'
										? 'bold'
										: 'normal'
							}}
						>
							H2
						</span>
						<span
							onMouseDown={this.toggleHeading3}
							style={{
								fontWeight:
									this.getBlockType() === 'header-three'
										? 'bold'
										: 'normal'
							}}
						>
							H3
						</span>
						<span
							onMouseDown={this.toggleHeading4}
							style={{
								fontWeight:
									this.getBlockType() === 'header-four'
										? 'bold'
										: 'normal'
							}}
						>
							H4
						</span>
						<span
							onMouseDown={this.toggleHeading5}
							style={{
								fontWeight:
									this.getBlockType() === 'header-five'
										? 'bold'
										: 'normal'
							}}
						>
							H5
						</span>
						<span
							onMouseDown={this.toggleHeading6}
							style={{
								fontWeight:
									this.getBlockType() === 'header-six'
										? 'bold'
										: 'normal'
							}}
						>
							H6
						</span>
						<span
							onMouseDown={this.toggleUL}
							style={{
								fontWeight:
									this.getBlockType() ===
									'unordered-list-item'
										? 'bold'
										: 'normal'
							}}
						>
							UL
						</span>
						<span
							onMouseDown={this.toggleOL}
							style={{
								fontWeight:
									this.getBlockType() === 'ordered-list-item'
										? 'bold'
										: 'normal'
							}}
						>
							OL
						</span>
						<br />
						<span
							onMouseDown={this.toggleBold}
							style={{
								fontWeight: editorState
									.getCurrentInlineStyle()
									.has('BOLD')
									? 'bold'
									: 'normal'
							}}
						>
							B
						</span>
						<span
							onMouseDown={this.toggleItalic}
							style={{
								fontStyle: editorState
									.getCurrentInlineStyle()
									.has('ITALIC')
									? 'italic'
									: 'normal'
							}}
						>
							I
						</span>
						<span
							onMouseDown={this.toggleUnderline}
							style={{
								textDecoration: editorState
									.getCurrentInlineStyle()
									.has('UNDERLINE')
									? 'underline'
									: 'none'
							}}
						>
							U
						</span>
						<span
							onMouseDown={this.addImage}
							style={{
								backgroundImage: 'url(/images/image.png)',
								display: 'inline-block',
								width: 29,
								height: 25,
								backgroundSize: '29px 25px',
								float: 'left'
							}}
						/>
						<br />
						{/* <span
							onMouseDown={this.toggleLeftAlign}
						>
							LA
						</span>
						<span
							onMouseDown={this.toggleCenterAlign}
						>
							CA
						</span>
						<span
							onMouseDown={this.toggleRightAlign}
						>
							RA
						</span> */}
					</div>
					<div
						className="textarea-box-editor"
						style={{
							maxHeight: 1000,
							overflow: 'auto'
						}}
					>
						<Editor
							{...this.props}
							editorState={editorState}
							handleKeyCommand={this.handleKeyCommand}
							onChange={this.onChange}
							blockRendererFn={(block: ContentBlock) =>
								mediaRenderFunction(
									block,
									this.editorState.getCurrentContent()
								)
							}
						/>
					</div>
				</div>
			</div>
		);
	}

	private get editorState() {
		return this.props.value || EditorState.createEmpty();
	}

	private toggleBold(e: React.MouseEvent<HTMLSpanElement>) {
		e.preventDefault();
		this.onChange(RichUtils.toggleInlineStyle(this.editorState, 'BOLD'));
	}

	private toggleItalic(e: React.MouseEvent<HTMLSpanElement>) {
		e.preventDefault();
		this.onChange(RichUtils.toggleInlineStyle(this.editorState, 'ITALIC'));
	}

	private toggleUnderline(e: React.MouseEvent<HTMLSpanElement>) {
		e.preventDefault();
		this.onChange(
			RichUtils.toggleInlineStyle(this.editorState, 'UNDERLINE')
		);
	}

	private toggleHeading1(e: React.MouseEvent<HTMLSpanElement>) {
		e.preventDefault();
		this.onChange(
			RichUtils.toggleBlockType(this.editorState, 'header-one')
		);
	}

	private toggleHeading2(e: React.MouseEvent<HTMLSpanElement>) {
		e.preventDefault();
		this.onChange(
			RichUtils.toggleBlockType(this.editorState, 'header-two')
		);
	}

	private toggleHeading3(e: React.MouseEvent<HTMLSpanElement>) {
		e.preventDefault();
		this.onChange(
			RichUtils.toggleBlockType(this.editorState, 'header-three')
		);
	}

	private toggleHeading4(e: React.MouseEvent<HTMLSpanElement>) {
		e.preventDefault();
		this.onChange(
			RichUtils.toggleBlockType(this.editorState, 'header-four')
		);
	}

	private toggleHeading5(e: React.MouseEvent<HTMLSpanElement>) {
		e.preventDefault();
		this.onChange(
			RichUtils.toggleBlockType(this.editorState, 'header-five')
		);
	}

	private toggleHeading6(e: React.MouseEvent<HTMLSpanElement>) {
		e.preventDefault();
		this.onChange(
			RichUtils.toggleBlockType(this.editorState, 'header-six')
		);
	}

	private toggleUL(e: React.MouseEvent<HTMLSpanElement>) {
		e.preventDefault();
		this.onChange(
			RichUtils.toggleBlockType(this.editorState, 'unordered-list-item')
		);
	}

	private toggleOL(e: React.MouseEvent<HTMLSpanElement>) {
		e.preventDefault();
		this.onChange(
			RichUtils.toggleBlockType(this.editorState, 'ordered-list-item')
		);
	}

	private async addImage(e: React.MouseEvent<HTMLSpanElement>) {
		e.preventDefault();
		this.setState({
			fileDialogueOpen: true
		});

		const fileObject = await this.imagePromise.getPromise();

		if (fileObject.length !== 1) {
			return;
		}

		const contentState = this.editorState.getCurrentContent();

		const contentStateWithEntityKey = contentState.createEntity(
			'IMAGE',
			'IMMUTABLE',
			{
				src: urlFormat('api', 'files', fileObject[0].id, 'export'),
				width: '100%',
				height: '100%',
				float: 'left'
			}
		);

		const entityKey = contentStateWithEntityKey.getLastCreatedEntityKey();

		const newState = AtomicBlockUtils.insertAtomicBlock(
			EditorState.set(this.editorState, {
				currentContent: contentStateWithEntityKey
			}),
			entityKey,
			' '
		);

		this.onChange(
			EditorState.forceSelection(
				newState,
				newState.getCurrentContent().getSelectionAfter()
			)
		);
	}

	private toggleLeftAlign(e: React.MouseEvent<HTMLSpanElement>) {
		e.preventDefault();
		this.onChange(RichUtils.toggleBlockType(this.editorState, 'leftalign'));
	}

	private toggleCenterAlign(e: React.MouseEvent<HTMLSpanElement>) {
		e.preventDefault();
		this.onChange(
			RichUtils.toggleBlockType(this.editorState, 'centeralign')
		);
	}

	private toggleRightAlign(e: React.MouseEvent<HTMLSpanElement>) {
		e.preventDefault();
		this.onChange(
			RichUtils.toggleBlockType(this.editorState, 'rightalign')
		);
	}

	private onChange(editorState: EditorState): void {
		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: editorState
			});
		}

		if (this.props.onChange) {
			this.props.onChange(editorState);
		}
	}

	private getBlockType() {
		return this.editorState
			.getCurrentContent()
			.getBlockForKey(this.editorState.getSelection().getStartKey())
			.getType();
	}

	private handleKeyCommand(
		command: string,
		editorState: EditorState
	): DraftHandleValue {
		const newState = RichUtils.handleKeyCommand(editorState, command);
		if (newState) {
			this.onChange(newState);
			return 'handled';
		}
		return 'not-handled';
	}

	private onFileSelect(file: FileObject[]) {
		this.setState({
			fileDialogueOpen: false
		});
		if (this.imagePromise.resolve) {
			this.imagePromise.resolve([file[0]]);
		}
	}

	private filterImageFiles(file: FileObject) {
		return !!file.contentType.match(/image\//);
	}

	private closeErrorDialogue() {
		this.setState({
			fileDialogueOpen: false
		});
	}
}
