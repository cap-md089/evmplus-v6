#!/usr/bin/env node

import conf from './conf';
import getServer from './getServer';
import setup from 'discord-bot';

getServer(conf)
	.then(({ finishServerSetup, capwatchEmitter, conf: config, app }) => {
		setup(config, capwatchEmitter);

		return finishServerSetup;
	})
	.then(val => {
		val();
		console.log('Server bound');
	});
