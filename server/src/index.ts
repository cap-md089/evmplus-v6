import conf from './conf';
import getServer from './getServer';

getServer(conf).then(val => {
	console.log('Server bound');
});
