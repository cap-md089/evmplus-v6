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
	APIEither,
	asyncIterMap,
	asyncIterReduce,
	Either,
	FileObject,
	FileUserAccessControlPermissions,
	get,
	parseStringMemberReference,
	pipe,
	userHasFilePermission,
} from 'common-lib';
import * as React from 'react';
import fetchApi from '../../lib/apis';
import Button from '../Button';
import FilePermissionsDialogue from '../dialogues/FilePermissionsDialogue';
import Form, { BigTextBox, Label } from '../forms/SimpleForm';
import { CommentsForm, ExtraDisplayProps, ExtraDisplayState } from './DriveExtraFileDisplay';

const canModify = userHasFilePermission(FileUserAccessControlPermissions.MODIFY);

export default class ExtraFolderDisplay extends React.Component<
	ExtraDisplayProps & { currentFolderID: string },
	ExtraDisplayState
> {
	public state = {
		comments: this.props.file.comments,
		permissionsOpen: false,
	};

	public static getDerivedStateFromProps = (props: ExtraDisplayProps): { comments: string } => ({
		comments: props.file.comments,
	});

	public render(): JSX.Element | null {
		const userCanModify = canModify(this.props.member);

		// All of these file IDs represent special, virtual folders that cannot be modified by regular users
		if (
			this.props.file.id === 'root' ||
			this.props.file.id === 'events' ||
			this.props.file.id === 'personalfolders' ||
			Either.isRight(parseStringMemberReference(this.props.file.id))
		) {
			return null;
		}

		return (
			<div className="drive-file-extra-display" ref={this.props.childRef}>
				<FilePermissionsDialogue
					file={this.props.file}
					handleCancel={this.onPermissionsCancel}
					handleFile={this.onPermissionsChange}
					open={this.state.permissionsOpen}
					registry={this.props.registry}
					members={this.props.members}
					teams={this.props.teams}
				/>
				{userCanModify(this.props.parentFile) ? (
					<Button buttonType="none" onClick={this.saveFiles}>
						Delete file
					</Button>
				) : null}
				{userCanModify(this.props.parentFile) && userCanModify(this.props.file) ? (
					<> | </>
				) : null}
				{userCanModify(this.props.file) ? (
					<Button buttonType="none" onClick={this.openPermissions}>
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
					<Form<CommentsForm>
						id=""
						values={{ comments: this.props.file.comments }}
						onChange={this.onFormChange}
						onSubmit={this.onFileChangeFormSubmit}
						showSubmitButton={true}
					>
						<Label>Comments</Label>
						<BigTextBox name="comments" />
					</Form>
				) : (
					this.props.file.comments
				)}
			</div>
		);
	}

	private onFormChange = (formState: CommentsForm): void => {
		this.props.fileModify({
			...this.props.file,
			...formState,
		});
	};

	private onFileChangeFormSubmit = async (formState: CommentsForm): Promise<void> => {
		if (this.props.member) {
			await fetchApi.files.files.setInfo({ fileid: this.props.file.id }, formState);

			this.props.fileModify({
				...this.props.file,
				...formState,
			});
		}
	};

	private saveFiles = async (): Promise<void> => {
		const member = this.props.member;

		if (!member) {
			return;
		}

		const childrenEither = await fetchApi.files.children.getBasic(
			{ parentid: this.props.file.id },
			{},
		);

		if (Either.isLeft(childrenEither)) {
			return;
		}

		const children = childrenEither.value.filter(Either.isRight).map(get('value'));

		const moveSuccess = await pipe(
			asyncIterMap<FileObject, APIEither<void>>((file: FileObject) =>
				fetchApi.files.children.add(
					{ parentid: this.props.parentFile.id },
					{ childid: file.id },
				),
			),
			asyncIterMap(Either.isRight),
			asyncIterReduce<boolean, boolean>((prev, curr) => prev || curr)(false),
		)(children);

		if (!moveSuccess) {
			// TODO: Show error message
			return;
		}

		const result = await fetchApi.files.files.delete({ fileid: this.props.file.id }, {});

		if (Either.isLeft(result)) {
			// TODO: Show error message
			return;
		}

		this.props.fileDelete(this.props.file);
	};

	private openPermissions = (): void => {
		this.setState({
			permissionsOpen: true,
		});
	};

	private onPermissionsCancel = (): void => {
		this.setState({
			permissionsOpen: false,
		});
	};

	private onPermissionsChange = async (file: FileObject): Promise<void> => {
		await fetchApi.files.files.setInfo({ fileid: file.id }, file);

		this.setState({
			permissionsOpen: false,
		});

		this.props.fileModify(file);
	};
}
