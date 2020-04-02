import { DiscordServerInformation, NewAccountObject } from 'common-lib';
import Validator, { MaybeValidator } from '../Validator';

export default class AccountObjectValidator extends Validator<NewAccountObject> {
	constructor() {
		super({
			adminIDs: {
				validator: Validator.ArrayOf(Validator.MemberReference)
			},
			discordServer: {
				validator: MaybeValidator(
					new Validator<DiscordServerInformation>({
						serverID: {
							validator: Validator.String
						},
						displayFlight: {
							validator: Validator.Boolean
						}
					})
				)
			}
		});
	}
}
