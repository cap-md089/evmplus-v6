import Validator from '../Validator';

export default new Validator<AbsenteeInformation>({
	absentUntil: {
		validator: Validator.Number
	},
	comments: {
		validator: Validator.String
	}
});
