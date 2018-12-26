import Validator from "../Validator";

export default class AccountObjectValidator extends Validator<NewAccountObject> {
	constructor() {
		super({
			adminIDs: {
				validator: Validator.ArrayOf(Validator.MemberReference)
			}
		});
	}
}