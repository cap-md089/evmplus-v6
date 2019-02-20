import { FileObject } from 'common-lib';
import * as React from 'react';
import FileInterface from '../../lib/File';
import MemberBase from '../../lib/Members';
import urlFormat from '../../lib/urlFormat';

export interface FileDisplayProps {
	file: FileInterface;
	onSelect: (file: FileObject) => void;
	selected: boolean;
	member: MemberBase | null;
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
						backgroundImage:
							'url(' + urlFormat('api', 'files', props.file.id, 'export') + ')'
					}}
				/>
			) : null}
		</div>
		<div className="info-display">
			{props.file.fileName} (<a href={`/api/files/${props.file.id}/download`}>Download</a>)
		</div>
	</div>
);
