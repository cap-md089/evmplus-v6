import getCookies from './nhq-authenticate';
import getID from './nhq-getcapid';
import getContact from './nhq-getcontact';
import getName from './nhq-getname';

export const nhq = {
	getContact,
	getCookies,
	getID,
	getName
};