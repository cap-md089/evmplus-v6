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
	// AccountType,
	api,
	AsyncEither,
	asyncRight,
	CAPProspectiveMemberObject,
	ClientUser,
	Either,
	hasOneDutyPosition,
	hasPermission,
	HTTPError,
	// isCAPMember,
	Permissions,
	reports,
	spreadsheets,
} from 'common-lib';
import { TDocumentDefinitions, TFontDictionary } from 'pdfmake/interfaces';
import * as React from 'react';
import Button from '../../../components/Button';
import LoaderShort from '../../../components/LoaderShort';
import { FetchAPIProps, withFetchApi } from '../../../globals';
import { clientErrorGenerator } from '../../../lib/error';
import Page, { PageProps } from '../../Page';

interface ReportsWidgetLoadingState {
	state: 'LOADING';
}

interface ReportsWidgetLoadedState {
	state: 'LOADED';

	nhqMembers: api.member.promotionrequirements.PromotionRequirementsItem[];
	newMembers: CAPProspectiveMemberObject[];
}

interface ReportsWidgetErrorState {
	state: 'ERROR';

	error: string;
}

type ReportsWidgetState =
	| ReportsWidgetErrorState
	| ReportsWidgetLoadedState
	| ReportsWidgetLoadingState;

interface ReportsWidgetViewState {
	showError: boolean;
}

const hasAllowedDutyPosition = hasOneDutyPosition([
	'Cadet Flight Commander',
	'Cadet Flight Sergeant',
	'Cadet Commander',
	'Cadet Deputy Commander for Operations',
	'Cadet Deputy Commander for Support ',
	'Deputy Commander For Cadets',
]);

export const shouldRenderReports = (props: PageProps): boolean =>
	!!props.member &&
	(hasAllowedDutyPosition(props.member) ||
		hasPermission('PromotionManagement')(Permissions.PromotionManagement.FULL)(props.member));

export interface RequiredMember extends PageProps, FetchAPIProps {
	member: ClientUser;
}

export const ReportsWidget = withFetchApi(
	class extends Page<RequiredMember, ReportsWidgetState & ReportsWidgetViewState> {
		public state: ReportsWidgetState & ReportsWidgetViewState = {
			state: 'LOADING',
			showError: false,
		};

		public async componentDidMount(): Promise<void> {
			if (!this.props.member) {
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
		}

		public render(): JSX.Element | null {
			if (!this.props.member) {
				return null;
			}

			return (
				<div className="widget">
					<div className="widget-title">Reports</div>
					<div className="widget-body">
						<>
							{this.state.state === 'LOADING' ? (
								<LoaderShort />
							) : this.state.state === 'ERROR' ? (
								<div>{this.state.error}</div>
							) : (
								<div>
									SQR 60-1 Cadet status report &nbsp;
									<Button onClick={() => this.createSQR601()} buttonType="none">
										pdf
									</Button>{' '}
									&nbsp;
									<Button
										buttonType="none"
										onClick={this.createsqr601Spreadsheet}
									>
										xlsx
									</Button>
									<br />
								</div>
							)}
							{this.state.state === 'LOADING' ? (
								<LoaderShort />
							) : this.state.state === 'ERROR' ? (
								<div>{this.state.error}</div>
							) : (
								<div>
									SQR 60-1a Cadet status report by flight &nbsp;
									<Button
										buttonType="none"
										onClick={this.createsqr601aSpreadsheet}
									>
										xlsx
									</Button>
									<br />
								</div>
							)}
							{this.state.state === 'LOADING' ? (
								<LoaderShort />
							) : this.state.state === 'ERROR' ? (
								<div>{this.state.error}</div>
							) : (
								<div>
									SQR 60-20 Cadet HFZ report &nbsp;
									<Button onClick={() => this.createSQR6020()} buttonType="none">
										pdf
									</Button>{' '}
									&nbsp;
									<Button
										buttonType="none"
										onClick={this.createsqr6020Spreadsheet}
									>
										xlsx
									</Button>
									<br />
								</div>
							)}
						</>
					</div>
				</div>
			);
		}
		private createSQR601 = async (): Promise<void> => {
			if (this.state.state === 'ERROR') {
				this.setState({
					showError: true,
				});

				return;
			}

			if (this.state.state !== 'LOADED' || !this.props.member) {
				return;
			}

			const now = new Date();
			const formatdate =
				now.getFullYear().toString() +
				'-' +
				(now.getMonth() + 1).toString().padStart(2, '0') +
				'-' +
				now.getDate().toString().padStart(2, '0') +
				' ' +
				now.getHours().toString().padStart(2, '0') +
				now.getMinutes().toString().padStart(2, '0');

			const docDef = reports.sqr601DocumentDefinition(
				this.state.nhqMembers,
				this.state.newMembers,
				this.props.registry,
			);

			await this.printForm(docDef, `SQR601-${this.props.account.id}-${formatdate}.pdf`);
		};

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

			const now = new Date();
			const formatdate =
				now.getFullYear().toString() +
				'-' +
				(now.getMonth() + 1).toString().padStart(2, '0') +
				'-' +
				now.getDate().toString().padStart(2, '0') +
				' ' +
				now.getHours().toString().padStart(2, '0') +
				now.getMinutes().toString().padStart(2, '0');

			const docDef = reports.sqr6020DocumentDefinition(
				this.state.nhqMembers,
				this.state.newMembers,
				this.props.registry,
			);

			await this.printForm(docDef, `SQR6020-${this.props.account.id}-${formatdate}.pdf`);
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

		private createsqr6020Spreadsheet = async (): Promise<void> => {
			if (this.state.state !== 'LOADED' || !this.props.member) {
				return;
			}

			const XLSX = await import('xlsx');

			const wb = XLSX.utils.book_new();

			let wsName = 'UnitInfo';
			const wsDataEvent = spreadsheets.sqr6020XL();
			let ws = XLSX.utils.aoa_to_sheet(wsDataEvent);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			let sheet = spreadsheets.Formatsqr6020XL(ws);
			XLSX.utils.book_append_sheet(wb, sheet, wsName);

			wsName = 'HFZStatus';
			const [wsDataAttendance, widths] = spreadsheets.sqr6020MembersXL(
				this.state.nhqMembers,
				this.state.newMembers,
				// this.props.registry,
			);
			ws = XLSX.utils.aoa_to_sheet(wsDataAttendance);
			sheet = spreadsheets.Formatsqr6020MembersXL(ws, widths, wsDataAttendance.length);
			XLSX.utils.book_append_sheet(wb, sheet, wsName);

			const now = new Date();
			const formatdate =
				now.getFullYear().toString() +
				'-' +
				(now.getMonth() + 1).toString().padStart(2, '0') +
				'-' +
				now.getDate().toString().padStart(2, '0') +
				' ' +
				now.getHours().toString().padStart(2, '0') +
				now.getMinutes().toString().padStart(2, '0');

			XLSX.writeFile(wb, `SQR 60-20 ${this.props.account.id}-${formatdate}.xlsx`);
		};

		private createsqr601Spreadsheet = async (): Promise<void> => {
			if (this.state.state !== 'LOADED' || !this.props.member) {
				return;
			}

			const XLSX = await import('xlsx');

			const wb = XLSX.utils.book_new();

			let wsName = 'UnitInfo';
			const wsDataEvent = spreadsheets.sqr601XL();
			let ws = XLSX.utils.aoa_to_sheet(wsDataEvent);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			let sheet = spreadsheets.Formatsqr601XL(ws);
			XLSX.utils.book_append_sheet(wb, sheet, wsName);

			wsName = 'CadetInfo';
			const [wsDataAttendance, widths] = spreadsheets.sqr601MembersXL(
				this.state.nhqMembers,
				this.state.newMembers,
				// this.props.registry,
			);
			ws = XLSX.utils.aoa_to_sheet(wsDataAttendance);
			sheet = spreadsheets.Formatsqr601MembersXL(ws, widths, wsDataAttendance.length);
			XLSX.utils.book_append_sheet(wb, sheet, wsName);

			const now = new Date();
			const formatdate =
				now.getFullYear().toString() +
				'-' +
				(now.getMonth() + 1).toString().padStart(2, '0') +
				'-' +
				now.getDate().toString().padStart(2, '0') +
				' ' +
				now.getHours().toString().padStart(2, '0') +
				now.getMinutes().toString().padStart(2, '0');

			XLSX.writeFile(wb, `SQR 60-1 ${this.props.account.id}-${formatdate}.xlsx`);
		};

		private createsqr601aSpreadsheet = async (): Promise<void> => {
			if (this.state.state !== 'LOADED' || !this.props.member) {
				return;
			}

			const XLSX = await import('xlsx');

			const wb = XLSX.utils.book_new();

			let wsName = 'UnitInfo';
			const wsDataEvent = spreadsheets.sqr601aXL();
			let ws = XLSX.utils.aoa_to_sheet(wsDataEvent);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			let sheet = spreadsheets.Formatsqr601aXL(ws);
			XLSX.utils.book_append_sheet(wb, sheet, wsName);
			const flights = this.props.registry.RankAndFile.Flights; 
			const state = this.state;

			flights.forEach(flight => {
				// need to loop through flights and create a sheet for each flight
				wsName = flight.toString();
				console.log("flight", wsName);
				const [wsDataAttendance, widths]: [any[][], number[]] = spreadsheets.sqr601aMembersXL(
					state.nhqMembers.filter((member: api.member.promotionrequirements.PromotionRequirementsItem) => member.member.flight === flight),
					state.newMembers.filter((member: CAPProspectiveMemberObject) => member.flight === flight),
				);

				ws = XLSX.utils.aoa_to_sheet(wsDataAttendance);
				sheet = spreadsheets.Formatsqr601aMembersXL(ws, widths, wsDataAttendance.length); 
				XLSX.utils.book_append_sheet(wb, sheet, wsName);
			});

			const now = new Date();
			const formatdate =
				now.getFullYear().toString() +
				'-' +
				(now.getMonth() + 1).toString().padStart(2, '0') +
				'-' +
				now.getDate().toString().padStart(2, '0') +
				' ' +
				now.getHours().toString().padStart(2, '0') +
				now.getMinutes().toString().padStart(2, '0');

			XLSX.writeFile(wb, `SQR 60-1a ${this.props.account.id}-${formatdate}.xlsx`);
		};


	},
);
