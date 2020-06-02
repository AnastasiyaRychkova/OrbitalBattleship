import UpdaterBase from "./UpdaterBase.js";
import StatUpdater from "./StatUpdater.js";
import GameUpdater from "./GameUpdater.js";
import DiagramUpdater from "./DiagramUpdater.js";
import type { PlayerUpdInfo, PlayerGameInfo } from './types.js';
import type { UserInfo, Statistics, AdminUser } from '../../common/messages.js';

type ControllerType = {
	openDiagram( event: Event ): void;
}

/** Модуль, обновляющий интерфейс согласно внутреннему представлению */
class Updater extends UpdaterBase
{
	private statistics: StatUpdater;

	private games: GameUpdater;

	private diagram: DiagramUpdater;

	constructor()
	{
		super();

		this.statistics = new StatUpdater();
		this.games = new GameUpdater();
		this.diagram = new DiagramUpdater();
	}

	init( controller: ControllerType, address: string ): void
	{
		this.games.init( controller, address );
	}

	updateClient( name: string, bIsOnline: boolean, statistics?: Statistics, rating?: number ): void
	{
		this.statistics.updateClient( name, bIsOnline, statistics, rating );

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

	clear(): void
	{
		this.statistics.clear();
		this.games.clear();
		this.updateDiagramHidden( true );
		this.updateClientCounter( 0, 0 );
	}

	reload( model: AdminUser[] ): void
	{
		this.statistics.reload( model );
		this.games.reload( model );
		this.updateDiagramHidden( true );
	}
}

export default Updater;