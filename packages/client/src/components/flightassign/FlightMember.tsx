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
			if (element.duty === 'Cadet Commander') {
				lineFlag = '[cc]';
			} else if (element.duty === 'Cadet Deputy Commander for Operations') {
				lineFlag = '[do]';
			} else if (element.duty === 'Cadet First Sergeant') {
				lineFlag = '[1st]';
			} else if (element.duty === 'Cadet Flight Commander') {
				lineFlag = '[fc]';
			} else if (element.duty === 'Cadet Flight Sergeant') {
				lineFlag = '[fs]';
			} else if (element.duty === 'Cadet Element Leader') {
				lineFlag = '[el]';
			} else if (element.duty === 'Cadet Deputy Commander for Support') {
				supportFlag = '[ds]';
			} else if (
				element.duty === 'Cadet Activities NCO' ||
				element.duty === 'Cadet Activities Officer' ||
				element.duty === 'Cadet Administrative NCO' ||
				element.duty === 'Cadet Administrative Officer' ||
				element.duty === 'Cadet Aerospace Education NCO' ||
				element.duty === 'Cadet Aerospace Education Officer' ||
				element.duty === 'Cadet Communications NCO' ||
				element.duty === 'Cadet Communications Officer' ||
				element.duty === 'Cadet Drug Demand Reduction NCO' ||
				element.duty === 'Cadet Emergency Services NCO' ||
				element.duty === 'Cadet Emergency Services Officer' ||
				element.duty === 'Cadet Historian NCO' ||
				element.duty === 'Cadet IT NCO' ||
				element.duty === 'Cadet IT Officer' ||
				element.duty === 'Cadet Leadership Education NCO' ||
				element.duty === 'Cadet Leadership Education Officer' ||
				element.duty === 'Cadet Logistics NCO' ||
				element.duty === 'Cadet Logistics Officer' ||
				element.duty === 'Cadet Operations NCO' ||
				element.duty === 'Cadet Public Affairs NCO' ||
				element.duty === 'Cadet Public Affairs Officer' ||
				element.duty === 'Cadet Recruiting NCO' ||
				element.duty === 'Cadet Recruiting Officer' ||
				element.duty === 'Cadet Safety NCO' ||
				element.duty === 'Cadet Safety Officer' ||
				element.duty === 'Cadet Supply NCO' ||
				element.duty === 'Cadet Supply Officer'
			) {
				supportFlag = '[s]';
			} else if (
				element.duty === 'Cadet RCAC Assistant' ||
				element.duty === 'Cadet RCAC Representative' ||
				element.duty === 'Cadet WCAC Assistant' ||
				element.duty === 'Cadet WCAC Chair' ||
				element.duty === 'Cadet WCAC Recorder' ||
				element.duty === 'Cadet WCAC Representative' ||
				element.duty === 'Cadet WCAC Vice Chair'
			) {
				councilFlag = '[c]';
			}
		});
		return supportFlag + lineFlag + councilFlag !== ''
			? supportFlag + lineFlag + councilFlag
			: '';
	};
}
