const { resolve } = require('path');

module.exports = {
	globalSetup: require(resolve(__dirname, 'setup.js')),
	globalTeardown: require(resolve(__dirname, 'teardown.js')),
};
