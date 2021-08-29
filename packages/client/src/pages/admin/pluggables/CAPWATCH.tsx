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

import { hasPermission, Permissions, ClientUser } from 'common-lib';
import * as React from 'react';
import { Link } from 'react-router-dom';
import Page, { PageProps } from '../../Page';

export const canUseDownload = (props: PageProps): boolean => {
	if (!props.member) {
		return false;
	}

	return hasPermission('DownloadCAPWATCH')(Permissions.DownloadCAPWATCH.YES)(props.member);
};

interface CAPWATCHWidgetProps extends PageProps {
	member: ClientUser;
}

export class CAPWATCHWidget extends Page<CAPWATCHWidgetProps> {
	public state: {} = {};

	public render = (): JSX.Element => (
		<div className="widget">
			<div className="widget-title">Create something</div>
			<div className="widget-body">
				<Link to="/admin/uploadcapwatch">Upload CAPWATCH file</Link>
			</div>
		</div>
	);
}
