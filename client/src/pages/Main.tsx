import * as React from 'react';
import Page, { PageProps } from './Page';
import { Link } from 'react-router-dom';

export default class Main extends Page<PageProps> {
	public render() {
		return (
			<div>Hello! <Link to="/test">Test page</Link></div>
		);
	}
}