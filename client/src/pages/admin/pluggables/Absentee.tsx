import * as React from 'react';
import Form from 'src/components/forms/Form';
import { DateTimeInput, TextInput, Label } from 'src/components/forms/SimpleForm';
import { CAPMemberClasses, CAPNHQMember, CAPProspectiveMember } from 'src/lib/Members';
import Page, { PageProps } from 'src/pages/Page';
import './Absentee.css';

interface AbsenteeState {
	absentee: AbsenteeInformation;
}

interface AbsenteeProps extends PageProps {
	member: CAPMemberClasses;
}

export const canUseAbsentee = (props: PageProps) => {
	return props.member instanceof CAPNHQMember || props.member instanceof CAPProspectiveMember;
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
	}

	public render() {
		return (
			<div className="widget">
				<div className="widget-title">Absent?</div>
				<div className="widget-body">
					<Form
						className="absentee-form"
						submitInfo={{
							text: 'Submit',
							className: 'primaryButton submit'
						}}
					>
						<Label>When will you be absent until?</Label>
						<DateTimeInput
							name="absentUntil"
							date={true}
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
}
