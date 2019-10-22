import { ItemProps } from '../FileDialogue';
import * as React from 'react';

export class SelectedFileDisplayer extends React.Component<
	ItemProps & {
		red: boolean;
	}
> {
	public render() {
		return (
			<div
				className="selectedFile"
				onClick={e => {
					e.stopPropagation();
					this.props.onClick(this.props.file, this.props.selected);
				}}
			>
				<div
					className={'box selected' + (this.props.red ? ' red' : '')}
					title={this.props.red ? 'Invalid file selected' : this.props.file.fileName}
				>
					{this.props.file.fileName}
				</div>
			</div>
		);
	}
}
