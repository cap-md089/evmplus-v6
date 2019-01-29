import * as React from 'react';
import Page, { PageProps } from './Page';

export default class NotFound extends Page<PageProps> {
	public state: {} = {};

	public componentDidMount() {
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			}
		]);
		this.props.updateSideNav([]);
		this.updateTitle('Not found');
	}

	public render () {
		return <div>
			<h2>This is not the page you are looking for</h2>
			We're sorry, the page "{this.props.routeProps.location.pathname.split('/')[1]}" cannot be found<br />
			<a onClick={() => this.props.routeProps.history.goBack()}>Go back a page</a>
		</div>
	}
}