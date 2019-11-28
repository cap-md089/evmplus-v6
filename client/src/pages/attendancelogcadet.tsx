import './attendancelog.css';
import * as React from 'react';
import Page, { PageProps } from './Page';

export default class AttendanceLogCadet extends Page<PageProps> {
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

	public render() {
		return (
			<div>
				<div className="instructions">
					<h2>Press print</h2>
					This is
					<br />
				</div>
				<div className="signin-sheet" />
			</div>
		);
	}
}
