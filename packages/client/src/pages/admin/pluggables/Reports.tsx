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
	hasPermission,
	HTTPError,
	Permissions,
	reports,
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

	nhqMembers: api.member.promotionrequirements.PromotionRequrementsItem[];
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

export const shouldRenderReports = (props: PageProps): boolean =>
	!!props.member &&
	hasPermission('PromotionManagement')(Permissions.PromotionManagement.FULL)(props.member);

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
						{this.state.state === 'LOADING' ? (
							<LoaderShort />
						) : this.state.state === 'ERROR' ? (
							<div>{this.state.error}</div>
						) : (
							<div>
								{(this.props.account.type === AccountType.CAPSQUADRON ||
									this.props.account.type === AccountType.CAPEVENT) &&
								hasPermission('PromotionManagement')(
									Permissions.PromotionManagement.FULL,
								)(this.props.member) ? (
									<>
										<Button
											onClick={() => this.createSQR601()}
											buttonType="none"
										>
											SQR 60-1 Cadet status report
										</Button>
										<br />
									</>
								) : null}
							</div>
						)}
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

			const now = new Date().toString();
			const docDef = reports.sqr601DocumentDefinition(
				this.state.nhqMembers,
				this.state.newMembers,
				this.props.registry,
			);

			await this.printForm(docDef, `SQR601-${this.props.account.id}-${now}.pdf`);
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
