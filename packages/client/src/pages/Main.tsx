/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of CAPUnit.com.
 *
 * CAPUnit.com is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * CAPUnit.com is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with CAPUnit.com.  If not, see <http://www.gnu.org/licenses/>.
 */

import {
	AsyncEither,
	asyncRight,
	CadetPromotionStatus,
	CadetAprvStatus,
	CadetPromotionRequirementsMap,
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
	RawEventObject,
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
	events: RawEventObject[];
	nextEvent: MaybeObj<RawEventObject>;
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

	public async componentDidMount() {
		const links: SideNavigationItem[] = [
			{
				target: '/team',
				text: 'Team list',
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
					: fetchApi.member.promotionrequirements
							.currentuser({}, {}, this.props.member.sessionID)
							.map(Maybe.some)
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

	public render() {
		return (
			<div>
				{this.state.state === 'UNLOADED' ? (
					<Loader />
				) : this.state.state === 'ERROR' ? (
					<div>{this.state.message}</div>
				) : (
					<>
						{this.props.member && !this.props.member.seniorMember && this.state.promotionRequirements.hasValue ? (
							<section className="halfSection">
								<h1>Stuff</h1>
								{/* {RequirementsBuild(this.state.promotionRequirements)} */}
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
									<strong>Location</strong>:{' '}
									{this.state.nextEvent.value.meetLocation}
									<br />
									<strong>Uniform of the day</strong>:{' '}
									{pipe(
										M.map(uniform => <>{uniform}</>),
										M.orSome(<i>No uniform specified</i>),
									)(
										presentMultCheckboxReturn(
											this.state.nextEvent.value.uniform,
										),
									)}
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
												{DateTime.fromMillis(
													ev.meetDateTime,
												).toLocaleString({
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
												{DateTime.fromMillis(
													ev.meetDateTime,
												).toLocaleString({
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
}

function RequirementsBuild(cps: CadetPromotionStatus): string {
	let response = "<h3>Promotion Requirements</h3>";
	response += CadetPromotionRequirementsMap[cps.CurrentCadetAchv.CadetAchvID];
	response += cps.CurrentAprvStatus;
	return response;
}