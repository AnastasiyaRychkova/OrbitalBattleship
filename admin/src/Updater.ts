import UpdaterBase from "./UpdaterBase.js";
import StatUpdater from "./StatUpdater.js";
import GameUpdater from "./GameUpdater.js";
import DiagramUpdater from "./DiagramUpdater.js";
import type { PlayerUpdInfo, ClientStatistics, PlayerGameInfo } from './types.js';
import type { UserInfo } from '../../common/messages.js';

type ControllerType = {
	openDiagram( event: Event ): void;
}

/** Модуль, обновляющий интерфейс согласно внутреннему представлению */
class Updater extends UpdaterBase
{
	private statistics: StatUpdater;

	private games: GameUpdater;

	private diagram: DiagramUpdater;

	constructor( controller: ControllerType, address: string )
	{
		super();

		this.statistics = new StatUpdater();
		this.games = new GameUpdater( controller, address );
		this.diagram = new DiagramUpdater();
	}

	updateClient( name: string, bIsOnline: boolean, statistics?: ClientStatistics ): void
	{
		this.statistics.updateClient( name, bIsOnline, statistics );

		if ( statistics !== undefined )
			return;
		
		this.games.updateClient( name, bIsOnline );
		this.diagram.updateClient( name, bIsOnline );
	}

	updatePlayer( player: PlayerUpdInfo ): void
	{
		this.games.updatePlayer( player );
		this.diagram.updatePlayer( player );
	}

	updateClientCounter( online: number, total: number ): void
	{
		this.statistics.updateClientCounter( online, total );
	}

	updateDiagramHidden( newHidden: boolean, info?: UserInfo ): void
	{
		this.diagram.updateDiagramHidden( newHidden, info );
	}

	newGame( gameId: string, player1: PlayerGameInfo, player2: PlayerGameInfo ): void
	{
		this.games.newGame( gameId, player1, player2 );
	}

	removePlayer( player: string ): void
	{
		this.games.removePlayer( player );
		this.diagram.removePlayer( player );
	}
}

export default Updater;