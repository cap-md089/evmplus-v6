import { ItemProps } from '../dialogues/FileDialogue';
import * as React from 'react';

export class FolderDisplayer extends React.Component<ItemProps> {
	public render() {
		return (
			<div
				className="folderDisplayer"
				onClick={e => {
					e.stopPropagation();
					this.props.onClick(
						this.props.file,
						this.props.selected
					);
				}}
			>
				<div
					className={'box' + (this.props.selected ? ' selected' : '')}
				>
					{this.props.file.fileName}
				</div>
			</div>
		);
	}
}
