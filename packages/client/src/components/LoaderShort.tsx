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
import './LoaderShort.css';

export default class LoaderShort extends React.Component<{}, { display: boolean }> {
	public state = {
		display: false
	};

	private handle: NodeJS.Timer | null = null;

	public componentDidMount() {
		this.handle = setInterval(() => {
			this.setState({
				display: true
			});
			if (this.handle) {
				clearInterval(this.handle);
			}
		}, 200);
	}

	public componentWillUnmount() {
		if (this.handle) {
			clearInterval(this.handle);
		}
	}

	public render() {
		return (
			<div className="svg-loader">
				{this.state.display ? (
					<svg width="300" height="55">
						<circle
							className="svg-loader-circle-1"
							cx="50"
							cy="27"
							r="10"
							fill="#00b2ff"
						/>
						<circle
							className="svg-loader-circle-2"
							cx="100"
							cy="27"
							r="10"
							fill="#00b2ff"
						/>
						<circle
							className="svg-loader-circle-3"
							cx="150"
							cy="27"
							r="10"
							fill="#00b2ff"
						/>
						<circle
							className="svg-loader-circle-4"
							cx="200"
							cy="27"
							r="10"
							fill="#00b2ff"
						/>
						<circle
							className="svg-loader-circle-5"
							cx="250"
							cy="27"
							r="10"
							fill="#00b2ff"
						/>
					</svg>
				) : null}
			</div>
		);
	}
}
