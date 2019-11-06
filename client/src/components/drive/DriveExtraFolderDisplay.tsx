import { FileUserAccessControlPermissions } from 'common-lib';
import * as React from 'react';
import FileInterface from '../../lib/File';
import Button from '../Button';
import Form, { BigTextBox, Label } from '../forms/Form';
import { CommentsForm, ExtraDisplayProps } from './DriveExtraFileDisplay';

export default class ExtraFolderDisplay extends React.Component<
	ExtraDisplayProps & { currentFolderID: string },
	CommentsForm
> {
	public static getDerivedStateFromProps(props: ExtraDisplayProps) {
		return {
			comments: props.file.comments
		};
	}

	public state = {
		comments: this.props.file.comments
	};

	constructor(props: ExtraDisplayProps & { currentFolderID: string }) {
		super(props);

		this.onFormChange = this.onFormChange.bind(this);
		this.onFileChangeFormSubmit = this.onFileChangeFormSubmit.bind(this);

		this.saveFiles = this.saveFiles.bind(this);
	}

	public render() {
		const FileChangeForm = Form as new () => Form<CommentsForm>;

		return (
			<div className="drive-file-extra-display" ref={this.props.childRef}>
				{this.props.file.hasPermission(
					this.props.member,
					FileUserAccessControlPermissions.DELETE
				) ? (
					<>
						<Button buttonType="none" onClick={this.saveFiles}>
							Delete file
						</Button>
						<br />
						<br />
					</>
				) : null}
				<h3>Comments:</h3>
				{this.props.file.hasPermission(
					this.props.member,
					// tslint:disable-next-line:no-bitwise
					FileUserAccessControlPermissions.COMMENT |
						FileUserAccessControlPermissions.MODIFY
				) ? (
					<FileChangeForm
						id=""
						values={{ comments: this.props.file.comments }}
						onChange={this.onFormChange}
						onSubmit={this.onFileChangeFormSubmit}
						showSubmitButton={true}
					>
						<Label>Comments</Label>
						<BigTextBox name="comments" />
					</FileChangeForm>
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

	private onFileChangeFormSubmit(formState: CommentsForm) {
		this.props.file.comments = formState.comments;

		if (this.props.member) {
			this.props.file.save(this.props.member).then(() => {
				this.props.fileModify(this.props.file);
			});
		}
	}

	private async saveFiles() {
		if (!this.props.member) {
			// TODO: Show error message
			return;
		}

		let parent;

		try {
			parent = await this.props.file.getParent(this.props.member);
		} catch (e) {
			// TODO: Show error message
			return;
		}

		const getFilesPromise = [];

		for (const id of this.props.file.fileChildren) {
			getFilesPromise.push(FileInterface.Get(id, this.props.member, this.props.file.account));
		}

		const children = await Promise.all(getFilesPromise);
		const saveFilesPromises = [];

		for (const child of children) {
			saveFilesPromises.push(child.moveTo(parent, this.props.member));
		}

		const moveResults = await Promise.all(saveFilesPromises);

		const moveSuccess = moveResults
			.map(c => c === 200 || c === 204)
			.reduce((a, b) => a && b, true);

		if (!moveSuccess) {
			// TODO: Show error message
			return;
		}

		const result = await this.props.file.delete(this.props.member);

		if (result !== 200 && result !== 204) {
			// TODO: Show error message
			return;
		}

		this.props.fileDelete(this.props.file);
	}
}
