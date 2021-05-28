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

import { AbsenteeInformation, isCAPMember, Maybe, MemberCreateError, ClientUser } from 'common-lib';
import * as React from 'react';
import { DateTimeInput, Form, Label, TextInput } from '../../../components/forms/SimpleForm';
import fetchApi from '../../../lib/apis';
import Page, { PageProps } from '../../Page';
import './Absentee.css';

interface AbsenteeState {
	absentee: AbsenteeInformation;
}

interface AbsenteeProps extends PageProps {
	member: ClientUser;
}

export const canUseAbsentee = (props: PageProps): boolean =>
	Maybe.orSome(false)(Maybe.map(isCAPMember)(Maybe.fromValue(props.member)));

export class AbsenteeWidget extends Page<AbsenteeProps, AbsenteeState> {
	public state: AbsenteeState = {
		absentee: {
			absentUntil: Date.now(),
			comments: '',
		},
	};

	public constructor(props: AbsenteeProps) {
		super(props);

		if (
			this.props.member.absenteeInformation &&
			this.props.member.absenteeInformation.absentUntil > Date.now()
		) {
			this.state = {
				absentee: {
					...this.props.member.absenteeInformation,
				},
			};
		}

		this.onFormChange = this.onFormChange.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	}

	public render = (): JSX.Element => (
		<div className="widget">
			<div className="widget-title">Absent?</div>
			<div className="widget-body">
				<Form<AbsenteeInformation>
					className="absentee-form"
					submitInfo={{
						text: 'Submit',
						className: 'primaryButton submit',
					}}
					values={this.state.absentee}
					onChange={this.onFormChange}
					onSubmit={this.onSubmit}
				>
					<Label>When will you be absent until?</Label>
					<DateTimeInput
						name="absentUntil"
						time={true}
						originalTimeZoneOffset={'America/New_York'}
					/>

					<Label>Is there a reason?</Label>
					<TextInput name="comments" />
				</Form>
			</div>
		</div>
	);

	public onFormChange = (absentee: AbsenteeInformation): void => {
		this.setState({
			absentee,
		});
	};

	public onSubmit = async (): Promise<void> => {
		if (this.props.fullMemberDetails.error !== MemberCreateError.NONE) {
			return;
		}

		await fetchApi.member.setAbsentee({}, this.state.absentee);

		this.props.authorizeUser({
			error: MemberCreateError.NONE,
			member: {
				...this.props.member,
				absenteeInformation: this.state.absentee,
			},
			notificationCount: this.props.fullMemberDetails.notificationCount,
			taskCount: this.props.fullMemberDetails.taskCount,
			linkableAccounts: this.props.fullMemberDetails.linkableAccounts,
		});
	};
}
