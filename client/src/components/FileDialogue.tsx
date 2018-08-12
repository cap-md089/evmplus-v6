import * as jQuery from 'jquery';
import * as React from 'react';
import { createPortal } from 'react-dom';
import myFetch from '../lib/myFetch';
import urlFormat from '../lib/urlFormat';
import Button from './Button';
import './FileDialogue.css';
import Loader from './Loader';

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

export class FolderDisplayer extends React.Component<ItemProps> {
	constructor(props: ItemProps) {
		super(props);
	}

	public render() {
		return (
			<div
				className="folderDisplayer"
				onClick={e => {
					e.stopPropagation();
					const {
						fileName,
						accountID,
						comments,
						contentType,
						created,
						forDisplay,
						forSlideshow,
						id,
						kind,
						memberOnly,
						uploaderID,
						_id,
						fileChildren,
						parentID
					} = this.props;
					this.props.onClick(
						{
							fileName,
							accountID,
							comments,
							contentType,
							created,
							forDisplay,
							forSlideshow,
							id,
							kind,
							memberOnly,
							uploaderID,
							_id,
							fileChildren,
							parentID
						},
						this.props.selected
					);
				}}
			>
				<div
					className={'box' + (this.props.selected ? ' selected' : '')}
				>
					{this.props.fileName}
				</div>
			</div>
		);
	}
}

export class FileDisplayer extends React.Component<ItemProps> {
	constructor(props: ItemProps) {
		super(props);
	}

	public render() {
		return (
			<div
				className="fileDisplayer"
				onClick={e => {
					e.stopPropagation();
					const {
						fileName,
						accountID,
						comments,
						contentType,
						created,
						forDisplay,
						forSlideshow,
						id,
						kind,
						memberOnly,
						uploaderID,
						_id,
						fileChildren,
						parentID
					} = this.props;
					this.props.onClick(
						{
							fileName,
							accountID,
							comments,
							contentType,
							created,
							forDisplay,
							forSlideshow,
							id,
							kind,
							memberOnly,
							uploaderID,
							_id,
							fileChildren,
							parentID
						},
						this.props.selected
					);
				}}
			>
				<div
					className={'box' + (this.props.selected ? ' selected' : '')}
					title={this.props.fileName}
				>
					{this.props.fileName}
				</div>
			</div>
		);
	}
}

class SelectedFileDisplayer extends React.Component<
	ItemProps & { red: boolean }
> {
	public render() {
		return (
			<div
				className="selectedFile"
				onClick={e => {
					e.stopPropagation();
					const {
						fileName,
						accountID,
						comments,
						contentType,
						created,
						forDisplay,
						forSlideshow,
						id,
						kind,
						memberOnly,
						uploaderID,
						_id,
						fileChildren,
						parentID
					} = this.props;
					this.props.onClick(
						{
							fileName,
							accountID,
							comments,
							contentType,
							created,
							forDisplay,
							forSlideshow,
							id,
							kind,
							memberOnly,
							uploaderID,
							_id,
							fileChildren,
							parentID
						},
						this.props.selected
					);
				}}
			>
				<div
					className={'box selected' + (this.props.red ? ' red' : '')}
					title={
						this.props.red
							? 'Invalid file selected'
							: this.props.fileName
					}
				>
					{this.props.fileName}
				</div>
			</div>
		);
	}
}

interface FileUploaderProps {
	files: File[];
	onUploadedFile: (file: FileObject) => void;
	clearFileList: () => void;
}

interface FileUploaderState {
	files: File[];
	progress: number;
	doneWithCurrentFile: boolean;
}

class FileUploader extends React.Component<
	FileUploaderProps,
	FileUploaderState
> {
	public static getDerivedStateFromProps(
		props: FileUploaderProps,
		state: FileUploaderState
	): FileUploaderState | null {
		const newFileList = state.files.slice(0);
		const fileCount = newFileList.length; // Keep track of this to see if the component
		// needs to rerender
		for (const i of props.files) {
			if (newFileList.indexOf(i) === -1) {
				newFileList.push(i);
			}
		}

		// If true, there were files added
		if (newFileList.length !== fileCount) {
			return {
				files: newFileList,
				progress: state.progress,
				doneWithCurrentFile: state.doneWithCurrentFile
			};
		}

		// Parent function to clear list so that the files don't get added again once they are done
		props.clearFileList();

		// else, return no changes
		return null;
	}

	public state = {
		files: [] as File[],
		progress: 0,
		doneWithCurrentFile: true
	};

	public componentDidUpdate() {
		// Don't start uploading again if it is currently uploading
		if (!this.state.doneWithCurrentFile && this.state.files.length > 0) {
			return;
		}

		// If there are no files to upload, don't try
		if (this.state.files.length === 0) {
			return;
		}

		const fd = new FormData();
		fd.append('file', this.state.files[0], this.state.files[0].name);

		const xhr = new XMLHttpRequest();
		xhr.open('POST', urlFormat('api', 'files', 'upload'));

		const sid = localStorage.getItem('sessionID');

		if (!sid) {
			// @TODO: Create an error message
			return;
		}

		xhr.setRequestHeader('authorization', sid);

		xhr.upload.addEventListener('progress', ev => {
			if (ev.lengthComputable) {
				this.setState({
					progress: ev.loaded / ev.total
				});
			}
		});

		xhr.upload.addEventListener('loadend', () => {
			this.setState({
				progress: 1
			});
		});

		const self = this;
		xhr.addEventListener('readystatechange', function(evt: Event) {
			if (this.readyState === 4) {
				try {
					const resp = JSON.parse(this.responseText) as FileObject;
					myFetch(urlFormat('api', 'files', 'root', 'children'), {
						method: 'POST',
						body: JSON.stringify({
							id: resp.id
						}),
						headers: {
							authorization: !!sid ? sid : '',
							'content-type': 'application/json'
						},
						cache: 'no-cache'
					});
					self.props.onUploadedFile(resp);
					self.setState(prev => ({
						files: prev.files.slice(1),
						doneWithCurrentFile: true,
						progress: 0
					}));
				} catch (e) {
					// tslint:disable-next-line:no-console
					console.log(e);
				}
			}
		});

		xhr.send(fd);

		this.setState({
			doneWithCurrentFile: false
		});
	}

	public render() {
		return (
			<div>
				{this.state.files.length > 0 ? (
					<div>Uploading files</div>
				) : null}
				{this.state.files.map((f, i) => (
					<div key={i}>
						{f.name} {i === 0 ? this.state.progress : 0}%
					</div>
				))}
			</div>
		);
	}
}

export default class FileDialogue extends React.Component<
	{
		open: boolean;
		/**
		 * What happens when the dialogue is closed.
		 *
		 * If it returns a boolean value, it stays open; otherwise it closes
		 */
		onReturn: (ids: FileObject[]) => void;
		/**
		 * Used to filter all the files to show only the desired ones to be selected
		 *
		 * When files are uploaded, a warning is given saying that the provided file
		 * has been uploaded but is invalid
		 */
		filter?: (
			element: FileObject,
			index: number,
			array: FileObject[]
		) => boolean;
	},
	{
		view: FileDialogueView;
		hovering: boolean;
		open: boolean;
		loaded: boolean;
		folder: string;
		previousFolders: string[];
		folderFiles: FileObject[];
		error: boolean;
		selectedFolder: string;
		selectedFiles: FileObject[];
		uploadingFiles: File[];
	}
> {
	public state = {
		view: FileDialogueView.MYDRIVE,
		open: false,
		loaded: false,
		folder: 'root',
		previousFolders: [] as string[],
		folderFiles: [] as FileObject[],
		error: false,
		hovering: false,
		selectedFolder: '',
		selectedFiles: [] as FileObject[],
		uploadingFiles: [] as File[]
	};

	private mainDiv: HTMLDivElement;

	constructor(props: {
		open: boolean;
		onReturn: (ids: FileObject[]) => void;
		filter?: (
			file: FileObject,
			index: number,
			array: FileObject[]
		) => boolean;
	}) {
		super(props);

		this.handleSelectChange = this.handleSelectChange.bind(this);
		this.handleDrop = this.handleDrop.bind(this);

		this.onFileClick = this.onFileClick.bind(this);
		this.onFolderClick = this.onFolderClick.bind(this);
		this.handleSelectedFileDelete = this.handleSelectedFileDelete.bind(
			this
		);

		this.clearFileList = this.clearFileList.bind(this);
		this.addFile = this.addFile.bind(this);
	}

	public componentDidMount() {
		const div: JQuery = jQuery(this.mainDiv);

		div.css({
			zIndex: 5010,
			position: 'fixed'
		});

		const mobile = jQuery('body').hasClass('mobile');

		if (!mobile) {
			div.css({
				left: '50%',
				top: '50%',
				'margin-left'() {
					return -(jQuery(this).outerWidth() as number) / 2;
				},
				'margin-top'() {
					return -(jQuery(this).outerHeight() as number) / 2;
				}
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

			myFetch('/api/files/' + this.state.folder + '/children')
				.then(
					res =>
						res.ok
							? Promise.resolve(res)
							: Promise.reject(new Error('404'))
				)
				.then(res => res.json())
				.then((folderFiles: FileObject[]) => {
					this.setState({
						loaded: true,
						error: false,
						folderFiles
					});
				})
				.catch(err => {
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

	public componentDidUpdate() {
		const div: JQuery = jQuery(this.mainDiv);

		div.css({
			zIndex: 5010,
			position: 'fixed'
		});

		const mobile = jQuery('body').hasClass('mobile');

		if (!mobile) {
			div.css({
				left: '50%',
				top: '50%',
				'margin-left'() {
					return -(jQuery(this).outerWidth() as number) / 2;
				},
				'margin-top'() {
					return -(jQuery(this).outerHeight() as number) / 2;
				}
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

			myFetch('/api/files/' + this.state.folder + '/children')
				.then(
					res =>
						res.ok
							? Promise.resolve(res)
							: Promise.reject(new Error('404'))
				)
				.then(res => res.json())
				.then((folderFiles: FileObject[]) => {
					this.setState({
						loaded: true,
						error: false,
						folderFiles
					});
				})
				.catch(err => {
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
	}

	public render() {
		const folderFiles = this.state.folderFiles.filter(
			f => f.contentType !== 'application/folder'
		);
		const folderFolders = this.state.folderFiles.filter(
			f => f.contentType === 'application/folder'
		);

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
				onClick={() => {
					this.props.onReturn(
						this.state.selectedFiles.filter(
							this.props.filter ? this.props.filter : () => true
						)
					);
				}}
			>
				<div
					ref={(el: HTMLDivElement) => {
						this.mainDiv = el as HTMLDivElement;
					}}
					id="fileDialogue"
					key="main_alert"
					onClick={e => {
						e.stopPropagation();
						this.setState({
							selectedFolder: ''
						});
					}}
				>
					<div id="fileDialogueControls">
						<a
							href="#"
							onClick={this.getViewChanger(
								FileDialogueView.MYDRIVE
							)}
							className={
								this.state.view === FileDialogueView.MYDRIVE
									? 'selected'
									: ''
							}
						>
							Squadron Drive
						</a>
						<a
							href="#"
							onClick={this.getViewChanger(
								FileDialogueView.UPLOAD
							)}
							className={
								this.state.view === FileDialogueView.UPLOAD
									? 'selected'
									: ''
							}
						>
							Upload
						</a>
					</div>
					<div id="fileDialogueBody">
						{this.state.selectedFiles.length > 0 ? (
							<div>Selected files</div>
						) : null}
						{this.state.selectedFiles.map((file, i) => (
							<SelectedFileDisplayer
								key={i}
								{...file}
								onClick={this.handleSelectedFileDelete}
								selected={true}
								red={
									this.props.filter
										? !this.props.filter(
												file,
												i,
												this.state.selectedFiles
										  )
										: false
								}
							/>
						))}
						{
							<FileUploader
								files={this.state.uploadingFiles}
								onUploadedFile={this.addFile}
								clearFileList={this.clearFileList}
							/>
						}
						{!this.state.loaded ? (
							<Loader />
						) : this.state.error ? (
							<div>
								An error occurred requesting a listing of files
							</div>
						) : this.state.view === FileDialogueView.MYDRIVE &&
						this.state.folderFiles.length === 0 ? (
							<div
								style={{
									margin: '0 auto'
								}}
							>
								No files to select
							</div>
						) : this.state.view === FileDialogueView.MYDRIVE ? (
							[
								folderFolders.length > 0 ? (
									<div key={0}>Folders</div>
								) : null,
								folderFolders
									.sort((a, b) =>
										a.fileName.localeCompare(b.fileName)
									)
									.map((folder, i) => (
										<FolderDisplayer
											{...folder}
											key={i}
											onClick={this.onFolderClick}
											selected={
												this.state.selectedFolder ===
												folder.id
											}
										/>
									)),
								folderFiles.length > 0 ? (
									<div key={1}>Files</div>
								) : null,
								folderFiles
									.sort((a, b) =>
										a.fileName.localeCompare(b.fileName)
									)
									.filter(
										this.props.filter
											? this.props.filter
											: () => true
									)
									.map((file, i) => (
										<FileDisplayer
											{...file}
											key={i}
											onClick={this.onFileClick}
											selected={
												this.state.selectedFiles
													.map(f => f.id)
													.indexOf(file.id) > -1
											}
										/>
									))
							]
						) : (
							<>
								<div
									id="fileDialogueUpload"
									onDrop={this.handleDrop}
									onDragOver={this.getDropOverChanger(true)}
									onDragExit={this.getDropOverChanger(false)}
									onDragEnd={this.getDropOverChanger(false)}
									onDragLeave={this.getDropOverChanger(false)}
									style={{
										backgroundColor: this.state.hovering
											? '#b4d1ff'
											: '#fff',
										borderColor: this.state.hovering
											? '#3079ed'
											: '#999',
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
						)}
					</div>
					<Button
						buttonType="primaryButton"
						onClick={() => {
							this.props.onReturn(
								this.state.selectedFiles.filter(
									this.props.filter
										? this.props.filter
										: () => true
								)
							);

							return false;
						}}
						className="floatAllthewayRight"
					>
						{this.state.selectedFiles.length === 0
							? 'Cancel'
							: 'Select files'}
					</Button>
				</div>
			</div>,
			document.getElementById('file-dialogue-box') as HTMLDivElement
		);
	}

	private getViewChanger(view: FileDialogueView) {
		return ((e: React.MouseEvent<HTMLAnchorElement>) => {
			if (view === FileDialogueView.MYDRIVE) {
				myFetch('/api/files/' + this.state.folder + '/children')
					.then(
						res =>
							res.ok
								? Promise.resolve(res)
								: Promise.reject(new Error('404'))
					)
					.then(res => res.json())
					.then((folderFiles: FileObject[]) => {
						this.setState({
							loaded: true,
							error: false,
							folderFiles
						});
					})
					.catch(err => {
						this.setState({
							error: true,
							loaded: true
						});
					});
				this.setState({
					loaded: false,
					error: false,
					folderFiles: [],
					view
				});
			} else {
				this.setState({
					view
				});
			}
			e.preventDefault();
		}).bind(this);
	}

	private onFolderClick(folder: FileObject, selected: boolean) {
		// basically set state with folder id
		if (selected) {
			this.setState({
				folder: folder.id,
				selectedFolder: ''
			});
		} else {
			this.setState({
				selectedFolder: folder.id
			});
		}
	}

	private onFileClick(file: FileObject, selected: boolean) {
		// add file to selected files if it is not selected else remove
		if (selected) {
			const selectedFiles = this.state.selectedFiles.filter(
				filterFile => filterFile.id !== file.id
			);
			this.setState({
				selectedFiles
			});
		} else {
			const selectedFiles = [...this.state.selectedFiles, file];
			this.setState({
				selectedFiles
			});
		}
	}

	private handleDrop(ev: React.DragEvent<HTMLDivElement>) {
		ev.preventDefault();

		if (ev.dataTransfer.files) {
			this.handleFiles(ev.dataTransfer.files);
		} else if (ev.dataTransfer.items) {
			const files = [];
			// I don't think a for of loop would work with dataTransfer.items
			// tslint:disable-next-line:prefer-for-of
			for (let i = 0; i < ev.dataTransfer.items.length; i++) {
				if (ev.dataTransfer.items[i].kind === 'file') {
					files.push(ev.dataTransfer.items[i].getAsFile());
				}
			}
			this.handleFiles((files as any) as FileList);
		}

		this.setState({
			hovering: false
		});
	}

	private getDropOverChanger(hovering: boolean) {
		return ((e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			this.setState({
				hovering
			});
		}).bind(this);
	}

	private handleSelectChange(ev: React.FormEvent<HTMLInputElement>) {
		const files = ev.currentTarget.files;

		if (files === null || typeof files === 'undefined') {
			return;
		}

		this.handleFiles(files);
	}

	private handleFiles(files: FileList) {
		// program will crash if we use files.item(index); use files[index] instead
		// upload file and add to selected files
		// upload to root folder

		const uploadingFiles = [] as File[];

		// I don't think a for-of loop would work here
		// tslint:disable-next-line:prefer-for-of
		for (let i = 0; i < files.length; i++) {
			uploadingFiles.push(files[i]);
		}

		this.setState({
			uploadingFiles
		});
	}

	private handleSelectedFileDelete(file: FileObject, selected: boolean) {
		// delete the file from this.state.selectedFiles
		const selectedFiles = this.state.selectedFiles.filter(
			f => f.id !== file.id
		);
		this.setState({ selectedFiles });
	}

	private addFile(file: FileObject) {
		this.setState(prev => ({
			selectedFiles: [...prev.selectedFiles, file]
		}));
	}

	private clearFileList() {
		if (this.state.uploadingFiles.length !== 0) {
			this.setState({
				uploadingFiles: []
			});
		}
	}
}
