import * as React from 'react';

import { InputProps } from './Input';

interface FileInputElement {
	name: string;
	type: string;
	size: number;
	complete: boolean;

	// For completed files
	id?: string;

	// For uploading files
	progress?: number;

	// The actual file (if being uploaded)
	file?: File;
}

export default class FileInput extends React.Component<InputProps<string[]>, {
	files: FileInputElement[]
}> {
	state: {files: FileInputElement[]} = {
		files: []
	};

	constructor(props: InputProps<string[]>) {
		super(props);

		this.onChange = this.onChange.bind(this);
	}

	// tslint:disable-next-line:no-empty
	public onChange (event: React.FormEvent<HTMLInputElement>) {
		let files = event.currentTarget.files;

		if (files === null) {
			return;
		}

		let filesArray: FileInputElement[] = [];

		for (let i in files) {
			if (files.hasOwnProperty(i)) {
				filesArray.push({
					name: files[i].name,
					size: files[i].size,
					type: files[i].type,
					complete: false,
					progress: 0,
					file: files[i]
				});
			}
		}

		this.setState(previousState => {
			return {
				files: [
					...previousState.files,
					...filesArray
				]
			};
		});
	}

	render () {
		return (
			<div
				className="formbox"
				style={this.props.boxStyles}
			>
				<div
					className="fileinput-container"
				>
					<label
						className="file"
						htmlFor={this.props.name + 'FileDialog'}
					>
						{this.props.children}
					</label>
					<input
						id={this.props.name + 'FileDialog'}
						name={this.props.name}
						type="file"
						multiple={true}
						onChange={this.onChange}
					/>
					<div
						className="filesList"
					>
						<ul>
							{
								this.state.files.map((file, i) => {
									return (
										<li key={i}>{file.name}</li>
									);
								})
							}
						</ul>
					</div>
				</div>
			</div>
		);
	}
}