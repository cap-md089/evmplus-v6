import * as React from 'react';

import FileDialogue from '../FileDialogue';
import { FileObject } from '../../types';
import Loader from '../Loader';
import Button from '../Button';
import myFetch from '../../lib/myFetch';
import urlFormat from '../../lib/urlFormat';
import { InputProps } from './Input';

import './FileInput.css';

interface FileInputState {
	files: FileObject[];
	dialogueOpen: boolean;
	loaded: boolean;
}

interface FileDisplayProps {
	onClick: (file: FileObject) => void;
	file: FileObject;
}

const FileDisplay = ({
	onClick,
	file
}: FileDisplayProps) => (
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

export default class FileInput extends React.Component<InputProps<string[]>, FileInputState> {
	state = {
		loaded: false,
		dialogueOpen: false,
		files: [] as FileObject[]
	};

	constructor (props: InputProps<string[]>) {
		super(props);

		this.handleFileSelect = this.handleFileSelect.bind(this);
		this.onFileRemove = this.onFileRemove.bind(this);
	}

	async componentDidMount() {
		let sid = localStorage.getItem('sessionID');

		if (this.props.value) {
			let files: FileObject[] = await Promise.all(this.props.value.map(id => 
				myFetch(
					urlFormat('api', 'files', id),
					{
						headers: {
							authorization: !!sid ? sid : ''
						}
					}
				).then(res =>
					res.json())
			));

			console.log(files);

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

	componentDidUpdate () {
		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: this.state.files.map(f => f.id)
			});
		}
		
		if (this.props.onChange) {
			this.props.onChange(
				this.state.files.map(f => f.id)
			);
		}
	}

	render () {
		return this.state.loaded ?
			(
				<div className="formbox">
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
							{
								this.state.files.map((file, i) =>
									<FileDisplay
										key={i}
										file={file}
										onClick={this.onFileRemove}
									/>
								)
							}
						</div>
					</div>
				</div>
			) :
			<Loader />;
	}

	private handleFileSelect (files: FileObject[]) {
		let newFiles = this.state.files.slice(0);

		for (let i = 0; i < files.length; i++) {
			let add = true;
			for (let j = 0; j < newFiles.length; j++) {
				if (newFiles[j].id === files[i].id) {
					add = false;
					break;
				}
			}
			if (add) {
				newFiles.push(files[i]);
			}
		}

		this.setState({
			files: newFiles,
			dialogueOpen: false
		});
	}

	private onFileRemove (file: FileObject) {
		let files = this.state.files.slice(0);

		files = files.filter(f => f.id !== file.id);

		this.setState({files});
	}
}