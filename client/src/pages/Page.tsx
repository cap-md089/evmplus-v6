import * as React from 'react';
import { RouteComponentProps } from 'react-router';

// DO NOT USE THIS COMPONENT
// Other pages extend this so that I can use `typeof Page` in route composition

export interface PageProps<R = {}> {
	member: SigninReturn,
	routeProps: RouteComponentProps<R>;
	authorizeUser: (arg: SigninReturn) => void;
}

export default abstract class Page<
	P extends PageProps = PageProps,
	S = {},
	SS = {}
> extends React.Component<P, S, SS> {
	public abstract render (): JSX.Element | null;
}
