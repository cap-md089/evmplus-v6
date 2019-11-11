import $ from 'jquery';
import * as React from 'react';
import ExtraFileDisplay from '../components/drive/DriveExtraFileDisplay';
import ExtraFolderDisplay from '../components/drive/DriveExtraFolderDisplay';
import DriveFileDisplay from '../components/drive/DriveFileDisplay';
import DriveFolderDisplay from '../components/drive/DriveFolderDisplay';
import FileUploader from '../components/FileUploader';
import { TextInput, Form } from '../components/forms/SimpleForm';
import Loader from '../components/Loader';
import FileInterface from '../lib/File';
import './Drive.css';
import Page, { PageProps } from './Page';
import { FileObject, FullFileObject } from 'common-lib';

enum ErrorReason {
	NONE,
	ERR401,
	ERR403,
	ERR404,
	ERR500,
	UNKNOWN
}

interface UnloadedDriveState {
	files: null;
	currentlySelected: '';
	newFoldername: string;
	currentFolder: null;
	showingExtraInfo: boolean;
	error: boolean;
	errorReason: ErrorReason;
}

interface LoadedDriveState {
	files: FileInterface[];
	currentlySelected: string;
	newFoldername: string;
	currentFolder: FileInterface;
	showingExtraInfo: boolean;
	error: boolean;
	errorReason: ErrorReason;
}

type DriveState = UnloadedDriveState | LoadedDriveState;

export default class Drive extends Page<PageProps, DriveState> {
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

		this.createFolder = this.createFolder.bind(this);
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

		if (last.toLowerCase() === 'drive' || last.toLowerCase() === 'filemanagement') {
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

		if (this.state.currentFolder) {
			this.props.updateBreadCrumbs([
				{
					target: '/',
					text: 'Home'
				},
				{
					target: '/admin',
					text: 'Administration'
				},
				{
					target: '/drive',
					text: 'Drive'
				},
				...this.state.currentFolder.folderPath.map(item => ({
					target: `/drive/${item.id}`,
					text: `View folder '${item.name}'`
				}))
			]);

			this.updateTitle(`View folder ${this.state.currentFolder.fileName}`);

			this.props.updateSideNav([]);
		}
	}

	public render() {
		if (this.state.error) {
			switch (this.state.errorReason) {
				case ErrorReason.ERR403:
				case ErrorReason.ERR401:
					return <div>You do not have permission to view the requested folder</div>;
				case ErrorReason.ERR404:
					return <div>The requested folder could not be found</div>;
				case ErrorReason.ERR500:
				case ErrorReason.UNKNOWN:
					return <div>There was an unknown server error</div>;
				default:
					break;
			}
		}

		if (this.state.files === null || this.state.currentFolder === null) {
			return <Loader />;
		}

		const filesPerRow = 4;

		const folders = this.state.files.filter(file => file.contentType === 'application/folder');
		const rowedFolders: FileInterface[][] = [];
		folders.forEach((file, index) => {
			const realIndex = Math.floor(index / filesPerRow);
			if (rowedFolders[realIndex] === undefined) {
				rowedFolders.push([file]);
			} else {
				rowedFolders[realIndex].push(file);
			}
		});

		const files = this.state.files.filter(file => file.contentType !== 'application/folder');
		const rowedFiles: FileInterface[][] = [];
		files.forEach((file, index) => {
			const realIndex = Math.floor(index / filesPerRow);
			if (rowedFiles[realIndex] === undefined) {
				rowedFiles.push([file]);
			} else {
				rowedFiles[realIndex].push(file);
			}
		});

		const selectedFile = this.state.files.filter(f => f.id === this.state.currentlySelected);
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

		return (
			<div>
				{this.props.member && this.props.member.hasPermission('FileManagement') ? (
					<div>
						<Form<{ name: string }>
							id=""
							values={{
								name: this.state.newFoldername
							}}
							onChange={this.updateNewFolderForm}
							onSubmit={this.createFolder}
							submitInfo={{
								text: 'Add folder',
								className: 'primaryButton drive-newfoldername-submit'
							}}
							rowClassName="drive-newfoldername-row"
						>
							<TextInput name="name" />
						</Form>
					</div>
				) : null}
				<div className="drive-folders">
					{rowedFolders.map((folderList, i) => (
						<React.Fragment key={i}>
							<div className="drive-folder-row">
								{folderList.map((f, j) => (
									<DriveFolderDisplay
										key={j}
										file={f}
										onSelect={this.onFolderClick}
										selected={f.id === this.state.currentlySelected}
										member={this.props.member}
										refresh={this.refresh}
									/>
								))}
							</div>
							{isFolderSelected && i === indices.row ? (
								<ExtraFolderDisplay
									currentFolderID={this.state.currentFolder!.id}
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
						member={this.props.member}
						account={this.props.account}
						currentFolder={this.state.currentFolder!}
						display={true}
					/>
				) : null}
				<div className="drive-files">
					{rowedFiles.map((fileList, i) => (
						<React.Fragment key={i}>
							<div className="drive-file-row">
								{fileList.map((f, j) => (
									<DriveFileDisplay
										key={j}
										file={f}
										onSelect={this.onFileClick}
										selected={f.id === this.state.currentlySelected}
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
		this.setState(prev =>
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

	private async receiveData({ id }: { id: string }) {
		if (this.state.currentFolder && this.props.member) {
			await this.state.currentFolder.addChild(this.props.member, id);

			this.goToFolder(id, true);
		}
	}

	private async goToFolder(id: string, update = true) {
		try {
			const [files, currentFolder] = await Promise.all([
				this.props.account.getFiles(id, this.props.member),
				FileInterface.Get(id, this.props.member, this.props.account)
			]);
			let parentFolder = null;
			if (currentFolder.id !== 'root') {
				parentFolder = await currentFolder.getParent(this.props.member);
			}
			this.setState(
				{
					files: parentFolder ? [...files, parentFolder] : files,
					currentFolder
				},
				() => {
					if (update) {
						this.props.routeProps.history.push('/' + this.path + '/' + id);
					}

					this.props.updateBreadCrumbs(
						currentFolder.folderPath.map(folder => ({
							text: folder.name,
							target: `/${this.path}/${folder.id}`
						}))
					);
				}
			);
		} catch (err) {
			this.setState({
				error: true,
				errorReason:
					err.status === 403
						? ErrorReason.ERR403
						: err.status === 404
						? ErrorReason.ERR404
						: err.status === 500
						? ErrorReason.ERR500
						: err.status === 401
						? ErrorReason.ERR401
						: ErrorReason.UNKNOWN
			});
		}
	}

	private addFile(file: FileObject) {
		const fileObject: FullFileObject = {
			...file,
			uploader: this.props.member!.toRaw()
		};

		this.setState(prev => ({
			files: [...prev.files!, new FileInterface(fileObject, this.props.account)]
		}));
	}

	private fileDeleted(file: FileObject) {
		this.setState(prev => ({
			files: (prev.files || []).filter(f => f.id !== file.id)
		}));
	}

	private fileModified(file: FullFileObject) {
		const files = (this.state.files || []).slice();

		let index = 0;

		for (let i = 0; i < files.length; i++) {
			if (files[i].id === file.id) {
				index = i;
			}
		}

		files[index] = new FileInterface(file, this.props.account);

		this.setState({ files });
	}

	private refresh() {
		if (this.state.currentFolder) {
			this.goToFolder(this.state.currentFolder.id, false);
		}
	}

	private createFolder() {
		if (this.props.member && this.state.newFoldername !== '') {
			FileInterface.CreateFolder(
				this.state.newFoldername,
				this.props.member,
				this.props.account
			)
				.then(folder => {
					return folder
						.moveTo(this.state.currentFolder!, this.props.member!)
						.then(() => folder);
				})
				.then(folder => {
					this.addFile(folder);
				});
		}
	}
}
