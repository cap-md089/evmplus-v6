import 'core-js/stable';
import 'promise-polyfill/src/polyfill';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
// import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter as Router } from 'react-router-dom';
import 'regenerator-runtime/runtime';
import App from './App';
import './lib/MemberBase';
import './_theme.scss';

ReactDOM.render(
	<Router>
		<App isMobile={false} />
	</Router>,
	document.getElementById('root') as HTMLElement
);

// registerServiceWorker();

if (module.hot) {
	module.hot.accept();
}

// window.addEventListener('error', async ev => {
// 	const error = ev.error;
// 	// tslint:disable-next-line:no-console
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
