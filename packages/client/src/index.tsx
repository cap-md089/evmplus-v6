/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 * 
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 * 
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

import 'core-js';
// import 'promise-polyfill/src/polyfill';
import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
// import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter as Router } from 'react-router-dom';
import 'regenerator-runtime/runtime';
import App from './App';

ReactDOM.render(
	<Router>
		<App isMobile={false} />
	</Router>,
	document.getElementById('root') as HTMLElement,
);

// registerServiceWorker();

// if (module.hot) {
// 	module.hot.accept();
// }

// window.addEventListener('error', async ev => {
// 	const error = ev.error;
// 	// eslint-disable-next-line no-console
// 	console.log('Caught error', ev.error);

// 	const stacks = parse(error);

// 	const errorObject: NewClientErrorObject = {
// 		componentStack: '',
// 		message: error.message,
// 		pageURL: location.href,
// 		resolved: false,
// 		stack: stacks.map(stack => ({
// 			filename: stack.getFileName(),
// 			line: stack.getLineNumber(),
// 			column: stack.getColumnNumber(),
// 			name: stack.getFunctionName()
// 		})),
// 		timestamp: Date.now(),
// 		type: 'Client'
// 	};

// 	ErrorMessage.Create(errorObject, basicInfo.member, await Account.Get());

// 	return true;
// });

// @ts-ignore: This is done to store a global variable without webpack mangling the name, so that I can actually find it
// eslint-disable-next-line dot-notation
window['CLIENT_VERSION'] = process.env.REACT_APP_VERSION;
