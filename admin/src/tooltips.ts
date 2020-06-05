import EState from "../../common/EState.js";

const stateTooltip:Map<number, string> = new Map();

stateTooltip.set( EState.PeriodicTable, 'element selection' );
stateTooltip.set( EState.Preparing, 'diagram filling' );
stateTooltip.set( EState.Match, 'skirmish' );
stateTooltip.set( EState.Celebration, 'award' );


export {
	stateTooltip,
}