import { FileObject, User } from 'common-lib';
import * as React from 'react';

export interface FileDisplayProps {
	file: FileObject;
	parent: FileObject;
	onSelect: (file: FileObject) => void;
	selected: boolean;
	member: User | null;
}

export default (props: FileDisplayProps) => (
	<div
		className={`drive-file-display ${props.selected ? 'selected' : ''}`}
		onClick={() => props.onSelect(props.file)}
		draggable={true}
		onDragStart={e => {
			e.dataTransfer.setData('text', props.file.id);
		}}
	>
		<div className="display-image">
			{!!props.file.contentType.match(/image\//) ? (
				<div
					style={{
						backgroundImage: `url('/api/files/${props.file.id}/export')`
					}}
				/>
			) : null}
		</div>
		<div className="info-display">
			{props.file.fileName} (<a href={`/api/files/${props.file.id}/download`}>Download</a>)
		</div>
	</div>
);
