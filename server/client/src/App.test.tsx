import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App, { Head, Signin } from './App';
// import * as sinon from 'sinon';

describe ('<App />', () => {
	it('renders without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(<App isMobile={false} />, div);
		ReactDOM.unmountComponentAtNode(div);
	});
});

describe ('<Head />', () => {
	it('renders without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(<Head />, div);
		ReactDOM.unmountComponentAtNode(div);
	});
});

describe ('<Signin />', () => {
	it('renders without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(<Signin />, div);
		ReactDOM.unmountComponentAtNode(div);
	});

	it ('handles form changes', () => {
		// const handleChangeSpy = sinon.spy();
	});
});
