import { Admin, getPermissions, Manager, Member, Staff } from "../../lib/Permissions";

describe ('permission level get', () => {
	it('should return the correct permission levels', () => {
		expect(getPermissions('Member')).toEqual(Member);
		expect(getPermissions('Staff')).toEqual(Staff);
		expect(getPermissions('Manager')).toEqual(Manager);
		expect(getPermissions('Admin')).toEqual(Admin);

		// This is meant to throw an error, just check that the JS works not the TS
		// @ts-ignore
		expect(getPermissions('Not a permission level')).toEqual(null);
	});
});