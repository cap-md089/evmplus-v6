import Validator from '../Validator';
import RawDraftContentStateValidator from './RawDraftContentState';

export default class NewBlogPostValidator extends Validator<NewBlogPost> {
	constructor() {
		super({
			title: {
				validator: Validator.String
			},
			content: {
				validator: new RawDraftContentStateValidator()
			}
		});
	}
}
