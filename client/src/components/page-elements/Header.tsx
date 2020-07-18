import { MaybeObj, RegistryValues } from 'common-lib';
import React, { FunctionComponent, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import jQuery, { bestfit } from '../../jquery.textfit';
import './Header.scss';

interface HeaderProps {
	registry: MaybeObj<RegistryValues>;
	loadingError: boolean;
}

export default (({ registry, loadingError }) => {
	const ref = React.createRef<HTMLDivElement>();

	useEffect(() => {
		if (ref.current) {
			bestfit(jQuery(ref.current));
		}
	});

	return (
		<>
			<header>
				{/* <img src alt="Civil Air Patrol" height="127" className="logo" /> */}
				{/* <div className="header-divider" /> */}
				<div className="page-title" ref={ref}>
					{loadingError
						? 'CAPUnit.com'
						: registry.hasValue
						? registry.value.Website.Name
						: null}
				</div>
				<div className="servings">
					<span className="servings-title">
						Citizens Serving
						<br />
						Communities
						{process.env.NODE_ENV === 'test' ? (
							<>
								<br />
								<br />
								<b style={{ color: 'red' }}>TEST BUILD</b>
							</>
						) : process.env.NODE_ENV === 'development' ? (
							<>
								<br />
								<br />
								<b style={{ color: 'red' }}> DEVELOPMENT BUILD</b>
							</>
						) : null}
					</span>
				</div>
			</header>
			<nav className="main-nav">
				<ul>
					<li>
						<NavLink to="/" exact={true} activeClassName="selected">
							Home
						</NavLink>
					</li>
					<li>
						<NavLink to="/calendar" activeClassName="selected">
							Calendar
						</NavLink>
					</li>
					<li>
						<NavLink to="/admin" activeClassName="selected">
							Administration
						</NavLink>
					</li>
				</ul>
			</nav>
		</>
	);
}) as FunctionComponent<HeaderProps>;
