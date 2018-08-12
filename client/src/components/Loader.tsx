import * as React from 'react';
import './loader.css';

export default class Loader extends React.Component<
	{},
	{ display: boolean }
> {
	public state = {
		display: false
	};

	private handle: NodeJS.Timer;

	public componentDidMount() {
		this.handle = setInterval(() => {
			this.setState({
				display: true
			});
			clearInterval(this.handle);
		}, 200);
	}

	public componentWillUnmount() {
		clearInterval(this.handle);
	}

	public render() {
		return this.state.display ? (
			<div>
				<div
					className="uil-default-css"
					style={{
						transform: 'scale(0.6)',
						margin: '20px auto'
					}}
				>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(0deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute'
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(30deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute'
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(60deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute'
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(90deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute'
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(120deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute'
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(150deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute'
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(180deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute'
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(210deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute'
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(240deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute'
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(270deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute'
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(300deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute'
						}}
					/>
					<div
						style={{
							top: 80,
							left: 93,
							width: 14,
							height: 40,
							background: '#00b2ff',
							transform: 'rotate(330deg) translate(0,-60px)',
							borderRadius: 10,
							position: 'absolute'
						}}
					/>
				</div>
			</div>
		) : null;
	}
}
