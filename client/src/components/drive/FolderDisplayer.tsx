import { ItemProps } from '../dialogues/FileDialogue';
import * as React from 'react';
export class FolderDisplayer extends React.Component<ItemProps> {
	constructor(props: ItemProps) {
		super(props);
	}
	public render() {
		return (
			<div
				className="folderDisplayer"
				onClick={e => {
					e.stopPropagation();
					const {
						fileName,
						accountID,
						comments,
						contentType,
						created,
						forDisplay,
						forSlideshow,
						id,
						kind,
						owner,
						_id,
						fileChildren,
						parentID,
						folderPath,
						permissions
					} = this.props;
					this.props.onClick(
						{
							fileName,
							accountID,
							comments,
							contentType,
							created,
							forDisplay,
							forSlideshow,
							id,
							kind,
							owner,
							_id,
							fileChildren,
							parentID,
							folderPath,
							permissions
						},
						this.props.selected
					);
				}}
			>
				<div
					className={'box' + (this.props.selected ? ' selected' : '')}
				>
					{this.props.fileName}
				</div>
			</div>
		);
	}
}
