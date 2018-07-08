import * as moment from 'moment';

export default () => {
	const today = moment();
	today.set('hour', 0);
	today.set('minute', 0);
	today.set('second', 0);
	today.set('millisecond', 0);
	return today;
};