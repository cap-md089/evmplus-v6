import { NewBlogPage } from 'common-lib';
import Validator from '../Validator';
import RawDraftContentStateValidator from './RawDraftContentState';

export default class NewBlogPageValidator extends Validator<NewBlogPage> {
	constructor() {
		super({
			content: {
				validator: new RawDraftContentStateValidator()
			},
			title: {
				validator: Validator.String
			}
		});
	}
}
