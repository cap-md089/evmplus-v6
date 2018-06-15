import * as React from 'react';
import * as ReactDOM from 'react-dom';

import * as ReactTestUtils from 'react-dom/test-utils';

import TextInput from './TextInput';
import * as sinon from 'sinon';

import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

import { mount } from 'enzyme';
Enzyme.configure({ adapter: new Adapter() });

describe('<TextInput />', () => {
	it ('should render without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(
			<TextInput name="test1" onChange={console.log} />,
			div
		);
		ReactDOM.unmountComponentAtNode(div);
	});

	it ('should call the update function on text update', () => {
		let spy = sinon.spy();
		let wrapper = mount(
			<TextInput name="test1" onChange={spy} />
		);
		let node = wrapper.find('input').instance();
		(node as any as {value: string}).value = 'text';
		ReactTestUtils.Simulate.change(node);
		expect(spy.calledOnce).toEqual(true);
		expect(spy.args[0][1]).toEqual('text');
	});
});