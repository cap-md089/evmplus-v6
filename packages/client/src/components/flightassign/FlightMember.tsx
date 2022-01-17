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

import { getFullMemberName, Member, toReference } from 'common-lib';
import * as React from 'react';
import './FlightMember.css';

interface FlightMemberProps {
	onDragStart: () => void;
	onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
	member: Member;
}

export default class FlightMember extends React.Component<FlightMemberProps> {
	public constructor(props: FlightMemberProps) {
		super(props);

		this.onDragStart = this.onDragStart.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.handleOver = this.handleOver.bind(this);
	}

	public shouldComponentUpdate = (newProps: FlightMemberProps): boolean =>
		newProps.member.id !== this.props.member.id;

	public render = (): JSX.Element => (
		<>
			<div
				draggable={true}
				className="flightmember-box"
				onDragStart={this.onDragStart}
				onDrop={this.onDrop}
				onDragOver={this.handleOver}
				onDragEnd={this.handleOver}
				onDragExit={this.handleOver}
				onDragLeave={this.handleOver}
				onDragEnter={this.handleOver}
			>
				{this.getDutyColor(this.props.member)}&nbsp;{getFullMemberName(this.props.member)}
			</div>
		</>
	);

	private onDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
		this.props.onDragStart();

		e.dataTransfer.setData('text', JSON.stringify(toReference(this.props.member)));
	};

	private onDrop = (e: React.DragEvent<HTMLDivElement>): void => {
		e.preventDefault();
		e.stopPropagation();

		this.props.onDrop(e);
	};

	private handleOver = (e: React.DragEvent<HTMLDivElement>): void => {
		e.stopPropagation();
		e.preventDefault();
	};

	private getDutyColor = (myMember: Member): string => {
		let supportFlag = '';
		let lineFlag = '';
		let councilFlag = '';
		myMember.dutyPositions.forEach(element => {
			if (
				element.duty === 'Cadet Commander' ||
				element.duty === 'Cadet Deputy Commander for Operations' ||
				element.duty === 'Cadet Element Leader' ||
				element.duty === 'Cadet First Sergeant' ||
				element.duty === 'Cadet Flight Commander' ||
				element.duty === 'Cadet Flight Sergeant'
			) {
				lineFlag = 'o';
			} else if (element.duty === 'Cadet Activities NCO') {
				supportFlag = 's';
			} else if (element.duty === 'Cadet WCAC Representative') {
				councilFlag = 'c';
			}
		});
		return supportFlag + lineFlag + councilFlag !== ''
			? supportFlag + lineFlag + councilFlag
			: '';
	};
}
