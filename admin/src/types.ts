import EState from "../../common/EState";
import { ETeam } from "../../common/ETeam";
import { ChemicalElement, DiagramView } from "../../common/messages";


type PlayerUpdInfo = {
	name: string,
	gameId: string,
	state?: EState,
	team?: ETeam,
	element?: ChemicalElement,
	diagramCheck?: boolean,
	diagram?: DiagramView,
	rightMove?: boolean,
};

type ClientStatistics = {
	counter?: {
		games: number,
		victories: number,
	},
	timing?: {
		totalTime: number,
		AVGTime: number,
	}
};


type PlayerGameInfo = {
	name: string,
	bIsOnline: boolean,
	state: EState,
	team: ETeam,
	element: ChemicalElement,
	rightMove: boolean,
}


export type {
	PlayerUpdInfo,
	ClientStatistics,
	PlayerGameInfo,
}