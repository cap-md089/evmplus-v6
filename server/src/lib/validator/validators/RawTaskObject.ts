import { RawTaskObject } from 'common-lib';
import Validator from '../Validator';

export default new Validator<RawTaskObject>({
	description: {
		validator: Validator.String
	},
	name: {
		validator: Validator.String
	},
	tasker: {
		validator: Validator.MemberReference
	}
});
