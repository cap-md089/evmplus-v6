import * as React from 'react';
import FileInterface from '../../lib/File';
import Button from '../Button';
import Dialogue, { DialogueButtons } from '../dialogues/Dialogue';
import FileDialogue from '../dialogues/FileDialogue';
import Loader from '../Loader';
import './FileInput.css';
import { InputProps } from './Input';
import { FileObject } from 'common-lib';

interface FileInputState {
	files: FileInterface[];
	dialogueOpen: boolean;
	loaded: boolean;
}

interface FileDisplayProps {
	onClick: (file: FileObject) => void;
	file: FileInterface;
}

const FileDisplay = ({ onClick, file }: FileDisplayProps) => (
	<div
		className="fileDisplay"
		style={{
			clear: 'both'
		}}
	>
		{file.fileName}
		<Button
			className="floatAllthewayRight"
			onClick={() => {
				onClick(file);
				return false;
			}}
			buttonType="none"
		>
			Remove file
		</Button>
	</div>
);

interface FileInputProps extends InputProps<string[]> {
	filter?: (
		element: FileObject,
		index: number,
		array: FileObject[]
	) => boolean;
}

export default class FileInput extends React.Component<
	FileInputProps,
	FileInputState
> {
	public static getDerivedStateFromProps(
		props: InputProps<string[]>,
		state: FileInputState
	): FileInputState | null {
		if (props.value === state.files.map(f => f.id)) {
			return null;
		} else {
			return state;
		}
	}

	public state: FileInputState = {
		loaded: false,
		dialogueOpen: false,
		files: []
	};

	private previousFiles: string[] = [];

	constructor(props: FileInputProps) {
		super(props);

		this.handleFileSelect = this.handleFileSelect.bind(this);
		this.onFileRemove = this.onFileRemove.bind(this);
		this.closeErrorDialogue = this.closeErrorDialogue.bind(this);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: this.props.value || []
			});
		}
	}

	public async componentDidMount() {
		if (this.props.value && this.props.account && this.props.member) {
			const account = this.props.account;

			const files = await Promise.all(
				this.props.value.map(id =>
					FileInterface.Get(id, this.props.member, account)
				)
			);

			this.setState({
				files,
				loaded: true
			});
		} else {
			this.setState({
				files: [],
				loaded: true
			});
		}
	}

	public componentDidUpdate() {
		let shouldUpdate = false;
		const files = this.state.files.map(f => f.id);

		for (const i in files) {
			if (files[i] !== this.previousFiles[i]) {
				shouldUpdate = true;
			}
		}

		if (!shouldUpdate) {
			return;
		}

		this.previousFiles = files;

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: this.state.files.map(f => f.id)
			});
		}

		if (this.props.onChange) {
			this.props.onChange(this.state.files.map(f => f.id));
		}
	}

	public render() {
		if (!this.props.account) {
			throw new Error('Account not provided');
		}

		if (typeof this.props.member === 'undefined') {
			throw new Error(
				'No member variable passed, will not work when people are signed in. ' +
					'If this is intentional, pass `null` to member'
			);
		}

		return this.state.loaded ? (
			<div className="formbox" style={this.props.boxStyles}>
				<div className="fileInput">
					{this.props.member ? (
						<FileDialogue
							open={this.state.dialogueOpen}
							onReturn={this.handleFileSelect}
							filter={this.props.filter}
							member={this.props.member}
							account={this.props.account}
						/>
					) : this.state.dialogueOpen ? (
						<Dialogue
							open={this.state.dialogueOpen}
							displayButtons={DialogueButtons.OK}
							onClose={this.closeErrorDialogue}
							title="Sign in error"
						>
							Please sign in
						</Dialogue>
					) : null}
					<Button
						onClick={() => {
							this.setState({
								dialogueOpen: true
							});
						}}
					>
						Select or upload files
					</Button>
					<div>
						{this.state.files.map((file, i) => (
							<FileDisplay
								key={i}
								file={file}
								onClick={this.onFileRemove}
							/>
						))}
					</div>
				</div>
			</div>
		) : (
			<Loader />
		);
	}

	private handleFileSelect(files: FileInterface[]) {
		const newFiles = this.state.files.slice(0);

		for (const file of files) {
			let add = true;
			for (const newFile of newFiles) {
				if (newFile.id === file.id) {
					add = false;
					break;
				}
			}
			if (add) {
				newFiles.push(file);
			}
		}

		this.setState({
			files: newFiles,
			dialogueOpen: false
		});

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: newFiles.map(f => f.id)
			});
		}

		if (this.props.onChange) {
			this.props.onChange(newFiles.map(f => f.id));
		}
	}

	private onFileRemove(file: FileObject) {
		let files = this.state.files.slice(0);

		files = files.filter(f => f.id !== file.id);

		this.setState({ files });

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: files.map(f => f.id)
			});
		}

		if (this.props.onChange) {
			this.props.onChange(files.map(f => f.id));
		}
	}

	private closeErrorDialogue() {
		this.setState({
			dialogueOpen: false
		});
	}
}
