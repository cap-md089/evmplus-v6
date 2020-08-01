/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { AccountObject, AsyncEither, Either, FileObject, get, User } from 'common-lib';
import * as React from 'react';
import fetchApi from '../../lib/apis';
import { FolderDisplayer } from '../drive/FolderDisplayer';
import FileUploader from '../FileUploader';
import Loader from '../Loader';
import Dialogue, { DialogueButtons, DialogueWithOK, DialogueWithOKCancel } from './Dialogue';
import { SelectedFileDisplayer } from './dialogue-components/SelectedFileDisplayer';
import { SimpleFileDisplayer } from './dialogue-components/SimpleFileDisplayer';
import './FileDialogue.css';

enum FileDialogueView {
	MYDRIVE,
	// SHAREDWITHME,
	// RECENT,
	UPLOAD
}

export interface ItemProps {
	file: FileObject;
	onClick: (file: FileObject, selected: boolean) => void;
	selected: boolean;
}

interface FileDialogueState {
	view: FileDialogueView;
	hovering: boolean;
	open: boolean;
	files: FileObject[] | null;
	error: boolean;
	selectedFolder: string;
	selectedFiles: FileObject[];
	currentFolder: null | FileObject;
}

export interface FileDialogueProps {
	member: User;
	account: AccountObject;

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
	filter?: (element: FileObject, index: number, array: FileObject[]) => boolean;
	/**
	 * Whether or not one file is to be returned
	 *
	 * This causes the onReturn function to be called with an
	 * array with one element in it
	 */
	multiple?: boolean;
}

export default class FileDialogue extends React.Component<FileDialogueProps, FileDialogueState> {
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
		this.handleSelectedFileDelete = this.handleSelectedFileDelete.bind(this);

		this.addFile = this.addFile.bind(this);
		this.goToFolder = this.goToFolder.bind(this);

		this.onDialogueClose = this.onDialogueClose.bind(this);
		this.onDialogueCloseCancel = this.onDialogueCloseCancel.bind(this);
	}

	public componentDidMount() {
		this.goToFolder('root');
	}

	private get multiple() {
		return typeof this.props.multiple === 'undefined' ? true : this.props.multiple;
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
					<button
						onClick={this.getViewChanger(FileDialogueView.MYDRIVE)}
						className={
							'linkButton ' +
							(this.state.view === FileDialogueView.MYDRIVE ? 'selected' : '')
						}
					>
						Squadron Drive
					</button>
					<button
						onClick={this.getViewChanger(FileDialogueView.UPLOAD)}
						className={
							'linkButton ' +
							(this.state.view === FileDialogueView.UPLOAD ? 'selected' : '')
						}
					>
						Upload
					</button>
				</div>
				<div id="fileDialogueBody">
					{this.state.selectedFiles.length > 0 ? <div>Selected files</div> : null}
					{this.state.selectedFiles.map((file, i) => (
						<SelectedFileDisplayer
							key={i}
							file={file}
							onClick={this.handleSelectedFileDelete}
							selected={true}
							red={
								this.props.filter
									? !this.props.filter(file, i, this.state.selectedFiles)
									: false
							}
						/>
					))}
					<div className="divider10px" />
					{this.state.currentFolder ? (
						<FileUploader
							currentFolder={this.state.currentFolder}
							onFileUpload={this.addFile}
							display={this.state.view === FileDialogueView.UPLOAD}
							member={this.props.member}
							account={this.props.account}
						/>
					) : null}
					{this.state.files === null ? (
						<Loader />
					) : this.state.error ? (
						<div>An error occurred requesting a listing of files</div>
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
									? this.state.currentFolder.folderPath.map(path => (
											<>
												<button
													onClick={e => {
														e.preventDefault();
														this.goToFolder(path.id);
														return false;
													}}
													style={{
														color: '#2875d7',
														cursor: 'pointer'
													}}
													className="linkButton"
												>
													{path.name}
												</button>
												&nbsp;/&nbsp;
											</>
									  ))
									: null}
							</div>
							<br />
							{folderFolders.length > 0 ? <div key={0}>Folders</div> : null}
							{folderFolders
								.sort((a, b) => a.fileName.localeCompare(b.fileName))
								.map((folder, i) => (
									<FolderDisplayer
										file={folder}
										key={i}
										onClick={this.onFolderClick}
										selected={this.state.selectedFolder === folder.id}
									/>
								))}
							{folderFiles.length > 0 ? <div key={1}>Files</div> : null}
							{folderFiles
								.sort((a, b) => a.fileName.localeCompare(b.fileName))
								.filter(this.props.filter ? this.props.filter : () => true)
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
		return (e: React.MouseEvent<HTMLButtonElement>) => {
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
		};
	}

	private onFolderClick(folder: FileObject, selected: boolean) {
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
			const selectedFiles = this.multiple ? [...this.state.selectedFiles, file] : [file];
			this.setState({
				selectedFiles
			});
		}
	}

	private handleSelectedFileDelete(file: FileObject, selected: boolean) {
		// delete the file from this.state.selectedFiles
		const selectedFiles = this.state.selectedFiles.filter(f => f.id !== file.id);
		this.setState({ selectedFiles });
	}

	private addFile(file: FileObject) {
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
		const fileInfoEither = await AsyncEither.All([
			fetchApi.files.children.getFull({ parentid: id }, {}, this.props.member.sessionID),
			fetchApi.files.files.get({ id }, {}, this.props.member.sessionID)
		]);

		if (Either.isLeft(fileInfoEither)) {
			this.setState({
				error: true
			});
		} else {
			const [files, currentFolder] = fileInfoEither.value;

			this.setState({
				files: files.filter(Either.isRight).map(get('value')),
				currentFolder
			});
		}
	}

	private onDialogueClose() {
		this.props.onReturn(
			this.state.selectedFiles.filter(this.props.filter ? this.props.filter : () => true)
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
