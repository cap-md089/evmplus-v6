import { AbsenteeInformation, isCAPMember, Maybe, MemberCreateError, User } from 'common-lib';
import * as React from 'react';
import { DateTimeInput, Form, Label, TextInput } from '../../../components/forms/SimpleForm';
import fetchApi from '../../../lib/apis';
import Page, { PageProps } from '../../Page';
import './Absentee.css';

interface AbsenteeState {
	absentee: AbsenteeInformation;
}

interface AbsenteeProps extends PageProps {
	member: User;
}

export const canUseAbsentee = (props: PageProps) => {
	return Maybe.orSome(false)(Maybe.map(isCAPMember)(Maybe.fromValue(props.member)));
};

export class AbsenteeWidget extends Page<AbsenteeProps, AbsenteeState> {
	public state: AbsenteeState = {
		absentee: {
			absentUntil: Date.now(),
			comments: ''
		}
	};

	public constructor(props: AbsenteeProps) {
		super(props);

		if (
			this.props.member.absenteeInformation &&
			this.props.member.absenteeInformation.absentUntil > Date.now()
		) {
			this.state = {
				absentee: {
					...this.props.member.absenteeInformation
				}
			};
		}

		this.onFormChange = this.onFormChange.bind(this);
		this.onSubmit = this.onSubmit.bind(this);
	}

	public render() {
		return (
			<div className="widget">
				<div className="widget-title">Absent?</div>
				<div className="widget-body">
					<Form<AbsenteeInformation>
						className="absentee-form"
						submitInfo={{
							text: 'Submit',
							className: 'primaryButton submit'
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
	}

	public onFormChange(absentee: AbsenteeInformation) {
		this.setState({
			absentee
		});
	}

	public async onSubmit() {
		if (this.props.fullMemberDetails.error !== MemberCreateError.NONE) {
			return;
		}

		await fetchApi.member.setAbsentee({}, this.state.absentee, this.props.member.sessionID);

		this.props.authorizeUser({
			error: MemberCreateError.NONE,
			member: {
				...this.props.member,
				absenteeInformation: this.state.absentee
			},
			notificationCount: this.props.fullMemberDetails.notificationCount,
			sessionID: this.props.member.sessionID,
			taskCount: this.props.fullMemberDetails.taskCount,
			linkableAccounts: this.props.fullMemberDetails.linkableAccounts
		});
	}
}
