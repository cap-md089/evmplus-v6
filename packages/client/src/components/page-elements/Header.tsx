/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of EvMPlus.org.
 *
 * EvMPlus.org is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * EvMPlus.org is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with EvMPlus.org.  If not, see <http://www.gnu.org/licenses/>.
 */

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
						? 'EvMPlus.org'
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
