/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { FileUserAccessControlPermissions, userHasFilePermission } from 'common-lib';
import * as React from 'react';
import { FileDisplayProps } from './DriveFileDisplay';
import fetchApi from '../../lib/apis';

export default class DriveFolderDisplay extends React.Component<
	FileDisplayProps & { fileDeleteID: (id: string) => void },
	{ hovering: boolean }
> {
	public state = {
		hovering: false,
	};

	constructor(props: FileDisplayProps & { fileDeleteID: (id: string) => void }) {
		super(props);

		this.handleDrop = this.handleDrop.bind(this);
		this.handleOff = this.handleOff.bind(this);
		this.handleOver = this.handleOver.bind(this);
		this.handleDragStart = this.handleDragStart.bind(this);
	}

	public render() {
		return (
			<div
				className={`drive-folder-display ${this.props.selected ? 'selected' : ''} ${
					this.state.hovering ? 'hovering' : ''
				}`}
				onClick={() => this.props.onSelect(this.props.file)}
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
	}

	private handleOver(e: React.DragEvent<HTMLDivElement>) {
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
	}

	private handleOff() {
		this.setState({
			hovering: false,
		});
	}

	private async handleDrop(e: React.DragEvent<HTMLDivElement>) {
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

		if (!id.match(/^[0-9a-f]{32}$/)) {
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
	}

	private handleDragStart(e: React.DragEvent<HTMLDivElement>) {
		e.dataTransfer.setData('text', this.props.file.id);
	}
}
