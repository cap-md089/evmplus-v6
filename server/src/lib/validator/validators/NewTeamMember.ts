import { NewTeamMember } from 'common-lib';
import Validator from '../Validator';

export default class NewTeamMemberValidator extends Validator<NewTeamMember> {
	constructor() {
		super({
			reference: {
				validator: Validator.MemberReference
			},
			job: {
				validator: Validator.String
			}
		});
	}
}
