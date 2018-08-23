import * as React from 'react';
import myFetch from '../../lib/myFetch';
import { Selector } from '../Form';
import Loader from '../Loader';
import { CombinedSelectorProps } from './Selector';

interface DownloadSelectorProps {
	valueUrl: string;
	requestProperties?: RequestInit;
	errorMessage?: string;
}

interface DownloadSelectorState<T extends Identifiable> {
	loaded: boolean;
	values: T[];
	error: boolean;
}

type CombinedDownloadSelectorProps<
	T extends Identifiable
> = CombinedSelectorProps<T> & DownloadSelectorProps;

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
			const result = await myFetch(
				this.props.valueUrl,
				this.props.requestProperties
			);

			const values = await result.json();

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
