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
	ClientUser,
	FileObject,
	FileUserAccessControlPermissions,
	Member,
	RawTeamObject,
	RegistryValues,
	userHasFilePermission,
} from 'common-lib';
import * as React from 'react';
import fetchApi from '../../lib/apis';
import Button from '../Button';
import FilePermissionsDialogue from '../dialogues/FilePermissionsDialogue';
import SimpleForm, { BigTextBox, Label } from '../forms/SimpleForm';

export interface ExtraDisplayProps {
	parentFile: FileObject;
	file: FileObject;
	member: ClientUser | null;
	childRef: React.RefObject<HTMLDivElement>;
	fileDelete: (file: FileObject) => void;
	fileModify: (file: FileObject) => void;
	fileUpdate: () => void;

	registry: RegistryValues;
	members: Member[];
	teams: RawTeamObject[];
}

export interface CommentsForm {
	comments: string;
}

export interface ExtraDisplayState extends CommentsForm {
	permissionsOpen: boolean;
}

const canModify = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

export default class ExtraFileDisplay extends React.Component<
	ExtraDisplayProps,
	ExtraDisplayState
> {
	public state = {
		comments: this.props.file.comments,
		permissionsOpen: false,
	};

	public render(): JSX.Element {
		const userCanModify = canModify(this.props.member);

		return (
			<div className="drive-file-extra-display" ref={this.props.childRef}>
				<FilePermissionsDialogue
					file={this.props.file}
					handleCancel={this.onFilePermissionsSaveCancel}
					handleFile={this.onFilePermissionsSave}
					open={this.state.permissionsOpen}
					registry={this.props.registry}
					members={this.props.members}
					teams={this.props.teams}
				/>
				{userCanModify(this.props.parentFile) ? (
					<Button buttonType="none" onClick={this.onDeleteFileClick}>
						Delete file
					</Button>
				) : null}
				{userCanModify(this.props.parentFile) && userCanModify(this.props.file) ? (
					<> | </>
				) : null}
				{userCanModify(this.props.file) ? (
					<Button buttonType="none" onClick={this.openFilePermissions}>
						Sharing settings
					</Button>
				) : null}
				{userCanModify(this.props.parentFile) || userCanModify(this.props.file) ? (
					<>
						<br />
						<br />
					</>
				) : null}
				<h3>Comments:</h3>
				{userCanModify(this.props.file) ? (
					<SimpleForm<CommentsForm>
						values={{ comments: this.props.file.comments }}
						onChange={this.onFormChange}
						onSubmit={this.onFileChangeFormSubmit}
						showSubmitButton={true}
					>
						<Label>Comments</Label>
						<BigTextBox name="comments" />
					</SimpleForm>
				) : (
					this.props.file.comments
				)}
			</div>
		);
	}

	private onFormChange = (formState: CommentsForm): void => {
		this.props.file.comments = formState.comments;
		this.props.fileModify(this.props.file);
	};

	private onDeleteFileClick = async (): Promise<void> => {
		if (this.props.member) {
			await fetchApi.files.files.delete({ fileid: this.props.file.id }, {});
			this.props.fileDelete(this.props.file);
		}
	};

	private onFileChangeFormSubmit = async (formState: CommentsForm): Promise<void> => {
		if (this.props.member) {
			const newFile: FileObject = {
				...this.props.file,
				...formState,
			};

			await fetchApi.files.files.setInfo({ fileid: this.props.file.id }, formState);

			this.props.fileModify(newFile);
		}
	};

	private openFilePermissions = (): void => {
		this.setState({
			permissionsOpen: true,
		});
	};

	private onFilePermissionsSave = async (file: FileObject): Promise<void> => {
		await fetchApi.files.files.setInfo({ fileid: file.id }, file).fullJoin();

		this.setState({
			permissionsOpen: false,
		});

		this.props.fileModify(file);
	};

	private onFilePermissionsSaveCancel = (): void => {
		this.setState({
			permissionsOpen: false,
		});
	};
}
