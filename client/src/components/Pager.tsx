import * as React from 'react';

import './Pager.css';

interface PagerProps<T> {
	/**
	 * A 1 based index of what page the user should be on
	 */
	page: number;
	onChangePageNumber: (newPageNumber: number, currentPageItems: T[]) => void;
	dataset: T[];
	renderFunction: (datum: T) => React.ReactChild;
	dataCountPerPage: number;
}

export default class Pager<T> extends React.Component<PagerProps<T>> {
	constructor(props: PagerProps<T>) {
		super(props);
	}

	public render() {
		const start = (this.props.page - 1) * this.props.dataCountPerPage;

		if (start > this.props.dataset.length || start < 0) {
			return null;
		}

		const renderDataset: T[] = [];

		for (
			let i = start;
			i < this.props.dataset.length &&
			i < this.props.dataCountPerPage + start;
			i++
		) {
			renderDataset.push(this.props.dataset[i]);
		}

		const pageCount = Math.ceil(
			this.props.dataset.length / this.props.dataCountPerPage
		);

		return (
			<div>
				{this.renderPageControls(this.props.page, pageCount)}
				{renderDataset.map(this.props.renderFunction)}
				{this.renderPageControls(this.props.page, pageCount)}
			</div>
		);
	}

	private renderPageControls(page: number, pageCount: number) {
		switch (pageCount) {
			case 1:
				return (
					<div className="pagination-controls">
						<span
							className="highlighted"
							onMouseDown={this.controlClick(1)}
						>
							1
						</span>
					</div>
				);

			case 2:
				return (
					<div className="pagination-controls">
						<span
							className={page === 1 ? 'highlighted' : ''}
							onMouseDown={this.controlClick(1)}
						>
							1
						</span>
						<span
							className={page === 2 ? 'highlighted' : ''}
							onMouseDown={this.controlClick(2)}
						>
							2
						</span>
					</div>
				);

			case 3:
				return (
					<div className="pagination-controls">
						<span
							className={page === 1 ? 'highlighted' : ''}
							onMouseDown={this.controlClick(1)}
						>
							1
						</span>
						<span
							className={page === 2 ? 'highlighted' : ''}
							onMouseDown={this.controlClick(2)}
						>
							2
						</span>
						<span
							className={page === 3 ? 'highlighted' : ''}
							onMouseDown={this.controlClick(3)}
						>
							3
						</span>
					</div>
				);

			case 4:
				return (
					<div className="pagination-controls">
						<span
							className={page === 1 ? 'highlighted' : ''}
							onMouseDown={this.controlClick(1)}
						>
							1
						</span>
						<span
							className={page === 2 ? 'highlighted' : ''}
							onMouseDown={this.controlClick(2)}
						>
							2
						</span>
						<span
							className={page === 3 ? 'highlighted' : ''}
							onMouseDown={this.controlClick(3)}
						>
							3
						</span>
						<span
							className={page === 4 ? 'highlighted' : ''}
							onMouseDown={this.controlClick(4)}
						>
							4
						</span>
					</div>
				);

			case 5:
				return (
					<div className="pagination-controls">
						<span
							className={page === 1 ? 'highlighted' : ''}
							onMouseDown={this.controlClick(1)}
						>
							1
						</span>
						<span
							className={page === 2 ? 'highlighted' : ''}
							onMouseDown={this.controlClick(2)}
						>
							2
						</span>
						<span
							className={page === 3 ? 'highlighted' : ''}
							onMouseDown={this.controlClick(3)}
						>
							3
						</span>
						<span
							className={page === 4 ? 'highlighted' : ''}
							onMouseDown={this.controlClick(4)}
						>
							4
						</span>
						<span
							className={page === 5 ? 'highlighted' : ''}
							onMouseDown={this.controlClick(5)}
						>
							5
						</span>
					</div>
				);

			default:
				return (
					<div className="pagination-controls">
						<span
							className={page === 1 ? 'highlighted' : ''}
							onMouseDown={this.controlClick(1)}
						>
							1
						</span>
						{page > 3 ? ' ... ' : null}
						{page > 2 ? (
							<span onMouseDown={this.controlClick(page - 1)}>
								{page - 1}
							</span>
						) : null}
						{page > 1 && page < pageCount ? (
							<span
								className="highlighted"
								onMouseDown={this.controlClick(page)}
							>
								{page}
							</span>
						) : null}
						{page < pageCount - 1 ? (
							<span onMouseDown={this.controlClick(page + 1)}>
								{page + 1}
							</span>
						) : null}
						{page < pageCount - 2 ? ' ... ' : null}
						<span
							className={page === pageCount ? 'highlighted' : ''}
							onMouseDown={this.controlClick(pageCount)}
						>
							{pageCount}
						</span>
					</div>
				);
		}
	}

	private controlClick(page: number) {
		return ((e: React.MouseEvent<HTMLSpanElement>) => {
			const start = (page - 1) * this.props.dataCountPerPage;

			if (start > this.props.dataset.length) {
				return;
			}

			const renderDataset: T[] = [];

			for (
				let i = start;
				i < this.props.dataset.length &&
				i < this.props.dataCountPerPage + start;
				i++
			) {
				renderDataset.push(this.props.dataset[i]);
			}

			this.props.onChangePageNumber(page, renderDataset);
		}).bind(this);
	}
}
