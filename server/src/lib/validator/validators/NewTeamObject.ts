import { TeamPublicity } from '../../../enums';
import Validator from '../Validator';
import NewTeamMemberValidator from './NewTeamMember';

export default class NewTeamObjectValidator extends Validator<NewTeamObject> {
	constructor() {
		super({
			name: {
				validator: Validator.String
			},
			members: {
				validator: Validator.ArrayOf(new NewTeamMemberValidator())
			},
			description: {
				validator: Validator.String
			},
			cadetLeader: {
				validator: Validator.MemberReference
			},
			seniorMentor: {
				validator: Validator.MemberReference
			},
			seniorCoach: {
				validator: Validator.MemberReference
			},
			visibility: {
				validator: Validator.Enum(TeamPublicity)
			}
		});
	}
}
