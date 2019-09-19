import * as React from 'react';
import './LoaderShort.css';

export default class LoaderShort extends React.Component<{}, { display: boolean }> {
	public state = {
		display: false
	};

	private handle: NodeJS.Timer | null = null;

	public componentDidMount() {
		this.handle = setInterval(() => {
			this.setState({
				display: true
			});
			if (this.handle) {
				clearInterval(this.handle);
			}
		}, 200);
	}

	public componentWillUnmount() {
		if (this.handle) {
			clearInterval(this.handle);
		}
	}

	public render() {
		return (
			<div className="svg-loader">
				{this.state.display ? (
					<svg width="300" height="55">
						<circle
							className="svg-loader-circle-1"
							cx="50"
							cy="27"
							r="10"
							fill="#00b2ff"
						/>
						<circle
							className="svg-loader-circle-2"
							cx="100"
							cy="27"
							r="10"
							fill="#00b2ff"
						/>
						<circle
							className="svg-loader-circle-3"
							cx="150"
							cy="27"
							r="10"
							fill="#00b2ff"
						/>
						<circle
							className="svg-loader-circle-4"
							cx="200"
							cy="27"
							r="10"
							fill="#00b2ff"
						/>
						<circle
							className="svg-loader-circle-5"
							cx="250"
							cy="27"
							r="10"
							fill="#00b2ff"
						/>
					</svg>
				) : null}
			</div>
		);
	}
}
