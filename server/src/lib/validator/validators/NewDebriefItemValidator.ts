import { NewDebriefItem } from 'common-lib';
import Validator from '../Validator';

export default new Validator<NewDebriefItem>({
	debriefText: {
		validator: Validator.String
	}
});
