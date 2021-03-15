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

import {
	AsyncEither,
	Either,
	EitherObj,
	FileObject,
	FileUserAccessControlPermissions,
	FullFileObject,
	FullTeamObject,
	get,
	hasPermission,
	HTTPError,
	Maybe,
	Member,
	Permissions,
	RawTeamObject,
	Right,
	userHasFilePermission,
} from 'common-lib';
import $ from 'jquery';
import * as React from 'react';
import { withMemberList, withTeamlist } from '../../globals';
import ExtraFileDisplay from '../../components/drive/DriveExtraFileDisplay';
import ExtraFolderDisplay from '../../components/drive/DriveExtraFolderDisplay';
import DriveFileDisplay from '../../components/drive/DriveFileDisplay';
import DriveFolderDisplay from '../../components/drive/DriveFolderDisplay';
import FileUploader from '../../components/FileUploader';
import { Form, TextInput } from '../../components/forms/SimpleForm';
import Loader from '../../components/Loader';
import fetchApi from '../../lib/apis';
import Page, { PageProps } from '../Page';
import './Drive.css';

interface UnloadedDriveState {
	files: null;
	currentlySelected: '';
	newFoldername: string;
	currentFolder: null;
	showingExtraInfo: boolean;
	error: boolean;
	errorReason: string | null;
	teams: null;
	members: null;
}

interface LoadedDriveState {
	files: FileObject[];
	currentlySelected: string;
	newFoldername: string;
	currentFolder: FileObject;
	showingExtraInfo: boolean;
	error: boolean;
	errorReason: string | null;
	teams: RawTeamObject[];
	members: Member[];
}

interface DataUnloadedState {
	extraLoaded: false;
	teams: null;
	members: null;
}

interface DataLoadedState {
	extraLoaded: true;
	teams: RawTeamObject[];
	members: Member[];
}

type DataState = DataUnloadedState | DataLoadedState;

type DriveState = (UnloadedDriveState | LoadedDriveState) & DataState;

interface DriveProps extends PageProps {
	memberList: EitherObj<HTTPError, Member[]>;
	teamList: EitherObj<HTTPError, FullTeamObject[]>;
}

export class Drive extends Page<DriveProps, DriveState> {
	public state: DriveState = {
		files: null,
		currentlySelected: '',
		newFoldername: '',
		currentFolder: null,
		showingExtraInfo: true,
		error: false,
		errorReason: null,

		extraLoaded: false,
		teams: null,
		members: null,
	};

	private extraInfoRef = React.createRef<HTMLDivElement>();

	constructor(props: DriveProps) {
		super(props);

		this.onFileClick = this.onFileClick.bind(this);
		this.onFolderNavigate = this.onFolderNavigate.bind(this);

		this.createFolder = this.createFolder.bind(this);
		this.updateNewFolderForm = this.updateNewFolderForm.bind(this);
		this.addFile = this.addFile.bind(this);
		this.fileDeleted = this.fileDeleted.bind(this);
		this.fileIDDeleted = this.fileIDDeleted.bind(this);
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

	public async componentDidMount() {
		this.goToFolder(this.folderID, false);

		const resultEither = await AsyncEither.All([
			fetchApi.team.list({}, {}),
			fetchApi.member.memberList({}, {}),
		]);

		if (Either.isLeft(resultEither)) {
			// TODO: Add error
		} else {
			const [teams, members] = resultEither.value;

			this.setState({
				extraLoaded: true,
				teams,
				members,
			});
		}
	}

	public componentDidUpdate() {
		if (!this.state.showingExtraInfo && this.extraInfoRef.current) {
			this.setState({
				showingExtraInfo: true,
			});

			$(this.extraInfoRef.current).slideDown(250);
		}

		if (this.state.currentFolder) {
			this.props.updateBreadCrumbs([
				{
					target: '/',
					text: 'Home',
				},
				{
					target: '/admin',
					text: 'Administration',
				},
				...this.state.currentFolder.folderPath.map(item => ({
					target: `/drive/${item.id}`,
					text: `View folder '${item.name}'`,
				})),
			]);

			this.updateTitle(`View folder ${this.state.currentFolder.fileName}`);

			this.props.updateSideNav([]);
		}
	}

	public render() {
		if (this.state.error) {
			return <div>{this.state.errorReason}</div>;
		}

		const { memberList, teamList } = this.props;

		if (Either.isLeft(teamList)) {
			return <div>{teamList.value.message}</div>;
		}

		if (Either.isLeft(memberList) && this.props.member) {
			return <div>{memberList.value.message}</div>;
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
			column: 0,
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

		const isEditableFolder =
			this.props.member &&
			(hasPermission('FileManagement')(Permissions.FileManagement.FULL)(this.props.member) ||
				userHasFilePermission(FileUserAccessControlPermissions.MODIFY)(
					this.props.member,
				)) &&
			this.state.currentFolder.id !== 'personalfolders';

		return (
			<div>
				{isEditableFolder ? (
					<div>
						<Form<{ name: string }>
							id=""
							values={{
								name: this.state.newFoldername,
							}}
							onChange={this.updateNewFolderForm}
							onSubmit={this.createFolder}
							submitInfo={{
								text: 'Add folder',
								className: 'primaryButton drive-newfoldername-submit',
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
								{folderList.map(f => (
									<DriveFolderDisplay
										key={f.id}
										file={f}
										onFolderNavigate={this.onFolderNavigate}
										onSelect={this.onFileClick}
										selected={f.id === this.state.currentlySelected}
										member={this.props.member}
										fileDeleteID={this.fileIDDeleted}
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
									registry={this.props.registry}
									members={
										!!this.props.member
											? (memberList as Right<Member[]>).value
											: []
									}
									teams={teamList.value}
								/>
							) : null}
						</React.Fragment>
					))}
				</div>
				{this.props.member && isEditableFolder ? (
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
								{fileList.map(f => (
									<DriveFileDisplay
										key={f.id}
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
									registry={this.props.registry}
									members={
										!!this.props.member
											? (memberList as Right<Member[]>).value
											: []
									}
									teams={teamList.value}
								/>
							) : null}
						</React.Fragment>
					))}
				</div>
			</div>
		);
	}

	private onFolderNavigate(file: FileObject) {
		this.goToFolder(file.id, true);
	}

	private onFileClick(file: FileObject) {
		this.setState(prev =>
			prev.currentlySelected === file.id
				? {
						currentlySelected: '',
						showingExtraInfo: true,
				  }
				: {
						currentlySelected: file.id,
						showingExtraInfo: false,
				  },
		);
	}

	private updateNewFolderForm({ name: newFoldername }: { name: string }) {
		this.setState({
			newFoldername,
		});
	}

	private async goToFolder(id: string, update = true) {
		const folderInfoEither = await AsyncEither.All([
			fetchApi.files.children.getBasic({ parentid: id }, {}),
			fetchApi.files.files.get({ id }, {}),
		]);

		if (Either.isLeft(folderInfoEither)) {
			this.setState({
				error: true,
				errorReason: folderInfoEither.value.message,
			});
			return;
		}

		const [wrappedFiles, currentFolder] = folderInfoEither.value;

		const files = wrappedFiles.filter(Either.isRight).map(get('value'));

		this.setState(
			{
				files,
				currentFolder,
			},
			() => {
				if (update) {
					this.props.prepareURL('/' + this.path + '/' + id);
					this.props.routeProps.history.push('/' + this.path + '/' + id);
				}

				this.props.updateBreadCrumbs(
					currentFolder.folderPath.map(folder => ({
						text: folder.name,
						target: `/${this.path}/${folder.id}`,
					})),
				);
			},
		);
	}

	private addFile(file: FileObject) {
		if (!this.props.member) {
			// Probably an error if it reaches here
			return;
		}

		const fileObject: FullFileObject = {
			...file,
			uploader: Maybe.some(this.props.member),
		};

		this.setState(prev => ({
			files: [...prev.files!, fileObject],
		}));
	}

	private fileIDDeleted(id: string) {
		this.setState(prev => ({
			files: (prev.files || []).filter(f => f.id !== id),
		}));
	}

	private fileDeleted(file: FileObject) {
		this.fileIDDeleted(file.id);
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
			);

			if (Either.isLeft(result)) {
				// TODO: Show error
			} else {
				this.addFile(result.value);
			}
		}
	}
}

export default withTeamlist(withMemberList(Drive));
