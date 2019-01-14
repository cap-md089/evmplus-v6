import * as React from 'react';
import { Link } from 'react-router-dom';
import Page from './Page';

export default class Main extends Page {
	public componentDidMount() {
		this.props.updateSideNav([]);
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			}
		]);
		this.updateTitle();
	}

	public render() {
		return (
			<div>
				Hello! <Link to="/test">Test page</Link>
			</div>
		);
	}
}
