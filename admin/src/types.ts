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
	games?: number,
	victories?: number,
};

type ClientTiming = {
	name: string,
	totalTime: number,
	AVGTime: number,
};

type DiagramView = {
	main: number[],
	base: number[],
}


export type {
	ClientData,
	ClientTiming,
	DiagramView,
}