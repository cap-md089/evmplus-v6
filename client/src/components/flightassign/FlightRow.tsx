import * as React from 'react';
import jQuery from 'jquery';

import './FlightRow.css';
import FlightMember from './FlightMember';
import { MemberReference } from 'common-lib';
import { CAPMemberClasses } from '../../lib/Members';

interface FlightRowProps {
	open: boolean;
	onDragStart: (flight: string) => void;
	onDrop: (member: MemberReference) => void;
	members: CAPMemberClasses[];
	name: string;
	first: boolean;
	highlighted: boolean;
	index: number;
}

interface FlightRowState {
	open: boolean;
	divHeight: number;
}

const topBorder: React.CSSProperties = {
	borderTopWidth: 1
};

export default class FlightRow extends React.Component<FlightRowProps, FlightRowState> {
	public state: FlightRowState = {
		open: true,
		divHeight: 0
	};

	private namesDiv = React.createRef<HTMLDivElement>();
	private titleDiv = React.createRef<HTMLDivElement>();

	public constructor(props: FlightRowProps) {
		super(props);

		this.onDragStart = this.onDragStart.bind(this);
		this.onDrop = this.onDrop.bind(this);
		this.handleOver = this.handleOver.bind(this);
		this.grow = this.grow.bind(this);
		this.shrink = this.shrink.bind(this);
	}

	public shouldComponentUpdate(newProps: FlightRowProps, newState: FlightRowState) {
		if (this.props.open !== newProps.open) {
			return true;
		}

		if (this.props.members.length !== newProps.members.length) {
			return true;
		}

		if (this.props.highlighted !== newProps.highlighted) {
			return true;
		}

		if (newState.divHeight !== this.state.divHeight) {
			return true;
		}

		if (newState.open !== this.state.open) {
			return true;
		}

		return false;
	}

	public componentDidUpdate() {
		if (this.state.open && !this.props.open && this.namesDiv.current && this.titleDiv.current) {
			jQuery(this.namesDiv.current).slideUp(() => {
				this.setState({
					open: false
				})
			});
			jQuery(this.titleDiv.current).animate({
				height: 40,
				'font-size': 32
			})
		} else if (!this.state.open && this.props.open && this.namesDiv.current && this.titleDiv.current) {
			jQuery(this.namesDiv.current).slideDown(() => {
				this.setState({
					open: true
				})
			});
			jQuery(this.titleDiv.current).animate({
				height: 16,
				'font-size': 14
			})
		}
		if (this.namesDiv.current && this.state.divHeight !== this.namesDiv.current.scrollHeight) {
			this.setState({
				divHeight: this.namesDiv.current.scrollHeight
			});
		}
	}

	public componentDidMount() {
		if (this.namesDiv.current) {
			this.setState({
				divHeight: this.namesDiv.current.scrollHeight
			});
		}
	}

	public render() {
		return (
			<div
				className="flightrow"
				style={this.props.first ? topBorder : undefined}
				onDrop={this.onDrop}
				onDragOver={this.handleOver}
				onDragEnd={this.handleOver}
				onDragExit={this.handleOver}
				onDragLeave={this.handleOver}
				onDragEnter={this.handleOver}
				id={this.props.name.toLowerCase() + '-' + this.props.index}
			>
				<div
					className="flightrow-name"
					onDrop={this.onDrop}
					onDragOver={this.handleOver}
					onDragEnd={this.handleOver}
					onDragExit={this.handleOver}
					onDragLeave={this.handleOver}
					onDragEnter={this.handleOver}
					ref={this.titleDiv}
				>
					{this.props.name}
				</div>
				<div
					className={(this.state.open && this.props.open) ? 'flightrow-names-open' : ''}
					onDrop={this.onDrop}
					onDragOver={this.handleOver}
					onDragEnd={this.handleOver}
					onDragExit={this.handleOver}
					onDragLeave={this.handleOver}
					onDragEnter={this.handleOver}
					ref={this.namesDiv}
				>
					{this.props.members.map((mem, index) => (
						<FlightMember
							member={mem}
							key={index}
							onDrop={this.onDrop}
							onDragStart={this.onDragStart}
						/>
					))}
				</div>
			</div>
		);
	}

	private onDragStart() {
		this.props.onDragStart(this.props.name);
	}

	private onDrop(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		e.stopPropagation();

		const ref = JSON.parse(e.dataTransfer.getData('text')) as MemberReference;

		this.props.onDrop(ref);
	}

	private handleOver(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		e.stopPropagation();
	}

	private shrink() {
		if (
			this.namesDiv.current &&
			parseInt(this.namesDiv.current.style.maxHeight || '0', 10) > -1
		) {
			let height = parseInt(this.namesDiv.current.style.maxHeight || '0', 10);
			height -= 40;

			this.namesDiv.current.style.maxHeight = height.toString() + 'px';

			setTimeout(this.shrink, 40);
		} else {
			this.setState({
				open: false
			});
		}
	}

	private grow() {
		if (
			this.namesDiv.current &&
			parseInt(this.namesDiv.current.style.maxHeight || '0', 10) < this.state.divHeight
		) {
			let height = parseInt(this.namesDiv.current.style.maxHeight || '0', 10);
			height += 40;

			this.namesDiv.current.style.maxHeight = height.toString() + 'px';

			setTimeout(this.grow, 40);
		} else {
			this.setState({
				open: true
			});
		}
	}
}
