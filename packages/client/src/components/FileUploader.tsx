/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { FileObject, AccountObject, User } from 'common-lib';
import * as React from 'react';
import { uploadFile } from '../lib/File';

interface FileUploaderProps {
	onFileUpload: (file: FileObject) => void;
	member: User;
	account: AccountObject;
	currentFolder: FileObject;
	display: boolean;
}

interface FileUploaderState {
	files: File[];
	hovering: boolean;
	progress: number;
	doneWithCurrentFile: boolean;
}

export default class FileUploader extends React.Component<FileUploaderProps, FileUploaderState> {
	public state: FileUploaderState = {
		files: [],
		hovering: false,
		progress: 0,
		doneWithCurrentFile: true
	};

	public constructor(props: FileUploaderProps) {
		super(props);

		this.handleSelectChange = this.handleSelectChange.bind(this);
		this.handleDrop = this.handleDrop.bind(this);
	}

	public async componentDidUpdate() {
		// Don't start uploading if it is currently uploading the first file
		if (!this.state.doneWithCurrentFile && this.state.files.length > 0) {
			return;
		}

		// Don't try to upload if there aren't files to upload
		if (this.state.files.length === 0) {
			return;
		}

		this.setState({
			doneWithCurrentFile: false
		});

		for await (const event of uploadFile(this.props.member)(this.props.currentFolder.id)(
			this.state.files[0]
		)) {
			if (event.event === 'PROGRESS') {
				this.setState({
					progress: event.progress
				});
			} else if (event.event === 'FINISH') {
				this.props.onFileUpload(event.file);
				this.setState(prev => ({
					files: prev.files.slice(1),
					doneWithCurrentFile: true,
					progress: 0
				}));
			}
		}
	}

	public render() {
		return (
			<>
				<div>
					{this.state.files.length > 0 ? <div>Uploading files</div> : null}
					{this.state.files.map((f, i) => (
						<div key={i}>
							{f.name} {i === 0 ? this.state.progress * 100 : 0}%
						</div>
					))}
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
						display: this.props.display ? 'block' : 'none'
					}}
				>
					<div
						style={{
							margin: '0px auto',
							overflow: 'auto',
							textAlign: 'center',
							clear: 'both'
						}}
						className="verticalCenter"
					>
						Drag here to upload
						<br />
						or
						<br />
						<label
							htmlFor="fileUpload"
							id="fileUploadLabel"
							className="primaryButton"
							style={{
								display: 'inline-block',
								margin: '2px auto'
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
								zIndex: -1
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
				hovering
			});
		};
	}

	private handleDrop(ev: React.DragEvent<HTMLDivElement>) {
		ev.preventDefault();

		if (ev.dataTransfer.files) {
			this.handleFiles(ev.dataTransfer.files);
		} else if (ev.dataTransfer.items) {
			const files = [];
			// I don't think a for of loop would work with dataTransfer.items
			// tslint:disable-next-line:prefer-for-of
			for (let i = 0; i < ev.dataTransfer.items.length; i++) {
				if (ev.dataTransfer.items[i].kind === 'file') {
					files.push(ev.dataTransfer.items[i].getAsFile());
				}
			}

			if (files.length > 0) {
				this.handleFiles((files as any) as FileList);
			}
		}

		this.setState({
			hovering: false
		});
	}

	private handleSelectChange(ev: React.FormEvent<HTMLInputElement>) {
		const files = ev.currentTarget.files;

		if (files === null || typeof files === 'undefined') {
			return;
		}

		this.handleFiles(files);
	}

	private handleFiles(files: FileList) {
		const uploadingFiles = this.state.files.slice();

		// FileList does not implement Iterator, would not work with for-of
		// tslint:disable-next-line:prefer-for-of
		for (let i = 0; i < files.length; i++) {
			uploadingFiles.push(files[i]);
		}

		this.setState({ files: uploadingFiles });
	}
}
