import 'core-js/stable';
import 'regenerator-runtime/runtime';
import 'promise-polyfill/src/polyfill';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
// import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter as Router } from 'react-router-dom';
import App, { MessageEventListener } from './App';
import './lib/MemberBase';
import MemberBase from './lib/MemberBase';
import './nhq.css';

const basicInfo: {
	member: MemberBase | null;
} = {
	member: null
};

ReactDOM.render(
	<Router>
		<App isMobile={false} basicInfo={basicInfo} />
	</Router>,
	document.getElementById('root') as HTMLElement
);

// registerServiceWorker();

window.addEventListener(
	'message',
	(event: MessageEvent): void => {
		if (event.data.source && event.data.source.indexOf('react-devtools') > -1) {
			return;
		}
		try {
			JSON.parse(event.data);
		} catch (e) {
			return;
		}
		MessageEventListener.publish(event);
	},
	false
);

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
