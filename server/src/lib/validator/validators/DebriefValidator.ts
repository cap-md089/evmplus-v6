import { DebriefItem } from 'common-lib';
import Validator from '../Validator';
export default class DebriefValidator extends Validator<DebriefItem> {
	constructor() {
		super({
			memberRef: {
				validator: Validator.MemberReference
			},
			timeSubmitted: {
				validator: Validator.Number
			},
			debriefText: {
				validator: Validator.String
			}
		});
	}
}
