import { ShortCAPUnitDutyPosition, ShortNHQDutyPosition } from 'common-lib';
import * as React from 'react';
import { PageProps } from '../../Page';

export function ShowMemberInfo(props: PageProps) {
	if (props.member === null) {
		return <div>Please sign in to view your personal information</div>;
	}

	const dutyPositions = props.member.dutyPositions;
	const nhqDutyPositions: ShortNHQDutyPosition[] = [];
	const capunitDutyPositions: ShortCAPUnitDutyPosition[] = [];

	for (const dutyPosition of dutyPositions) {
		if (dutyPosition.type === 'CAPUnit') {
			capunitDutyPositions.push(dutyPosition);
		} else {
			nhqDutyPositions.push(dutyPosition);
		}
	}

	return (
		<div>
			<section>
				<h2>CAP NHQ Duty Positions</h2>
				<ul>
					{nhqDutyPositions.map(item => (
						<li key={item.duty}>{item.duty}</li>
					))}
				</ul>

				<h2>CAPUnit Temporary Duty Positions</h2>
				<ul>
					{capunitDutyPositions.map(item => (
						<li key={item.duty}>{item.duty}</li>
					))}
				</ul>
			</section>
		</div>
	);
}
