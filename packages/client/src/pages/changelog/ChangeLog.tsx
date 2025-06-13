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

import { Either, always, ChangeLogItem } from 'common-lib';
import * as React from 'react';
import Loader from '../../components/Loader';
import Page, { PageProps } from '../Page';
import fetchApi from '../../lib/apis';
import MarkdownRenderer from 'react-markdown-renderer';

interface ChangeLogLoadingState {
	state: 'LOADING';
}

interface ChangeLogLoadedState {
	state: 'LOADED';
	changelog: ChangeLogItem[];
}

interface ChangeLogErrorState {
	state: 'ERROR';
}

type ChangeLogState = ChangeLogLoadedState | ChangeLogLoadingState | ChangeLogErrorState;

export default class TeamList extends Page<PageProps, ChangeLogState> {
	public state: ChangeLogState = {
		state: 'LOADING',
	};

	public async componentDidMount(): Promise<void> {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
		]);
		this.props.deleteReduxState();
		
		this.props.updateSideNav([]);
		this.updateTitle('Change log');

		const changeLogEither = await fetchApi.changelog.get({}, {});

		if (Either.isLeft(changeLogEither)) {
			this.setState(
				always({
					state: 'ERROR',
				}),
			);
		} else {
			const changelog = changeLogEither.value.sort((a, b) => b.noteDateTime - a.noteDateTime);

			this.setState({
				state: 'LOADED',
				changelog,
			});
		}
	}

	public render(): JSX.Element {
		if (this.state.state === 'LOADING') {
			return <Loader />;
		}

		if (this.state.state === 'ERROR') {
			return <div>There was an error getting the changelog list</div>;
		}

		return (
			<div>
				{this.state.changelog.map((logitem, i) => [
					i !== 0 ? <hr /> : null,
					<div key={i}>
						<h2>
							{logitem.noteTitle} on {new Date(logitem.noteDateTime).toDateString()}
						</h2>
						<p>
							{logitem.noteText ? (
								<MarkdownRenderer markdown={logitem.noteText} />
							) : (
								<i>Log item has no description</i>
							)}
						</p>
					</div>,
				])}
			</div>
		);
	}
}
