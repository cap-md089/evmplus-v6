import * as React from 'react';
import Page, { PageProps } from './Page';

export default class Main extends Page<PageProps> {
	public render() {
		return (
			<div>Hello!</div>
		);
	}
}