/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { FileObject, AccountObject, ClientUser, Either } from 'common-lib';
import * as React from 'react';
import fetchApi from '../lib/apis';
import { uploadFile } from '../lib/File';

interface FileUploadAction {
	type: 'File';
	name: string;
	fileToUpload: File;
	beingUploaded: boolean;
	progress: number;
	id: number;
}

interface FolderCreationAction {
	type: 'Folder';
	name: string;
	pendingActions: FileCreationAction[];
	id: number;
}

type FileCreationAction = FileUploadAction | FolderCreationAction;

const renderFileCreationAction = (action: FileCreationAction) =>
	action.type === 'File' ? (
		<li key={action.name}>
			{action.name} {action.beingUploaded ? `${(action.progress * 100).toFixed(1)}%` : null}
		</li>
	) : (
		<li key={action.name}>
			Folder '{action.name}'
			<ul>
				{action.pendingActions.length > 3
					? [
							...action.pendingActions.slice(0, 3).map(renderFileCreationAction),
							<li key="extra">...</li>,
					  ]
					: action.pendingActions.map(renderFileCreationAction)}
			</ul>
		</li>
	);

type FileWithPath = File & {
	relativePath?: string;
	webkitRelativePath: string;
};

const hasRelativePath = (file: File): file is FileWithPath =>
	'relativePath' in file || 'webkitRelativePath' in file;

/**
 * Helper function to get around TypeScript
 */
const getRelativePath = (file: FileWithPath) => {
	return file.relativePath || file.webkitRelativePath;
};

const redText: React.CSSProperties = {
	color: 'red',
};

interface FileUploaderProps {
	onFileUpload: (file: FileObject) => void;
	member: ClientUser;
	account: AccountObject;
	currentFolder: FileObject;
	display: boolean;
}

interface FileUploaderState {
	error: string | null;
	pendingActions: FileCreationAction[];
	hovering: boolean;
	progress: number;
}

export default class FileUploader extends React.Component<FileUploaderProps, FileUploaderState> {
	public state: FileUploaderState = {
		error: null,
		pendingActions: [],
		hovering: false,
		progress: 0,
	};

	private currentlyUploading = false;
	private id = 0;

	public constructor(props: FileUploaderProps) {
		super(props);

		this.handleSelectChange = this.handleSelectChange.bind(this);
		this.handleDrop = this.handleDrop.bind(this);
	}

	public render() {
		return (
			<>
				{this.state.error !== null ? <div style={redText}>{this.state.error}</div> : null}
				<div>
					{this.state.pendingActions.length > 0 ? (
						<>
							<div>Uploading files</div>
							<div style={redText}>
								Please do not navigate away from this webpage, or else it will cause
								issues with your upload
							</div>
							<ul>{this.state.pendingActions.map(renderFileCreationAction)}</ul>
						</>
					) : null}
				</div>
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
						padding: 30,
						display: this.props.display ? 'block' : 'none',
					}}
				>
					<div
						style={{
							margin: '0px auto',
							overflow: 'auto',
							textAlign: 'center',
							clear: 'both',
						}}
						className="verticalCenter"
					>
						Drag files or folders here to upload
						<br />
						or
						<br />
						<label
							htmlFor="fileUpload"
							id="fileUploadLabel"
							className="primaryButton"
							style={{
								display: 'inline-block',
								margin: '2px auto',
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
								zIndex: -1,
							}}
							onChange={this.handleSelectChange}
						/>
						<br />
						or
						<br />
						<label
							htmlFor="folderUpload"
							id="folderUploadLabel"
							className="primaryButton"
							style={{
								display: 'inline-block',
								margin: '2px auto',
							}}
						>
							Select folder to upload
						</label>
						<input
							id="folderUpload"
							type="file"
							multiple={true}
							style={{
								width: 0.1,
								height: 0.1,
								opacity: 0,
								overflow: 'hidden',
								position: 'fixed',
								left: -20,
								zIndex: -1,
							}}
							/* TS doesn't like defining extra properties directly
								However, as long as the object being applied extends the
								target type, it's ok. We can use this to sneak extra
								properties in (e.g., webkitdirectory) */
							ref={r => {
								if (r !== null) {
									// @ts-ignore
									r.directory = true;
									// @ts-ignore
									r.webkitdirectory = true;
								}
							}}
							onChange={this.handleSelectChange}
						/>
					</div>
				</div>
			</>
		);
	}

	private getDropOverChanger(hovering: boolean) {
		return (e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			this.setState({
				hovering,
			});
		};
	}

	private handleDrop(ev: React.DragEvent<HTMLDivElement>) {
		ev.preventDefault();

		if (ev.dataTransfer.items) {
			const files = [];
			const entries = [];
			// I don't think a for of loop would work with dataTransfer.items
			// tslint:disable-next-line:prefer-for-of
			for (let i = 0; i < ev.dataTransfer.items.length; i++) {
				if (ev.dataTransfer.items[i].kind === 'file') {
					let entry: any;
					if (
						'webkitGetAsEntry' in ev.dataTransfer.items[i] &&
						// tslint:disable-next-line: no-conditional-assignment
						!!(entry = ev.dataTransfer.items[i].webkitGetAsEntry())
					) {
						entries.push(entry);
					} else {
						files.push(ev.dataTransfer.items[i].getAsFile());
					}
				}
			}

			if (files.length > 0) {
				this.handleFileList((files as any) as FileList);
			}

			if (entries.length > 0) {
				for (const entry of entries) {
					this.handleFileEntry(entry);
				}
			}
		}

		this.setState({
			hovering: false,
		});
	}

	private handleSelectChange(ev: React.FormEvent<HTMLInputElement>) {
		const files = ev.currentTarget.files;

		if (files === null || typeof files === 'undefined') {
			return;
		}

		this.handleFileList(files);
	}

	private async handleFileEntry(files: any) {
		const entryToActions = async (entry: any): Promise<FileCreationAction> => {
			if (entry.isDirectory) {
				const readEntries: any[] = [];
				let newEntries: any[] = [];

				const directoryReader = entry.createReader();
				const readerFunc = directoryReader.readEntries.bind(directoryReader);

				do {
					newEntries = await new Promise(readerFunc);

					for (const newEntry of newEntries) {
						readEntries.push(newEntry);
					}
				} while (newEntries.length > 0);

				const pendingActions: FileCreationAction[] = await Promise.all(
					readEntries.map(entryToActions),
				);

				return {
					type: 'Folder',
					id: this.id++,
					name: entry.name,
					pendingActions,
				};
			} else {
				const fileToUpload: File = await new Promise((res, rej) => entry.file(res, rej));

				return {
					type: 'File',
					beingUploaded: false,
					fileToUpload,
					id: this.id++,
					name: fileToUpload.name,
					progress: 0,
				};
			}
		};

		const newActions = [await entryToActions(files)];

		this.setState(
			{
				pendingActions: [...this.state.pendingActions, ...newActions],
			},
			() => {
				this.startFileUploadProcess();
			},
		);
	}

	private handleFileList(filesList: FileList) {
		const files = Array.prototype.slice.call(filesList);

		if (files.length === 0) {
			return;
		}

		const uploadingFiles = this.state.pendingActions.slice();

		const groupFilesWithSameFolders = (subFiles: FileUploadAction[]) => {
			const oldActions = subFiles.splice(0);
			const newActions: FileCreationAction[] = [];

			while (oldActions.length > 0) {
				const [file] = oldActions.splice(0, 1);

				const [basename, ...rest] = file.name.split('/');

				if (rest.length === 0) {
					// basename is the filename, not a folder name
					newActions.push({
						type: 'File',
						beingUploaded: false,
						fileToUpload: file.fileToUpload,
						id: file.id,
						name: basename,
						progress: 0,
					});
				} else {
					const folderFiles: FileUploadAction[] = [
						{
							type: 'File',
							beingUploaded: false,
							fileToUpload: file.fileToUpload,
							id: file.id,
							name: rest.join('/'),
							progress: 0,
						},
					];

					for (let i = oldActions.length - 1; i >= 0; i--) {
						const [otherBasename, ...otherFilePathParts] = oldActions[i].name.split(
							'/',
						);

						// Check for 1, to prevent a file that has the same name as a folder as
						// being presented as a file with no name that is a subfile of that folder
						if (otherFilePathParts.length > 0 && otherBasename === basename) {
							const [otherFile] = oldActions.splice(i, 1);

							folderFiles.push({
								type: 'File',
								beingUploaded: false,
								fileToUpload: otherFile.fileToUpload,
								id: otherFile.id,
								name: otherFilePathParts.join('/'),
								progress: 0,
							});
						}
					}

					const folderAction: FolderCreationAction = {
						id: this.id++,
						name: basename,
						pendingActions: groupFilesWithSameFolders(folderFiles),
						type: 'Folder',
					};

					newActions.push(folderAction);
				}
			}

			return newActions;
		};

		const filesWithoutPaths = files.filter(file => !hasRelativePath(file));
		const filesWithPaths = files.filter(hasRelativePath);

		const filesWithoutPathsActions: FileCreationAction[] = filesWithoutPaths.map(file => ({
			type: 'File' as const,
			name: file.name,
			beingUploaded: false,
			fileToUpload: file,
			progress: 0,
			id: this.id++,
		}));

		const initialFilesWithPathsActions: FileUploadAction[] = filesWithPaths.map(file => ({
			type: 'File' as const,
			name: getRelativePath(file),
			beingUploaded: false,
			fileToUpload: file,
			progress: 0,
			id: this.id++,
		}));

		const filesWithPathsActions = groupFilesWithSameFolders(initialFilesWithPathsActions);

		this.setState(
			{
				pendingActions: [
					...uploadingFiles,
					...filesWithoutPathsActions,
					...filesWithPathsActions,
				],
			},
			() => {
				this.startFileUploadProcess();
			},
		);
	}

	private async startFileUploadProcess() {
		if (this.currentlyUploading) {
			return;
		}

		this.currentlyUploading = true;

		while (this.state.pendingActions.length > 0) {
			const nextAction = this.state.pendingActions[0];

			await this.handleAction(nextAction, this.props.currentFolder.id);

			await new Promise<void>(resolve =>
				this.setState({ pendingActions: this.state.pendingActions.slice(1) }, resolve),
			);
		}

		this.currentlyUploading = false;
	}

	private async handleAction(
		action: FileCreationAction,
		parentFolderID: string,
	): Promise<boolean> {
		const updateParent = (newFileObj: FileObject) => {
			if (newFileObj.parentID === this.props.currentFolder.id) {
				this.props.onFileUpload(newFileObj);
			}
		};

		if (action.type === 'File') {
			try {
				this.updateActionWithID(action.id, a => ({ ...a, beingUploaded: true }));
				for await (const event of uploadFile(parentFolderID)([action.fileToUpload])) {
					if (event.event === 'PROGRESS') {
						this.updateFileProgress(action.id, event.progress);
					} else {
						this.removeWithID(action.id);
						updateParent(event.files[0]);
					}
				}
			} catch (e) {
				this.setState({
					error: e.message,
					pendingActions: [],
				});
				return false;
			}
		} else {
			const res = await fetchApi.files.files.createFolder(
				{
					parentid: parentFolderID,
					name: action.name,
				},
				{},
			);

			if (Either.isLeft(res)) {
				this.setState({
					error: res.value.message,
					pendingActions: [],
				});
			} else {
				updateParent(res.value);

				const fileActions = action.pendingActions.filter(
					(a): a is FileUploadAction => a.type === 'File',
				);
				const folderActions = action.pendingActions.filter(
					(a): a is FolderCreationAction => a.type === 'Folder',
				);

				// If there are no files to upload, and it makes the request, two bad things happen:
				// 1. It's an empty request which serves no purpose, wasting bandwidth and time
				// 2. It causes the server to respond with a 400 due to an empty input
				// 		Currently too lazy to figure out how to listen to 'empty errors' with busboy,
				// 		so I'll just make sure the client never does this
				if (fileActions.length > 0) {
					try {
						this.updateFolderActionWithID(action.id, a => ({
							...a,
							pendingActions: a.pendingActions.map(subAction =>
								subAction.type === 'File'
									? { ...subAction, beingUploaded: true }
									: subAction,
							),
						}));

						for await (const event of uploadFile(res.value.id)(
							fileActions.map(({ fileToUpload }) => fileToUpload),
						)) {
							if (event.event === 'PROGRESS') {
								this.updateFolderActionWithID(action.id, a => ({
									...a,
									pendingActions: a.pendingActions.map(subAction =>
										subAction.type === 'File'
											? { ...subAction, progress: event.progress }
											: subAction,
									),
								}));
							} else {
								this.updateFolderActionWithID(action.id, a => ({
									...a,
									pendingActions: folderActions,
								}));
							}
						}
					} catch (e) {
						this.setState({
							error: e.message,
							pendingActions: [],
						});
						return false;
					}
				}

				for (const subAction of folderActions) {
					if (!(await this.handleAction(subAction, res.value.id))) {
						return false;
					}
				}

				this.removeWithID(action.id);
			}
		}

		return true;
	}

	private updateFileProgress(id: number, progress: number) {
		this.updateActionWithID(id, action =>
			action.type === 'File'
				? {
						...action,
						progress,
				  }
				: action,
		);
	}

	private updateFolderActionWithID(
		id: number,
		actionUpdate:
			| FolderCreationAction
			| ((action: FolderCreationAction) => FolderCreationAction),
	) {
		this.updateActionWithID(id, action =>
			action.type === 'File'
				? action
				: typeof actionUpdate === 'function'
				? actionUpdate(action)
				: actionUpdate,
		);
	}

	private updateActionWithID(
		id: number,
		action: FileCreationAction | ((action: FileCreationAction) => FileCreationAction),
	) {
		const checkForIDAndUpdate = (subAction: FileCreationAction): FileCreationAction =>
			subAction.id === id
				? typeof action === 'function'
					? action(subAction)
					: action
				: subAction.type === 'File'
				? subAction
				: {
						type: 'Folder',
						id: subAction.id,
						name: subAction.name,
						pendingActions: subAction.pendingActions.map(checkForIDAndUpdate),
				  };

		this.setState(prev => ({
			...prev,
			pendingActions: prev.pendingActions.map(checkForIDAndUpdate),
		}));
	}

	private removeWithID(targetId: number) {
		const checkForIDAndRemove = <T extends { pendingActions: FileCreationAction[] }>(
			value: T,
		): T => ({
			...value,
			pendingActions: value.pendingActions
				.filter(({ id }) => id !== targetId)
				.map(action => (action.type === 'File' ? action : checkForIDAndRemove(action))),
		});

		this.setState(checkForIDAndRemove);
	}
}
