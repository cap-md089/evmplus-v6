import * as React from 'react';
import myFetch from 'src/lib/myFetch';
import urlFormat from 'src/lib/urlFormat';
import { FileUserAccessControlPermissions } from '../enums';
import Button from './Button';
import { CommentsForm, ExtraDisplayProps } from "./DriveExtraFileDisplay";
import { BigTextBox, Label } from './Form';
import SimpleRequestForm from './SimpleRequestForm';

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

		this.saveFilesFirst = this.saveFilesFirst.bind(this);
	}

	public render() {
		const FileChangeForm = SimpleRequestForm as new () => SimpleRequestForm<
			CommentsForm,
			null
			>;

		return (
			<div className="drive-file-extra-display" ref={this.props.childRef}>
				{this.props.file.hasPermission(
					this.props.member,
					FileUserAccessControlPermissions.DELETE
				) ? (
						<>
							<Button
								buttonType="none"
								url={'/api/files/' + this.props.file.id}
								method="DELETE"
								onReceiveData={() => {
									if (this.props.fileDelete) {
										this.props.fileDelete(this.props.file);
									}
								}}
								onClick={this.saveFilesFirst}
								parseReturn={false}
							>
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
							method="PUT"
							url={'/api/files/' + this.props.file.id}
							onReceiveData={() => {
								if (this.props.fileModify) {
									this.props.fileModify(this.props.file);
								}
							}}
							values={{ comments: this.props.file.comments }}
							onChange={this.onFormChange}
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

	private async saveFilesFirst() {
		const promises = [];

		for (const id of this.props.file.fileChildren) {
			promises.push(
				myFetch(
					urlFormat(
						'api',
						'files',
						this.props.currentFolderID,
						'children'
					),
					{
						method: 'POST',
						headers: {
							authorization: this.props.member
								? this.props.member.sessionID
								: '',
							'content-type': 'application/json'
						},
						body: JSON.stringify({
							id
						})
					}
				)
			);
		}

		await Promise.all(promises);
	}
}