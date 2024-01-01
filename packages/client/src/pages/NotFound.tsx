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

import * as React from 'react';
import Page, { PageProps } from './Page';

export default class NotFound extends Page<PageProps> {
	public state: {} = {};

	public componentDidMount(): void {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
		]);
		this.props.updateSideNav([]);
		this.updateTitle('Not found');

		this.props.deleteReduxState();
			
	}

	public render = (): JSX.Element => (
		<div>
			<h2>This is not the page you are looking for</h2>
			We're sorry, the page "{this.props.routeProps.location.pathname.split('/')[1]}" cannot
			be found
			<br />
			<button className="linkButton" onClick={() => this.props.routeProps.history.goBack()}>
				Go back a page
			</button>
		</div>
	);
}
