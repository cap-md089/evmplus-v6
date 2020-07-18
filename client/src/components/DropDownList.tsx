import React, { ReactNode, PureComponent } from 'react';
import jQuery from 'jquery';
import './DropDownList.scss';

interface DropDownListProps<T> {
	open?: boolean[];
	onOpen?: (index: number) => void;
	onClose?: (index: number) => void;

	onlyOneOpen?: boolean;

	titles: (value: T, index: number, array: T[]) => ReactNode;
	children: (value: T, index: number, array: T[]) => ReactNode;
	values: T[];

	keyFunc?: (val: T, index: number, array: T[]) => string;
}

interface DropDownListState<T> {
	open: boolean[];
	previousValues: T[];
}

export default class DropDownList<T> extends PureComponent<
	DropDownListProps<T>,
	DropDownListState<T>
> {
	public static getDerivedStateFromProps<T>(
		props: DropDownListProps<T>,
		state: DropDownListState<T>
	): DropDownListState<T> | null {
		let open = props.open ?? state.open;

		if (open.length !== props.values.length) {
			open = props.values.map(val =>
				state.previousValues.includes(val)
					? state.open[state.previousValues.indexOf(val)]
					: false
			);
		}

		return {
			open,
			previousValues: props.values
		};
	}

	public state: DropDownListState<T> = {
		open: this.props.values.map(() => false),
		previousValues: [...this.props.values]
	};

	private divRefs: Array<HTMLDivElement | null> = [];
	private arrowRefs: Array<HTMLDivElement | null> = [];

	private get onlyOneOpen() {
		return this.props.onlyOneOpen ?? false;
	}

	public render() {
		return (
			<ul className="detailedlistplus">
				{this.props.values.map((val, ind, arr) => (
					<li key={`${ind}-${val}`}>
						<div
							className={`detailedlistplusrow ${
								this.state.open[ind] ? 'open' : 'closed'
							}`}
						>
							<div
								className={`detailedlistplusarrow ${
									this.state.open[ind] ? 'down' : ''
								}`}
								onClick={this.getToggleOpener(ind)}
								ref={ref => (this.arrowRefs[ind] = ref)}
							/>
							<div
								className="detailedlistplusname"
								onClick={this.getToggleOpener(ind)}
							>
								{this.props.titles(val, ind, arr)}
							</div>
						</div>
						<div
							className="detailedlistplusdesc"
							ref={ref => (this.divRefs[ind] = ref)}
						>
							{this.props.children(val, ind, arr)}
						</div>
					</li>
				))}
			</ul>
		);
	}

	private getToggleOpener(index: number) {
		return () => {
			if (this.state.open[index]) {
				const ref = this.divRefs[index];
				if (ref !== null) {
					const arrowRef = this.arrowRefs[index];
					if (arrowRef !== null) {
						jQuery(arrowRef).removeClass('down');
					}
					jQuery(ref).slideUp(400, 'swing', () => {
						const open = this.onlyOneOpen
							? this.state.open.map(f => false)
							: this.state.open.slice();

						open[index] = false;

						this.setState({ open }, () => {
							if (this.props.onClose) {
								this.props.onClose(index);
							}
						});
					});
				}
			} else {
				const ref = this.divRefs[index];
				if (ref !== null) {
					const arrowRef = this.arrowRefs[index];
					if (arrowRef !== null) {
						jQuery(arrowRef).addClass('down');
					}

					if (this.onlyOneOpen) {
						this.arrowRefs.forEach(arrRef => {
							if (arrRef !== null && arrRef !== arrowRef) {
								jQuery(arrRef).removeClass('down');
							}
						});
						this.divRefs.forEach(divRef => {
							if (divRef !== null && divRef !== ref) {
								jQuery(divRef).slideUp(400);
							}
						});
					}

					jQuery(ref).slideDown(400, 'swing', () => {
						const open = this.onlyOneOpen
							? this.state.open.map(f => false)
							: this.state.open.slice();

						open[index] = true;

						this.setState({ open }, () => {
							if (this.props.onOpen) {
								this.props.onOpen(index);
							}
						});
					});
				}
			}
		};
	}
}
