import * as React from 'react';
import { Omit, RegistryValues } from 'common-lib';
import Page, { PageProps } from '../../Page';
import SimpleForm, { Title, FormBlock, Label, NumberInput, TextInput, ListEditor, TextBox } from '../../../components/forms/SimpleForm';
import Button from '../../../components/Button';

type RegEditValues = Omit<RegistryValues, '_id' | 'accountID' | 'id'>;

interface RegEditState {
	values: RegEditValues;
	showSave: boolean;
}

const saveMessage = {
	marginLeft: 10
}

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
				YouTube: this.props.registry.Contact.YouTube || ''
			},
			RankAndFile: {
				Flights: this.props.registry.RankAndFile.Flights.slice()
			},
			Website: {
				Name: this.props.registry.Website.Name,
				PhotoLibraryImagesPerPage: this.props.registry.Website.PhotoLibraryImagesPerPage,
				Separator: this.props.registry.Website.Separator,
				ShowUpcomingEventCount: this.props.registry.Website.ShowUpcomingEventCount
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
				target: 'blog',
				text: 'Blog',
				type: 'Reference'
			},
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

		if (!this.props.member.hasPermission('RegistryEdit')) {
			return <div>You do not have permission to do that</div>;
		}

		return (
			<SimpleForm<RegEditValues>
				onChange={this.onFormChange}
				values={this.state.values}
				showSubmitButton={false}
			>
				<Title>Blog</Title>

				<FormBlock name="Blog">
					<Label>Blog Posts per Page</Label>
					<NumberInput name="BlogPostsPerPage" />
				</FormBlock>

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

					<Label>How many photos to show per page on the photo library</Label>
					<NumberInput name="PhotoLibraryImagesPerPage" />
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

	private onFormChange(values: RegEditValues) {
		this.setState({ values, showSave: false });
	}

	private async onFormSubmit(values: RegEditValues) {
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

		await this.props.registry.save(this.props.member!);

		this.props.updateApp();
	}

	private async onSaveClick() {
		await this.onFormSubmit(this.state.values);

		this.setState({
			showSave: true
		});
	}
}
