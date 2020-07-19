//   "proxy": {
//     "/api": {
//       "target": "http://md089.localcapunit.com:3001"
//     },
//     "/images": {
//       "target": "http://md089.localcapunit.com:3001"
//     }
//   }

// @ts-ignore
const proxy = require('http-proxy-middleware');

module.exports = function(app) {
	app.use(
		proxy('/api', {
			target: 'http://localhost:3001'
		}),
		proxy('/images', {
			target: 'http://localhost:3001'
		})
	);
};
