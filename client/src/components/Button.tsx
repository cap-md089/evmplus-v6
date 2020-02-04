import * as React from 'react';
import './Button.scss';

export interface ButtonProps {
	className?: string;
	id?: string;

	useData?: false;

	/**
	 * Called when the button is clicked, passes the data given to it
	 */
	onClick?: () => void;

	buttonType?: 'primaryButton' | 'secondaryButton' | ('none' | '');
}

export interface ButtonPropsWithData<C> {
	className?: string;
	id?: string;

	useData: true;
	/**
	 * Data to use on button press
	 */
	data: C;

	/**
	 * Called when the button is clicked, passes the data given to it
	 */
	onClick?: (data: C) => void;

	buttonType?: 'primaryButton' | 'secondaryButton' | ('none' | '');
}

export default class Button<C> extends React.Component<
	ButtonPropsWithData<C> | ButtonProps,
	{
		disabled: boolean;
	}
> {
	constructor(props: ButtonPropsWithData<C> | ButtonProps) {
		super(props);

		this.handleClick = this.handleClick.bind(this);
		this.state = {
			disabled: false
		};
	}

	public handleClick(e: React.MouseEvent<HTMLButtonElement>): void {
		e.preventDefault();

		if (this.props.onClick) {
			if (this.props.useData) {
				this.props.onClick(this.props.data);
			} else {
				this.props.onClick();
			}
		}
	}

	public render() {
		return (
			<button
				onClick={this.handleClick}
				style={{
					cursor: 'pointer'
				}}
				className={
					(this.props.buttonType === 'none' ? 'linkButton ' : '') +
					(typeof this.props.buttonType === 'string'
						? ` ${this.props.buttonType}`
						: 'primaryButton') +
					(this.props.className ? ` ${this.props.className}` : ' asyncButton')
				}
			>
				{this.props.children}
			</button>
		);
	}
}
