import {
	AsyncEither,
	Either,
	FileObject,
	FullFileObject,
	get,
	hasPermission,
	Maybe,
	Permissions
} from 'common-lib';
import $ from 'jquery';
import * as React from 'react';
import ExtraFileDisplay from '../components/drive/DriveExtraFileDisplay';
import ExtraFolderDisplay from '../components/drive/DriveExtraFolderDisplay';
import DriveFileDisplay from '../components/drive/DriveFileDisplay';
import DriveFolderDisplay from '../components/drive/DriveFolderDisplay';
import FileUploader from '../components/FileUploader';
import { Form, TextInput } from '../components/forms/SimpleForm';
import Loader from '../components/Loader';
import fetchApi from '../lib/apis';
import './Drive.css';
import Page, { PageProps } from './Page';

interface UnloadedDriveState {
	files: null;
	currentlySelected: '';
	newFoldername: string;
	currentFolder: null;
	showingExtraInfo: boolean;
	error: boolean;
	errorReason: string | null;
}

interface LoadedDriveState {
	files: FileObject[];
	currentlySelected: string;
	newFoldername: string;
	currentFolder: FileObject;
	showingExtraInfo: boolean;
	error: boolean;
	errorReason: string | null;
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
		errorReason: null
	};

	private extraInfoRef = React.createRef<HTMLDivElement>();

	constructor(props: PageProps) {
		super(props);

		this.onFileClick = this.onFileClick.bind(this);
		this.onFolderClick = this.onFolderClick.bind(this);

		this.createFolder = this.createFolder.bind(this);
		this.updateNewFolderForm = this.updateNewFolderForm.bind(this);
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
			return <div>{this.state.errorReason}</div>;
		}

		if (this.state.files === null || this.state.currentFolder === null) {
			return <Loader />;
		}

		const filesPerRow = 4;

		const folders = this.state.files.filter(file => file.contentType === 'application/folder');
		const rowedFolders: FileObject[][] = [];
		folders.forEach((file, index) => {
			const realIndex = Math.floor(index / filesPerRow);
			if (rowedFolders[realIndex] === undefined) {
				rowedFolders.push([file]);
			} else {
				rowedFolders[realIndex].push(file);
			}
		});

		const files = this.state.files.filter(file => file.contentType !== 'application/folder');
		const rowedFiles: FileObject[][] = [];
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
				{this.props.member &&
				hasPermission('FileManagement')(Permissions.FileManagement.FULL)(
					this.props.member
				) ? (
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
										parent={this.state.currentFolder!}
									/>
								))}
							</div>
							{isFolderSelected && i === indices.row ? (
								<ExtraFolderDisplay
									parentFile={this.state.currentFolder!}
									currentFolderID={this.state.currentFolder!.id}
									file={folderList[indices.column]}
									member={this.props.member}
									childRef={this.extraInfoRef}
									fileDelete={this.fileDeleted}
									fileModify={this.fileModified}
									fileUpdate={this.refresh}
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
										parent={this.state.currentFolder!}
									/>
								))}
							</div>
							{isFileSelected && i === indices.row ? (
								<ExtraFileDisplay
									parentFile={this.state.currentFolder!}
									file={fileList[indices.column]}
									member={this.props.member}
									childRef={this.extraInfoRef}
									fileDelete={this.fileDeleted}
									fileModify={this.fileModified}
									fileUpdate={this.refresh}
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

	private async goToFolder(id: string, update = true) {
		const folderInfoEither = await AsyncEither.All([
			fetchApi.files.children.getFull({ parentid: id }, {}, this.props.member?.sessionID),
			fetchApi.files.files.get({ id }, {}, this.props.member?.sessionID)
		]);

		if (Either.isLeft(folderInfoEither)) {
			return this.setState({
				error: true,
				errorReason: folderInfoEither.value.message
			});
		}

		const [wrappedFiles, currentFolder] = folderInfoEither.value;

		const files = wrappedFiles.filter(Either.isRight).map(get('value'));

		this.setState(
			{
				files,
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
	}

	private addFile(file: FileObject) {
		if (!this.props.member) {
			// Probably an error if it reaches here
			return;
		}

		const fileObject: FullFileObject = {
			...file,
			uploader: Maybe.some(this.props.member)
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
			this.goToFolder(this.state.currentFolder.id, false);
		}
	}

	private async createFolder() {
		if (this.props.member && this.state.newFoldername !== '' && this.state.currentFolder) {
			const result = await fetchApi.files.files.createFolder(
				{ parentid: this.state.currentFolder.id, name: this.state.newFoldername },
				{},
				this.props.member.sessionID
			);

			if (Either.isLeft(result)) {
			} else {
				this.addFile(result.value);
			}
		}
	}
}
