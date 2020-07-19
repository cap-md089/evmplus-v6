import { ItemProps } from '../FileDialogue';
import * as React from 'react';

export class SimpleFileDisplayer extends React.Component<ItemProps> {
	public render() {
		return (
			<div
				className="fileDisplayer"
				onClick={e => {
					e.stopPropagation();
					this.props.onClick(this.props.file, this.props.selected);
				}}
			>
				<div
					className={'box' + (this.props.selected ? ' selected' : '')}
					title={this.props.file.fileName}
				>
					{this.props.file.fileName}
				</div>
			</div>
		);
	}
}
