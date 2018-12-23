import * as React from 'react';
import FileInterface from '../lib/File';
import MemberBase from '../lib/Members';
import Button from './Button';
import SimpleRequestForm from './SimpleRequestForm';
import { Label, BigTextBox } from './Form';
import { FileUserAccessControlPermissions } from '../enums';

export interface ExtraDisplayProps {
	file: FileInterface;
	member: MemberBase | null;
	childRef: React.RefObject<HTMLDivElement>;
	fileDelete: (file: FileObject) => void;
	fileModify: (file: FileObject) => void;
}

export interface CommentsForm {
	comments: string;
}

export default class ExtraFileDisplay extends React.Component<
	ExtraDisplayProps,
	CommentsForm
	> {
	public state = {
		comments: this.props.file.comments
	};

	constructor(props: ExtraDisplayProps) {
		super(props);

		this.onFormChange = this.onFormChange.bind(this);
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
}