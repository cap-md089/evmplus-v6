/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	AsyncEither,
	asyncRight,
	CadetPromotionRequirementsMap,
	CadetPromotionStatus,
	Either,
	errorGenerator,
	EventStatus,
	getURIComponent,
	HTTPError,
	Maybe as M,
	Maybe,
	MaybeObj,
	pipe,
	presentMultCheckboxReturn,
	RawResolvedEventObject,
} from 'common-lib';
import { DateTime } from 'luxon';
import * as React from 'react';
import { FacebookProvider, Page as FBPage } from 'react-facebook';
import { Link } from 'react-router-dom';
import { TwitterTimelineEmbed } from 'react-twitter-embed';
import Loader from '../components/Loader';
import { SideNavigationItem } from '../components/page-elements/SideNavigation';
import fetchApi from '../lib/apis';
import Page, { PageProps } from './Page';

interface MainStateUnloaded {
	state: 'UNLOADED';
}

interface MainStateLoaded {
	state: 'LOADED';
	events: RawResolvedEventObject[];
	nextEvent: MaybeObj<RawResolvedEventObject>;
	promotionRequirements: MaybeObj<CadetPromotionStatus>;
}

interface MainStateError {
	state: 'ERROR';
	message: string;
}

type MainState = MainStateUnloaded | MainStateLoaded | MainStateError;

export default class Main extends Page<PageProps, MainState> {
	public state: MainState = {
		state: 'UNLOADED',
	};

	public async componentDidMount(): Promise<void> {
		this.props.deleteReduxState();
		
		const links: SideNavigationItem[] = [
			{
				target: '/team',
				text: 'Team list',
				type: 'Link',
			},
			{
				target: '/changelog',
				text: 'Change log',
				type: 'Link',
			},
		];

		if (this.props.member) {
			links.push({
				target: '/admin',
				text: 'Administration',
				type: 'Link',
			});
		}

		this.props.updateSideNav(links);
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
		]);
		this.updateTitle();

		const infoEither = await AsyncEither.All([
			fetchApi.events.events.getNextRecurring({}, {}),
			fetchApi.events.events.getUpcoming({}, {}),
			this.props.member
				? this.props.member.seniorMember
					? asyncRight<HTTPError, MaybeObj<CadetPromotionStatus>>(
							Maybe.none(),
							errorGenerator('Unable to retrieve promotion requirements'),
					  )
					: fetchApi.member.promotionrequirements.currentuser({}, {}).map(Maybe.some)
				: asyncRight<HTTPError, MaybeObj<CadetPromotionStatus>>(
						Maybe.none(),
						errorGenerator('Unable to retrieve promotion requirements'),
				  ),
		]);

		if (Either.isLeft(infoEither)) {
			this.setState({
				state: 'ERROR',
			});
		} else {
			const [nextEvent, events, promotionRequirements] = infoEither.value;

			this.setState({
				state: 'LOADED',
				events,
				nextEvent,
				promotionRequirements,
			});
		}
	}

	public render = (): JSX.Element => (
		<div>
			{this.state.state === 'UNLOADED' ? (
				<Loader />
			) : this.state.state === 'ERROR' ? (
				<div>{this.state.message}</div>
			) : (
				<>
					{this.props.member &&
					!this.props.member.seniorMember &&
					this.state.promotionRequirements.hasValue ? (
						<section className="halfSection">
							<RequirementsBuild {...this.state.promotionRequirements.value} />
						</section>
					) : null}
					<section
						className="halfSection"
						style={{
							float:
								this.props.member && !this.props.member.seniorMember
									? 'right'
									: 'left',
						}}
					>
						{!this.state.nextEvent.hasValue ? (
							<h3 style={{ textAlign: 'center' }}>No upcoming meeting</h3>
						) : (
							<>
								<h3
									style={{
										textAlign: 'center',
									}}
								>
									Next meeting
								</h3>
								<strong>Event</strong>: {this.state.nextEvent.value.name}
								<br />
								<strong>Time</strong>:{' '}
								{DateTime.fromMillis(
									this.state.nextEvent.value.meetDateTime,
								).toLocaleString({
									year: 'numeric',
									weekday: 'short',
									month: 'short',
									day: '2-digit',
									hour: '2-digit',
									minute: '2-digit',
									hour12: false,
								})}
								<br />
								<strong>Location</strong>: {this.state.nextEvent.value.meetLocation}
								<br />
								<strong>SM Uniform</strong>:{' '}
								{pipe(
									M.map(smuniform => <>{smuniform}</>),
									M.orSome(<i>No SM uniform specified</i>),
								)(presentMultCheckboxReturn(this.state.nextEvent.value.smuniform))}
								<br />
								<strong>Cadet Uniform</strong>:{' '}
								{pipe(
									M.map(cuniform => <>{cuniform}</>),
									M.orSome(<i>No cadet uniform specified</i>),
								)(presentMultCheckboxReturn(this.state.nextEvent.value.cuniform))}
								<br />
								<Link
									to={`/eventviewer/${getURIComponent(
										this.state.nextEvent.value,
									)}`}
								>
									View details
								</Link>
							</>
						)}
					</section>
					<section className="halfSection" style={{ float: 'right', clear: 'right' }}>
						{this.state.events.length === 0 ? (
							<h3
								style={{
									textAlign: 'center',
									lineHeight: 'initial',
								}}
							>
								No upcoming events
							</h3>
						) : (
							<h3
								style={{
									textAlign: 'center',
									lineHeight: 'initial',
								}}
							>
								Upcoming events
							</h3>
						)}
						{this.state.events.map((ev, i) => (
							<div key={i}>
								{ev.status === EventStatus.CANCELLED ? (
									<span style={{ color: 'red' }}>
										<strong>
											{DateTime.fromMillis(ev.meetDateTime).toLocaleString({
												day: '2-digit',
												month: 'long',
											})}
										</strong>{' '}
										<Link to={`/eventviewer/${getURIComponent(ev)}`}>
											{ev.name}
										</Link>{' '}
										<strong>!! Cancelled !!</strong>
									</span>
								) : (
									<span>
										<strong>
											{DateTime.fromMillis(ev.meetDateTime).toLocaleString({
												day: '2-digit',
												month: 'long',
											})}
										</strong>{' '}
										<Link to={`/eventviewer/${getURIComponent(ev)}`}>
											{ev.name}
										</Link>
									</span>
								)}
							</div>
						))}
					</section>
					{!!this.props.registry.Contact.Twitter ? (
						<section className="halfSection">
							<TwitterTimelineEmbed
								screenName={this.props.registry.Contact.Twitter}
								sourceType="profile"
								options={{ height: 500 }}
							/>
						</section>
					) : null}

					{!!this.props.registry.Contact.FaceBook ? (
						<section className="halfSection">
							<FacebookProvider appId="1640151259363083">
								<FBPage
									href={`https://www.facebooko.com/${this.props.registry.Contact.FaceBook}`}
									tabs="timeline"
								/>
							</FacebookProvider>
						</section>
					) : null}
				</>
			)}
		</div>
	);
}

function RequirementsBuild(cps: CadetPromotionStatus): JSX.Element | null {
	// constants
	const days = 60 * 60 * 24 * 1000;
	const promoReqs =
		CadetPromotionRequirementsMap[
			cps.MaxAprvStatus === 'INC'
				? cps.CurrentCadetAchv.CadetAchvID
				: cps.CurrentCadetAchv.CadetAchvID + 1
		];
	const cadetTrackReport = 'https://www.capnhq.gov/CAP.eServices.Web/Reports.aspx?id=161';
	const cadetOath = 'http://www.capli.com/oath.html';
	const sdaLink =
		'https://www.gocivilairpatrol.com/programs/cadets/library/cadet-staff-duty-analysis';
	const encampmentDate = cps.EncampDate ? cps.EncampDate : -1;

	// Check for Spaatz cadets
	if (!promoReqs) {
		return null;
	}

	// calculate next available promotion date
	let promotionAvailability =
		'You are eligible to promote as soon as all of your promotion requirements are complete';
	if (Maybe.isSome(cps.LastAprvDate)) {
		const lastDate = cps.LastAprvDate.value;
		const availablePromotionDate = lastDate + 56 * days;
		const nowDate = Date.now();
		if (availablePromotionDate > nowDate) {
			promotionAvailability =
				'You will be eligible for promotion on ' +
				new Date(availablePromotionDate).toDateString();
		}
	}

	return (
		<div>
			<h3>Promotion requirements</h3>
			{cps.MaxAprvStatus === 'PND' ? (
				<p>
					Your achievement completion is pending eServices approval. Local promotion
					requirements may apply. Review the requirements for your next achievement{' '}
					<a href={promoReqs.ReqsWebLink} rel="noopener noreferrer">
						here
					</a>
				</p>
			) : cps.NextCadetAchvID <= 8 ||
			  cps.NextCadetAchvID === 10 ||
			  cps.NextCadetAchvID === 12 ||
			  cps.NextCadetAchvID === 14 ||
			  cps.NextCadetAchvID === 17 ||
			  cps.NextCadetAchvID === 20 ||
			  cps.NextCadetAchvID === 21 ? (
				<p>
					Requirements for your promotion to {promoReqs.Grade} are not yet complete.
					Review the requirements{' '}
					<a href={promoReqs.ReqsWebLink} target="_blank" rel="noopener noreferrer">
						here
					</a>
				</p>
			) : (
				<p>
					Requirements for your next achievement are not yet complete. Review the
					requirements{' '}
					<a href={promoReqs.ReqsWebLink} target="_blank" rel="noopener noreferrer">
						here
					</a>
				</p>
			)}
			{<p>{promotionAvailability}</p>}
			<h3>Incomplete Promotion Requirements</h3>
			Check your eServices Cadet Track Report{' '}
			<a href={cadetTrackReport} target="_blank" rel="noopener noreferrer">
				here
			</a>
			<h4>Complete these requirements to promote</h4>
			<ul>
				{promoReqs.Leadership === 'Milestone' ? (
					+new Date(cps.CurrentCadetAchv.LeadLabDateP) <= 0 ? (
						<li>
							<p>
								You need to pass a milestone leadership test. The test must be
								proctored. Go{' '}
								<a
									href={promoReqs.LeadTestWebLink}
									target="_blank"
									rel="noopener noreferrer"
								>
									here
								</a>{' '}
								to take the test
							</p>
						</li>
					) : null
				) : promoReqs.Leadership === 'Pt 1' ? (
					+new Date(cps.CurrentCadetAchv.LeadLabDateP) <= 0 ? (
						<li>
							<p>
								You need to pass the Wright Brothers leadership test. The test must
								be proctored. Go{' '}
								<a
									href={promoReqs.LeadTestWebLink}
									target="_blank"
									rel="noopener noreferrer"
								>
									here
								</a>{' '}
								to take the test
							</p>
						</li>
					) : null
				) : promoReqs.Leadership !== 'None' ? (
					+new Date(cps.CurrentCadetAchv.LeadLabDateP) <= 0 ? (
						<li>
							<p>
								You need to pass a leadership test. Go{' '}
								<a
									href={promoReqs.LeadTestWebLink}
									target="_blank"
									rel="noopener noreferrer"
								>
									here
								</a>{' '}
								to take the test
							</p>
						</li>
					) : null
				) : null}
				{promoReqs.Aerospace === 'Milestone' ? (
					+new Date(cps.CurrentCadetAchv.AEDateP) <= 0 ? (
						<li>
							<p>
								You need to pass the Spaatz aerospace test. The test must be
								proctored. See your Senior Member staff for details.
							</p>
						</li>
					) : null
				) : promoReqs.Aerospace !== 'None' ? (
					+new Date(cps.CurrentCadetAchv.AEDateP) <= 0 ? (
						<li>
							<p>
								You need to pass an aerospace test. Go{' '}
								<a
									href={promoReqs.AeroTestWebLink}
									target="_blank"
									rel="noopener noreferrer"
								>
									here
								</a>{' '}
								to take the test
							</p>
						</li>
					) : null
				) : null}
				{promoReqs.Oath === false
					? "CPFT requirements can't be determined at this time!!  HFZ information is not available in CAPWATCH files"
					: null}
				{promoReqs.CharDev === true ? (
					+new Date(cps.CurrentCadetAchv.MoralLDateP) <= 0 ? (
						<li>
							<p>You need to attend a Character Development session</p>
						</li>
					) : null
				) : null}
				{promoReqs.Drill !== 'None' ? (
					+new Date(cps.CurrentCadetAchv.DrillDate) <= 0 ? (
						<li>
							<p>
								You need credit for a drill test. Study the requirements for your
								next test{' '}
								<a
									href={promoReqs.DrillTestWebLink}
									target="_blank"
									rel="noopener noreferrer"
								>
									here
								</a>
							</p>
						</li>
					) : null
				) : null}
				{promoReqs.Oath === true ? (
					<li>
						<p>
							You need to recite the Cadet Oath word for word. Study the oath text
							located{' '}
							<a href={cadetOath} target="_blank" rel="noopener noreferrer">
								here
							</a>
						</p>
					</li>
				) : null}
				{promoReqs.SDAWriting === true ? (
					+new Date(cps.CurrentCadetAchv.TechnicalWritingAssignmentDate) <= 0 ? (
						<li>
							<p>
								You need to complete a Staff Duty Assignment Report. Review SDA
								requirements{' '}
								<a href={sdaLink} rel="noopener noreferrer">
									here
								</a>
							</p>
						</li>
					) : null
				) : null}
				{cps.NextCadetAchvID <= 10 ? (
					encampmentDate <= 0 ? (
						<li>
							<p>
								You need to complete Encampment in order to earn the Mitchell award.
								Complete Encampment at your first opportunity!
							</p>
						</li>
					) : null
				) : null}
			</ul>
		</div>
	);
}
