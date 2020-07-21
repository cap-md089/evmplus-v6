/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Either, FileObject, get } from 'common-lib';
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
		state: 'LOADING'
	};

	public async componentDidMount() {
		const root = await fetchApi.files.children.getBasic(
			{ parentid: 'root' },
			{},
			this.props.member?.sessionID
		);

		if (Either.isLeft(root)) {
			this.setState({
				state: 'ERROR',
				message: root.value.message
			});
		} else {
			this.setState({
				state: 'LOADED',
				list: root.value.filter(Either.isRight).map(get('value'))
			});
		}
	}

	public render() {
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
							{this.state.list.length !== 1 ? 's' : ''} in the root drive
							<br />
							<br />
							<Link to="/drive">Go there now</Link>
						</div>
					)}
				</div>
			</div>
		);
	}
}
