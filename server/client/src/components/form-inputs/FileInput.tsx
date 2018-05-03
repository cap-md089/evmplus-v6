import * as React from 'react';

import { InputProps } from './Input';

import urlFormat from '../../lib/urlFormat';
import myFetch from '../../lib/myFetch';

import Button from '../Button';
import Loader from '../Loader';
import { FileObject } from '../../../../src/types';
import { connect } from 'react-redux';
import { displayDialogue, DialogueAction } from '../../actions/dialogue';

import fileSelect from '../../lib/fileSelect';

interface FileInputElement {
	name: string;
	complete: boolean;
}

interface UploadedFileElement extends FileInputElement {
	// For completed files
	id: string;
}

interface UploadingFileElement extends FileInputElement {
	// For uploading files
	progress: number;

	// The actual file
	file: File;

	// To be used by the FileInput to upload files sequentially
	upload: boolean;
}

interface FileInputProps extends InputProps<string[]> {
	fileComponent?: new() => React.Component<{
		onFinish: (key: number, id: string) => void
	}, {}>;
	currentFiles?: string[];
	_currentFiles?: UploadedFileElement[];
	displaySelect?: boolean;
}

interface ConnectedFileInputProps extends FileInputProps {
	displayDialogue: (data: DialogueAction) => void;
}

interface FileUploadSliderProps extends UploadingFileElement {
	displayId: number;
	onFinish?: (key: number, id: string) => void;
}

interface FileDisplayProps extends UploadedFileElement {
	displayId: number;
	delete: (id: number) => void;
	deleteable: boolean;
}

class FileDisplay extends React.Component<FileDisplayProps, UploadedFileElement> {
	render () {
		return (
			<>
				<div
					className="fileName"
				>
					{this.props.name}
				</div>
				<div
					style={{
						'width': 'calc(50% - 30px)',
						'margin': 15,
						'boxSizing': 'border-box',
						'float': 'right'
					}}
				>
					<Button 
						onClick={() => {
							this.props.delete(this.props.displayId);
						}}
						buttonType={''}
					>
						Remove file
					</Button>
				</div>
			</>
		);
	}
}

class FileUploadSlider extends React.Component<FileUploadSliderProps, UploadingFileElement> {
	protected xhr: XMLHttpRequest;
	protected uploading: boolean;

	constructor(props: FileUploadSliderProps) {
		super(props);
		this.state = props;
		this.uploading = false;
	}

	protected checkUpdate () {
		if (
			typeof this.props.file !== 'undefined' &&
			typeof this.props.upload === 'boolean' &&
			this.props.upload &&
			!this.uploading
		) {
			this.uploading = true;
			setTimeout(() => {
				let fd = new FormData();
				fd.append('file', this.props.file, this.props.name);
				
				this.xhr = new XMLHttpRequest();
				this.xhr.open(
					'POST',
					urlFormat('api', 'files', 'upload')
				);
				
				this.xhr.upload.addEventListener(
					'progress',
					(evt) => {
						if (evt.lengthComputable) {
							this.setState(previousState => {
								return {
									...previousState,
									progress: 100 * (evt.loaded / evt.total)
								};
							});
						}
					},
					false
				);
				
				this.xhr.upload.addEventListener(
					'loadend',
					(evt) => {
						this.setState(previousState => {
							return {
								...previousState,
								progress: 100
							};
						});
					},
					false
				);
				
				let self = this;
				this.xhr.addEventListener('readystatechange', function (evt: Event) {
					if (this.readyState === 4) {
						self.setState(previousState => {
							return {
								...previousState,
								id: JSON.parse(this.responseText).id,
								complete: true
							};
						});
						if (typeof self.props.onFinish !== 'undefined') {
							self.props.onFinish(0, JSON.parse(this.responseText).id);
						}
					}
				});
				
				this.xhr.send(fd);
			});
		}
	}

	componentDidMount () {
		this.checkUpdate();
	}
	
	render () {
		return (
			<>
				<div className="fileName">
					{this.props.name}
				</div>
				<div className="fileProgress">
					<div
						className={'bar' + this.state.complete ? ' complete' : ''}
						style={{
							width: this.state.progress + '%'
						}}
					/>
				</div>
			</>
		);
	}
}

export default class FileInput extends React.Component<ConnectedFileInputProps, {
	uploadedFiles: UploadedFileElement[],
	uploadingFiles: UploadingFileElement[]
}> {
	state: {
		uploadedFiles: UploadedFileElement[],
		uploadingFiles: UploadingFileElement[]
	} = {
		uploadedFiles: [],
		uploadingFiles: []
	};

	files: string[] = [];

	constructor(props: ConnectedFileInputProps) {
		super(props);

		this.onChange = this.onChange.bind(this);
		this.onFinish = this.onFinish.bind(this);
		this.delete = this.delete.bind(this);
		this.selectFiles = this.selectFiles.bind(this);

		this.files = this.props.currentFiles || [];

		this.state = {
			uploadedFiles: this.props._currentFiles || [],
			uploadingFiles: []
		};
	}

	render () {
		let Comp = this.props.fileComponent || FileUploadSlider;
		type SelectButton = new () => Button<{}, FileObject[]>;
		let SelectButton = Button as SelectButton;
		return (
			<div
				className="formbox"
				style={this.props.boxStyles}
			>
				<div
					className="fileinput-container"
				>
					<label
						className="file"
						htmlFor={this.props.name + 'FileDialog'}
					>
						{this.props.children}
					</label>
					{
						typeof this.props.displaySelect !== 'undefined'
							&& this.props.displaySelect ?
							(
								<>
									&nbsp;or&nbsp;
									<SelectButton
										buttonType={''}
										onClick={this.selectFiles}
									>
										select files
									</SelectButton>
								</>
							) : null
					}
					<input
						id={this.props.name + 'FileDialog'}
						name={this.props.name}
						type="file"
						multiple={true}
						onChange={this.onChange}
					/>
					<div
						className="filesList"
						style={{
							'borderWidth': (this.state.uploadingFiles.length + this.state.uploadedFiles.length) > 0 ? 1 : 0
						}}
					>
						<ul>
							{
								this.state.uploadedFiles.map((file, i) => {
									return (
										<li key={i}>
											<FileDisplay
												key={i}
												displayId={i}
												{...file}
												deleteable={this.state.uploadingFiles.length === 0} 
												delete={this.delete}
											/>
										</li>
									);
								})
							}
							{
								this.state.uploadingFiles.map((file, i) => {
									let f: UploadingFileElement = Object.assign({}, file);
									f.upload = i === 0;
									return (
										<li key={i}>
											<Comp
												key={i}
												displayId={i}
												{...f}
												onFinish={this.onFinish}
											/>
										</li>
									);
								})
							}
						</ul>
					</div>
				</div>
			</div>
		);
	}

	private selectFiles () {
		fileSelect(
			this.props.displayDialogue,
			true,
			false,
		).then(console.log);
	}

	private onChange (event: React.FormEvent<HTMLInputElement>) {
		let files = event.currentTarget.files;

		if (files === null) {
			return;
		}

		let filesArray: UploadingFileElement[] = [];

		for (let i in files) {
			if (files.hasOwnProperty(i)) {
				filesArray.push({
					name: files[i].name,
					complete: false,
					progress: 0,
					file: files[i],
					upload: false
				});
			}
		}

		this.setState(previousState => {
			return {
				uploadingFiles: filesArray,
				uploadedFiles: previousState.uploadedFiles
			};
		});
	}

	private fileListUpdate () {
		if (typeof this.props.onUpdate !== 'undefined') {
			this.props.onUpdate({
				name: this.props.name,
				value: this.files
			});
		}
	}

	private onFinish (key: number, id: string) {		
		let uploadedList: UploadedFileElement[] = Object.assign([], this.state.uploadedFiles);
		let uploadingList: UploadingFileElement[] = Object.assign([], this.state.uploadingFiles);
		
		if (uploadingList.length === 0) {
			return;
		}
		
		this.files.push(id);

		let file: UploadingFileElement[] = uploadingList.splice(0, 1);

		uploadedList.push({
			name: file[0].name,
			complete: true,
			id
		});

		this.setState({
			uploadedFiles: uploadedList,
			uploadingFiles: uploadingList
		});

		this.fileListUpdate();
	}

	private delete (id: number) {
		if (this.state.uploadingFiles.length === 0) {
			this.files.splice(id, 1);
			let uploadedFiles = Object.assign([], this.state.uploadedFiles);
			uploadedFiles.splice(id, 1);
			this.setState({
				uploadedFiles
			});
			this.fileListUpdate();
		}
	}
}

export class FileInputLoader extends React.Component<ConnectedFileInputProps, {
	files: UploadedFileElement[],
	loaded: boolean
}> {
	constructor(props: ConnectedFileInputProps) {
		super(props);

		this.state = {
			files: [],
			loaded: !!this.props.value && this.props.value.length === 0
		};
	}

	componentDidMount () {
		if (this.props.value && this.props.value.length > 0) {
			let promises: Promise<FileObject>[] = [];
			for (let i of this.props.value) {
				promises.push(new Promise((res, rej) => {
					myFetch('/api/files/' + i)
						.then(val =>
							val.json())
						.then((info: FileObject) => 
							res(info));
				}));
			}
			Promise.all(promises).then(value => {
				this.setState({
					files: value.map(fobj => {
						return {
							name: fobj.name,
							complete: true,
							id: fobj.id
						};
					}),
					loaded: true
				});
			});
		} else {
			this.setState({
				files: [],
				loaded: true
			});
		}
	}

	render () {
		return (
			this.state.loaded ? 
				(
					<FileInput
						onChange={this.props.onChange}
						onUpdate={this.props.onUpdate}

						displaySelect={this.props.displaySelect}

						boxStyles={this.props.boxStyles}
						inputStyles={this.props.inputStyles}

						name={this.props.name}
						currentFiles={this.props.value}
						_currentFiles={this.state.files}

						displayDialogue={this.props.displayDialogue}
					>
						{this.props.children}
					</FileInput>
				)
					:
				<Loader />
		);
	}
}

export const FileInputLoaderSelect = connect(
	undefined,
	dispatch => {
		return {
			displayDialogue: (data: DialogueAction) => {
				dispatch(displayDialogue(
					data.title,
					data.text,
					data.buttontext,
					data.displayButton,
					data.onClose
				));
			}
		};
	}
)(FileInputLoader);