import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { BreadCrumb } from '../components/BreadCrumbs';
import { SideNavigationItem } from '../components/page-elements/SideNavigation';
import Account from '../lib/Account';
import MemberBase from '../lib/MemberBase';
import Registry from '../lib/Registry';
import { SigninReturn } from 'common-lib';

// DO NOT USE THIS COMPONENT
// Other pages extend this so that I can use `typeof Page` in route composition

export interface PageProps<R = {}> {
	member: MemberBase | null;
	account: Account;
	routeProps: RouteComponentProps<R>;
	registry: Registry;
	fullMemberDetails: SigninReturn;
	authorizeUser: (arg: SigninReturn) => void;
	updateSideNav: (links: SideNavigationItem[], force?: boolean) => void;
	updateBreadCrumbs: (links: BreadCrumb[]) => void;
	updateApp: () => void;

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
	public abstract state: S;

	protected isShallowOk = false;

	private updatingState = false;
	private okURL = '';

	public shouldComponentUpdate(nextProps: P, nextState: S) {
		const urlChanged =
			nextProps.routeProps.location.pathname !== this.okURL &&
			nextProps.routeProps.location.pathname !== this.props.routeProps.location.pathname;

		const nextSID = nextProps.member ? nextProps.member.sessionID : '';
		const currentSID = this.props.member ? this.props.member.sessionID : '';

		const areStatesEqual = this.isShallowOk
			? shallowCompare(nextState, this.state)
			: deepCompare(nextState, this.state);

		const shouldUpdate =
			this.updatingState ||
			(this.props.account === null && nextProps.account !== null) ||
			(this.props.registry === null && nextProps.registry !== null) ||
			nextSID !== currentSID ||
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
		callback?: () => void
	) {
		this.updatingState = true;
		super.setState(state, callback);
	}

	public abstract render(): JSX.Element | null;

	protected updateTitle(...text: string[]) {
		document.title = `${[this.props.registry.Website.Name, ...text].join(
			` ${this.props.registry.Website.Separator} `
		)}`;
	}

	protected updateURL(text: string) {
		this.okURL = text;
		this.props.prepareURL(text);
		this.props.routeProps.history.replace(text);
	}

	protected async refreshSession() {
		// tslint:disable-next-line:no-console
		console.log('Refreshing session ID');

		const { member } = this.props;
		if (member) {
			await member
				.fetch(`/api/check`, {}, member)
				.then(res => res.json())
				.then((sr: SigninReturn) => {
					this.props.authorizeUser(sr);
				});
		}
	}
}

export const shallowCompare = <T extends {}>(a: T, b: T) => {
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

export const deepCompare = <T extends {}>(a: T, b: T) => {
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
