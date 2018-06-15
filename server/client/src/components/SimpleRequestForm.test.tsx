import * as React from 'react';
import * as ReactDOM from 'react-dom';

import RequestForm from './SimpleRequestForm';

import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';
import { mount } from 'enzyme';

import TextInput from './form-inputs/TextInput';
import { spy } from 'sinon';

Enzyme.configure({ adapter: new Adapter() });

describe ('<RequestForm />', () => {
	describe ('Button-like algorithms', () => {
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
				let form = mount(
					<RequestForm
						id="test"
						onSubmit={
							data => {
								expect(data).toEqual(
									{
										test: 'test'
									}
								);
								return true;
							}
						}
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
			}
		);

		it (
			'should handle promises',
			done => {
				let form = mount(
					<RequestForm
						id="test"
						onReceiveData={
							data => {
								expect(data).toEqual(
									{
										test: 'test'
									}
								);
								done();
							}
						}
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
			},
			500
		);

		it (
			'should handle false values',
			done => {
				let formSpy = spy();
				let form = mount (
					<RequestForm
						id="test"
						onReceiveData={formSpy}
						onSubmit={
							data => Promise.resolve(false)
						}
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
				setTimeout(
					() => {
						expect(formSpy.calledOnce).toEqual(false);
						done();
					},
					400
				);
			},
			1500
		);
	});
});
