import * as React from 'react';
import myFetch from '../../lib/myFetch';
import urlFormat from '../../lib/urlFormat';
import Button from '../Button';
import FileDialogue from '../FileDialogue';
import Loader from '../Loader';
import './FileInput.css';
import { InputProps } from './Input';

interface FileInputState {
	files: FileObject[];
	dialogueOpen: boolean;
	loaded: boolean;
}

interface FileDisplayProps {
	onClick: (file: FileObject) => void;
	file: FileObject;
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

export default class FileInput extends React.Component<
	InputProps<string[]>,
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

	public state = {
		loaded: false,
		dialogueOpen: false,
		files: [] as FileObject[]
	};

	private previousFiles: string[] = [];

	constructor(props: InputProps<string[]>) {
		super(props);

		this.handleFileSelect = this.handleFileSelect.bind(this);
		this.onFileRemove = this.onFileRemove.bind(this);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: this.props.value || []
			});
		}
	}

	public async componentDidMount() {
		const sid = localStorage.getItem('sessionID');

		if (this.props.value) {
			const files: FileObject[] = await Promise.all(
				this.props.value.map(id =>
					myFetch(urlFormat('api', 'files', id), {
						headers: {
							authorization: !!sid ? sid : ''
						}
					}).then(res => res.json())
				)
			);

			this.setState({
				files,
				loaded: true
			});
		} else {
			this.setState({
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
		return this.state.loaded ? (
			<div className="formbox" style={this.props.boxStyles}>
				<div className="fileInput">
					<FileDialogue
						open={this.state.dialogueOpen}
						onReturn={this.handleFileSelect}
					/>
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

	private handleFileSelect(files: FileObject[]) {
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
	}

	private onFileRemove(file: FileObject) {
		let files = this.state.files.slice(0);

		files = files.filter(f => f.id !== file.id);

		this.setState({ files });
	}
}
