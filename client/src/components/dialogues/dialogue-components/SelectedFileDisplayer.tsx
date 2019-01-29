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
						permissions,
						owner,
						_id,
						fileChildren,
						parentID,
						folderPath
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
							permissions,
							owner,
							_id,
							fileChildren,
							parentID,
							folderPath
						},
						this.props.selected
					);
				}}
			>
				<div
					className={'box selected' + (this.props.red ? ' red' : '')}
					title={
						this.props.red
							? 'Invalid file selected'
							: this.props.fileName
					}
				>
					{this.props.fileName}
				</div>
			</div>
		);
	}
}
