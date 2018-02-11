import * as React from 'react';

// https://reactjs.org/docs/forms.html

export class Label extends React.Component {
	public IsLabel = true;

	render() {
		return (
			<div className="formbox">
				{this.props.children}
			</div>
		);
	}
}

export class Title extends React.Component {
	public IsLabel = true;

	render() {
		return (
			<div className="formbox">
				<h3>{this.props.children}</h3>
			</div>
		);
	}
}

export default class Form<T> extends React.Component<{}, T> {
	constructor (props: {}) {
		super(props);
	}

	public onChange (e: React.FormEvent<HTMLInputElement>) {
		this.setState(Object.assign(
			{},
			this.state,
			{
				[e.currentTarget.name]: e.currentTarget.value
			}
		));
	}

	render () {
		return (
			<form>
				{
					React.Children.map(this.props.children, (child: React.ReactChild & { IsInput?: boolean }, i) => {
						if (typeof this.props.children === 'undefined' || this.props.children === null) {
							throw new TypeError('Some React error occurred');
						}
						let ret;
						if (!React.isValidElement(child)) {
							throw new TypeError('Form: Children must be a React element');
						}
						if (typeof (
							child as React.ReactChild & { IsInput?: boolean }
						).IsInput === 'undefined' ||
						!(
							child as React.ReactChild & { IsInput?: boolean }
						).IsInput) {
							if (typeof (
								child as React.ReactChild & { IsLabel?: boolean }
							).IsLabel === 'undefined' ||
							!(
								child as React.ReactChild & { IsLabel?: boolean }
							).IsLabel) {
								throw new TypeError('Form: Children must be either an input, label, or title');
							}
							return;
						} else {
							ret = [
								React.cloneElement(
									child as React.ReactElement<{
										onChange: (e: React.FormEvent<HTMLInputElement>) => void
									}>,
									{
										onChange: this.onChange
									}
								)
							];
						}
						if (i > 0 && (this.props.children as React.ReactNode[])[i - 1]) {
							ret.unshift(
								this.props.children[i - 1]
							);
						} else {
							ret.unshift(
								<div
									className="formbar"
									style={{
										height: 2
									}}
								/>
							);
						}
						
						return <div className="formbar">{ret}</div>;
					})}
			</form>
		);
	}
}

export {default as TextInput} from './form-inputs/TextInput';