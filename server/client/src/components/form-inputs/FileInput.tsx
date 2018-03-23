import * as React from 'react';

import { InputProps } from './Input';

import urlFormat from '../../lib/urlFormat';

import Button from '../Button';

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

	// To be used by the FileInput to upload 2 files at a time
	upload: boolean;
}

interface FileInputProps<F extends FileInputElement = FileInputElement> extends InputProps<F[]> {
	fileComponent?: new() => React.Component<{
		onFinish: (key: number, id: string) => void
	}, {}>;
	currentFiles?: string[];
	_currentFiles?: UploadedFileElement[];
	displaySelect?: boolean;
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

	constructor(props: FileUploadSliderProps) {
		super(props);
		this.state = props;
	}

	protected checkUpdate () {
		if (typeof this.props.file !== 'undefined' && typeof this.props.upload === 'boolean' && this.props.upload) {
			setTimeout(() => {
				let fd = new FormData();
				fd.append('file', this.props.file, this.props.name);
				
				this.xhr = new XMLHttpRequest();
				this.xhr.open(
					'POST',
					urlFormat('file', 'upload')
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
								id: JSON.parse(this.responseText).fileID,
								complete: true
							};
						});
						if (typeof self.props.onFinish !== 'undefined') {
							self.props.onFinish(0, JSON.parse(this.responseText).fileID);
						}
					}
				});
				
				this.xhr.send(fd);
			});
		}
	}

	componentDidUpdate () {
		this.checkUpdate();
	}

	componentDidMount () {
		this.checkUpdate();
	}

	componentWillReceiveProps(nextProps: UploadingFileElement) {
		this.setState(nextProps);
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

export default class FileInput extends React.Component<FileInputProps, {
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

	constructor(props: FileInputProps) {
		super(props);

		this.onChange = this.onChange.bind(this);
		this.onFinish = this.onFinish.bind(this);
		this.delete = this.delete.bind(this);

		this.files = this.props.currentFiles || [];
	}

	public onChange (event: React.FormEvent<HTMLInputElement>) {
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

	public fileListUpdate () {
		if (typeof this.props.onUpdate !== 'undefined') {
			this.props.onUpdate({
				currentTarget: {
					name: this.props.name,
					value: this.files
				}
			} as any as React.FormEvent<HTMLInputElement>);
		}
	}

	public onFinish (key: number, id: string) {		
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

	public delete (id: number) {
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

	render () {
		let Comp = this.props.fileComponent || FileUploadSlider;
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
}

export class FileInputLoader extends React.Component<FileInputProps, {
	files: UploadedFileElement[]
}> {
	constructor(props: FileInputProps) {
		super(props);

		this.state = {
			files: []
		};
	}

	// tslint:disable-next-line:no-empty
	componentDidMount () {
		
	}

	render () {
		return (
			<FileInput
				onChange={this.props.onChange}
				onUpdate={this.props.onUpdate}

				displaySelect={this.props.displaySelect}

				boxStyles={this.props.boxStyles}
				inputStyles={this.props.inputStyles}

				name={this.props.name}
				_currentFiles={this.state.files}
			/>
		);
	}
}
