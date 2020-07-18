import {
	FileObject,
	FileUserAccessControlPermissions,
	User,
	userHasFilePermission
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
		comments: this.props.file.comments
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
					this.props.parentFile
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
					this.props.file
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
				this.props.member.sessionID
			);
			this.props.fileDelete(this.props.file);
		}
	}

	private async onFileChangeFormSubmit(formState: CommentsForm) {
		if (this.props.member) {
			const newFile: FileObject = {
				...this.props.file,
				...formState
			};

			await fetchApi.files.files.setInfo(
				{ fileid: this.props.file.id },
				formState,
				this.props.member.sessionID
			);

			this.props.fileModify(newFile);
		}
	}
}
