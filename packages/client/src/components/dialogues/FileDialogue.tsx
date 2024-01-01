/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 * 
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 * 
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	AccountObject,
	AsyncEither,
	Either,
	FileObject,
	get,
	ClientUser,
	stringifyMemberReference,
} from 'common-lib';
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
	UPLOAD,
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
	member: ClientUser;
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
		currentFolder: null,
	};

	public async componentDidMount(): Promise<void> {
		await this.goToFolder(stringifyMemberReference(this.props.member));
	}

	private get multiple(): boolean {
		return this.props.multiple ?? true;
	}

	public render(): JSX.Element {
		const folderFiles = (this.state.files || []).filter(
			f => f.contentType !== 'application/folder',
		);
		const folderFolders = (this.state.files || []).filter(
			f => f.contentType === 'application/folder',
		);

		let props: DialogueWithOK | DialogueWithOKCancel;

		if (this.state.selectedFiles.length === 0) {
			props = {
				displayButtons: DialogueButtons.OK,
				labels: ['Cancel'],
				onClose: this.onDialogueCloseCancel,
				open: this.props.open,
				title: '',
			};
		} else {
			props = {
				displayButtons: DialogueButtons.OK_CANCEL,
				labels: ['Select Files', 'Cancel'],
				onCancel: this.onDialogueCloseCancel,
				onOk: this.onDialogueClose,
				onClose: () => void 0,
				open: this.props.open,
				title: '',
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
						Drive
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
								margin: '0 auto',
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
														void this.goToFolder(path.id);
														return false;
													}}
													style={{
														color: '#2875d7',
														cursor: 'pointer',
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

	private getViewChanger = (view: FileDialogueView) => async (
		e: React.MouseEvent<HTMLButtonElement>,
	) => {
		if (view === FileDialogueView.MYDRIVE) {
			if (this.state.currentFolder) {
				await this.goToFolder(this.state.currentFolder.id);
				this.setState({
					error: false,
					view,
					files: null,
				});
			}
		} else {
			this.setState({
				view,
			});
		}
		e.preventDefault();
	};

	private onFolderClick = async (folder: FileObject, selected: boolean): Promise<void> => {
		// basically set state with folder id
		if (selected) {
			this.setState({
				selectedFolder: '',
			});

			await this.goToFolder(folder.id);
		} else {
			this.setState({
				selectedFolder: folder.id,
			});
		}
	};

	private onFileClick = (file: FileObject, selected: boolean): void => {
		// add file to selected files if it is not selected else remove
		if (selected) {
			const selectedFiles = this.state.selectedFiles.filter(
				filterFile => filterFile.id !== file.id,
			);
			this.setState({
				selectedFiles,
			});
		} else {
			const selectedFiles = this.multiple ? [...this.state.selectedFiles, file] : [file];
			this.setState({
				selectedFiles,
			});
		}
	};

	private handleSelectedFileDelete = (file: FileObject): void => {
		// delete the file from this.state.selectedFiles
		const selectedFiles = this.state.selectedFiles.filter(f => f.id !== file.id);
		this.setState({ selectedFiles });
	};

	private addFile = (file: FileObject): void => {
		if (this.props.multiple) {
			this.setState(prev => ({
				selectedFiles: [...prev.selectedFiles, file].filter(
					this.props.filter || (() => true),
				),
			}));
		} else if (this.props.filter === undefined) {
			this.setState({
				selectedFiles: [file],
			});
		} else {
			if (this.props.filter(file, 0, [file])) {
				this.setState({
					selectedFiles: [file],
				});
			}
		}
	};

	private goToFolder = async (id: string): Promise<void> => {
		const fileInfoEither = await AsyncEither.All([
			fetchApi.files.children.getBasic({ parentid: id }, {}),
			fetchApi.files.files.get({ id }, {}),
		]);

		if (Either.isLeft(fileInfoEither)) {
			this.setState({
				error: true,
			});
		} else {
			const [files, currentFolder] = fileInfoEither.value;

			this.setState({
				files: files.filter(Either.isRight).map(get('value')),
				currentFolder,
			});
		}
	};

	private onDialogueClose = (): void => {
		this.props.onReturn(
			this.state.selectedFiles.filter(this.props.filter ? this.props.filter : () => true),
		);

		this.setState({
			selectedFiles: [],
		});
	};

	private onDialogueCloseCancel = (): void => {
		this.props.onReturn([]);

		this.setState({
			selectedFiles: [],
		});
	};
}
