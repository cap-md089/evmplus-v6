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

import { FileObject, FileUserAccessControlPermissions, userHasFilePermission } from 'common-lib';
import * as React from 'react';
import { FileDisplayProps } from './DriveFileDisplay';
import fetchApi from '../../lib/apis';

interface FolderDisplayProps extends FileDisplayProps {
	fileDeleteID: (id: string) => void;
	onFolderNavigate: (folder: FileObject) => void;
}

export default class DriveFolderDisplay extends React.Component<
	FolderDisplayProps,
	{ hovering: boolean }
> {
	public state = {
		hovering: false,
	};

	public constructor(props: FolderDisplayProps) {
		super(props);
	}

	public render = (): JSX.Element => (
		<div
			className={`drive-folder-display ${this.props.selected ? 'selected' : ''} ${
				this.state.hovering ? 'hovering' : ''
			}`}
			onClick={() => this.props.onSelect(this.props.file)}
			onDoubleClick={() => this.props.onFolderNavigate(this.props.file)}
			onDragOver={this.handleOver}
			onDragEnd={this.handleOff}
			onDragLeave={this.handleOff}
			onDragEnter={this.handleOver}
			onDrop={this.handleDrop}
			draggable={true}
			onDragStart={this.handleDragStart}
		>
			{this.props.file.fileName}
		</div>
	);

	private handleOver = (e: React.DragEvent<HTMLDivElement>): void => {
		e.stopPropagation();
		e.preventDefault();

		if (
			!userHasFilePermission(FileUserAccessControlPermissions.MODIFY)(this.props.member)(
				this.props.file,
			)
		) {
			return;
		}

		this.setState({
			hovering: true,
		});
	};

	private handleOff = (): void => {
		this.setState({
			hovering: false,
		});
	};

	private handleDrop = async (e: React.DragEvent<HTMLDivElement>): Promise<void> => {
		e.preventDefault();
		e.stopPropagation();

		if (
			!userHasFilePermission(FileUserAccessControlPermissions.MODIFY)(this.props.member)(
				this.props.file,
			)
		) {
			return;
		}

		const id = e.dataTransfer.getData('text');

		if (id === this.props.file.parentID) {
			return;
		}

		if (id === this.props.file.id) {
			return;
		}

		if (!/^[0-9a-f]{32}$/.exec(id)) {
			return;
		}

		if (!this.props.member) {
			return;
		}

		await fetchApi.files.children.add({ parentid: this.props.file.id }, { childid: id });

		this.props.fileDeleteID(id);
		this.setState({
			hovering: false,
		});
	};

	private handleDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
		e.dataTransfer.setData('text', this.props.file.id);
	};
}
