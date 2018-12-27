import * as React from 'react';
import { Selector } from '../Form';
import Loader from '../Loader';
import { CombinedSelectorProps } from './Selector';

interface DownloadSelectorProps<T extends Identifiable> {
	values: Promise<T[]>;
	errorMessage?: string;
}

interface DownloadSelectorState<T extends Identifiable> {
	loaded: boolean;
	values: T[];
	error: boolean;
}

export type CombinedDownloadSelectorProps<
	T extends Identifiable
> = CombinedSelectorProps<T> & DownloadSelectorProps<T>;

export default class DownloadSelector<
	T extends Identifiable
> extends React.Component<
	CombinedDownloadSelectorProps<T>,
	DownloadSelectorState<T>
> {
	public state: DownloadSelectorState<T> = {
		loaded: false,
		values: [],
		error: false
	};

	public async componentDidMount() {
		try {
			const values = await this.props.values;

			this.setState({
				values,
				loaded: true
			});
		} catch (e) {
			this.setState({
				error: true,
				loaded: true
			});
		}
	}

	public render() {
		return !this.state.loaded ? (
			<Loader />
		) : this.state.error ? (
			this.props.errorMessage || 'Could not load values'
		) : (
			<Selector {...this.props} values={this.state.values} />
		);
	}
}
