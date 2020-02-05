#!/usr/bin/env node

import conf from './conf';
import getServer from './getServer';

getServer(conf).then(val => {
	val.finishServerSetup();
	console.log('Server bound');
});
