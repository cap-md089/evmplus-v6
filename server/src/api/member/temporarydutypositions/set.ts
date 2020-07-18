import { ServerAPIEndpoint } from 'auto-client-api';
import {
	api,
	asyncEither,
	CAPMember,
	destroy,
	errorGenerator,
	parseStringMemberReference,
	SessionType,
	ShortCAPUnitDutyPosition,
	ShortDutyPosition,
} from 'common-lib';
import { PAM, resolveReference, saveExtraMemberInformation } from 'server-common';
import { getExtraMemberInformationForCAPMember } from 'server-common/dist/member/members/cap';

const getDutyPosition = (now = Date.now) => (oldPositions: ShortDutyPosition[]) => (duty: string) =>
	oldPositions.find(({ duty: oldDuty, type }) => duty === oldDuty && type === 'CAPUnit') ?? {
		type: 'CAPUnit' as const,
		duty,
		date: now(),
	};

const updateDutyPosition = (now = Date.now) => (oldPositions: ShortDutyPosition[]) => ({
	duty,
	expires,
}: ShortCAPUnitDutyPosition) => ({
	...getDutyPosition(now)(oldPositions)(duty),
	expires,
});

const getNewPositions = (now = Date.now) => (
	newPositions: Array<Omit<ShortCAPUnitDutyPosition, 'date'>>
) => (oldPositions: ShortDutyPosition[]): ShortDutyPosition[] => [
	...newPositions.map(updateDutyPosition(now)(oldPositions)),
	...oldPositions.filter(({ type }) => type !== 'CAPUnit'),
];

export const func: () => ServerAPIEndpoint<
	api.member.temporarydutypositions.SetTemporaryDutyPositions
> = (now = Date.now) =>
	PAM.RequireSessionType(SessionType.REGULAR)(
		PAM.RequiresPermission('AssignTemporaryDutyPositions')(req =>
			asyncEither(
				parseStringMemberReference(req.params.id),
				errorGenerator('Could not parse member ID')
			)
				.flatMap(resolveReference(req.mysqlx)(req.account))
				.map<CAPMember>(member => ({
					...member,
					dutyPositions: getNewPositions(now)(req.body.dutyPositions)(
						member.dutyPositions
					),
				}))
				.tap(member => {
					req.memberUpdateEmitter.emit('memberChange', {
						member,
						account: req.account,
					});
				})
				.flatMap(getExtraMemberInformationForCAPMember(req.account))
				.flatMap(saveExtraMemberInformation(req.mysqlx)(req.account))
				.map(destroy)
		)
	);

export default func();
