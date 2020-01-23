import React, { Component } from 'react';
import Page, { PageProps } from '../../Page';
import './CAPF6080.css';
import { Link } from 'react-router-dom';
import MemberBase, { CAPMemberClasses } from '../../../lib/Members';
import Event from '../../../lib/Event';
import SigninLink from '../../../components/SigninLink';
import { fromValue } from 'common-lib';

interface CAPF6080Props {
	memberInformation: CAPMemberClasses[];
	currentMember: CAPMemberClasses;
	event: Event;
}

const zeroPad = (n: number, a = 2) => ('00' + n).substr(-a);

const formatDateTime = (date: number) => {
	const dateObject = new Date(date);

	const hour = dateObject.getHours();
	const minute = dateObject.getMinutes();

	const day = dateObject.getDate();
	const month = dateObject.getMonth();
	const year = dateObject.getFullYear();

	return `${zeroPad(hour)}:${zeroPad(minute)} on ${zeroPad(month + 1)}/${zeroPad(day)}/${year}`;
};

const formatDate = (date: number) => {
	const dateObject = new Date(date);

	const hour = dateObject.getHours();
	const minute = dateObject.getMinutes();

	const day = dateObject.getDate();
	const month = dateObject.getMonth();
	const year = dateObject.getFullYear();

	return `${zeroPad(month + 1)}/${zeroPad(day)}/${year}`;
};

export default class CAPF6080 extends Component<CAPF6080Props> {
	public render() {
		return (
			<div className="capf6080-form">
				Event: {this.props.event.name}
				<div className="capf6080-block">
					<div className="capf6080-page-title">
						CIVIL AIR PATROL CADET ACTIVITY PERMISSION SLIP
					</div>
					<div className="capf6080-block-title-small">
						SUGGESTED BEST PRACTICE for LOCAL "WEEKEND" ACTIVITIES
					</div>
					<div className="capf6080-block-title-small">
						Announce the activity at least 2 weeks in advance and require participating
						cadets to sign up via this form 1 week prior to the event
					</div>
				</div>
				<div className="capf6080-block print-grid-fifths">
					<div className="capf6080-block-title" style={{ gridColumn: '1 / span 5' }}>
						1. INFORMATION on the PARTICIPATING CADET
					</div>
					<div className="capf6080-column" style={{ gridColumn: '1 / span 2' }}>
						<span className="capf6080-block-text-bold">Cadet Grade &amp; Name: </span>
						<span className="capf6080-block-text">
							{this.props.currentMember.getFullName()}
						</span>
					</div>
					<div className="capf6080-column" style={{ gridColumn: '3 / span 1' }}>
						<span className="capf6080-block-text-bold">CAPID: </span>
						<span className="capf6080-block-text">{this.props.currentMember.id}</span>
					</div>
					<div className="capf6080-column" style={{ gridColumn: '4 / span 2' }}>
						<span className="capf6080-block-text-bold">Unit Charter Number: </span>
						<span className="capf6080-block-text">
							{this.props.currentMember.squadron}
						</span>
					</div>
					<div className="capf6080-column" style={{ gridColumn: '1 / span 3' }}>
						<span className="capf6080-block-text-bold">Activity Name: </span>
						<span className="capf6080-block-text">{this.props.event.name}</span>
					</div>
					<div className="capf6080-column" style={{ gridColumn: '4 / span 2' }}>
						<span className="capf6080-block-text-bold">Activity Date: </span>
						<span className="capf6080-block-text">
							{formatDate(this.props.event.startDateTime)}
						</span>
					</div>
				</div>
				<div className="capf6080-block capf6080-grid-fifths">
					<div className="capf6080-block-title" style={{ gridColumn: '1 / span 5' }}>
						2. INFORMATION about the ACTIVITY
					</div>
					<div className="capf6080-column capf6080-block-text" style={{ gridColumn: 1 }}>
						For hotel-based activity
					</div>
					<div className="capf6080-column" style={{ gridColumn: '2 / span 4' }}>
						<span className="capf6080-column capf6080-block-text-bold">
							Grade &amp; Name of Supervising Senior:{' '}
						</span>
						<span className="capf6080-column capf6080-block-text">
							{fromValue(this.props.event.pointsOfContact[0])
								.map(poc => poc.name)
								.orElse('')
								.some()}
						</span>
					</div>
					<div className="capf6080-column capf6080-block-text" style={{ gridColumn: 1 }}>
						or conference
					</div>
					<div className="capf6080-column" style={{ gridColumn: '2 / span 4' }}>
						<span className="capf6080-column capf6080-block-text-bold">
							Grade &amp; Name of Supervising Senior:{' '}
						</span>
						<span className="capf6080-column capf6080-block-text">
							{fromValue(this.props.event.pointsOfContact[1])
								.map(poc => poc.name)
								.orElse('')
								.some()}
						</span>
					</div>
				</div>
				<div className="capf6080-block capf6080-grid-thirds">
					<div className="capf6080-block-title" style={{ gridColumn: '1 / span 3' }}>
						3. PARENT's or GUARDIAN's CONTACT INFORMATION
					</div>
					<div
						className="capf6080-column capf6080-block-text-bold"
						style={{ gridColumn: 1 }}
					>
						Parent or Guardian
					</div>
					<div
						className="capf6080-column capf6080-block-text-bold"
						style={{ gridColumn: 2 }}
					>
						Relationship
					</div>
					<div
						className="capf6080-column capf6080-block-text-bold"
						style={{ gridColumn: 3 }}
					>
						Contact Number on
					</div>
					<div
						className="capf6080-column capf6080-block-text-bold"
						style={{ gridColumn: 1 }}
					>
						Name:
					</div>
					<div
						className="capf6080-column capf6080-block-text-bold"
						style={{ gridColumn: 2 }}
					>
						to Cadet:
					</div>
					<div
						className="capf6080-column capf6080-block-text-bold"
						style={{ gridColumn: 3 }}
					>
						Date(s) of Activity:
					</div>
				</div>
				<div className="capf6080-block capf6080-grid-half">
					<div className="capf6080-block-title" style={{ gridColumn: '1 / span 2' }}>
						4. OTHER DOCUMENTS REQUIRED to PARTICIPATE
					</div>
					<div className="capf6080-column capf6080-block-text" style={{ gridColumn: 1 }}>
						<span className="capf6080-block-text-bold">&#9744; CAPF 31 </span>
						<span className="capf6080-block-text">
							Application for Special Activity
						</span>
					</div>
					<div className="capf6080-column capf6080-block-text" style={{ gridColumn: 2 }}>
						<span className="capf6080-block-text-bold">&#9745; CAPF 160 </span>
						<span className="capf6080-block-text">CAP Member Health History Form</span>
					</div>
					<div className="capf6080-column capf6080-block-text" style={{ gridColumn: 1 }}>
						<span className="capf6080-block-text-bold">&#9744; CAPF 161 </span>
						<span className="capf6080-block-text">Emergency Information</span>
					</div>
					<div className="capf6080-column capf6080-block-text" style={{ gridColumn: 2 }}>
						<span className="capf6080-block-text-bold">&#9745; </span>
						<span className="capf6080-block-text">Other / Special Local Forms</span>
					</div>
					<div className="capf6080-column capf6080-block-text" style={{ gridColumn: 1 }}>
						<span className="capf6080-block-text-bold">&#9744; CAPF 163 </span>
						<span className="capf6080-block-text">
							Provision of Minor OTC Medication
						</span>
					</div>
				</div>
				<div className="capf6080-block capf6080-grid-auth">
					<div className="capf6080-block-title" style={{ gridColumn: '1 / span 3' }}>
						5. PARENT's or GUARDIAN's AUTHORIZATION
					</div>
					<div
						className="capf6080-column capf6080-block-text-small"
						style={{ gridColumn: '1 / span 3' }}
					>
						Cadets who have reached the age of majority, write "N.A."
					</div>
					<div
						className="capf6080-column capf6080-block-text-bold"
						style={{ gridColumn: 1 }}
					>
						I authorize my cadet to participate
					</div>
					<div
						className="capf6080-column capf6080-block-text-bold"
						style={{ gridColumn: 2 }}
					>
						Signature:{' '}
					</div>
					<div
						className="capf6080-column capf6080-block-text-bold"
						style={{ gridColumn: 3 }}
					>
						Date:
					</div>
					<div
						className="capf6080-column capf6080-block-text-bold"
						style={{ gridColumn: '1 / span 3' }}
					>
						in the activity described above
					</div>
					<div className="clear" />
					<div
						className="capf6080-column capf6080-block-text-small"
						style={{ gridColumn: '1 / span 3', gridRow: 5 }}
					>
						Disposition: Units may destroy this completed form when the activity
						concludes
					</div>
				</div>
				<div className="capf6080-block capf6080-grid-header">
					<div
						className="capf6080-column capf6080-block-title-small-bold"
						style={{ gridColumn: 1 }}
					>
						Please detach on the dashed line. The upper portion is for CAP and the lower
						portion is for the parent's or guardian's reference.
					</div>
				</div>
				<div className="capf6080-block capf6080-grid-info">
					<div className="capf6080-block-title" style={{ gridColumn: '1 / span 2' }}>
						6. HELPFUL INFORMATION FOR PARENTS &amp; GUARDIANS
					</div>
					<div className="capf6080-column" style={{ gridColumn: 1 }}>
						<span className="capf6080-block-text-bold">Uniform:</span>
						<span className="capf6080-block-text">{this.props.event.uniform}</span>
					</div>
					<div className="capf6080-column" style={{ gridColumn: 2 }}>
						<span className="capf6080-block-text-bold">Event Number: </span>
						<span className="capf6080-block-text">
							{this.props.event.accountID}-{this.props.event.id}
						</span>
					</div>
					<div className="capf6080-column" style={{ gridColumn: 1 }}>
						<span className="capf6080-block-text-bold">Activity:</span>
						<span className="capf6080-block-text">{this.props.event.activity}</span>
					</div>
					<div className="capf6080-column" style={{ gridColumn: 2 }}>
						<span className="capf6080-block-text-bold">Event Status: </span>
						<span className="capf6080-block-text">{this.props.event.status}</span>
					</div>
				</div>
			</div>
		); // form div close
	}
}

interface TestState {
	data: {
		members: CAPMemberClasses[];
		event: Event;
	} | null;
}

export class CAPF6080Render extends Page<PageProps, TestState> {
	public state: TestState = {
		data: null
	};

	public async componentDidMount() {
		const [members, event] = await Promise.all([
			this.props.account.getMembers(this.props.member),
			Event.Get(1, this.props.member, this.props.account)
		]);

		this.setState({
			data: {
				members,
				event
			}
		});
	}

	public render() {
		return (
			<div>
				<Link to="/eventviewer/1">Event to compare to</Link>
				<br />
				<br />
				<br />
				<style>
					{`
  #mother #bodyContainer #page header {
    display: none !important;
  }
  #mother #bodyContainer #page #pageContent .contentBorder, #mother #bodyContainer #page #pageContent .slideshowTop, #mother #bodyContainer #page #pageContent .slideshow, #mother #bodyContainer #page #pageContent .slideshowBottom, #mother #bodyContainer #page #pageContent #fb-root, #mother #bodyContainer #page #pageContent #breadcrumbs, #mother #bodyContainer #page #pageContent .banner, #mother #bodyContainer #page #pageContent #sidenav {
    display: none !important;
  }

  #mother #footer {
    display: none !important;
  }

  #mother #bodyContainer #page {
	  max-width: 100%;
	  width: 100%;
	  height: 100%;
  }

  #mother #bodyContainer #page #content {
	  max-width: 100%;
	  float: left;
	  width: 100%;
	  min-height: 0;
	  padding: 0;
  }

  html body, html body #bodyContainer, html body #bodyContainer #page #body, .mainContentBottom, #content {
	  background: #fff !important;
  }
					`}
				</style>
				{this.props.member === null || this.state.data === null ? (
					<SigninLink>Sign in</SigninLink>
				) : (
					<CAPF6080
						event={this.state.data.event}
						memberInformation={this.state.data.members}
						currentMember={this.props.member as CAPMemberClasses}
					/>
				)}
			</div>
		);
	}
}
