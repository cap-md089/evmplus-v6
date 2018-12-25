import EventValidator from "./lib/validator/validators/EventValidator";

const eventValidator = new EventValidator();

console.log(eventValidator.validate({
	"_id": "00005bb2064f0000000000000001", 
	"acceptSignups": true, 
	"accountID": "mdx89", 
	"activity": [
		[
			false, 
			false, 
			false, 
			false, 
			false, 
			false
		], 
		""
	], 
	"administrationComments": "", 
	"attendance": [], 
	"author": {
		kind: 'CAPNHQMember'
	}, 
	"comments": "", 
	"complete": false, 
	"debrief": "", 
	"desiredNumberOfParticipants": 8, 
	"endDateTime": 1538144400, 
	"eventWebsite": "", 
	"fileIDs": [], 
	"groupEventNumber": [
		0, 
		""
	], 
	"highAdventureDescription": "", 
	"id": 5, 
	"location": "Airport", 
	"lodgingArrangments": [
		[
			false, 
			false, 
			false, 
			false, 
			false
		], 
		""
	], 
	"mealsDescription": [
		[
			false, 
			false, 
			false, 
			false, 
			false
		], 
		""
	], 
	"meetDateTime": 1538140500, 
	"meetLocation": "Airport", 
	"name": "Test event 4", 
	"pickupDateTime": 1538144700, 
	"pickupLocation": "Airport", 
	"pointsOfContact": [
		{
			email: 'arioux303931@gmail.com',
			memberReference: {
				id: 542488,
				type: 'CAPNHQMember'
			},
			phone: '2404960443',
			receiveEventUpdates: false,
			receiveRoster: false,
			receiveSignUpUpdates: false,
			receiveUpdates: false,
			type: 0
		}
	], 
	"publishToWingCalendar": false, 
	"requiredEquipment": [], 
	"requiredForms": [
		[
			true, 
			false, 
			false, 
			false, 
			false, 
			false, 
			false, 
			false
		], 
		""
	], 
	"showUpcoming": true, 
	"startDateTime": 1538140800, 
	"status": [
		0, 
		""
	], 
	"teamID": 0, 
	"timeCreated": 1538399848, 
	"timeModified": 1538399848, 
	"transportationDescription": "", 
	"transportationProvided": false, 
	"uniform": [
		[
			false, 
			false, 
			true, 
			false, 
			false, 
			false, 
			false, 
			false, 
			false
		], 
		""
	]
}));
console.log(eventValidator.getErrors());