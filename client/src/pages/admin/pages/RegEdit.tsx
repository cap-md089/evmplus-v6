import * as React from 'react';
import Page, { PageProps } from 'src/pages/Page';
import SimpleForm, {
	Title,
	Label,
	NumberInput,
	FormBlock,
	TextInput,
	ListEditor
} from 'src/components/forms/SimpleForm';

type RegEditValues = Omit<RegistryValues, '_id' | 'accountID' | 'id'>;

export default class RegEdit extends Page<PageProps, RegEditValues> {
	public state: RegEditValues = {
		Blog: {
			BlogPostsPerPage: this.props.registry.Blog.BlogPostsPerPage
		},
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
	};

	public constructor(props: PageProps) {
		super(props);

		this.onFormChange = this.onFormChange.bind(this);
		this.onFormSubmit = this.onFormSubmit.bind(this);
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
			<SimpleForm
				onChange={this.onFormChange}
				onSubmit={this.onFormSubmit}
				values={this.state}
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
						<Label>The name of the meeting address</Label>
						<TextInput name="Name" />

						<Label>The first line for the meeting address</Label>
						<TextInput name="FirstLine" />

						<Label>The second line for the meeting address</Label>
						<TextInput name="SecondLine" />
					</FormBlock>

					<FormBlock name="MailingAddress">
						<Label>The name of the mailing address</Label>
						<TextInput name="Name" />

						<Label>The first line for the mailing address</Label>
						<TextInput name="FirstLine" />

						<Label>The second line for the mailing address</Label>
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
			</SimpleForm>
		);
	}

	private onFormChange(values: RegEditValues) {
		this.setState(values);
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
		this.props.registry.Blog = values.Blog;
		this.props.registry.Contact = values.Contact;
		this.props.registry.RankAndFile = values.RankAndFile;
		this.props.registry.Website = values.Website;

		await this.props.registry.save(this.props.member!);

		this.props.updateApp();
	}
}
