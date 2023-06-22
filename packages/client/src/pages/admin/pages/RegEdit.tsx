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
	hasPermission,
	Maybe,
	RankAndFileInformation,
	RegistryValues,
	Timezone,
	WebsiteContact,
	Permissions,
} from 'common-lib';
import * as React from 'react';
import Button from '../../../components/Button';
import Select from '../../../components/form-inputs/Select';
import SimpleForm, {
	FileInput,
	FormBlock,
	Label,
	ListEditor,
	NumberInput,
	TextBox,
	TextInput,
	Title,
} from '../../../components/forms/SimpleForm';
import fetchApi from '../../../lib/apis';
import Page, { PageProps } from '../../Page';

type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;

type RegEditValues = Omit<RegistryValues, '_id' | 'accountID' | 'id'>;

const timezones: Timezone[] = [
	'America/Hawaii',
	'America/Anchorage',
	'America/Los_Angeles',
	'America/Arizona',
	'America/Chicago',
	'America/Denver',
	'America/New_York',
	'America/Puerto_Rico',
];

interface RegEditState {
	values: RegEditValues;
	showSave: boolean;
}

interface RegEditFormValues {
	Contact: WebsiteContact;
	RankAndFile: RankAndFileInformation;
	Website: {
		Name: string;
		UnitName: string;
		PhotoLibraryImagesPerPage: number;
		ShowUpcomingEventCount: number;
		Separator: string;
		Timezone: number;
		FaviconID: string[];
	};
}

const saveMessage = {
	marginLeft: 10,
};

const convertStateToForm = (values: RegEditValues): RegEditFormValues => ({
	...values,
	Website: {
		...values.Website,
		FaviconID: Maybe.toArray(values.Website.FaviconID),
		Timezone: timezones.indexOf(values.Website.Timezone),
	},
});

const convertFormToState = (values: RegEditFormValues): RegEditValues => ({
	...values,
	Website: {
		...values.Website,
		FaviconID: Maybe.fromArray(values.Website.FaviconID),
		Timezone: timezones[values.Website.Timezone],
	},
});

export default class RegEdit extends Page<PageProps, RegEditState> {
	public state: RegEditState = {
		values: {
			Contact: {
				FaceBook: this.props.registry.Contact.FaceBook || '',
				Flickr: this.props.registry.Contact.Flickr || '',
				Instagram: this.props.registry.Contact.Instagram || '',
				LinkedIn: this.props.registry.Contact.LinkedIn || '',
				MailingAddress: this.props.registry.Contact.MailingAddress
					? {
							...this.props.registry.Contact.MailingAddress,
					  }
					: {
							FirstLine: '',
							Name: '',
							SecondLine: '',
					  },
				MeetingAddress: this.props.registry.Contact.MeetingAddress
					? {
							...this.props.registry.Contact.MeetingAddress,
					  }
					: {
							FirstLine: '',
							Name: '',
							SecondLine: '',
					  },
				Twitter: this.props.registry.Contact.Twitter || '',
				YouTube: this.props.registry.Contact.YouTube || '',
				Discord: this.props.registry.Contact.Discord || '',
			},
			RankAndFile: {
				Flights: this.props.registry.RankAndFile.Flights.slice(),
			},
			Website: {
				Name: this.props.registry.Website.Name,
				UnitName: this.props.registry.Website.UnitName,
				PhotoLibraryImagesPerPage: this.props.registry.Website.PhotoLibraryImagesPerPage,
				Separator: this.props.registry.Website.Separator,
				ShowUpcomingEventCount: this.props.registry.Website.ShowUpcomingEventCount,
				Timezone: this.props.registry.Website.Timezone,
				FaviconID: this.props.registry.Website.FaviconID,
			},
		},
		showSave: false,
	};

	public componentDidMount(): void {
		this.props.deleteReduxState();
		
		this.props.updateSideNav([
			{
				target: 'contact',
				text: 'Contact',
				type: 'Reference',
			},
			{
				target: 'rank-&-file',
				text: 'Rank & File',
				type: 'Reference',
			},
			{
				target: 'website',
				text: 'Website',
				type: 'Reference',
			},
		]);
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home',
			},
			{
				target: '/admin',
				text: 'Administration',
			},
			{
				target: '/admin/regedit',
				text: 'Site configuration',
			},
		]);
		this.updateTitle('Site configuration');
	}

	public render(): JSX.Element {
		if (!this.props.member) {
			return <div>Please sign in</div>;
		}

		if (!hasPermission('RegistryEdit')(Permissions.RegistryEdit.YES)(this.props.member)) {
			return <div>You do not have permission to do that</div>;
		}

		return (
			<SimpleForm<RegEditFormValues>
				onChange={this.onFormChange}
				values={convertStateToForm(this.state.values)}
				showSubmitButton={false}
			>
				<Title>Contact</Title>

				<FormBlock name="Contact">
					<Label>Facebook handle</Label>
					<TextInput name="FaceBook" />

					<Label>Flickr handle</Label>
					<TextInput name="Flickr" />

					<Label>YouTube handle</Label>
					<TextInput name="YouTube" />

					<Label>LinkedIn handle</Label>
					<TextInput name="LinkedIn" />

					<Label>Instagram handle</Label>
					<TextInput name="Instagram" />

					<Label>Twitter handle</Label>
					<TextInput name="Twitter" />

					<Label>Discord invite</Label>
					<TextInput name="Discord" />

					<FormBlock name="MeetingAddress">
						<Label>Meeting Location</Label>
						<TextInput name="Name" />

						<Label>Meeting Address Line 1</Label>
						<TextInput name="FirstLine" />

						<Label>Meeting Address Line 2</Label>
						<TextInput name="SecondLine" />
					</FormBlock>

					<FormBlock name="MailingAddress">
						<Label>Mailing Address Location</Label>
						<TextInput name="Name" />

						<Label>Mailing Address Line 1</Label>
						<TextInput name="FirstLine" />

						<Label>Mailing Address Line 2</Label>
						<TextInput name="SecondLine" />
					</FormBlock>
				</FormBlock>

				<Title>Rank &amp; File</Title>

				<FormBlock name="RankAndFile">
					<Label>Flight names</Label>
					<ListEditor<string>
						addNew={() => ''}
						extraProps={{}}
						inputComponent={TextInput}
						name="Flights"
						removeText="Remove flight"
						buttonText="Add flight"
					/>
				</FormBlock>

				<Title>Website</Title>

				<FormBlock name="Website">
					<Label>Website name</Label>
					<TextInput name="Name" />

					<Label>Full unit name (used for reports)</Label>
					<TextInput name="UnitName" />

					<Label>Title separator</Label>
					<TextInput name="Separator" />

					<Label>How many upcoming events to show</Label>
					<NumberInput name="ShowUpcomingEventCount" />

					<Label>What timezone does the unit primarily operate within?</Label>
					<Select
						labels={timezones.map(i => i.substr(8).replace('_', ' '))}
						name="Timezone"
					/>

					<Label>Shortcut icon (favicon)</Label>
					<FileInput
						name="FaviconID"
						single={true}
						filter={file =>
							file.fileName.endsWith('.png') ||
							file.fileName.endsWith('.ico') ||
							file.fileName.endsWith('.jpg')
						}
						account={this.props.account}
						member={this.props.member}
					/>
				</FormBlock>

				<TextBox>
					<Button buttonType="primaryButton" onClick={this.onSaveClick}>
						Save
					</Button>
					{this.state.showSave ? <span style={saveMessage}>Saved!</span> : null}
				</TextBox>
			</SimpleForm>
		);
	}

	private onFormChange = (formValues: RegEditFormValues): void => {
		const values = convertFormToState(formValues);
		this.setState({ values, showSave: false });
	};

	private onFormSubmit = async (formValues: RegEditFormValues): Promise<void> => {
		if (!this.props.member) {
			return;
		}

		const values = convertFormToState(formValues);

		if (
			values.Contact.MailingAddress &&
			values.Contact.MailingAddress.FirstLine === '' &&
			values.Contact.MailingAddress.SecondLine === '' &&
			values.Contact.MailingAddress.Name === ''
		) {
			values.Contact.MailingAddress = null;
		}
		if (
			values.Contact.MeetingAddress &&
			values.Contact.MeetingAddress.FirstLine === '' &&
			values.Contact.MeetingAddress.SecondLine === '' &&
			values.Contact.MeetingAddress.Name === ''
		) {
			values.Contact.MeetingAddress = null;
		}
		this.props.registry.Contact = values.Contact;
		this.props.registry.RankAndFile = values.RankAndFile;
		this.props.registry.Website = values.Website;

		await fetchApi.registry.set({}, this.props.registry);

		this.props.updateApp();
	};

	private onSaveClick = async (): Promise<void> => {
		await this.onFormSubmit(convertStateToForm(this.state.values));

		this.setState({
			showSave: true,
		});
	};
}
