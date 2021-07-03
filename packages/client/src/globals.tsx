import {
	ClientUser,
	Either,
	EitherObj,
	FullTeamObject,
	HTTPError,
	Member,
	MemberCreateError,
	SigninReturn,
} from 'common-lib';
import * as React from 'react';
import Loader from './components/Loader';
import fetchApi, { fetchAPIForAccount, TFetchAPI } from './lib/apis';

const { Consumer: MemberListConsumer, Provider: MemberListProvider } = React.createContext<{
	state: EitherObj<HTTPError, Member[]> | null;
	updateList: () => void;
}>({
	state: null,
	updateList: () => void 0,
});

export const withMemberList = <T extends { memberList: EitherObj<HTTPError, Member[]> }>(
	Component: React.FC<T> | (new (props: T) => React.Component<T>),
	LoaderComponent = Loader,
): React.FC<Omit<T, 'memberList'>> => props => (
	<MemberListConsumer>
		{details => {
			if (details.state === null) {
				details.updateList();

				return <LoaderComponent />;
			}

			if (Either.isLeft(details.state)) {
				details.updateList();
			}

			const newProps = ({
				...props,
				memberList: details.state,
			} as any) as T;

			return <Component {...newProps} />;
		}}
	</MemberListConsumer>
);

const { Consumer: TeamListConsumer, Provider: TeamListProvider } = React.createContext<{
	state: EitherObj<HTTPError, FullTeamObject[]> | null;
	updateList: () => void;
}>({
	state: null,
	updateList: () => void 0,
});

export const withTeamlist = <T extends { teamList: EitherObj<HTTPError, FullTeamObject[]> }>(
	Component: React.FC<T> | (new (props: T) => React.Component<T>),
	LoaderComponent = Loader,
): React.FC<Omit<T, 'teamList'>> => props => (
	<TeamListConsumer>
		{details => {
			if (details.state === null) {
				details.updateList();

				return <LoaderComponent />;
			}

			const newProps = ({
				...props,
				teamList: details.state,
			} as any) as T;

			return <Component {...newProps} />;
		}}
	</TeamListConsumer>
);

const { Consumer: MemberDetailsConsumer, Provider: MemberDetailsProvider } = React.createContext<{
	member: ClientUser | null;
	fullMember: SigninReturn;
}>({
	member: null,
	fullMember: {
		error: MemberCreateError.INVALID_SESSION_ID,
	},
});

export const withMember = <T extends { member: ClientUser | null; fullMember: SigninReturn }>(
	Component: React.FC<T> | (new (props: T) => React.Component<T>),
): React.FC<Omit<T, 'member' | 'fullMember'>> => props => (
	<MemberDetailsConsumer>
		{details => {
			const newProps = ({
				...props,
				...details,
			} as any) as T;

			return <Component {...newProps} />;
		}}
	</MemberDetailsConsumer>
);

export interface FetchAPIProps {
	fetchApi: TFetchAPI;
	fetchAPIForAccount: (accountID: string) => TFetchAPI;
}

const {
	Consumer: FetchAPIConsumer,
	Provider: FetchAPIProvider,
} = React.createContext<FetchAPIProps>({
	fetchApi,
	fetchAPIForAccount,
});

export const withFetchApi = <T extends FetchAPIProps>(
	Component: React.FC<T> | (new (props: T) => React.Component<T>),
): React.FC<Omit<T, 'fetchApi' | 'fetchAPIForAccount'> & Partial<FetchAPIProps>> => props => (
	<FetchAPIConsumer>
		{details => {
			const newProps = ({
				...details,
				...props,
			} as any) as T;

			return <Component {...newProps} />;
		}}
	</FetchAPIConsumer>
);

export { MemberListProvider, MemberDetailsProvider, TeamListProvider, FetchAPIProvider };
