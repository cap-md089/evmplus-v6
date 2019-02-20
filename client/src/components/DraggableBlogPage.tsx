import * as React from 'react';
import './DraggableBlogPage.css';
import BlogPage from '../lib/BlogPage';

interface DraggableBlogPageProps {
	page: BlogPage;
	pageList: BlogPage[];
	onDrop: (targetPageID: BlogPage, currentPage: BlogPage) => void;
	ableToManage: boolean;
}

export default class DraggableBlogPage extends React.Component<
	DraggableBlogPageProps,
	{
		hovering: boolean;
	}
> {
	public state = {
		hovering: false
	};

	constructor(props: DraggableBlogPageProps) {
		super(props);

		this.handleOver = this.handleOver.bind(this);
		this.handleOff = this.handleOff.bind(this);
		this.handleDrop = this.handleDrop.bind(this);
		this.dragStart = this.dragStart.bind(this);
	}

	public render() {
		const style: React.CSSProperties = {
			marginLeft: (this.props.page.ancestry.length + (this.props.ableToManage ? 1 : 0)) * 30
		};

		return this.props.ableToManage ? (
			<div
				className="draggable-page able-to-manage"
				style={style}
				onDragOver={this.handleOver}
				onDragEnd={this.handleOff}
				onDragLeave={this.handleOff}
				onDragEnter={this.handleOver}
				draggable={true}
				onDrop={this.handleDrop}
				onDragStart={this.dragStart}
			>
				{this.props.page.title}
			</div>
		) : (
			<div className="draggable-page static" style={style}>
				{this.props.page.title}
			</div>
		);
	}

	private handleOff() {
		this.setState({
			hovering: false
		});
	}

	private handleOver(e: React.DragEvent<HTMLDivElement>) {
		e.stopPropagation();
		e.preventDefault();

		this.setState({
			hovering: true
		});
	}

	private handleDrop(e: React.DragEvent<HTMLDivElement>) {
		e.stopPropagation();
		e.preventDefault();

		const thatPageID = e.dataTransfer.getData('text');

		if (thatPageID === this.props.page.id) {
			return;
		}

		// From the perspective of the one that started the drag
		const thatPage = this.props.page;
		const thisPage = this.props.pageList.filter(
			page => page.id === thatPageID
		)[0];

		this.props.onDrop(thatPage, thisPage);
	}

	private dragStart(e: React.DragEvent<HTMLDivElement>) {
		const dataToSet = this.props.page.id;

		e.dataTransfer.setData('text', dataToSet);
	}
}
