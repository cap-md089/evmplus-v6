import * as React from 'react';
import Page from './Page';

export default class Debug extends Page {
	public state: {} = {};

	public render() {
		return (
			<pre>
				{!this.props.member ? 'null' : JSON.stringify(this.props.member, undefined, 4)}
			</pre>
		);
	}
}
