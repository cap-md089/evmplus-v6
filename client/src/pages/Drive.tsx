import * as $ from 'jquery';
import * as React from 'react';
import MemberBase from 'src/lib/Members';
import Button from '../components/Button';
import { Label, TextInput } from '../components/Form';
import BigTextBox from '../components/form-inputs/BigTextBox';
import Loader from '../components/Loader';
import RequestForm from '../components/RequestForm';
import SimpleRequestForm from '../components/SimpleRequestForm';
import {
	FileUserAccessControlPermissions,
	FileUserAccessControlType,
	MemberCreateError
} from '../enums';
import myFetch from '../lib/myFetch';
import urlFormat from '../lib/urlFormat';
import './Drive.css';
import { PageProps } from './Page';

enum ErrorReason {
	NONE,
	ERR404,
	ERR403,
	ERR500,
	UNKNOWN
}

interface DriveState {
	files: null | Array<FileObject | FullFileObject>;
	currentlySelected: string;
	newFoldername: string;
	currentFolder: null | FileObject | FullFileObject;
	showingExtraInfo: boolean;
	error: boolean;
	errorReason: ErrorReason;
}

interface FileDisplayProps {
	file: FileObject;
	onSelect: (file: FileObject) => void;
	selected: boolean;
	member: MemberBase | null;
}

const memberHasPermission = (
	file: FileObject,
	member: MemberBase | null,
	permission: FileUserAccessControlPermissions
): boolean => {
	let valid = false;

	const otherItems = file.permissions.filter(
		i => i.type === FileUserAccessControlType.OTHER
	);

	otherItems.forEach(item => {
		// tslint:disable-next-line:no-bitwise
		if ((item.permission & permission) > 0) {
			valid = true;
		}
	});

	if (!member || valid) {
		return valid;
	}

	if (member.permissions.FileManagement > 0) {
		return true;
	}

	const signedInItems = file.permissions.filter(
		i =>
			i.type === FileUserAccessControlType.SIGNEDIN ||
			i.type === FileUserAccessControlType.USER
	);

	signedInItems.forEach(item => {
		if (
			item.type === FileUserAccessControlType.USER &&
			item.reference.type === member.type
		) {
			if (member.id === item.reference.id) {
				// tslint:disable-next-line:no-bitwise
				valid = valid || (permission & item.permission) > 0;
			}
		} else {
			// tslint:disable-next-line:no-bitwise
			valid = valid || (permission & item.permission) > 0;
		}
	});

	if (valid) {
		return valid;
	}

	const teamItems = file.permissions.filter(
		i => i.type === FileUserAccessControlType.TEAM
	);

	for (const item of teamItems) {
		let valid2 = false;
		for (const id of member.teamIDs) {
			if ((item as FileTeamControlList).teamID === id) {
				// tslint:disable-next-line:no-bitwise
				valid2 = valid2 || (permission & item.permission) > 0;
			}
			if (valid2) {
				break;
			}
		}
		valid = valid || valid2;
		if (valid) {
			break;
		}
	}

	return valid;
};

class FolderDisplay extends React.Component<
	FileDisplayProps & { refresh: () => void },
	{ hovering: boolean }
> {
	public state = {
		hovering: false
	};

	constructor(props: FileDisplayProps & { refresh: () => void }) {
		super(props);

		this.handleDrop = this.handleDrop.bind(this);
		this.handleOff = this.handleOff.bind(this);
		this.handleOver = this.handleOver.bind(this);
		this.handleDragStart = this.handleDragStart.bind(this);
	}

	public render() {
		return memberHasPermission(
			this.props.file,
			this.props.member,
			FileUserAccessControlPermissions.WRITE
		) ? (
			<div
				className={`drive-folder-display ${
					this.props.selected ? 'selected' : ''
				} ${this.state.hovering ? 'hovering' : ''}`}
				onClick={() => this.props.onSelect(this.props.file)}
				onDragOver={this.handleOver}
				onDragEnd={this.handleOff}
				onDragLeave={this.handleOff}
				onDragEnter={this.handleOver}
				onDrop={this.handleDrop}
				draggable={true}
				onDragStart={this.handleDragStart}
			>
				{this.props.file.fileName}
			</div>
		) : (
			<div
				className={`drive-folder-display ${
					this.props.selected ? 'selected' : ''
				}`}
				onClick={() => this.props.onSelect(this.props.file)}
				draggable={true}
				onDragStart={this.handleDragStart}
			>
				{this.props.file.fileName}
			</div>
		);
	}

	private handleOver(e: React.DragEvent<HTMLDivElement>) {
		e.stopPropagation();
		e.preventDefault();

		this.setState({
			hovering: true
		});
	}

	private handleOff() {
		this.setState({
			hovering: false
		});
	}

	private async handleDrop(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		e.stopPropagation();

		const id = e.dataTransfer.getData('text');

		if (id === this.props.file.parentID) {
			return;
		}

		await myFetch(
			urlFormat('api', 'files', this.props.file.id, 'children', id),
			{
				method: 'DELETE',
				headers: {
					authorization: this.props.member
						? this.props.member.sessionID
						: ''
				}
			}
		);

		await myFetch(
			urlFormat('api', 'files', this.props.file.id, 'children'),
			{
				method: 'POST',
				headers: {
					authorization: this.props.member
						? this.props.member.sessionID
						: '',
					'content-type': 'application/json'
				},
				body: JSON.stringify({
					id
				})
			}
		);

		this.props.refresh();
	}

	private handleDragStart(e: React.DragEvent<HTMLDivElement>) {
		e.dataTransfer.setData('text', this.props.file.id);
	}
}

const FileDisplay = (props: FileDisplayProps) => (
	<div
		className={`drive-file-display ${props.selected ? 'selected' : ''}`}
		onClick={() => props.onSelect(props.file)}
		draggable={true}
		onDragStart={e => {
			e.dataTransfer.setData('text', props.file.id);
		}}
	>
		<div className="display-image">
			{!!props.file.contentType.match(/image\//) ? (
				<div
					style={{
						backgroundImage:
							'url(' +
							urlFormat('api', 'files', props.file.id, 'export') +
							')'
					}}
				/>
			) : null}
		</div>
		<div className="info-display">
			{props.file.fileName} (
			<a href={`/api/files/${props.file.id}/export`}>Download</a>)
		</div>
	</div>
);

interface ExtraDisplayProps {
	file: FileObject;
	member: MemberBase | null;
	childRef: React.RefObject<HTMLDivElement>;
	fileDelete: (file: FileObject) => void;
	fileModify: (file: FileObject) => void;
}

interface CommentsForm {
	comments: string;
}

class ExtraFolderDisplay extends React.Component<
	ExtraDisplayProps & { currentFolderID: string },
	CommentsForm
> {
	public static getDerivedStateFromProps(props: ExtraDisplayProps) {
		return {
			comments: props.file.comments
		};
	}

	public state = {
		comments: this.props.file.comments
	};

	constructor(props: ExtraDisplayProps & { currentFolderID: string }) {
		super(props);

		this.onFormChange = this.onFormChange.bind(this);

		this.saveFilesFirst = this.saveFilesFirst.bind(this);
	}

	public render() {
		const FileChangeForm = SimpleRequestForm as new () => SimpleRequestForm<
			CommentsForm,
			null
		>;

		return (
			<div className="drive-file-extra-display" ref={this.props.childRef}>
				{memberHasPermission(
					this.props.file,
					this.props.member,
					FileUserAccessControlPermissions.DELETE
				) ? (
					<>
						<Button
							buttonType="none"
							url={'/api/files/' + this.props.file.id}
							method="DELETE"
							onReceiveData={() => {
								if (this.props.fileDelete) {
									this.props.fileDelete(this.props.file);
								}
							}}
							onClick={this.saveFilesFirst}
							parseReturn={false}
						>
							Delete file
						</Button>
						<br />
						<br />
					</>
				) : null}
				<h3>Comments:</h3>
				{memberHasPermission(
					this.props.file,
					this.props.member,
					// tslint:disable-next-line:no-bitwise
					FileUserAccessControlPermissions.COMMENT |
						FileUserAccessControlPermissions.MODIFY
				) ? (
					<FileChangeForm
						id=""
						method="PUT"
						url={'/api/files/' + this.props.file.id}
						onReceiveData={() => {
							if (this.props.fileModify) {
								this.props.fileModify(this.props.file);
							}
						}}
						values={{ comments: this.props.file.comments }}
						onChange={this.onFormChange}
						showSubmitButton={true}
					>
						<Label>Comments</Label>
						<BigTextBox name="comments" />
					</FileChangeForm>
				) : (
					this.props.file.comments
				)}
			</div>
		);
	}

	private onFormChange(formState: CommentsForm) {
		this.props.file.comments = formState.comments;
		this.props.fileModify(this.props.file);
	}

	private async saveFilesFirst() {
		const promises = [];

		for (const id of this.props.file.fileChildren) {
			promises.push(
				myFetch(
					urlFormat(
						'api',
						'files',
						this.props.currentFolderID,
						'children'
					),
					{
						method: 'POST',
						headers: {
							authorization: this.props.member
								? this.props.member.sessionID
								: '',
							'content-type': 'application/json'
						},
						body: JSON.stringify({
							id
						})
					}
				)
			);
		}

		await Promise.all(promises);
	}
}

class ExtraFileDisplay extends React.Component<
	ExtraDisplayProps,
	CommentsForm
> {
	public state = {
		comments: this.props.file.comments
	};

	constructor(props: ExtraDisplayProps) {
		super(props);

		this.onFormChange = this.onFormChange.bind(this);
	}

	public render() {
		const FileChangeForm = SimpleRequestForm as new () => SimpleRequestForm<
			CommentsForm,
			null
		>;

		return (
			<div className="drive-file-extra-display" ref={this.props.childRef}>
				{memberHasPermission(
					this.props.file,
					this.props.member,
					FileUserAccessControlPermissions.DELETE
				) ? (
					<>
						<Button
							buttonType="none"
							url={'/api/files/' + this.props.file.id}
							method="DELETE"
							onReceiveData={() => {
								if (this.props.fileDelete) {
									this.props.fileDelete(this.props.file);
								}
							}}
							parseReturn={false}
						>
							Delete file
						</Button>
						<br />
						<br />
					</>
				) : null}
				<h3>Comments:</h3>
				{memberHasPermission(
					this.props.file,
					this.props.member,
					// tslint:disable-next-line:no-bitwise
					FileUserAccessControlPermissions.COMMENT |
						FileUserAccessControlPermissions.MODIFY
				) ? (
					<FileChangeForm
						id=""
						method="PUT"
						url={'/api/files/' + this.props.file.id}
						onReceiveData={() => {
							if (this.props.fileModify) {
								this.props.fileModify(this.props.file);
							}
						}}
						values={{ comments: this.props.file.comments }}
						onChange={this.onFormChange}
						showSubmitButton={true}
					>
						<Label>Comments</Label>
						<BigTextBox name="comments" />
					</FileChangeForm>
				) : (
					this.props.file.comments
				)}
			</div>
		);
	}

	private onFormChange(formState: CommentsForm) {
		this.props.file.comments = formState.comments;
		this.props.fileModify(this.props.file);
	}
}

interface FileUploaderProps {
	onFileUpload: (file: FileObject) => void;
	currentFolderID: string;
}

interface FileUploaderState {
	files: File[];
	hovering: boolean;
	progress: number;
	doneWithCurrentFile: boolean;
	error: ErrorReason;
}

class FileUploader extends React.Component<
	FileUploaderProps,
	FileUploaderState
> {
	public state: FileUploaderState = {
		files: [],
		hovering: false,
		progress: 0,
		doneWithCurrentFile: true,
		error: ErrorReason.NONE
	};

	constructor(props: FileUploaderProps) {
		super(props);
		this.onDragOver = this.onDragOver.bind(this);
		this.onDragOff = this.onDragOff.bind(this);
		this.onDrop = this.onDrop.bind(this);

		this.handleSelectChange = this.handleSelectChange.bind(this);
	}

	public componentDidUpdate() {
		// Don't start uploading if it is currently uploading the first file
		// This may seem like it will never execute with the next statement
		// (files.length > 0 || files.length === 0, fail) BUT they work because
		// the first part only fails if the program is currently uploading a file
		if (!this.state.doneWithCurrentFile && this.state.files.length > 0) {
			return;
		}

		// Don't try to upload if there aren't files to upload
		if (this.state.files.length === 0) {
			return;
		}

		const fd = new FormData();
		fd.append('file', this.state.files[0], this.state.files[0].name);

		const xhr = new XMLHttpRequest();
		xhr.open('POST', urlFormat('api', 'files', 'upload'));

		const sid = localStorage.getItem('sessionID');

		if (!sid) {
			// @TODO: Create error message. This dialogue should not show up in a
			// well designed program anyway
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
		xhr.addEventListener('readystatechange', function(evt) {
			if (this.readyState === 4) {
				if (this.status === 403) {
					self.setState({
						error: ErrorReason.ERR403
					});
					return;
				}
				if (this.status === 500) {
					self.setState({
						error: ErrorReason.ERR500
					});
					return;
				}
				const resp = JSON.parse(this.responseText) as FileObject;
				myFetch(
					urlFormat(
						'api',
						'files',
						self.props.currentFolderID,
						'children'
					),
					{
						method: 'POST',
						body: JSON.stringify({
							id: resp.id
						}),
						headers: {
							authorization: sid,
							'content-type': 'application/json'
						},
						cache: 'no-cache'
					}
				);
				self.props.onFileUpload(resp);
				self.setState(prev => ({
					files: prev.files.slice(1),
					doneWithCurrentFile: true,
					progress: 0
				}));
			}
		});

		xhr.send(fd);

		this.setState({
			doneWithCurrentFile: false
		});
	}

	public render() {
		if (this.state.error !== ErrorReason.NONE) {
			switch (this.state.error) {
				case ErrorReason.ERR403:
					return (
						<div>
							You were signed out while trying to upload files
						</div>
					);
				case ErrorReason.ERR500:
					return <div>There was an error while uploading files</div>;
			}
		}

		return (
			<div
				onDrop={this.onDrop}
				onDragEnd={this.onDragOff}
				onDragExit={this.onDragOff}
				onDragLeave={this.onDragOff}
				onDragOver={this.onDragOver}
				onDragEnter={this.onDragOver}
				style={{
					backgroundColor: this.state.hovering ? '#b4d1ff' : '#fff',
					borderColor: this.state.hovering ? '#3079ed' : '#999',
					borderWidth: 2,
					borderStyle: 'dashed',
					padding: 30,
					boxSizing: 'border-box',
					margin: 5
				}}
			>
				<div
					style={{
						margin: '0px auto',
						overflow: 'auto',
						textAlign: 'center',
						clear: 'both'
					}}
				>
					Drag here to upload
					<br />
					or
					<br />
					<label
						htmlFor="driveFileUpload"
						className="primaryButton"
						style={{
							display: 'inline-block',
							margin: '2px auto'
						}}
					>
						Select files to upload
					</label>
					<input
						id="driveFileUpload"
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
		);
	}

	private onDragOver(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		this.setState({
			hovering: true
		});
	}

	private onDragOff() {
		this.setState({
			hovering: false
		});
	}

	private onDrop(ev: React.DragEvent<HTMLDivElement>) {
		ev.preventDefault();
		ev.stopPropagation();

		const dataTransfer = ev.dataTransfer;

		if (dataTransfer.files) {
			this.setState(prev => ({
				files: [...prev.files, ...Array.from(dataTransfer.files)]
			}));
		} else if (dataTransfer.items) {
			this.setState(prev => ({
				files: [
					...prev.files,
					...(Array.from(dataTransfer.items, item =>
						item.getAsFile()
					).filter(f => f !== null) as File[])
				]
			}));
		}

		this.setState({
			hovering: false
		});
	}

	private handleSelectChange(ev: React.FormEvent<HTMLInputElement>) {
		const files = ev.currentTarget.files;

		if (files === null || typeof files === 'undefined') {
			return;
		}

		this.setState(prev => ({
			files: [...prev.files, ...Array.from(files)]
		}));
	}
}

export default class Drive extends React.Component<PageProps, DriveState> {
	public state: DriveState = {
		files: null,
		currentlySelected: '',
		newFoldername: '',
		currentFolder: null,
		showingExtraInfo: true,
		error: false,
		errorReason: ErrorReason.UNKNOWN
	};

	private extraInfoRef = React.createRef<HTMLDivElement>();

	constructor(props: PageProps) {
		super(props);

		this.onFileClick = this.onFileClick.bind(this);
		this.onFolderClick = this.onFolderClick.bind(this);

		this.updateNewFolderForm = this.updateNewFolderForm.bind(this);
		this.receiveData = this.receiveData.bind(this);
		this.addFile = this.addFile.bind(this);
		this.fileDeleted = this.fileDeleted.bind(this);
		this.fileModified = this.fileModified.bind(this);
		this.refresh = this.refresh.bind(this);
	}

	public get folderID() {
		const parts = this.props.routeProps.location.pathname.split('/');

		const last = parts[parts.length - 1];

		if (
			last.toLowerCase() === 'drive' ||
			last.toLowerCase() === 'filemanagement'
		) {
			return 'root';
		} else {
			return last;
		}
	}

	public get path() {
		return this.props.routeProps.location.pathname.split('/')[1];
	}

	public componentDidMount() {
		this.goToFolder(this.folderID, false);
	}

	public componentDidUpdate() {
		if (!this.state.showingExtraInfo && this.extraInfoRef.current) {
			this.setState({
				showingExtraInfo: true
			});

			$(this.extraInfoRef.current).slideDown(250);
		}
	}

	public render() {
		if (this.state.error) {
			switch (this.state.errorReason) {
				case ErrorReason.ERR403:
					return (
						<div>
							You do not have permission to view the requested
							folder
						</div>
					);
				case ErrorReason.ERR404:
					return <div>The requested folder could not be found</div>;
				case ErrorReason.ERR500:
				case ErrorReason.UNKNOWN:
					return <div>There was an unknown server error</div>;
				default:
					break;
			}
		}

		if (this.state.files === null) {
			return <Loader />;
		}

		const filesPerRow = 4;

		const folders = this.state.files.filter(
			file => file.contentType === 'application/folder'
		);
		const rowedFolders: FileObject[][] = [];
		folders.forEach((file, index) => {
			const realIndex = Math.floor(index / filesPerRow);
			if (rowedFolders[realIndex] === undefined) {
				rowedFolders.push([file]);
			} else {
				rowedFolders[realIndex].push(file);
			}
		});

		const files = this.state.files.filter(
			file => file.contentType !== 'application/folder'
		);
		const rowedFiles: FileObject[][] = [];
		files.forEach((file, index) => {
			const realIndex = Math.floor(index / filesPerRow);
			if (rowedFiles[realIndex] === undefined) {
				rowedFiles.push([file]);
			} else {
				rowedFiles[realIndex].push(file);
			}
		});

		const selectedFile = this.state.files.filter(
			f => f.id === this.state.currentlySelected
		);
		const isFileOrFolderSelected = selectedFile.length > 0;
		let isFolderSelected = false;
		let isFileSelected = false;

		const indices = {
			row: 0,
			column: 0
		};
		if (isFileOrFolderSelected) {
			if (selectedFile[0].contentType === 'application/folder') {
				isFolderSelected = true;
				for (let i = 0; i < folders.length; i++) {
					if (folders[i].id === selectedFile[0].id) {
						indices.row = Math.floor(i / filesPerRow);
						indices.column = i % filesPerRow;
					}
				}
			} else {
				isFileSelected = true;
				for (let i = 0; i < files.length; i++) {
					if (files[i].id === selectedFile[0].id) {
						indices.row = Math.floor(i / filesPerRow);
						indices.column = i % filesPerRow;
					}
				}
			}
		}

		const NewFolderRequestForm = RequestForm as new () => RequestForm<
			{ name: string },
			{ id: string }
		>;

		return (
			<div>
				{this.props.member &&
				this.props.member.permissions.FileManagement === 1 ? (
					<div>
						<NewFolderRequestForm
							id=""
							url="/api/files/create"
							values={{
								name: this.state.newFoldername
							}}
							onChange={this.updateNewFolderForm}
							rowClassName="drive-newfoldername-row"
							onReceiveData={this.receiveData}
						>
							<TextInput name="name" />
						</NewFolderRequestForm>
					</div>
				) : null}
				<div className="drive-folders">
					{rowedFolders.map((folderList, i) => (
						<React.Fragment key={i}>
							<div className="drive-folder-row">
								{folderList.map((f, j) => (
									<FolderDisplay
										key={j}
										file={f}
										onSelect={this.onFolderClick}
										selected={
											f.id ===
											this.state.currentlySelected
										}
										member={this.props.member}
										refresh={this.refresh}
									/>
								))}
							</div>
							{isFolderSelected && i === indices.row ? (
								<ExtraFolderDisplay
									currentFolderID={
										this.state.currentFolder!.id
									}
									file={folderList[indices.column]}
									member={this.props.member}
									childRef={this.extraInfoRef}
									fileDelete={this.fileDeleted}
									fileModify={this.fileModified}
								/>
							) : null}
						</React.Fragment>
					))}
				</div>
				{this.props.member ? (
					<FileUploader
						onFileUpload={this.addFile}
						currentFolderID={
							this.state.currentFolder
								? this.state.currentFolder.id
								: 'root'
						}
					/>
				) : null}
				<div className="drive-files">
					{rowedFiles.map((fileList, i) => (
						<React.Fragment key={i}>
							<div className="drive-file-row">
								{fileList.map((f, j) => (
									<FileDisplay
										key={j}
										file={f}
										onSelect={this.onFileClick}
										selected={
											f.id ===
											this.state.currentlySelected
										}
										member={this.props.member}
									/>
								))}
							</div>
							{isFileSelected && i === indices.row ? (
								<ExtraFileDisplay
									file={fileList[indices.column]}
									member={this.props.member}
									childRef={this.extraInfoRef}
									fileDelete={this.fileDeleted}
									fileModify={this.fileModified}
								/>
							) : null}
						</React.Fragment>
					))}
				</div>
			</div>
		);
	}

	private onFolderClick(file: FileObject) {
		if (file.id === this.state.currentlySelected) {
			this.goToFolder(file.id, true);
			this.setState({
				currentlySelected: '',
				showingExtraInfo: true
			});
		} else {
			this.setState({
				currentlySelected: file.id,
				showingExtraInfo: false
			});
		}
	}

	private onFileClick(file: FileObject) {
		this.setState(
			prev =>
				prev.currentlySelected === file.id
					? {
							currentlySelected: '',
							showingExtraInfo: true
					  }
					: {
							currentlySelected: file.id,
							showingExtraInfo: false
					  }
		);
	}

	private updateNewFolderForm({ name: newFoldername }: { name: string }) {
		this.setState({
			newFoldername
		});
	}

	private receiveData({ id }: { id: string }) {
		myFetch('/api/files/' + this.folderID + '/children', {
			headers: {
				authorization: this.props.member
					? this.props.member.sessionID
					: '',
				'content-type': 'application/json'
			},
			method: 'POST',
			body: JSON.stringify({
				id
			})
		}).then(() => {
			this.goToFolder(id, true);
		});
	}

	private goToFolder(id: string, update = true) {
		return Promise.all([
			myFetch('/api/files/' + id + '/children/dirty', {
				headers: {
					authorization: this.props.member
						? this.props.member.sessionID
						: ''
				}
			})
				.then(res => res.json())
				.then((files: FullFileObject[]) => {
					this.setState({ files });
				}),

			myFetch('/api/files/' + id + '/dirty', {
				headers: {
					authorization: this.props.member
						? this.props.member.sessionID
						: ''
				}
			})
				.then(res => res.json())
				.then((currentFolder: FullFileObject | FileObject) => {
					this.setState({ currentFolder });
				})
		])
			.then(() => {
				return this.state.currentFolder!.id === 'root'
					? Promise.resolve(null)
					: myFetch(
							urlFormat(
								'api',
								'files',
								this.state.currentFolder!.parentID
							),
							{
								headers: {
									authorization: this.props.member
										? this.props.member.sessionID
										: ''
								}
							}
					  );
			})
			.then(res => (res === null ? res : res.json()))
			.then((parent: FileObject) => {
				this.setState(
					prev => ({
						files: parent
							? [...(prev.files || []), parent]
							: prev.files
					}),
					() => {
						if (update) {
							this.props.routeProps.history.push(
								'/' + this.path + '/' + id
							);
						}
						if (this.state.currentFolder) {
							this.props.updateBreadCrumbs(
								this.state.currentFolder.folderPath.map(
									folder => ({
										text: folder.name,
										target:
											'/' + this.path + '/' + folder.id
									})
								)
							);
						}
					}
				);
			})
			.catch(err => {
				this.setState({
					error: true,
					errorReason:
						err.status === 403
							? ErrorReason.ERR403
							: err.status === 404
								? ErrorReason.ERR404
								: err.status === 500
									? ErrorReason.ERR500
									: ErrorReason.UNKNOWN
				});
			});
	}

	private addFile(file: FileObject) {
		// @ts-ignore
		const fileObject: FullFileObject = {
			...file,
			uploader: {
				error: MemberCreateError.NONE,
				sessionID: this.props.member!.sessionID,
				// @ts-ignore
				member: this.props.member!,
				valid: true
			}
		};

		this.setState(prev => ({
			files: [...prev.files!, fileObject]
		}));
	}

	private fileDeleted(file: FileObject) {
		this.setState(prev => ({
			files: (prev.files || []).filter(f => f.id !== file.id)
		}));
	}

	private fileModified(file: FileObject) {
		const files = (this.state.files || []).slice();

		let index = 0;

		for (let i = 0; i < files.length; i++) {
			if (files[i].id === file.id) {
				index = i;
			}
		}

		files[index] = file;

		this.setState({ files });
	}

	private refresh() {
		if (this.state.currentFolder) {
			this.goToFolder(this.state.currentFolder.id);
		}
	}
}
