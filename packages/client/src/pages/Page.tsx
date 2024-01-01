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

import { AccountObject, RegistryValues, SigninReturn, ClientUser } from 'common-lib';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { BreadCrumb } from '../components/BreadCrumbs';
import { SideNavigationItem } from '../components/page-elements/SideNavigation';
import fetchApi from '../lib/apis';

// DO NOT USE THIS COMPONENT
// Other pages extend this so that I can use `typeof Page` in route composition

export interface PageProps<R = {}> {
	member: ClientUser | null;
	account: AccountObject;
	routeProps: RouteComponentProps<R>;
	registry: RegistryValues;
	fullMemberDetails: SigninReturn;
	authorizeUser: (arg: SigninReturn) => void;
	updateSideNav: (links: SideNavigationItem[], force?: boolean) => void;
	updateBreadCrumbs: (links: BreadCrumb[]) => void;
	updateApp: () => void;
	deleteReduxState: () => void;

	/**
	 * IGNORE, DO NOT USE
	 *
	 * It is used by Page.updateURL to prevent unnecessary calls to componentDidMount
	 */
	prepareURL: (url: string) => void;
}

export default abstract class Page<
	P extends PageProps = PageProps,
	S = {},
	SS = {}
> extends React.Component<P, S, SS> {
	protected isShallowOk = false;

	private updatingState = false;
	private okURL = '';

	public abstract state: S;

	public shouldComponentUpdate(nextProps: P, nextState: S): boolean {
		const urlChanged =
			nextProps.routeProps.location.pathname !== this.okURL &&
			nextProps.routeProps.location.pathname !== this.props.routeProps.location.pathname;

		const nextID = nextProps.member?.id;
		const currentID = this.props.member?.id;

		const areStatesEqual = this.isShallowOk
			? shallowCompare(nextState, this.state)
			: deepCompare(nextState, this.state);

		const shouldUpdate =
			this.updatingState ||
			(this.props.account === null && nextProps.account !== null) ||
			(this.props.registry === null && nextProps.registry !== null) ||
			nextID !== currentID ||
			urlChanged ||
			nextProps.routeProps.location.hash !== this.props.routeProps.location.hash ||
			!areStatesEqual;

		this.updatingState = false;

		return shouldUpdate;
	}

	public setState<K extends keyof S>(
		state:
			| ((prevState: Readonly<S>, props: Readonly<P>) => Pick<S, K> | S | null)
			| (Pick<S, K> | S | null),
		callback?: () => void,
	): void {
		this.updatingState = true;
		super.setState(state, callback);
	}

	protected updateTitle(...text: string[]): void {
		document.title = `${[this.props.registry.Website.Name, ...text].join(
			` ${this.props.registry.Website.Separator} `,
		)}`;
	}

	protected updateURL(text: string): void {
		this.okURL = text;
		this.props.prepareURL(text);
		this.props.routeProps.history.replace(text);
	}

	protected async refreshSession(): Promise<void> {
		const { member } = this.props;
		if (member) {
			const result = await fetchApi.check({}, {});

			if (result.direction === 'right') {
				this.props.authorizeUser(result.value);
			}
		}
	}

	public abstract render(): JSX.Element | null;
}

export const shallowCompare = <T extends {}>(a: T, b: T): boolean => {
	let same = true;

	if (a === null && b !== null) {
		return false;
	}
	if (b === null && a !== null) {
		return false;
	}
	if (a === null && b === null) {
		return true;
	}

	for (const i in a) {
		if (a.hasOwnProperty(i)) {
			if (a[i] !== b[i]) {
				same = false;
				break;
			}
		}
	}

	return same;
};

export const deepCompare = <T extends {}>(a: T, b: T): boolean => {
	let same = true;

	if (a === null && b !== null) {
		return false;
	}
	if (b === null && a !== null) {
		return false;
	}
	if (a === null && b === null) {
		return true;
	}

	for (const i in a) {
		if (a.hasOwnProperty(i)) {
			if (typeof a[i] === 'object' && typeof b[i] === 'object') {
				if (!deepCompare(a[i], b[i])) {
					same = false;
					break;
				}
			} else if (a[i] !== b[i]) {
				same = false;
				break;
			}
		}
	}

	return same;
};
