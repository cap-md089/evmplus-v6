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

import { Either, FileObject, get, stringifyMemberReference } from 'common-lib';
import * as React from 'react';
import { Link } from 'react-router-dom';
import LoaderShort from '../../../components/LoaderShort';
import fetchApi from '../../../lib/apis';
import Page, { PageProps } from '../../Page';

interface DriveWidgetLoadingState {
	state: 'LOADING';
}

interface DriveWidgetLoadedState {
	state: 'LOADED';

	list: FileObject[];
}

interface DriveWidgetErrorState {
	state: 'ERROR';

	message: string;
}

type DriveWidgetState = DriveWidgetErrorState | DriveWidgetLoadedState | DriveWidgetLoadingState;

export class DriveWidget extends Page<PageProps, DriveWidgetState> {
	public state: DriveWidgetState = {
		state: 'LOADING',
	};

	public async componentDidMount(): Promise<void> {
		if (!this.props.member) {
			return;
		}

		const root = await fetchApi.files.children.getBasic(
			{ parentid: stringifyMemberReference(this.props.member) },
			{},
		);

		if (Either.isLeft(root)) {
			this.setState({
				state: 'ERROR',
				message: root.value.message,
			});
		} else {
			this.setState({
				state: 'LOADED',
				list: root.value.filter(Either.isRight).map(get('value')),
			});
		}
	}

	public render(): JSX.Element | null {
		if (!this.props.member) {
			return null;
		}

		return (
			<div className="widget">
				<div className="widget-title">Drive information</div>
				<div className="widget-body">
					{this.state.state === 'LOADING' ? (
						<LoaderShort />
					) : this.state.state === 'ERROR' ? (
						<div>{this.state.message}</div>
					) : (
						<div>
							There {this.state.list.length === 1 ? 'is' : 'are'}{' '}
							{this.state.list.length} file
							{this.state.list.length !== 1 ? 's' : ''} in your drive
							<br />
							<br />
							<Link to={`/drive/${stringifyMemberReference(this.props.member)}`}>
								Go there now
							</Link>
						</div>
					)}
				</div>
			</div>
		);
	}
}
