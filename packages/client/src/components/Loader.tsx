/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 * 
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 * 
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as React from 'react';
import './loader.css';

export default class Loader extends React.Component<
	{ forceDisplay?: boolean },
	{ display: boolean }
> {
	public state = {
		display: false,
	};

	private handle: NodeJS.Timer | null = null;

	public componentDidMount(): void {
		this.handle = setInterval(() => {
			this.setState({
				display: true,
			});
			if (this.handle) {
				clearInterval(this.handle);
			}
		}, 200);
	}

	public componentWillUnmount(): void {
		if (this.handle) {
			clearInterval(this.handle);
		}
	}

	public render = (): JSX.Element | null =>
		this.state.display || this.props.forceDisplay ? (
			<div>
				<div
					className="uil-default-css"
					style={{
						transform: 'scale(0.6)',
						margin: '20px auto',
					}}
				>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(0deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute',
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(30deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute',
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(60deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute',
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(90deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute',
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(120deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute',
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(150deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute',
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(180deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute',
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(210deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute',
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(240deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute',
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(270deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute',
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(300deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute',
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(330deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute',
						}}
					/>
				</div>
			</div>
		) : null;
}
