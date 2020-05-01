import UpdaterBase from "./UpdaterBase.js";
import EState from "../../common/EState.js";
import type { PlayerGameInfo, PlayerUpdInfo } from './types.js';
import { ChemicalElement } from "../../common/messages.js";
import { ETeam } from "../../common/ETeam.js";

type ControllerType = {
	openDiagram( event: Event ): void;
}

class GameUpdater extends UpdaterBase
{
	/** Список текущих игр */
	private list: HTMLUListElement;

	/** Метод, который необходимо повесить на элемент игрока, чтобы открыть окно диаграммы */
	openDiagram: ( event: Event ) => void;

	constructor( controller: ControllerType, address: string )
	{
		super();

		( document.querySelector( '.ipv4-address > span' ) as HTMLSpanElement ).textContent = address;

		this.list = document.getElementById( 'game-list' ) as HTMLUListElement;

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
			\n		<div class="state ${EState[player1.state].toLowerCase()}"></div>\
			\n		<div class="element"><sub>${player1.element.number}</sub>${player1.element.symbol}</div>\
			\n	</div>\
			\n	<div class="player" id="${'g-'+player2.name}" data-online="${player2.bIsOnline}" data-rm="${player2.rightMove}" data-disable="false">\
			\n		<div class="name">${player2.name}</div>\
			\n		<div class="state ${EState[player2.state].toLowerCase()}"></div>\
			\n		<div class="element"><sub>${player2.element.number}</sub>${player2.element.symbol}</div>\
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
			( player.getElementsByClassName( 'state' )[0] as HTMLElement ).className = 'state void';
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
					break;

				case 'element':
					const element: HTMLElement = ( client.getElementsByClassName( 'element' )[0] ) as HTMLElement;
					const elementInfo: ChemicalElement = clientInfo as ChemicalElement;
					element.innerHTML = `<sub>${elementInfo.number}</sub>${elementInfo.symbol}`;
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
}


export default GameUpdater;