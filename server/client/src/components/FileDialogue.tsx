import * as React from 'react';
import { createPortal } from 'react-dom';

import * as jQuery from 'jquery';
import Loader from './Loader';
import { FileObject } from '../../../src/types';
import myFetch from '../lib/myFetch';

import './FileDialogue.css';
import urlFormat from '../lib/urlFormat';

enum FileDialogueView {
	MYDRIVE,
	// SHAREDWITHME,
	// RECENT,
	UPLOAD
}

interface ItemProps extends FileObject {
	onClick: (file: FileObject, selected: boolean) => void;
	selected: boolean;
}

class FolderDisplayer extends React.Component<ItemProps> {
	constructor(props: ItemProps) {
		super(props);
	}

	render () {
		return (
			<div style={{border: '1px solid black'}}>
				{this.props.fileName}
			</div>
		);
	}
}

class FileDisplayer extends React.Component<ItemProps> {
	constructor(props: ItemProps) {
		super(props);
	}

	render () {
		return (
			<div>
				{this.props.fileName}
			</div>
		);
	}
}

interface UploadingFile {
	uploading: boolean;
	done: boolean;
	size: number;
	progress: number;
	name: string;
	file: File;
}

interface FileUploaderProps extends UploadingFile {
	onComplete: (uploadedFile: FileObject) => void;
}

class FileUploader extends React.Component<FileUploaderProps, UploadingFile> {
	constructor(props: FileUploaderProps) {
		super(props);

		this.state = props;
	}

	componentDidMount() {
		// upload only when commanded to
		if (!this.props.uploading) {
			return;
		}

		let fd = new FormData();
		fd.append('file', this.props.file, this.props.name);

		let xhr = new XMLHttpRequest();
		xhr.open(
			'POST',
			urlFormat('api', 'files', 'upload')
		);

		xhr.addEventListener(
			'progress',
			evt => {
				if (evt.lengthComputable) {
					this.setState({
						progress: 100 * (evt.loaded / evt.total)
					});
				}
			},
			false
		);

		xhr.addEventListener(
			'loadend',
			evt => {
				this.setState({
					progress: 100
				});
			},
			false
		);

		let self = this;
		xhr.addEventListener('readystatechange', function (evt: Event) {
			if (this.readyState === 4) {
				try {
					let resp = JSON.parse(this.responseText) as FileObject;
					self.setState({
						done: true
					});
					let sid = localStorage.getItem('sessionID');
					myFetch(
						urlFormat('api', 'files', 'root', 'children'),
						{
							method: 'POST',
							body: JSON.stringify({
								id: resp.id
							}),
							headers: {
								authorization: !!sid ? sid : '',
								'content-type': 'application/json'
							},
							cache: 'no-cache'
						}
					);
					self.props.onComplete(resp);
				} catch (e) {
					console.log(e);
				}
			}
		});

		xhr.send(fd);
	}

	render () {
		return (
			<div>
				{this.state.progress}% {this.state.name}
			</div>
		);
	}
}

class SelectedFileDisplayer extends React.Component<ItemProps> {
	render () {
		return (
			<div>
				{this.props.fileName} done uploading
			</div>
		);
	}
}

export default class FileDialogue extends React.Component<{
	open: boolean;
	/**
	 * What happens when the dialogue is closed.
	 * 
	 * If it returns a boolean value, it stays open; otherwise it closes
	 */
	onReturn: (ids: string[]) => void
}, {
	view: FileDialogueView
	hovering: boolean
	open: boolean
	values: string[]
	loaded: boolean
	folder: string
	folderFiles: FileObject[]
	error: boolean
	selectedFolder: string
	uploadingFiles: UploadingFile[]
	selectedFiles: FileObject[]
}> {
	state = {
		view: FileDialogueView.MYDRIVE,
		open: false,
		values: [] as string[],
		loaded: false,
		folder: 'root',
		folderFiles: [] as FileObject[],
		error: false,
		hovering: false,
		selectedFolder: '',
		uploadingFiles: [] as UploadingFile[],
		selectedFiles: [] as FileObject[]
	};

	private mainDiv: HTMLDivElement;

	constructor(props: {
		open: boolean,
		onReturn: (ids: string[]) => void
	}) {
		super(props);

		this.handleSelectChange = this.handleSelectChange.bind(this);
		this.handleDrop = this.handleDrop.bind(this);
		this.handleNextFile = this.handleNextFile.bind(this);
	}

	componentDidMount() {
		let div: JQuery = jQuery(this.mainDiv);

		div.css({
			'zIndex': 5010,
			position: 'fixed'
		});

		let mobile = jQuery('body').hasClass('mobile');

		if (!mobile) {
			div.css({
				'left': '50%',
				'top': '50%',
				'margin-left': function () { return -(jQuery(this).outerWidth() as number) / 2; },
				'margin-top': function () { return -(jQuery(this).outerHeight() as number) / 2; }
			});
		} else {
			div.css({
				left: 0,
				top: 0,
				right: 0,
				bottom: 0
			});
		}
		if (div.find('input[type=text]')[0]) {
			div.find('input[type=text]')[0].focus();
		}

		if (this.props.open && !this.state.open) {
			this.setState({
				open: true
			});

			myFetch(
				'/api/files/' + this.state.folder + '/children/dirty'
			).then(res =>
				res.ok ? 
					Promise.resolve(res) :
					Promise.reject(new Error('404'))
			).then(res =>
				res.json()
			).then((folderFiles: FileObject[]) => {
				this.setState({
					loaded: true,
					error: false,
					folderFiles
				});
			}).catch(err => {
				this.setState({
					error: true,
					loaded: true
				});
			});

			jQuery(div).animate(
				{
					opacity: 1
				},
				250,
				'swing'
			);
		} else if (!this.props.open && this.state.open) {
			jQuery(div).animate(
				{
					opacity: 0
				},
				250,
				'swing',
				() => {
					this.setState({
						open: this.props.open
					});
				}
			);
		}	

		return true;
	}

	render () {
		setTimeout(() => {
			this.componentDidMount();
		});

		return createPortal(
			<div
				id="cover"
				style={{
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
					position: 'fixed',
					zIndex: this.state.open ? 5010 : -5010,
					display: 'block',
					backgroundColor: 'rgba(0, 0, 0, 0.5)'
				}}
				onClick={
					() => {
						this.props.onReturn(this.state.values);
					}
				}
			>
				<div
					ref={
						(el: HTMLDivElement) => {
							this.mainDiv = el as HTMLDivElement;
						}
					}
					id="fileDialogue"
					key="main_alert"
					onClick={e => !e.isPropagationStopped() && e.stopPropagation()}
				>
					<div id="fileDialogueControls">
						<a
							href="#"
							onClick={this.getViewChanger(FileDialogueView.MYDRIVE)}
							className={this.state.view === FileDialogueView.MYDRIVE ? 'selected' : ''}
						>
							My Drive
						</a>
						<a
							href="#"
							onClick={this.getViewChanger(FileDialogueView.UPLOAD)}
							className={this.state.view === FileDialogueView.UPLOAD ? 'selected' : ''}
						>
							Upload
						</a>
					</div>
					<div id="fileDialogueBody">
						{
							this.state.selectedFiles.map((file, i) => 
								<SelectedFileDisplayer
									key={i}
									{...file}
									onClick={this.handleSelectedFileDelete}
									selected={false}
								/>
							)
						}
						{
							this.state.uploadingFiles.map((file, i) =>
								<FileUploader
									key={i}
									{...file}
									onComplete={this.handleNextFile}
								/>
							)
						}
						{
							!this.state.loaded ?
								<Loader /> :
							this.state.error ?
								<div>An error occurred requesting a listing of files</div> :
							this.state.view === FileDialogueView.MYDRIVE && this.state.folderFiles.length === 0 ?
								<div
									style={{
										margin: '0 auto'
									}}
								>
									No files to select
								</div> :
							this.state.view === FileDialogueView.MYDRIVE ?
								this.state.folderFiles.sort((a, b) => 
									a.fileName.localeCompare(b.fileName)
								).sort((a, b) => 
									a.contentType === 'application/folder' ? -1 :
									b.contentType === 'application/folder' ? 1 :
										0
								).map(file =>
									file.contentType === 'application/folder' ?
										<FolderDisplayer
											{...file}
											onClick={this.onFolderClick}
											selected={this.state.selectedFolder === file.id}
										/> :
										<FileDisplayer
											{...file}
											onClick={this.onFileClick}
											selected={this.state.values.indexOf(file.id) > -1}
										/>
								) :
								(
									<>
										<div
											id="fileDialogueUpload"
											onDrop={this.handleDrop}
											onDragOver={this.getDropOverChanger(true)}
											onDragExit={this.getDropOverChanger(false)}
											onDragEnd={this.getDropOverChanger(false)}
											onDragLeave={this.getDropOverChanger(false)}
											style={{
												backgroundColor: this.state.hovering ? '#b4d1ff' : '#fff',
												borderColor: this.state.hovering ? '#3079ed' : '#999',
												borderWidth: 2,
												borderStyle: 'dashed',
												padding: 30
											}}
										>
											<div
												style={{
													margin: '0px auto',
													overflow: 'auto',
													textAlign: 'center',
													clear: 'both'
												}}
												className="verticalCenter"
											>
												Drag here to upload<br />
												or<br />
												<label
													htmlFor="fileUpload"
													id="fileUploadLabel"
													className="primaryButton"
													style={{
														display: 'inline-block',
														margin: '2px auto'
													}}
												>
													Select files to upload
												</label>
												<input
													id="fileUpload"
													type="file"
													multiple={true}
													style={{
														width: 0.1,
														height: 0.1,
														opacity: 0,
														overflow: 'hidden',
														position: 'fixed',
														left: -20,
														zIndex: -1
													}}
													onChange={this.handleSelectChange}
												/>
											</div>
										</div>
									</>
								)
						}
					</div>
				</div>
			</div>,
			document.getElementById('file-dialogue-box') as HTMLDivElement
		);
	}

	private getViewChanger (view: FileDialogueView) {
		return ((e: React.MouseEvent<HTMLAnchorElement>) => {
			e.preventDefault();
			this.setState({
				view
			});
		}).bind(this);
	}

	private onFolderClick (folder: FileObject) {
		// basically set state with folder id
	}

	private onFileClick (file: FileObject) {
		// add file to selected files if it is not selected else remove
	}

	private handleDrop (ev: React.DragEvent<HTMLDivElement>) {
		ev.preventDefault();

		if (ev.dataTransfer.files) {
			this.handleFiles(ev.dataTransfer.files);
		} else if (ev.dataTransfer.items) {
			let files = [];
			for (let i = 0; i < ev.dataTransfer.items.length; i++) {
				if (ev.dataTransfer.items[i].kind === 'file') {
					files.push(ev.dataTransfer.items[i].getAsFile());
				}
			}
			this.handleFiles(files as any as FileList);
		}

		this.setState({
			hovering: false
		});
	}

	private handleSelectChange (ev: React.FormEvent<HTMLInputElement>) {
		let files = ev.currentTarget.files;

		if (files === null || typeof files === 'undefined') {
			return;
		}

		this.handleFiles(files);
	}

	private getDropOverChanger (hovering: boolean) {
		return ((e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			this.setState({
				hovering
			});
		}).bind(this);
	}

	private handleFiles (files: FileList) {
		// program will crash if we use files.item(index); use files[index] instead
		// upload file and add to selected files
		// upload to root folder

		let uploadingFiles = [] as UploadingFile[];
		for (let i = 0; i < files.length; i++) {
			uploadingFiles.push({
				uploading: i === 0,
				done: false,
				progress: 0,
				size: files[i].size,
				name: files[i].name,
				file: files[i]
			});
		}

		this.setState({
			uploadingFiles
		});
	}

	private handleNextFile (file: FileObject) {
		// Don't modify mutable objects, clone them
		let selectedFiles = this.state.selectedFiles.slice(0);	
		let uploadingFiles = this.state.uploadingFiles.slice(0);

		selectedFiles.push(file);

		// change state for first file, remove done files
		for (let i = 0; i < uploadingFiles.length; i++) {
			if (uploadingFiles[i].done) {
				uploadingFiles.splice(i, 1);
				i--;
			}
		}

		uploadingFiles[0].uploading = true;

		this.setState({
			selectedFiles,
			uploadingFiles
		});
	}

	private handleSelectedFileDelete (file: FileObject, selected: boolean) {
		// delete the file from this.state.selectedFiles
	}
}