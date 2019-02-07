import * as React from 'react';
import Page, { PageProps } from 'src/pages/Page';
import Loader from 'src/components/Loader';
import { CAPMemberClasses, CAPNHQMember, CAPProspectiveMember } from 'src/lib/Members';

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
					{this.state.absentee === null ? <Loader /> : <div>40</div>}
				</div>
			</div>
		);
	}
}
