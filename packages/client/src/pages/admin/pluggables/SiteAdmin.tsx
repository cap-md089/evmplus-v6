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

import {
	AccountType,
	api,
	AsyncEither,
	asyncRight,
	CAPProspectiveMemberObject,
	ClientUser,
	Either,
	hasOneDutyPosition,
	hasPermission,
	HTTPError,
	Permissions,
	reports,
} from 'common-lib';
import type { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../components/Button';
import Dialogue, { DialogueButtons } from '../../../components/dialogues/Dialogue';
import { FetchAPIProps, withFetchApi } from '../../../globals';
import { clientErrorGenerator } from '../../../lib/error';
import Page, { PageProps } from '../../Page';

interface AdminDataLoadingState {
	state: 'LOADING';
}

interface AdminDataLoadedState {
	state: 'LOADED';

	nhqMembers: api.member.promotionrequirements.PromotionRequrementsItem[];
	newMembers: CAPProspectiveMemberObject[];
}

interface AdminDataErrorState {
	state: 'ERROR';

	error: string;
}

type AdminDataState = AdminDataLoadingState | AdminDataLoadedState | AdminDataErrorState;

interface AdminViewState {
	showError: boolean;
}

export const shouldRenderSiteAdmin = (props: PageProps): boolean => !!props.member;

export interface RequiredMember extends PageProps, FetchAPIProps {
	member: ClientUser;
}

export const SiteAdminWidget = withFetchApi(
	class extends Page<RequiredMember, AdminDataState & AdminViewState> {
		public state: AdminDataState & AdminViewState = {
			state: 'LOADING',

			showError: false,
		};

		public componentDidMount = async (): Promise<void> => {
			if (
				!hasPermission('PromotionManagement')(Permissions.PromotionManagement.FULL)(
					this.props.member,
				)
			) {
				return;
			}

			if (
				this.props.account.type !== AccountType.CAPEVENT &&
				this.props.account.type !== AccountType.CAPSQUADRON
			) {
				return;
			}

			const requests = await AsyncEither.All([
				this.props.fetchApi.member.promotionrequirements.account({}, {}),
				this.props.fetchApi.member.memberList(
					{ type: 'CAPProspectiveMember' },
					{},
				) as AsyncEither<HTTPError, CAPProspectiveMemberObject[]>,

				// Ignore; this just preemptively loads pdfmake so we can use it whenever without actually going out to get the JS
				asyncRight(import('pdfmake'), clientErrorGenerator('Could not import pdfmake')),
			]);

			if (Either.isRight(requests)) {
				const [nhqMembers, newMembers] = requests.value;

				this.setState(prev => ({
					...prev,

					state: 'LOADED',

					newMembers,
					nhqMembers,
				}));
			} else {
				this.setState(prev => ({
					...prev,

					state: 'ERROR',

					error: requests.value.message,
				}));
			}
		};

		public render = (): JSX.Element => (
			<>
				<Dialogue
					open={this.state.showError}
					displayButtons={DialogueButtons.OK}
					title="Form Error"
					onClose={() => this.setState({ showError: false })}
				>
					{this.state.state === 'ERROR' ? this.state.error : 'An unknown error occurred'}
				</Dialogue>
				<div className="widget">
					<div className="widget-title">
						{hasPermission('RegistryEdit')(Permissions.RegistryEdit.YES)(
							this.props.member,
						)
							? 'Site '
							: hasPermission('FlightAssign')(Permissions.FlightAssign.YES)(
									this.props.member,
							  ) ||
							  ((this.props.member.type === 'CAPNHQMember' ||
									this.props.member.type === 'CAPProspectiveMember') &&
									this.props.member.seniorMember)
							? 'Account '
							: 'Personal '}
						administration
					</div>
					<div className="widget-body">
						<Link to="/eventlinklist">Event List</Link>
						<br />
						<Link to="/admin/attendance">View Attendance</Link>
						<br />
						{(this.props.account.type === AccountType.CAPSQUADRON ||
							this.props.account.type === AccountType.CAPEVENT) &&
						hasPermission('PromotionManagement')(Permissions.PromotionManagement.FULL)(
							this.props.member,
						) ? (
							<>
								<Button onClick={() => this.createSQR6020()} buttonType="none">
									Squadron achievement requirements
								</Button>
								<br />
							</>
						) : null}
						<Link to="/admin/setupmfa">Setup MFA</Link>
						<br />
						<Link to="/admin/tempdutypositions">Manage duty positions</Link>
						{(this.props.account.type === AccountType.CAPSQUADRON ||
							this.props.account.type === AccountType.CAPEVENT) &&
						hasPermission('FlightAssign')(Permissions.FlightAssign.YES)(
							this.props.member,
						) ? (
							<>
								<br />
								<Link to="/admin/flightassign">Assign flight members</Link>
							</>
						) : null}
						{hasPermission('RegistryEdit')(Permissions.RegistryEdit.YES)(
							this.props.member,
						) ? (
							<>
								<br />
								<Link to="/admin/regedit">Site configuration</Link>
							</>
						) : null}
						{hasPermission('PermissionManagement')(
							Permissions.PermissionManagement.FULL,
						)(this.props.member) ? (
							<>
								<br />
								<Link to="/admin/permissions">Permission management</Link>
							</>
						) : null}
						{(this.props.member.type === 'CAPProspectiveMember' ||
							this.props.member.type === 'CAPNHQMember') &&
						(this.props.member.seniorMember ||
							hasOneDutyPosition([
								'Cadet Commander',
								'Cadet Deputy Commander',
								'Cadet Executive Officer',
							])(this.props.member)) ? (
							<>
								<br />
								<Link to="/admin/emaillist">Email selector</Link>
							</>
						) : null}
					</div>
				</div>
			</>
		);

		private createSQR6020 = async (): Promise<void> => {
			if (this.state.state === 'ERROR') {
				this.setState({
					showError: true,
				});

				return;
			}

			if (this.state.state !== 'LOADED' || !this.props.member) {
				return;
			}

			const now = new Date().toString();
			const docDef = reports.sqr6020DocumentDefinition(
				this.state.nhqMembers,
				this.state.newMembers,
			);

			await this.printForm(docDef, `SQR6020-${this.props.account.id}-${now}.pdf`);
		};

		private async printForm(docDef: TDocumentDefinitions, fileName: string): Promise<void> {
			const pdfMake = await import('pdfmake');

			const fontGetter =
				process.env.NODE_ENV === 'production'
					? (fontName: string) =>
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							`https://${this.props.account.id}.${process.env
								.REACT_APP_HOST_NAME!}/images/fonts/${fontName}`
					: (fontName: string) => `http://localhost:3000/images/fonts/${fontName}`;

			const fonts: TFontDictionary = {
				FreeSans: {
					normal: fontGetter('FreeSans.ttf'),
					bold: fontGetter('FreeSansBold.ttf'),
					italics: fontGetter('FreeSansOblique.ttf'),
					bolditalics: fontGetter('FreeSansBoldOblique.ttf'),
				},
			};

			// @ts-ignore: the types lie, as has been verified with tests
			const docPrinter = (pdfMake.createPdf as (
				def: TDocumentDefinitions,
				idk: null,
				fontDictionary: TFontDictionary,
			) => { download(filename: string): void })(docDef, null, fonts);

			docPrinter.download(fileName);
		}
	},
);
