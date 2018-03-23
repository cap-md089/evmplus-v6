import * as React from 'react';
import * as ReactDOM from 'react-dom';

import RequestForm from './RequestForm';

import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';
import { mount } from 'enzyme';

import TextInput from './form-inputs/TextInput';

Enzyme.configure({ adapter: new Adapter() });

import { spy } from 'sinon';

describe ('<RequestForm />', () => {
	it ('should render without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(
			<RequestForm 
				url={'/api/echo'}
				onSubmit={console.log}
				id="test"
			/>,
			div
		);
		ReactDOM.unmountComponentAtNode(div);
	});

	it (
		'should handle passing data around',
		() => {
			let dataSpy = spy();
			let form = mount(
				<RequestForm
					id="test"
					onReceiveData={dataSpy}
					onSubmit={dataSpy}
					url={'/api/echo'}
				>
					Test
					<TextInput
						name="test"
						value="test"
					/>
				</RequestForm>
			);
			form.find('[type="submit"]').at(0).simulate('submit');
			expect(dataSpy.args[0][0]).toEqual(
				{
					test: 'test'
				}
			);
		},
		25
	);
});