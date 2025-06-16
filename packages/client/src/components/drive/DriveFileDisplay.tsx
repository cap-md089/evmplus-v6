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

import { FileObject, ClientUser } from 'common-lib';
import * as React from 'react';

export interface FileDisplayProps {
	file: FileObject;
	parent: FileObject;
	onSelect: (file: FileObject) => void;
	selected: boolean;
	member: ClientUser | null;
}

export const DriveFileDisplay = (props: FileDisplayProps): JSX.Element => (
	<div
		className={`drive-file-display ${props.selected ? 'selected' : ''}`}
		onClick={() => props.onSelect(props.file)}
		draggable={true}
		onDragStart={e => {
			e.dataTransfer.setData('text', props.file.id);
		}}
	>
		<div className="display-image">
			{!!/image\//.exec(props.file.contentType) ? (
				<div
					style={{
						backgroundImage: `url('/api/files/${props.file.id}/export')`,
					}}
				/>
			) : null}
		</div>
		<div className="info-display">
			{props.file.fileName} (<a href={`/api/files/${props.file.id}/download`}>Download</a>)
		</div>
	</div>
);

export default DriveFileDisplay;
