import * as React from 'react';
import { InputProps } from './Input';
import { identity } from 'common-lib';
import { default as ReactAutocomplete } from 'react-autocomplete';
import './Autocomplete.scss';

interface AutocompleteProps<T> extends InputProps<T> {
	items: T[];
	renderItem: (item: T, isHighlighted: boolean) => React.ReactChild;
}

interface LaxAutocompleteProps extends Omit<AutocompleteProps<string>, 'renderItem'> {
	renderItem?: (item: string, isHighlighted: boolean) => React.ReactChild;
}

export default class LaxAutocomplete extends React.Component<LaxAutocompleteProps> {
	public render() {
		return (
			<div className="input-formbox">
				<ReactAutocomplete
					autoHighlight={true}
					items={this.props.items}
					getItemValue={identity}
					renderItem={(value, isHighlighted) => (
						<div>{(this.props.renderItem ?? identity)(value, isHighlighted)}</div>
					)}
					value={this.props.value ?? ''}
					onChange={e => this.update(e.target.value)}
					onSelect={val => this.update(val)}
					shouldItemRender={(item, value) =>
						item.toLowerCase().includes(value.toLowerCase())
					}
				/>
			</div>
		);
	}

	private update(value: string) {
		this.props.onUpdate?.({
			name: this.props.name,
			value,
		});

		this.props.onChange?.(value);
	}
}
