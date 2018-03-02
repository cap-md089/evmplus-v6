import * as React from 'react';
import * as ReactDOM from 'react-dom';

import Button from './Button';

import * as Enzyme from 'enzyme';
import * as Adapter from 'enzyme-adapter-react-16';

import { shallow } from 'enzyme';

// import { stub, spy } from 'sinon';
import { spy } from 'sinon';

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
				onClick={buttonSpy}
				data={buttonData}
				url={'/api/echo'}
			>
				A link
			</Button>
		);
		button.find('a').simulate('click');
		expect(buttonSpy.calledWith(buttonData)).toEqual(true);
	});

	it (
		'should handle promises',
		done => {
			let testServerResponse = {
				hi: true
			};
			let onReceive = (params: any) => {
				expect(params).toEqual(testServerResponse);
				done();
			};
			let onClick = () => {
				return new Promise((res, rej) => {
					res(true);
				});
			};

			let button = shallow(
				<Button
					data={testServerResponse}
					onClick={onClick}
					onReceiveData={onReceive}
					url={'/api/echo'}
					buttonType={'primaryButton'}
				>
					A link
				</Button>
			);
			button.simulate('click');
		},
		250
	);

	it (
		'should handle false values',
		done => {
			let ajaxSpy = spy();
			let fetch = function () {
				ajaxSpy();
				return new Promise<Response>((res, rej) => {
					res({
						json: () => {
							return Promise.resolve({});
						}
					} as any as Response);
				});
			};
			let buttonData = {
				test1: 'test2'
			};
			let onReceive = (params: any) => {
				expect(ajaxSpy.notCalled).toEqual(true);
				done();
			};
			let onClick = () => {
				return Promise.resolve(false);
			};
			let button = shallow(
				<Button
					data={buttonData}
					onClick={onClick}
					onReceiveData={onReceive}
					url={'/test/test2'}
					fetch={fetch}
				>
					A link
				</Button>
			);
			button.simulate('click');

			setTimeout(
				() => {
					expect(ajaxSpy.calledOnce).toEqual(false);
					done();
				},
				190
			);
		},
		200
	);

	it (
		'should call onReceiveData immediately if no url is provided',
		done => {
			let buttonData = {
				url: '/'
			};

			let TestButton = Button as any as new() => Button<{
				url: string
			}, {
				url: string
			}>;

			let onReceive = spy();

			let button = shallow(
				<TestButton
					data={buttonData}
					onReceiveData={onReceive}
					buttonType={'primaryButton'}
				>
					A link
				</TestButton>
			);
			button.simulate('click');

			setTimeout(
				() => {
					expect(onReceive.calledOnce).toEqual(true);
					expect(onReceive.args[0][0]).toEqual(undefined);
					done();
				},
				10
			);
		},
		15
	);
});
