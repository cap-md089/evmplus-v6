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

import * as React from 'react';
import Page from './Page';
import './ribbonBuilder.css';

interface Ribbons {
	SilverValor: boolean;
	BronzeValor: boolean;
	DistinguishedService: boolean;
	ExceptionalService: boolean;
	MeritoriousService: boolean;
	CommandersCommendation: boolean;
	CAPAchievement: boolean;
	Lifesaving: boolean;
	NatCommanderUnitCitation: boolean;
	UnitCitation: boolean;
	Spaatz: boolean;
	Eaker: boolean;
	Earhart: boolean;
	Mitchell: boolean;
	Armstrong: boolean;
	Goddard: boolean;
	Doolittle: boolean;
	Lindbergh: boolean;
	Rickenbacker: boolean;
	Wright: boolean;
	Feik: boolean;
	Arnold: boolean;
	Curry: boolean;
	AFA: boolean;
	SegwartsAssociation: boolean;
	ForeignWarVet: boolean;
	RedService: boolean;
	SearchFind: boolean;
	AirSAR: boolean;
	DisasterRelief: boolean;
	CommunityService: boolean;
	IACE: boolean;
	CadetCompetition: boolean;
	ColorGuard: boolean;
	CAC: boolean;
	NCSA: boolean;
	Encampment: boolean;
	Recruiter: boolean;
}

class Ribbon extends React.Component<{
	source: keyof Ribbons;
}> {
	public render(): JSX.Element {
		const names: { [P in keyof Ribbons]: string } = {
			SilverValor: 'Silver Medal of Valor',
			BronzeValor: 'Bronze Medal of Valor',
			DistinguishedService: 'Distinguished Service Award',
			ExceptionalService: 'Exceptional Service Award',
			MeritoriousService: 'Meritorious Service Award',
			CommandersCommendation: "Commander's Commendation Award",
			CAPAchievement: 'CAP Achievement Award',
			Lifesaving: 'Certificate of Recognition For Life Saving',
			NatCommanderUnitCitation: 'National Commanders Unit Citation Award',
			UnitCitation: 'Unit Citation Award',
			Spaatz: 'Gen Carl A. Spaatz Award',
			Eaker: 'Gen Ira C. Eaker Award',
			Earhart: 'Amelia Earhart Award',
			Mitchell: 'Gen Billy Mitchell Award',
			Armstrong: 'Neil Armstrong Achievement',
			Goddard: 'Dr. Robert H. Goddard Achievement',
			Doolittle: 'Gen Jimmy Doolittle Achievement',
			Lindbergh: 'Charles A. Lindbergh Achievement',
			Rickenbacker: 'Capt Eddie Rickenbacker Achievement',
			Wright: 'Wright Brothers Award',
			Feik: 'Mary Feik',
			Arnold: 'Gen Hap Arnold Achievement',
			Curry: 'General J. F. Curry Achievement',
			AFA: 'AFA Award to Unit Cadet',
			RedService: 'Red Service Ribbon',
			SearchFind: 'Search "Find" Ribbon',
			AirSAR: 'Air Search and Rescue Ribbon',
			DisasterRelief: 'Disaster Relief Ribbon',
			CommunityService: 'Community Service Ribbon',
			IACE: 'International Air Cadet Exchange Ribbon',
			CadetCompetition: 'National Cadet Competition Ribbon',
			ColorGuard: 'National Color Guard Competition Ribbon',
			CAC: 'Cadet advisory Council',
			NCSA: 'National Cadet Special Activity Ribbon',
			Encampment: 'Encampment Ribbon',
			Recruiter: 'Cadet Recruiter Ribbon',
			ForeignWarVet: 'Foreign War Veteran',
			SegwartsAssociation: 'Segwarts Association Award',
		};

		return (
			<div
				className="ribbon"
				style={{
					flex: `2 1 ${100 / 3}%`,
					width: `${100 / 3}%`,
					backgroundImage: `url(/images/cadet-ribbons/${this.props.source}.png)`,
					backgroundSize: '100%',
					backgroundPosition: 'center',
					height: 20,
				}}
				title={names[this.props.source]}
			/>
		);
	}
}

const Spacer = (props: { size: number }): JSX.Element => (
	<div
		style={{
			flex: `${6 / props.size} 1 ${100 / props.size}%`,
			width: `${100 / props.size}%`,
		}}
	/>
);

class RibbonRack extends React.Component<Partial<Ribbons>> {
	public render(): JSX.Element {
		const ribbons: JSX.Element[] = [];

		for (const i in this.props) {
			if (this.props.hasOwnProperty(i)) {
				if (this.props[i as keyof Ribbons]) {
					ribbons.push(<Ribbon key={i} source={i as keyof Ribbons} />);
				}
			}
		}

		if (ribbons.length % 3 === 2) {
			ribbons.unshift(<Spacer key={-2} size={6} />);
			ribbons.splice(3, 0, <Spacer key={-1} size={6} />);
		} else if (ribbons.length % 3 === 1) {
			ribbons.unshift(<Spacer key={-2} size={3} />);
			ribbons.splice(2, 0, <Spacer key={-1} size={3} />);
		}

		return (
			<div
				className="ribbonRack"
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					width: '50%',
				}}
			>
				{ribbons}
			</div>
		);
	}
}

export default class RibbonRackBuilder extends Page {
	public state: {} = {};

	public render = (): JSX.Element => (
		<RibbonRack
			Earhart={true}
			Mitchell={true}
			Armstrong={true}
			Goddard={true}
			Doolittle={true}
			Lindbergh={true}
			Rickenbacker={true}
			Wright={true}
			Feik={true}
			Arnold={true}
			Curry={true}
			RedService={true}
			NCSA={true}
			Encampment={true}
			Recruiter={true}
			CommunityService={true}
		/>
	);
}
