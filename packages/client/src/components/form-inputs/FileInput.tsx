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

import { AsyncEither, Either, FileObject } from 'common-lib';
import * as React from 'react';
import fetchApi from '../../lib/apis';
import Button from '../Button';
import Dialogue, { DialogueButtons } from '../dialogues/Dialogue';
import FileDialogue from '../dialogues/FileDialogue';
import Loader from '../Loader';
import './FileInput.css';
import { InputProps } from './Input';

interface FileInputState {
	files: FileObject[];
	dialogueOpen: boolean;
	loaded: boolean;
}

interface FileDisplayProps {
	onClick: (file: FileObject) => void;
	file: FileObject;
}

const FileDisplay = ({ onClick, file }: FileDisplayProps): JSX.Element => (
	<div
		className="fileDisplay"
		style={{
			clear: 'both',
		}}
	>
		{file.fileName}
		<Button
			className="floatAllthewayRight"
			onClick={() => {
				onClick(file);
				return false;
			}}
			buttonType="none"
		>
			Remove file
		</Button>
	</div>
);

interface FileInputProps extends InputProps<string[]> {
	filter?: (element: FileObject, index: number, array: FileObject[]) => boolean;

	single?: boolean;
}

export default class FileInput extends React.Component<FileInputProps, FileInputState> {
	public state: FileInputState = {
		loaded: false,
		dialogueOpen: false,
		files: [],
	};

	private previousFiles: string[] = [];

	public constructor(props: FileInputProps) {
		super(props);

		this.handleFileSelect = this.handleFileSelect.bind(this);
		this.onFileRemove = this.onFileRemove.bind(this);
		this.closeErrorDialogue = this.closeErrorDialogue.bind(this);

		if (this.props.onInitialize) {
			this.props.onInitialize({
				name: this.props.name,
				value: this.props.value || [],
			});
		}
	}

	public static getDerivedStateFromProps(
		props: InputProps<string[]>,
		state: FileInputState,
	): FileInputState | null {
		if (props.value === state.files.map(f => f.id)) {
			return null;
		} else {
			return state;
		}
	}

	public async componentDidMount(): Promise<void> {
		if (this.props.value && this.props.member) {
			const files = await AsyncEither.All(
				this.props.value.map(id => fetchApi.files.files.get({ id: id.toString() }, {})),
			);

			if (Either.isRight(files)) {
				this.setState({
					files: files.value,
					loaded: true,
				});
			}
		} else {
			this.setState({
				files: [],
				loaded: true,
			});
		}
	}

	public componentDidUpdate(): void {
		let shouldUpdate = false;
		const files = this.state.files.map(f => f.id);

		files.forEach((file, i) => {
			if (file !== this.previousFiles[i]) {
				shouldUpdate = true;
			}
		});

		if (!shouldUpdate) {
			return;
		}

		this.previousFiles = files;

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: this.state.files.map(f => f.id),
			});
		}

		if (this.props.onChange) {
			this.props.onChange(this.state.files.map(f => f.id));
		}
	}

	public render(): JSX.Element {
		if (!this.props.account) {
			throw new Error('Account not provided');
		}

		if (typeof this.props.member === 'undefined') {
			throw new Error(
				'No member variable passed, will not work when people are signed in. ' +
					'If this is intentional, pass `null` to member',
			);
		}

		return this.state.loaded ? (
			<div className="input-formbox" style={this.props.boxStyles}>
				<div className="fileInput">
					{this.props.member ? (
						<FileDialogue
							open={this.state.dialogueOpen}
							onReturn={this.handleFileSelect}
							filter={this.props.filter}
							member={this.props.member}
							account={this.props.account}
							multiple={!this.props.single}
						/>
					) : this.state.dialogueOpen ? (
						<Dialogue
							open={this.state.dialogueOpen}
							displayButtons={DialogueButtons.OK}
							onClose={this.closeErrorDialogue}
							title="Sign in error"
						>
							Please sign in
						</Dialogue>
					) : null}
					<Button
						onClick={() => {
							this.setState({
								dialogueOpen: true,
							});
						}}
					>
						Select or upload files
					</Button>
					<div>
						{this.state.files.map((file, i) => (
							<FileDisplay key={i} file={file} onClick={this.onFileRemove} />
						))}
					</div>
				</div>
			</div>
		) : (
			<Loader />
		);
	}

	private handleFileSelect = (files: FileObject[]): void => {
		const newFiles = this.state.files.slice(0);

		for (const file of files) {
			let add = true;
			for (const newFile of newFiles) {
				if (newFile.id === file.id) {
					add = false;
					break;
				}
			}
			if (add) {
				newFiles.push(file);
			}
		}

		this.setState({
			files: newFiles,
			dialogueOpen: false,
		});

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: newFiles.map(f => f.id),
			});
		}

		if (this.props.onChange) {
			this.props.onChange(newFiles.map(f => f.id));
		}
	};

	private onFileRemove = (file: FileObject): void => {
		let files = this.state.files.slice(0);

		files = files.filter(f => f.id !== file.id);

		this.setState({ files });

		if (this.props.onUpdate) {
			this.props.onUpdate({
				name: this.props.name,
				value: files.map(f => f.id),
			});
		}

		if (this.props.onChange) {
			this.props.onChange(files.map(f => f.id));
		}
	};

	private closeErrorDialogue = (): void => {
		this.setState({
			dialogueOpen: false,
		});
	};
}
