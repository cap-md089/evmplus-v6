import Validator from "../Validator";

class AddressValidator extends Validator<{
	Name: string,
	FirstLine: string,
	SecondLine: string
}> {
	constructor() {
		super({
			Name: {
				validator: Validator.String
			},
			FirstLine: {
				validator: Validator.String
			},
			SecondLine: {
				validator: Validator.String
			}
		})
	}
}

class ContactValidator extends Validator<WebsiteContact> {
	constructor() {
		super({
			FaceBook: {
				required: false,
				validator: Validator.String
			},
			Flickr: {
				required: false,
				validator: Validator.String
			},
			Instagram: {
				required: false,
				validator: Validator.String
			},
			LinkedIn: {
				required: false,
				validator: Validator.String
			},
			MailingAddress: {
				required: false,
				validator: new AddressValidator()
			},
			MeetingAddress: {
				required: false,
				validator: new AddressValidator()
			},
			Twitter: {
				required: false,
				validator: Validator.String
			},
			YouTube: {
				required: false,
				validator: Validator.String
			}
		})
	}
}

class WebsiteValidator extends Validator<WebsiteInformation> {
	constructor() {
		super({
			Name: {
				validator: Validator.String
			},
			Separator: {
				validator: Validator.String
			},
			ShowUpcomingEventCount: {
				validator: Validator.Number
			},
			PhotoLibraryImagesPerPage: {
				validator: Validator.Number
			}
		});
	}
}

class BlogValidator extends Validator<BlogInformation> {
	constructor() {
		super({
			BlogPostsPerPage: {
				validator: Validator.Number
			}
		})
	}
}

export default class RegistryValueValidator extends Validator<RegistryValues> {
	constructor() {
		super({
			Blog: {
				validator: new BlogValidator()
			},
			Contact: {
				validator: new ContactValidator()
			},
			Website: {
				validator: new WebsiteValidator()
			},
			_id: {
				validator: Validator.String
			},
			accountID: {
				validator: Validator.String
			},
			id: {
				validator: Validator.String
			}
		})
	}
}