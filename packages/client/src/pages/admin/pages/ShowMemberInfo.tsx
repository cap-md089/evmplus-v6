import {
	ShortCAPUnitDutyPosition,
	ShortNHQDutyPosition,
	getFullMemberName,
	CAPMemberContactInstance,
} from 'common-lib';
import * as React from 'react';
import { PageProps } from '../../Page';

interface RenderInstanceProps {
	prettyName: string;
	instance: CAPMemberContactInstance;
}

function RenderInstance(props: RenderInstanceProps) {
	if (!props.instance.PRIMARY && !props.instance.SECONDARY && !props.instance.EMERGENCY) {
		return null;
	}

	return (
		<div>
			<h3>{props.prettyName}</h3>
			{props.instance.PRIMARY ? (
				<div>
					<strong>Primary:&nbsp;</strong>
					{props.instance.PRIMARY}
				</div>
			) : null}
			{props.instance.SECONDARY ? (
				<div>
					<strong>Secondary:&nbsp;</strong>
					{props.instance.SECONDARY}
				</div>
			) : null}
			{props.instance.EMERGENCY ? (
				<div>
					<strong>Emergency:&nbsp;</strong>
					{props.instance.EMERGENCY}
				</div>
			) : null}
		</div>
	);
}

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
				<h1>Personal Info for {getFullMemberName(props.member)}</h1>
				{props.member.flight !== null ? (
					<div>
						<strong>Flight:&nbsp;</strong>
						{props.member.flight}
					</div>
				) : null}
				<div>
					<strong>Squadron:&nbsp;</strong>
					{props.member.squadron}
				</div>
			</section>

			<section>
				<h2>Contact Information We Have For You</h2>
				<RenderInstance
					prettyName="Alpha Pager"
					instance={props.member.contact.ALPHAPAGER}
				/>
				<RenderInstance prettyName="Assistant" instance={props.member.contact.ASSISTANT} />
				<RenderInstance
					prettyName="Cadet Parent Email"
					instance={props.member.contact.CADETPARENTEMAIL}
				/>
				<RenderInstance
					prettyName="Cadet Parent Phone"
					instance={props.member.contact.CADETPARENTPHONE}
				/>
				<RenderInstance prettyName="Cellphone" instance={props.member.contact.CELLPHONE} />
				<RenderInstance
					prettyName="Digital Pager"
					instance={props.member.contact.DIGITALPAGER}
				/>
				<RenderInstance prettyName="Email" instance={props.member.contact.EMAIL} />
				<RenderInstance prettyName="Home Fax" instance={props.member.contact.HOMEFAX} />
				<RenderInstance prettyName="Home Phone" instance={props.member.contact.HOMEPHONE} />
				<RenderInstance
					prettyName="Instant Messenger"
					instance={props.member.contact.INSTANTMESSENGER}
				/>
				<RenderInstance prettyName="ISDN" instance={props.member.contact.ISDN} />
				<RenderInstance prettyName="Radio" instance={props.member.contact.RADIO} />
				<RenderInstance prettyName="Telex" instance={props.member.contact.TELEX} />
				<RenderInstance prettyName="Work Fax" instance={props.member.contact.WORKFAX} />
				<RenderInstance prettyName="Work Phone" instance={props.member.contact.WORKPHONE} />
			</section>

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
