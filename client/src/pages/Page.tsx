import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { MemberObject } from '../types';

// DO NOT USE THIS COMPONENT
// Other pages extend this so that I can use `typeof Page` in route composition

export interface PageProps<R = {}> {
	member: {
		value: MemberObject | null;
		valid: boolean;
		error: string;
	},
	routeProps: RouteComponentProps<R>;
}

export default class Page<
	P extends PageProps = PageProps,
	S = {},
	SS = {}
> extends React.Component<P, S, SS> {}
