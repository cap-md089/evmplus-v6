/**
 * Copyright (C) 2021 Andrew Rioux
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

import type { Namespace, Server } from 'socket.io';
import type { io, Socket } from 'socket.io-client';

type SocketPaths = 'member:capwatch:importcapwatch';

const SocketPathsImpl = {
	'member:capwatch:importcapwatch': 'member:capwatch:importcapwatch',
};

export const getServerNamespace = (namespace: SocketPaths, server: Server): Namespace =>
	server.of(SocketPathsImpl[namespace]);

export const getClientNamespace = (namespace: SocketPaths, client: typeof io): Socket =>
	process.env.NODE_ENV === 'development'
		? client(`http://md089.localevmplus.org:3001/${SocketPathsImpl[namespace]}`, {
				withCredentials: true,
		  })
		: client(SocketPathsImpl[namespace], {
				withCredentials: true,
		  });
