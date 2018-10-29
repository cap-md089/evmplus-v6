import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { BreadCrumb } from '../components/BreadCrumbs';
import { SideNavigationItem } from '../components/SideNavigation';
import Account from 'src/lib/Account';
import MemberBase from 'src/lib/Members';

// DO NOT USE THIS COMPONENT
// Other pages extend this so that I can use `typeof Page` in route composition

export interface PageProps<R = {}> {
	member: MemberBase | null;
	fullMemberDetails: SigninReturn;
	account: Account;
	routeProps: RouteComponentProps<R>;
	authorizeUser: (arg: SigninReturn) => void;
	updateSideNav: (links: SideNavigationItem[]) => void;
	updateBreadCrumbs: (links: BreadCrumb[]) => void;
}

export default abstract class Page<
	P extends PageProps = PageProps,
	S = {},
	SS = {}
> extends React.Component<P, S, SS> {
	public abstract render(): JSX.Element | null;
}
