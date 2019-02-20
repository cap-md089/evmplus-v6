import * as React from 'react';
import Account from '../../lib/Account';
import FileInterface from '../../lib/File';
import MemberBase from '../../lib/Members';
import Dialogue, {
	DialogueButtons,
	DialogueWithOK,
	DialogueWithOKCancel
} from './Dialogue';
import './FileDialogue.css';
import { SimpleFileDisplayer } from './dialogue-components/SimpleFileDisplayer';
import FileUploader from '../FileUploader';
import { FolderDisplayer } from '../drive/FolderDisplayer';
import Loader from '../Loader';
import { SelectedFileDisplayer } from './dialogue-components/SelectedFileDisplayer';
import { FileObject } from 'common-lib';

enum FileDialogueView {
	MYDRIVE,
	// SHAREDWITHME,
	// RECENT,
	UPLOAD
}

export interface ItemProps {
	file: FileInterface;
	onClick: (file: FileInterface, selected: boolean) => void;
	selected: boolean;
}

interface FileDialogueState {
	view: FileDialogueView;
	hovering: boolean;
	open: boolean;
	files: FileInterface[] | null;
	error: boolean;
	selectedFolder: string;
	selectedFiles: FileInterface[];
	currentFolder: null | FileInterface;
}

export interface FileDialogueProps {
	member: MemberBase;
	account: Account;

	open: boolean;
	/**
	 * What happens when the dialogue is closed.
	 *
	 * If it returns a boolean value, it stays open; otherwise it closes
	 */
	onReturn: (ids: FileInterface[]) => void;
	/**
	 * Used to filter all the files to show only the desired ones to be selected
	 *
	 * When files are uploaded, a warning is given saying that the provided file
	 * has been uploaded but is invalid
	 */
	filter?: (
		element: FileObject,
		index: number,
		array: FileInterface[]
	) => boolean;
	/**
	 * Whether or not one file is to be returned
	 *
	 * This causes the onReturn function to be called with an
	 * array with one element in it
	 */
	multiple?: boolean;
}

export default class FileDialogue extends React.Component<
	FileDialogueProps,
	FileDialogueState
> {
	public state: FileDialogueState = {
		view: FileDialogueView.MYDRIVE,
		open: false,
		files: [],
		error: false,
		hovering: false,
		selectedFolder: '',
		selectedFiles: [],
		currentFolder: null
	};

	constructor(props: FileDialogueProps) {
		super(props);

		this.onFileClick = this.onFileClick.bind(this);
		this.onFolderClick = this.onFolderClick.bind(this);
		this.handleSelectedFileDelete = this.handleSelectedFileDelete.bind(
			this
		);

		this.addFile = this.addFile.bind(this);
		this.goToFolder = this.goToFolder.bind(this);

		this.onDialogueClose = this.onDialogueClose.bind(this);
		this.onDialogueCloseCancel = this.onDialogueCloseCancel.bind(this);
	}

	public componentDidMount() {
		this.goToFolder('root');
	}

	private get multiple() {
		return typeof this.props.multiple === 'undefined'
			? true
			: this.props.multiple;
	}

	public render() {
		const folderFiles = (this.state.files || []).filter(
			f => f.contentType !== 'application/folder'
		);
		const folderFolders = (this.state.files || []).filter(
			f => f.contentType === 'application/folder'
		);

		let props: DialogueWithOK | DialogueWithOKCancel;

		if (this.state.selectedFiles.length === 0) {
			props = {
				displayButtons: DialogueButtons.OK,
				labels: ['Cancel'],
				onClose: this.onDialogueCloseCancel,
				open: this.props.open,
				title: ''
			};
		} else {
			props = {
				displayButtons: DialogueButtons.OK_CANCEL,
				labels: ['Select Files', 'Cancel'],
				onCancel: this.onDialogueCloseCancel,
				onOk: this.onDialogueClose,
				onClose: () => void 0,
				open: this.props.open,
				title: ''
			};
		}

		return (
			<Dialogue {...props}>
				<div id="fileDialogueControls">
					<a
						href="#"
						onClick={this.getViewChanger(FileDialogueView.MYDRIVE)}
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
						onClick={this.getViewChanger(FileDialogueView.UPLOAD)}
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
							file={file}
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
					<div className="divider10px" />
					{this.state.currentFolder ? (
						<FileUploader
							currentFolder={this.state.currentFolder}
							onFileUpload={this.addFile}
							display={
								this.state.view === FileDialogueView.UPLOAD
							}
							member={this.props.member}
							account={this.props.account}
						/>
					) : null}
					{this.state.files === null ? (
						<Loader />
					) : this.state.error ? (
						<div>
							An error occurred requesting a listing of files
						</div>
					) : this.state.view === FileDialogueView.MYDRIVE &&
					  this.state.files.length === 0 ? (
						<div
							style={{
								margin: '0 auto'
							}}
						>
							No files to select
						</div>
					) : this.state.view === FileDialogueView.MYDRIVE ? (
						<>
							<br />
							<div>
								{this.state.currentFolder !== null
									? this.state.currentFolder.folderPath.map(
											path => (
												<>
													<a
														onClick={e => {
															e.preventDefault();
															this.goToFolder(
																path.id
															);
															return false;
														}}
														href="#"
														style={{
															color: '#2875d7',
															cursor: 'pointer'
														}}
													>
														{path.name}
													</a>
													&nbsp;/&nbsp;
												</>
											)
									  )
									: null}
							</div>
							<br />
							{folderFolders.length > 0 ? (
								<div key={0}>Folders</div>
							) : null}
							{folderFolders
								.sort((a, b) =>
									a.fileName.localeCompare(b.fileName)
								)
								.map((folder, i) => (
									<FolderDisplayer
										file={folder}
										key={i}
										onClick={this.onFolderClick}
										selected={
											this.state.selectedFolder ===
											folder.id
										}
									/>
								))}
							{folderFiles.length > 0 ? (
								<div key={1}>Files</div>
							) : null}
							{folderFiles
								.sort((a, b) =>
									a.fileName.localeCompare(b.fileName)
								)
								.filter(
									this.props.filter
										? this.props.filter
										: () => true
								)
								.map((file, i) => (
									<SimpleFileDisplayer
										file={file}
										key={i}
										onClick={this.onFileClick}
										selected={
											this.state.selectedFiles
												.map(f => f.id)
												.indexOf(file.id) > -1
										}
									/>
								))}
						</>
					) : null}
				</div>
			</Dialogue>
		);
	}

	private getViewChanger(view: FileDialogueView) {
		return ((e: React.MouseEvent<HTMLAnchorElement>) => {
			if (view === FileDialogueView.MYDRIVE) {
				this.goToFolder(this.state.currentFolder!.id);
				this.setState({
					error: false,
					view,
					files: null
				});
			} else {
				this.setState({
					view
				});
			}
			e.preventDefault();
		}).bind(this);
	}

	private onFolderClick(folder: FileInterface, selected: boolean) {
		// basically set state with folder id
		if (selected) {
			this.setState({
				selectedFolder: ''
			});

			this.goToFolder(folder.id);
		} else {
			this.setState({
				selectedFolder: folder.id
			});
		}
	}

	private onFileClick(file: FileInterface, selected: boolean) {
		// add file to selected files if it is not selected else remove
		if (selected) {
			const selectedFiles = this.state.selectedFiles.filter(
				filterFile => filterFile.id !== file.id
			);
			this.setState({
				selectedFiles
			});
		} else {
			const selectedFiles = this.multiple
				? [...this.state.selectedFiles, file]
				: [file];
			this.setState({
				selectedFiles
			});
		}
	}

	private handleSelectedFileDelete(file: FileInterface, selected: boolean) {
		// delete the file from this.state.selectedFiles
		const selectedFiles = this.state.selectedFiles.filter(
			f => f.id !== file.id
		);
		this.setState({ selectedFiles });
	}

	private addFile(file: FileInterface) {
		if (this.props.multiple) {
			this.setState(prev => ({
				selectedFiles: [...prev.selectedFiles, file].filter(
					this.props.filter || (() => true)
				)
			}));
		} else if (this.props.filter === undefined) {
			this.setState({
				selectedFiles: [file]
			});
		} else {
			if (this.props.filter(file, 0, [file])) {
				this.setState({
					selectedFiles: [file]
				});
			}
		}
	}

	private async goToFolder(id: string) {
		this.setState({
			files: []
		});

		try {
			const [files, currentFolder] = await Promise.all([
				this.props.account.getFiles(id, this.props.member),
				FileInterface.Get(id, this.props.member, this.props.account)
			]);

			this.setState({
				files,
				currentFolder
			});
		} catch (e) {
			this.setState({
				error: true
			});
		}
	}

	private onDialogueClose() {
		this.props.onReturn(
			this.state.selectedFiles.filter(
				this.props.filter ? this.props.filter : () => true
			)
		);

		this.setState({
			selectedFiles: []
		});
	}

	private onDialogueCloseCancel() {
		this.props.onReturn([]);

		this.setState({
			selectedFiles: []
		});
	}
}
