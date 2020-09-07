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
	FileObject,
	FileUserAccessControlPermissions,
	User,
	userHasFilePermission,
} from 'common-lib';
import * as React from 'react';
import fetchApi from '../../lib/apis';
import Button from '../Button';
import SimpleForm, { BigTextBox, Label } from '../forms/SimpleForm';

export interface ExtraDisplayProps {
	parentFile: FileObject;
	file: FileObject;
	member: User | null;
	childRef: React.RefObject<HTMLDivElement>;
	fileDelete: (file: FileObject) => void;
	fileModify: (file: FileObject) => void;
	fileUpdate: () => void;
}

export interface CommentsForm {
	comments: string;
}

export default class ExtraFileDisplay extends React.Component<ExtraDisplayProps, CommentsForm> {
	public state = {
		comments: this.props.file.comments,
	};

	constructor(props: ExtraDisplayProps) {
		super(props);

		this.onFormChange = this.onFormChange.bind(this);
		this.onFileChangeFormSubmit = this.onFileChangeFormSubmit.bind(this);

		this.onDeleteFileClick = this.onDeleteFileClick.bind(this);
	}

	public render() {
		return (
			<div className="drive-file-extra-display" ref={this.props.childRef}>
				{userHasFilePermission(FileUserAccessControlPermissions.WRITE)(this.props.member)(
					this.props.parentFile,
				) ? (
					<>
						<Button buttonType="none" onClick={this.onDeleteFileClick}>
							Delete file
						</Button>
						<br />
						<br />
					</>
				) : null}
				<h3>Comments:</h3>
				{userHasFilePermission(FileUserAccessControlPermissions.WRITE)(this.props.member)(
					this.props.file,
				) ? (
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

	private onFormChange(formState: CommentsForm) {
		this.props.file.comments = formState.comments;
		this.props.fileModify(this.props.file);
	}

	private async onDeleteFileClick() {
		if (this.props.member) {
			await fetchApi.files.files.delete(
				{ fileid: this.props.file.id },
				{},
				this.props.member.sessionID,
			);
			this.props.fileDelete(this.props.file);
		}
	}

	private async onFileChangeFormSubmit(formState: CommentsForm) {
		if (this.props.member) {
			const newFile: FileObject = {
				...this.props.file,
				...formState,
			};

			await fetchApi.files.files.setInfo(
				{ fileid: this.props.file.id },
				formState,
				this.props.member.sessionID,
			);

			this.props.fileModify(newFile);
		}
	}
}
