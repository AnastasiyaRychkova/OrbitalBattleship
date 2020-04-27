import EState from "../../common/EState";
import { ETeam } from "../../common/ETeam";
import { ChemicalElement } from "../../common/messages";


type ClientData = {
	name: string,
	bIsOnline?: boolean,
	gameId?: string,
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

type DiagramView = {
	main: number[],
	base: number[],
}

type PlayerGameInfo = {
	name: string,
	bIsOnline: boolean,
	state: EState,
	team: ETeam,
	element: ChemicalElement,
	rightMove: boolean,
}


export type {
	ClientData,
	ClientStatistics,
	DiagramView,
	PlayerGameInfo,
}