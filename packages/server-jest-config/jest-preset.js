const TestConnection = require('./dist/index').TestConnection;

module.exports = {
	globalSetup: TestConnection.setup,
	globalTeardown: TestConnection.teardown
}