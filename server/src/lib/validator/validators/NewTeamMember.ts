import Validator from "../Validator";

export default class NewTeamMemberValidator extends Validator<TeamMember> {
	constructor() {
		super({
			reference: {
				validator: Validator.MemberReference
			},
			job: {
				validator: Validator.String
			},
			joined: {
				validator: Validator.Number
			}
		})
	}
}