/**
 * Copyright (C) 2020 Andrew Rioux
 *
 * This file is part of Event Manager.
 *
 * Event Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * Event Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Event Manager.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Verifies that the password meets security requirements
 *
 * @param password the password to check
 */
export const passwordMeetsRequirements = (password: string): boolean =>
	password.length > 32 ||
	(password.length >= 11 &&
		// lowercase letter
		!!password.match(/[a-z]/g) &&
		// uppercase letter
		!!password.match(/[A-Z]/g) &&
		// number
		!!password.match(/[0-9]/g) &&
		// symbol
		!!password.match(/[ ^!@#$%&*(){}+=_\-<>,.?/[\]\\|;'"]/g));
