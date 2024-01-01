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
import { Selector } from '../forms/SimpleForm';
import Loader from '../Loader';
import { CombinedSelectorProps } from './Selector';
import { Identifiable } from 'common-lib';

interface DownloadSelectorProps<T extends Identifiable> {
	values: Promise<T[]>;
	errorMessage?: string;
}

interface DownloadSelectorState<T extends Identifiable> {
	loaded: boolean;
	values: T[];
	error: boolean;
}

export type CombinedDownloadSelectorProps<T extends Identifiable> = CombinedSelectorProps<
	T,
	any[]
> &
	DownloadSelectorProps<T>;

export default class DownloadSelector<T extends Identifiable> extends React.Component<
	CombinedDownloadSelectorProps<T>,
	DownloadSelectorState<T>
> {
	public state: DownloadSelectorState<T> = {
		loaded: false,
		values: [],
		error: false,
	};

	public async componentDidMount(): Promise<void> {
		try {
			const values = await this.props.values;

			this.setState({
				values,
				loaded: true,
			});
		} catch (e) {
			this.setState({
				error: true,
				loaded: true,
			});
		}
	}

	public render = (): JSX.Element | string =>
		!this.state.loaded ? (
			<Loader />
		) : this.state.error ? (
			this.props.errorMessage || 'Could not load values'
		) : (
			<Selector {...this.props} values={this.state.values} />
		);
}
