import {
	hasPermission,
	RankAndFileInformation,
	RegistryValues,
	Timezone,
	WebsiteContact
} from 'common-lib';
import * as React from 'react';
import Button from '../../../components/Button';
import Select from '../../../components/form-inputs/Select';
import SimpleForm, {
	FormBlock,
	Label,
	ListEditor,
	NumberInput,
	TextBox,
	TextInput,
	Title
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
	'America/Puerto_Rico'
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
		PhotoLibraryImagesPerPage: number;
		ShowUpcomingEventCount: number;
		Separator: string;
		Timezone: number;
	};
}

const saveMessage = {
	marginLeft: 10
};

const convertStateToForm = (values: RegEditValues): RegEditFormValues => ({
	...values,
	Website: {
		...values.Website,
		Timezone: timezones.indexOf(values.Website.Timezone)
	}
});

const convertFormToState = (values: RegEditFormValues): RegEditValues => ({
	...values,
	Website: {
		...values.Website,
		Timezone: timezones[values.Website.Timezone]
	}
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
							...this.props.registry.Contact.MailingAddress
					  }
					: {
							FirstLine: '',
							Name: '',
							SecondLine: ''
					  },
				MeetingAddress: this.props.registry.Contact.MeetingAddress
					? {
							...this.props.registry.Contact.MeetingAddress
					  }
					: {
							FirstLine: '',
							Name: '',
							SecondLine: ''
					  },
				Twitter: this.props.registry.Contact.Twitter || '',
				YouTube: this.props.registry.Contact.YouTube || '',
				Discord: this.props.registry.Contact.Discord || ''
			},
			RankAndFile: {
				Flights: this.props.registry.RankAndFile.Flights.slice()
			},
			Website: {
				Name: this.props.registry.Website.Name,
				PhotoLibraryImagesPerPage: this.props.registry.Website.PhotoLibraryImagesPerPage,
				Separator: this.props.registry.Website.Separator,
				ShowUpcomingEventCount: this.props.registry.Website.ShowUpcomingEventCount,
				Timezone: this.props.registry.Website.Timezone
			}
		},
		showSave: false
	};

	public constructor(props: PageProps) {
		super(props);

		this.onFormChange = this.onFormChange.bind(this);
		this.onFormSubmit = this.onFormSubmit.bind(this);
		this.onSaveClick = this.onSaveClick.bind(this);
	}

	public componentDidMount() {
		this.props.updateSideNav([
			{
				target: 'contact',
				text: 'Contact',
				type: 'Reference'
			},
			{
				target: 'rank-&-file',
				text: 'Rank & File',
				type: 'Reference'
			},
			{
				target: 'website',
				text: 'Website',
				type: 'Reference'
			}
		]);
		this.props.updateBreadCrumbs([
			{
				target: '/',
				text: 'Home'
			},
			{
				target: '/admin',
				text: 'Administration'
			},
			{
				target: '/admin/regedit',
				text: 'Site configuration'
			}
		]);
		this.updateTitle('Site configuration');
	}

	public render() {
		if (!this.props.member) {
			return <div>Please sign in</div>;
		}

		if (hasPermission('RegistryEdit')()(this.props.member)) {
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
					/>
				</FormBlock>

				<Title>Website</Title>

				<FormBlock name="Website">
					<Label>Website name</Label>
					<TextInput name="Name" />

					<Label>Title separator</Label>
					<TextInput name="Separator" />

					<Label>How many upcoming events to show</Label>
					<NumberInput name="ShowUpcomingEventCount" />

					<Label>What timezone does the unit primarily operate within?</Label>
					<Select
						labels={timezones.map(i => i.substr(8).replace('_', ' '))}
						name="Timezone"
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

	private onFormChange(formValues: RegEditFormValues) {
		const values = convertFormToState(formValues);
		this.setState({ values, showSave: false });
	}

	private async onFormSubmit(formValues: RegEditFormValues) {
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

		await fetchApi.registry.set({}, this.props.registry, this.props.member.sessionID);

		this.props.updateApp();
	}

	private async onSaveClick() {
		await this.onFormSubmit(convertStateToForm(this.state.values));

		this.setState({
			showSave: true
		});
	}
}
