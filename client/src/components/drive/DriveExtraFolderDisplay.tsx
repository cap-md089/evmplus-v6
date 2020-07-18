import {
	APIEither,
	asyncIterMap,
	asyncIterReduce,
	Either,
	FileObject,
	FileUserAccessControlPermissions,
	get,
	pipe,
	userHasFilePermission
} from 'common-lib';
import * as React from 'react';
import fetchApi from '../../lib/apis';
import Button from '../Button';
import Form, { BigTextBox, Label } from '../forms/SimpleForm';
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
		return (
			<div className="drive-file-extra-display" ref={this.props.childRef}>
				{userHasFilePermission(FileUserAccessControlPermissions.WRITE)(this.props.member)(
					this.props.parentFile
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
				{userHasFilePermission(FileUserAccessControlPermissions.MODIFY)(this.props.member)(
					this.props.file
				) ? (
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

	private onFormChange(formState: CommentsForm) {
		this.props.fileModify({
			...this.props.file,
			...formState
		});
	}

	private async onFileChangeFormSubmit(formState: CommentsForm) {
		if (this.props.member) {
			await fetchApi.files.files.setInfo(
				{ fileid: this.props.file.id },
				formState,
				this.props.member.sessionID
			);

			this.props.fileModify({
				...this.props.file,
				...formState
			});
		}
	}

	private async saveFiles() {
		const member = this.props.member;

		if (!member) {
			return;
		}

		const childrenEither = await fetchApi.files.children.getBasic(
			{ parentid: this.props.file.id },
			{},
			member.sessionID
		);

		if (Either.isLeft(childrenEither)) {
			return;
		}

		const children = childrenEither.value.filter(Either.isRight).map(get('value'));

		const moveSuccess = pipe(
			asyncIterMap<FileObject, APIEither<void>>((file: FileObject) =>
				fetchApi.files.children.add(
					{ parentid: this.props.parentFile.id },
					{ childid: file.id },
					member.sessionID
				)
			),
			asyncIterMap(Either.isRight),
			asyncIterReduce<boolean, boolean>((prev, curr) => prev || curr)(false)
		)(children);

		if (!moveSuccess) {
			// TODO: Show error message
			return;
		}

		const result = await fetchApi.files.files.delete(
			{ fileid: this.props.file.id },
			{},
			member.sessionID
		);

		if (Either.isLeft(result)) {
			// TODO: Show error message
			return;
		}

		this.props.fileDelete(this.props.file);
	}
}
