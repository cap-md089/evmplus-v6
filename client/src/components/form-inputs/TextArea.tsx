import { DraftHandleValue, Editor, EditorState, RichUtils } from 'draft-js';
import * as React from 'react';
import { InputProps } from './Input';

interface TextAreaProps extends InputProps<EditorState> {
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
export default class TextArea extends React.Component<TextAreaProps> {
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

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: (this.props.value || EditorState.createEmpty())
			});
		}
	}

	public render() {
		const editorState = this.editorState;

		return (
			<div
				className="formbox"
				style={{
					marginBottom: 10,
					width: this.props.fullWidth ? '90%' : undefined,
					clear: this.props.fullWidth ? 'both' : undefined,
					...this.props.boxStyles
				}}
			>
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
						/>
					</div>
				</div>
			</div>
		);
	}

	private get editorState() {
		return (this.props.value || EditorState.createEmpty());
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
}
