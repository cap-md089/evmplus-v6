import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Form, { Title, Label, TextInput } from './Form';
import * as sinon from 'sinon';

import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

import { shallow, mount } from 'enzyme';

Enzyme.configure({ adapter: new Adapter() });

const nil = (e: React.FormEvent<HTMLInputElement>): void => {
	return;
};

describe ('<Form />', () => {
	it('renders without crashing', () => {
		const div = document.createElement('div');
		ReactDOM.render(
			<Form
				id="id"
				onSubmit={nil}
			/>,
			div
		);
		ReactDOM.unmountComponentAtNode(div);
	});

	describe ('handling of child components', () => {
		it ('shouldn\'t create labels that don\'t have an input', () => {
			let wrapper = shallow(
				<Form
					id="id"
					onSubmit={nil}
				>
					text
				</Form>
			);
			expect(wrapper.children().length).toEqual(1); // There is a submit button
		});

		it ('should have a title on its own row', () => {
			let wrapper = mount(
				<Form
					id="id"
					onSubmit={nil}
				>
					<Title>A title</Title>
				</Form>
			);
			expect(wrapper.at(0).children().length).toEqual(1);
		});

		it ('should pair labels and inputs', () => {
			let wrapper = mount(
				<Form
					id="id"
					onSubmit={nil}
				>
					<Label>A label</Label>
					<TextInput name="test" />
				</Form>
			);
			expect(wrapper.find('.formbar').length).toEqual(2);
			expect(wrapper.find('.formbar').at(0).children().length).toEqual(2);
			expect(wrapper.find('.formbar').at(0).children().at(0).text()).toEqual('A label');
		});
	});

	describe ('submissions', () => {
		it ('should have a submit button', () => {
			let wrapper = shallow(
				<Form
					id="id"
					onSubmit={nil}
				/>
			);
			let child = wrapper.children();
			expect(
				child.containsMatchingElement(
					<div className="formbar">
						<div className="formbox" />
						<div className="formbox">
							<input
								type="submit"
								value={'Submit'}
								className={'submit'}
							/>
						</div>
					</div>
				)
			).toEqual(true);
		});

		it ('should have a customizable submit button', () => {
			let submitInfo = {
				text: 'Click me!',
				className: 'formInput'
			};
			let wrapper = shallow(
				<Form
					id="id"
					onSubmit={nil}
					submitInfo={submitInfo}
				/>
			);
			let child = wrapper.children();
			expect(
				child.containsMatchingElement(
					<div className="formbar">
						<div className="formbox" />
						<div className="formbox">
							<input
								type="submit"
								value={submitInfo.text}
								className={submitInfo.className}
							/>
						</div>
					</div>
				)
			).toEqual(true);
		});

		it ('should submit and call the callback', () => {
			let submit = sinon.spy();
			let wrapper = mount(<Form id="id" onSubmit={submit} />);
			wrapper.find('input').simulate('submit');
			expect(submit.calledOnce).toEqual(true);
		});

		it ('should submit form data', () => {
			let submit = sinon.spy();
			let wrapper = mount(
				<Form
					id="id"
					onSubmit={submit}
				>
					<Label>
						El1
					</Label>
					<TextInput 
						name="name1"
						value="a string"
					/>
				</Form>
			);
			wrapper.find('[type="submit"]').at(0).simulate('submit');
			expect(submit.args[0][0]).toEqual(
				{
					name1: 'a string'
				}
			);
		});
	});
});