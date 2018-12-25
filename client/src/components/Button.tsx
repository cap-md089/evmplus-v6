import * as React from 'react';

export interface ButtonProps<C, S> {
	className?: string;
	id?: string;

	/**
	 * Data to use on button press
	 */
	data?: C;

	/**
	 * The function to handle data before a request is sent.
	 *
	 * Action is determined by return data
	 * If a promise, it will wait until it resolves. If it is an object, it will send the object
	 * If boolean (or a Promise that resolves to a boolean), it will send if true
	 * If anything else, it sends the object
	 *
	 * @param data The data currently being sent
	 *
	 * @returns {Promise<any> | boolean | any} Data to control the request
	 */
	onClick?: (data?: C) => Promise<any> | boolean | any;

	buttonType?: 'primaryButton' | 'secondaryButton' | ('none' | '');
}

export default class Button<C, S> extends React.Component<
	ButtonProps<C, S>,
	{
		disabled: boolean;
	}
> {
	constructor(props: ButtonProps<C, S>) {
		super(props);

		this.handleClick = this.handleClick.bind(this);
		this.state = {
			disabled: false
		};
	}

	public handleClick(e: React.MouseEvent<HTMLAnchorElement>): void {
		if (this.props.onClick) {
			this.props.onClick(this.props.data);
		}
	}

	public render() {
		return (
			<a
				onClick={this.handleClick}
				style={{
					cursor: 'pointer'
				}}
				className={
					(typeof this.props.buttonType === 'string'
						? ` ${this.props.buttonType}`
						: 'primaryButton') +
					(this.props.className
						? ` ${this.props.className}`
						: ' asyncButton')
				}
			>
				{this.props.children}
			</a>
		);
	}
}
