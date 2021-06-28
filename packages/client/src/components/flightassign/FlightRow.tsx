/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

import { Member, MemberReference } from 'common-lib';
import jQuery from 'jquery';
import * as React from 'react';
import FlightMember from './FlightMember';
import './FlightRow.css';

interface FlightRowProps {
	open: boolean;
	onDragStart: (flight: string) => void;
	onDrop: (member: MemberReference) => void;
	members: Member[];
	name: string;
	first: boolean;
	highlighted: boolean;
	index: number;
}

interface FlightRowState {
	open: boolean;
	divHeight: number;
	hidenames: boolean;
}

const topBorder: React.CSSProperties = {
	borderTopWidth: 1,
};

export default class FlightRow extends React.Component<FlightRowProps, FlightRowState> {
	public state: FlightRowState = {
		open: true,
		divHeight: 0,
		hidenames: false,
	};

	private namesDiv = React.createRef<HTMLDivElement>();
	private titleDiv = React.createRef<HTMLDivElement>();

	public constructor(props: FlightRowProps) {
		super(props);

		this.onDragStart = this.onDragStart.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.handleOver = this.handleOver.bind(this);
	}

	public shouldComponentUpdate(newProps: FlightRowProps, newState: FlightRowState): boolean {
		if (this.props.open !== newProps.open) {
			return true;
		}

		if (this.props.members.length !== newProps.members.length) {
			return true;
		}

		if (this.props.highlighted !== newProps.highlighted) {
			return true;
		}

		if (newState.divHeight !== this.state.divHeight) {
			return true;
		}

		if (newState.open !== this.state.open) {
			return true;
		}

		return false;
	}

	public componentDidUpdate(): void {
		if (this.state.open && !this.props.open && this.namesDiv.current && this.titleDiv.current) {
			const namesDiv = this.namesDiv.current;
			const titleDiv = this.titleDiv.current;
			setTimeout(() => {
				jQuery(namesDiv).slideUp(() => {
					this.setState({
						open: false,
					});
				});
				jQuery(titleDiv).animate({
					'height': 40,
					'font-size': 32,
				});
				this.setState({
					hidenames: true,
				});
			}, 100);
		} else if (
			!this.state.open &&
			this.props.open &&
			this.namesDiv.current &&
			this.titleDiv.current
		) {
			jQuery(this.namesDiv.current).slideDown(() => {
				this.setState({
					open: true,
				});
			});
			jQuery(this.titleDiv.current).animate({
				'height': 16,
				'font-size': 14,
			});
			this.setState({
				hidenames: false,
			});
		}
		if (this.namesDiv.current && this.state.divHeight !== this.namesDiv.current.scrollHeight) {
			this.setState({
				divHeight: this.namesDiv.current.scrollHeight,
			});
		}
	}

	public componentDidMount(): void {
		if (this.namesDiv.current) {
			this.setState({
				divHeight: this.namesDiv.current.scrollHeight,
			});
		}
	}

	public render = (): JSX.Element => (
		<div
			className="flightrow"
			style={this.props.first ? topBorder : undefined}
			onDrop={this.onDrop}
			onDragOver={this.handleOver}
			onDragEnd={this.handleOver}
			onDragExit={this.handleOver}
			onDragLeave={this.handleOver}
			onDragEnter={this.handleOver}
			id={`${this.props.name.toLowerCase()}-${this.props.index ?? 0}`}
		>
			<div
				className="flightrow-name"
				onDrop={this.onDrop}
				onDragOver={this.handleOver}
				onDragEnd={this.handleOver}
				onDragExit={this.handleOver}
				onDragLeave={this.handleOver}
				onDragEnter={this.handleOver}
				ref={this.titleDiv}
			>
				{this.props.name} ({this.props.members.length} member
				{this.props.members.length === 1 ? '' : 's'})
			</div>
			<div
				className={this.state.hidenames ? '' : 'flightrow-names-open'}
				onDrop={this.onDrop}
				onDragOver={this.handleOver}
				onDragEnd={this.handleOver}
				onDragExit={this.handleOver}
				onDragLeave={this.handleOver}
				onDragEnter={this.handleOver}
				ref={this.namesDiv}
			>
				{this.props.members.map((mem, index) => (
					<FlightMember
						member={mem}
						key={index}
						onDrop={this.onDrop}
						onDragStart={this.onDragStart}
					/>
				))}
			</div>
		</div>
	);

	private onDragStart = (): void => {
		this.props.onDragStart(this.props.name);
	};

	private onDrop = (e: React.DragEvent<HTMLDivElement>): void => {
		e.preventDefault();
		e.stopPropagation();

		const ref = JSON.parse(e.dataTransfer.getData('text')) as MemberReference;

		this.props.onDrop(ref);
	};

	private handleOver = (e: React.DragEvent<HTMLDivElement>): void => {
		e.preventDefault();
		e.stopPropagation();
	};
}
