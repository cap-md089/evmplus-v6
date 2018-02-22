import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Button from './Button';

import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

import { shallow } from 'enzyme';

// import { stub, spy } from 'sinon';
import { spy } from 'sinon';

import * as jQuery from 'jquery';

Enzyme.configure({ adapter: new Adapter() });

// stub(jQuery, 'ajax');

// afterAll(() => {
// 	(jQuery.ajax as any as {restore: () => void}).restore();
// });

describe ('<Button />', () => {
	it ('should render without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(
			<Button />,
			div
		);
		ReactDOM.unmountComponentAtNode(div);
	});

	it ('should handle passing data around', () => {
		let buttonSpy = spy();
		let buttonData = {
			test1: 'test2'
		};
		let button = shallow(
			<Button
				jQuery={jQuery}
				onClick={buttonSpy}
				data={buttonData}
				url={'/test/test2'}
			>
				A link
			</Button>
		);
		button.find('a').simulate('click');
		expect(buttonSpy.calledWith(buttonData)).toEqual(true);
		expect(buttonSpy.args[0][0]).toEqual(buttonData);
	});

	it ('should handle promises correctly', () => {
		let jQuerySpy = {
			getJSON: spy()
		} as any as JQueryStatic<HTMLElement>;
		let buttonData = {
			test1: 'test2'
		};
		let onClick = () => {
			return new Promise((res, rej) => {
				setTimeout(
					() => {
						res(true);
					},
					1
				);
			});
		};
		let button = shallow(
			<Button
				jQuery={jQuerySpy}
				data={buttonData}
				onClick={onClick}
				url={'/test/test2'}
			>
				A link
			</Button>
		);
	});
});