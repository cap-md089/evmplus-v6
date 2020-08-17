/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import { Link } from 'react-router-dom';

export interface BreadCrumb {
	text: string;
	target: string;
}

const dividerStyle: React.CSSProperties = {
	margin: '2px 10px',
	padding: '0 1px 0 1px',
	color: '#999',
};

export class BreadCrumbsPresentation extends React.Component<
	{
		links: BreadCrumb[];
	},
	{}
> {
	public render() {
		return (
			<div className="breadcrumbs">
				<ul>
					{this.props.links.map((link, i) => {
						if (i === 0) {
							return (
								<li key={i}>
									<Link to={link.target}>{link.text}</Link>
								</li>
							);
						} else {
							return [
								<li key={'d' + i} style={dividerStyle}>
									/
								</li>,
								<li key={i}>
									<Link to={link.target}>{link.text}</Link>
								</li>,
							];
						}
					})}
				</ul>
			</div>
		);
	}
}

export default BreadCrumbsPresentation;
