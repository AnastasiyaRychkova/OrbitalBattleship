import UpdaterBase from "./UpdaterBase.js";
import EState from "../../common/EState.js";
import type { PlayerGameInfo, PlayerUpdInfo } from './types.js';
import { ChemicalElement, AdminUser, AdminUserInfo } from "../../common/messages.js";
import { ETeam } from "../../common/ETeam.js";
import { stateTooltip } from "./tooltips.js";

type ControllerType = {
	openDiagram( event: Event ): void;
}

class GameUpdater extends UpdaterBase
{
	/** Список текущих игр */
	private list: HTMLUListElement;

	/** Метод, который необходимо повесить на элемент игрока, чтобы открыть окно диаграммы */
	openDiagram: ( event: Event ) => void;

	constructor()
	{
		super();

		this.openDiagram = () => {};

		this.list = document.getElementById( 'game-list' ) as HTMLUListElement;
	}

	init( controller: ControllerType, address: string ): void
	{
		( document.querySelector( '.ipv4-address > span' ) as HTMLSpanElement ).textContent = address;
		this.openDiagram = controller.openDiagram;
	}

	newGame( gameId: string, player1: PlayerGameInfo, player2: PlayerGameInfo ): void
	{
		if ( document.getElementById( gameId ) != null )
			return;

		if ( player1.team !== ETeam.Actinoids )
			[ player1, player2 ] = [ player2, player1 ];

		this.list.insertAdjacentHTML(
			"beforeend",
			`<li class="game" id="${gameId}">\
			\n	<div class="player" id="${'g-'+player1.name}" data-online="${player1.bIsOnline}" data-rm="${player1.rightMove}" data-disable="false">\
			\n		<div class="name">${player1.name}</div>\
			\n		<div class="state ${EState[player1.state].toLowerCase()}" data-tooltip="${stateTooltip.get( player1.state )}" data-tooltip-position="left"></div>\
			\n		<div class="element"><sub>${player1.element.number > 0 ? player1.element.number : '??'}</sub>${player1.element.number > 0 ? player1.element.symbol : '??'}</div>\
			\n	</div>\
			\n	<div class="player" id="${'g-'+player2.name}" data-online="${player2.bIsOnline}" data-rm="${player2.rightMove}" data-disable="false">\
			\n		<div class="name">${player2.name}</div>\
			\n		<div class="state ${EState[player2.state].toLowerCase()}" data-tooltip="${stateTooltip.get( player2.state )}" data-tooltip-position="left"></div>\
			\n		<div class="element"><sub>${player2.element.number > 0 ? player2.element.number : '??'}</sub>${player2.element.number > 0 ? player2.element.symbol : '??'}</div>\
			\n	</div>\
			\n</li>`
		);

		document.getElementById( 'g-'+player1.name )?.addEventListener(
			'click',
			this.openDiagram
		);
		document.getElementById( 'g-'+player2.name )?.addEventListener(
			'click',
			this.openDiagram
		);
	}

	removePlayer( name: string ): void
	{
		const player: HTMLElement | null = document.getElementById( 'g-'+name );

		if ( player == null )
			return;
		player.removeEventListener( "click", this.openDiagram );

		// Если оба игрока покинули игру, то необходимо игру удалить
		const game: HTMLElement = player.parentElement!;
		const opponent: Element | null = ( game.children.item( 0 )!.id === ( 'g-'+name ) ) ? game?.children.item( 1 ) : game?.children.item( 0 );
		// Если оппонент еще не ушел, то оставить основную информацию
		// и деактивировать
		if ( opponent != null && opponent.id !== '' )
		{
			player.id = '';
			player.dataset.disable = 'true';
			const state = player.getElementsByClassName( 'state' )[0] as HTMLElement;
			state.className = 'state void';
			state.removeAttribute( 'data-tooltip' );
			return;
		}

		game.remove();
	}

	updateClient( name: string, bIsOnline: boolean ): void
	{
		const client: HTMLElement | null = document.getElementById( 'g-'+name );

		if ( client == null )
			return;

		client.dataset.online = bIsOnline.toString();
	}

	updatePlayer( player: PlayerUpdInfo ): void
	{
		const client: HTMLElement | null = document.getElementById( 'g-'+player.name );

		if ( client == null )
			return;

		for (const prop in player) {
			const clientInfo = player[ prop as keyof PlayerUpdInfo ];
			if ( clientInfo === undefined )
				continue;

			switch ( prop ) {
				case 'state':
					const state: HTMLElement = ( client.getElementsByClassName( 'state' )[0] ) as HTMLElement;
					state.className = 'state ' + EState[ clientInfo as EState ].toLowerCase();
					state.dataset.tooltip = stateTooltip.get( clientInfo as number );
					break;

				case 'element':
					const element: HTMLElement = ( client.getElementsByClassName( 'element' )[0] ) as HTMLElement;
					const elementInfo: ChemicalElement = clientInfo as ChemicalElement;
					element.innerHTML = `<sub>${elementInfo.number > 0 ? elementInfo.number : '??'}</sub>${elementInfo.number > 0 ? elementInfo.symbol : '??'}`;
					break;

				case 'rightMove':
					client.dataset.rm = clientInfo.toString();
					break;
			}
		}
	}

	clear(): void
	{
		while ( this.list.hasChildNodes() )
			this.list.lastChild!.remove();
	}

	reload( model: AdminUser[] ): void
	{
		this.clear();

		/** Временное хранилище для поиска пар игроков */
		const games = new Map<string, PlayerGameInfo[]>();

		/** Из имени и AdminUserInfo объекта получить PlayerGameInfo объект */
		function makePlayerGameInfo( name: string, info: AdminUserInfo ): PlayerGameInfo
		{
			return {
				name: name,
				bIsOnline: info.bIsOnline,
				state: info.game!.player.state,
				team: info.game!.player.team,
				element: info.game!.player.element,
				rightMove: info.game!.player.rightMove,
			}
		}

		for ( const [ name, info ] of model )
		{
			if ( info.game == null )
				continue;

			const players = games.get( info.game.id );

			if ( players === undefined )
				games.set(
					info.game.id,
					[
						makePlayerGameInfo( name, info ),
					]
				)
			else
			{
				players.push( makePlayerGameInfo( name, info ) );
				if ( players.length === 2 )
					this.newGame( info.game.id, players[0], players[1] );
			}
		}
	}
}


export default GameUpdater;