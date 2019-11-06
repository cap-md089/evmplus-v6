import { NewTaskObject } from 'common-lib';
import Validator from '../Validator';

export default new Validator<NewTaskObject>({
	description: {
		validator: Validator.String
	},
	name: {
		validator: Validator.String
	},
	tasker: {
		validator: Validator.MemberReference
	},
	tasked: {
		validator: Validator.ArrayOf(Validator.MemberReference)
	}
});
