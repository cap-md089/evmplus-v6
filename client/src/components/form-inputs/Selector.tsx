import * as React from 'react';
import { TextInput } from '../Form';
import { InputProps } from './Input';

import './Selector.css';

export interface SelectorProps<T extends Identifiable> {
	showIDField: boolean;
	returnIDs?: boolean;
	filters?: Array<{
		check: (value: T, input: any) => boolean;
		filterInput: new () => React.Component<InputProps<any>>;
		displayText: string;
	}>;
	displayValue: (val: T) => React.ReactChild;
	values: T[];
}

interface SelectorPropsSingle<T extends Identifiable>
	extends InputProps<T>,
		SelectorProps<T> {
	multiple: false;
}

interface SelectorPropsMultiple<T extends Identifiable>
	extends InputProps<T[]>,
		SelectorProps<T> {
	multiple: true;
}

interface SelectorState<T extends Identifiable> {
	filterID: string;
	filterValues: any;
}

export type CombinedSelectorProps<T extends Identifiable> =
	| SelectorPropsSingle<T>
	| SelectorPropsMultiple<T>;

export default class Selector<T extends Identifiable> extends React.Component<
	CombinedSelectorProps<T>,
	SelectorState<T>
> {
	public state: SelectorState<T> = {
		filterID: '',
		filterValues: []
	};

	public constructor(props: CombinedSelectorProps<T>) {
		super(props);

		if (
			typeof this.props.onInitialize !== 'undefined' &&
			this.props.multiple
		) {
			this.props.onInitialize({
				name: this.props.name,
				value: (this.props.value || [])
			});
		} else if (
			typeof this.props.onInitialize !== 'undefined' &&
			!this.props.multiple &&
			typeof this.props.value !== 'undefined'
		) {
			this.props.onInitialize({
				name: this.props.name,
				value: this.props.value || this.props
			});
		}
	}

	public render() {
		const filteredIDValues =
			this.state.filterID === ''
				? this.props.values.slice()
				: this.props.values.filter(
						val =>
							typeof val.id === 'number'
								? val.id ===
								  parseInt(this.state.filterID.toString(), 10)
								: val.id === this.state.filterID
				  );

		const filteredValues = filteredIDValues.filter(val =>
			(this.props.filters || [])
				.map(({ check }, i) => check(val, this.state.filterValues[i]))
				.reduce((prev, curr) => prev && curr, true)
		);

		return (
			<div
				className="formbox selector-box"
				style={{
					clear: 'both',
					width: '98%'
				}}
			>
				<div className="selector-filters">
					<ul>
						{this.props.showIDField ? (
							<li>
								<div className="selector-left-filter">ID:</div>
								<div className="selector-right-filter">
									<TextInput
										name="null"
										value={this.state.filterID.toString()}
										onChange={filterID =>
											this.setState({ filterID })
										}
									/>
								</div>
							</li>
						) : null}
						{(this.props.filters || []).map((value, i) => (
							<li key={i}>
								<div className="selector-left-filter">
									{value.displayText}
								</div>
								<div className="selector-right-filter">
									<value.filterInput
										value={this.state.filterValues[i] || ''}
										name="null"
										onChange={this.getFilterValueUpdater(i)}
									/>
								</div>
							</li>
						))}
					</ul>
				</div>
				<ul className="selector-values">
					{filteredValues.map((val, i) => (
						<li
							key={i}
							onClick={this.getSelector(val)}
							className={
								(this.props.multiple
								? (this.props.value || [])
										.map(value => value.id)
										.indexOf(val.id) > -1
								: typeof this.props.value !== 'undefined' && this.props.value.id === val.id)
									? 'selected'
									: ''
							}
						>
							{this.props.displayValue(val)}
						</li>
					))}
				</ul>
			</div>
		);
	}

	private getFilterValueUpdater(i: number) {
		return ((e: any) => {
			const filterValues = this.state.filterValues.slice();

			filterValues[i] = e;

			this.setState({ filterValues });
		}).bind(this);
	}

	private getSelector(val: T) {
		return ((e: any) => {
			if (!this.props.multiple) {
				if (this.props.onChange) {
					this.props.onChange(val);
				}

				if (this.props.onUpdate) {
					this.props.onUpdate({
						name: this.props.name,
						value: val
					});
				}

				return;
			}

			const index = (this.props.value || [])
				.map(value => value.id)
				.indexOf(val.id);

			if (index > -1) {
				const newList = (this.props.value || []).slice();

				newList.splice(index, 1);

				if (this.props.onChange) {
					this.props.onChange(newList);
				}

				if (this.props.onUpdate) {
					this.props.onUpdate({
						name: this.props.name,
						value: newList
					});
				}
			} else {
				const newList = [...(this.props.value || []), val];

				if (this.props.onChange) {
					this.props.onChange(newList);
				}

				if (this.props.onUpdate) {
					this.props.onUpdate({
						name: this.props.name,
						value: newList
					});
				}
			}
		}).bind(this);
	}
}
