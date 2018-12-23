import { ItemProps } from './FileDialogue';
import * as React from 'react';

export class SimpleFileDisplayer extends React.Component<ItemProps> {
	constructor(props: ItemProps) {
		super(props);
	}
	public render() {
		return (
			<div
				className="fileDisplayer"
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
					title={this.props.fileName}
				>
					{this.props.fileName}
				</div>
			</div>
		);
	}
}
