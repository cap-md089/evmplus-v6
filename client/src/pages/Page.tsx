import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { AuthorizeUserArgument } from '../App';

// DO NOT USE THIS COMPONENT
// Other pages extend this so that I can use `typeof Page` in route composition

export interface PageProps<R = {}> {
	member: AuthorizeUserArgument,
	routeProps: RouteComponentProps<R>;
	authorizeUser: (arg: AuthorizeUserArgument) => void;
}

export default class Page<
	P extends PageProps = PageProps,
	S = {},
	SS = {}
> extends React.Component<P, S> {
	public render (): JSX.Element | null {return null;}
}
