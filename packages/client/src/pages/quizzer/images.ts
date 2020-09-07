/**
 * Copyright (C) 2020 Andrew Rioux, Melissa Trick
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

import { QuizInput } from './Quizzer';

import chiefInsignia from './images/800px-CCMSgt.jpg';
import chiefFsInsignia from './images/FSC_updated.png';
import lindberghInsignia from './images/800px-MSgt.jpg';
import lindberghFsInsignia from './images/FSM_updated.png';
import doolittleInsignia from './images/SMSgt_updated.png';
import doolittleFsInsignia from './images/FSS_updated.png';
import achievementRibbon from './images/Achievement_Ribbon.jpg';
import afaRibbon from './images/AFAribbonCAP.jpg';
import afsaRibbon from './images/AFSA.jpg';
import airSARribbon from './images/AirSAR.jpeg';
import armstrongRibbon from './images/Armstrong_E0754338898BE.jpg';
import arnoldRibbon from './images/Arnold_C94EF019751DA.jpg';
import bronzeMedalOfValorRibbon from './images/Bronze_MV_final.jpg';
import cacRibbon from './images/CAC.jpg';
import natComUnitCitationRibbon from './images/CAP_National_Commander\'s_Unit_Citation_Award.jpg';
import colorGuardRibbon from './images/Color_Guard.jpg';
import commandersCommRibbon from './images/Commanders_Comm.jpg';
import communityServiceRibbon from './images/Community_Service.jpg';
import curryRibbon from './images/curry_247B66A73F15F.jpg';
import disasterReliefRibbon from './images/Disaster_relief_with_V.jpg';
import distinguishedServiceRibbon from './images/Distinguished_Service.jpg';
import doolittleRibbon from './images/Doolittle_2CB62D7E8B6A2.jpg';
import encampmentRibbon from './images/Encampment.jpg';
import exceptionalServiceRibbon from './images/Exceptional_service.jpg';
import feikRibbon from './images/Feik_DDC27FC77F518.jpg';
import findRibbon from './images/Find.jpg';
import goddardRibbon from './images/goddard_688A90DC083B4.jpg';
import iaceRibbon from './images/IACE.jpg';
import lifesavingRibbon from './images/Lifesaving.jpg';
import lindberghRibbon from './images/Lindbergh_2A1F5A3AE59E4.jpg';
import meritoriousRibbon from './images/Meritorious_service.jpg';
import ncsaRibbon from './images/NCSA_ribbon.jpg';
import organizationalExcellenceRibbon from './images/Organizational_Excellence_ribbon.jpg';
import recruiterRibbon from './images/Recruiter.jpg';
import redServiceRibbon from './images/Red_service.jpg';
import rickenbackerRibbon from './images/Rickenbacker_34238296E42C5.jpg';
import silverMedalOfValorRibbon from './images/Silver_MV_final.jpg';
import unitCitationRibbon from './images/Unit_Citation.jpg';
import vfwNCORibbon from './images/VFW_NCO.jpg';
import vfwOfficerRibbon from './images/VFW_Officer.jpg';
import wrightBroRibbon from './images/wright_copy_3CD609F4385EA.jpg';

export type InsigniaKeys =
	| 'lindberghInsigniaChecked'
	| 'lindberghFsInsigniaChecked'
	| 'doolittleInsigniaChecked'
	| 'doolittleFsInsigniaChecked'
	| 'chiefInsigniaChecked'
	| 'chiefFsInsigniaChecked';

export const insigniaURLs: { [K in InsigniaKeys]: string } = {
	lindberghInsigniaChecked: lindberghInsignia,
	lindberghFsInsigniaChecked: lindberghFsInsignia,
	doolittleInsigniaChecked: doolittleInsignia,
	doolittleFsInsigniaChecked: doolittleFsInsignia,
	chiefInsigniaChecked: chiefInsignia,
	chiefFsInsigniaChecked: chiefFsInsignia,
};

export type RibbonKeys = Exclude<keyof QuizInput, InsigniaKeys | 'grade'>;

export const ribbonURLs: { [K in RibbonKeys]: string } = {
	curryChecked: curryRibbon,
	arnoldChecked: arnoldRibbon,
	feikChecked: feikRibbon,
	wrightBrothersChecked: wrightBroRibbon,
	rickenbackerChecked: rickenbackerRibbon,
	lindbergChecked: lindberghRibbon,
	doolittleChecked: doolittleRibbon,
	goddardChecked: goddardRibbon,
	armstrongChecked: armstrongRibbon,
	AFOEAChecked: organizationalExcellenceRibbon,
	encampmentChecked: encampmentRibbon,
	nCSAsChecked: ncsaRibbon,
	recruitChecked: recruiterRibbon,
	cACChecked: cacRibbon,
	colorGuardChecked: colorGuardRibbon,
	communityServiceChecked: communityServiceRibbon,
	airSARChecked: airSARribbon,
	findChecked: findRibbon,
	disasterReliefChecked: disasterReliefRibbon,
	vFW_NCOChecked: vfwNCORibbon,
	aFSAChecked: afsaRibbon,
	unit_CitationChecked: unitCitationRibbon,
	lifesavingChecked: lifesavingRibbon,
	national_Unit_CitationChecked: natComUnitCitationRibbon,
	cAP_AchievementChecked: achievementRibbon,
	commanders_CommendationChecked: commandersCommRibbon,
	meritorious_serviceChecked: meritoriousRibbon,
	exceptional_serviceChecked: exceptionalServiceRibbon,
	distinguished_serviceChecked: distinguishedServiceRibbon,
	bronze_MVChecked: bronzeMedalOfValorRibbon,
	silver_MVChecked: silverMedalOfValorRibbon,
	iaceChecked: iaceRibbon,
	vfwOfficer: vfwOfficerRibbon,
	afaChecked: afaRibbon,
	redService: redServiceRibbon,
};
