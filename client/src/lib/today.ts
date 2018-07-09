import { DateTime } from 'luxon';

export default () => DateTime.utc().startOf('day');