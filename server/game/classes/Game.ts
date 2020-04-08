import gameConfig from "../../config.json";
import { default as Client, clientList } from './Client.js';
import Player from './Player.js';
import { io } from "../../kernel/server.js";
import { EState } from '../../../common/general.js';

import {
	ETeam,
	getAnotherTeam,
	getRandomTeam
} from '../../../common/ETeam.js';

import type { RefreshListMessage }  from '../messages.js';

import log from '../../kernel/log.js';

/**
 * Информация об игре
 * -------------------
 */
class Game
{
	/** Массив участвующих в игре клиентов */
	private _players: Player[];

	/** Счетчик игроков готовых к следующему этапу игры */
	private _readyPlayers: number;

	/** Индекс клиента с правом хода
	 * или победитель игры, т.е. игрок, с правом закончить матч ( нажать на кубок )
	 */
	private _rightMove: number;

	/** Таймер самоуничтожения */
	private _selfDestructionTimer: NodeJS.Timeout | undefined;

	static readonly NUMBER_OF_PLAYERS = 2;


	constructor( client1: Client, client2: Client )
	{
		const randomTeam: ETeam = getRandomTeam();

		this._players = [
			new Player( this, client1, randomTeam ),
			new Player( this, client2, getAnotherTeam( randomTeam ) ),
		];
		this._readyPlayers 	= 0;
		this._rightMove 	= -1;

		clientList.forEach(
			( client: Client ) =>
			{
				client.removeInviter( client1 );
				client.removeInviter( client2 );
			}
		);

		const message: RefreshListMessage = {
			action: 'remove',
			data: [
				{
					name: client1.name,
					bIsInvited: false,
					bIsInviting: false,
				},
				{
					name: client2.name,
					bIsInvited: false,
					bIsInviting: false,
				}
			],
		}

		io.emit(
			'refreshResults',
			message,
		);
	}

	/**
	 * Есть ли у игрока право хода
	 * @param player Игрок
	 */
	hasRightMove( player: Player ): boolean
	{
		return this._rightMove === -1
			? false
			: this._players[ this._rightMove ] === player;
	}

	/**
	 * Передать право хода другому игроку
	 * 
	 * @param currPlayer Игрок, который запрашивает передачу хода другому игроку. Должен иметь право хода.
	 */
	nextMove( currPlayer: Player ): void
	{
		if (
			this._rightMove >= 0
			&& this._players[ this._rightMove ] === currPlayer
		)
		{
			this._rightMove = ( this._rightMove + 1 ) % Game.NUMBER_OF_PLAYERS;
		}
	}

	/**
	 * Получить оппонента игрока
	 * @param player Игрок
	 */
	getOpponent( player: Player ): Player
	{
		return this._players[ 0 ] !== player ? this._players[ 0 ]
											 : this._players[ 1 ];
	}

	/**
	 * Отметь готовность игрока с следующему этапу игры
	 * 
	 * @returns Количество готовых к следующему этапу игроков
	 */
	registerReadiness(): number
	{
		return ++this._readyPlayers;
	}


	toMatch(): void
	{
		if (
			!(
				this._players[ 0 ]
				&& this._players[ 0 ].bIsOnline
				&& this._players[ 0 ].state === EState.Preparing
			)
			|| !(
				this._players[ 1 ]
				&& this._players[ 1 ].bIsOnline
				&& this._players[ 1 ].state === EState.Preparing
			)
		)
		{
			log(
				'Warn',
				`Failed to go to the Match:
					${ this._players[ 0 ] ? this._players[ 0 ].name : 'Unknown player' },
					${ this._players[ 1 ] ? this._players[ 1 ].name : 'Unknown player' }`,
				'toMatch'
			)
			return;
		}

		log(
			'Event',
			`Match started:
				> ${ this._players[ 0 ].name },
				> ${ this._players[ 1 ].name }`,
			'toMatch'
		)
		return;

		this._toMatch();
	}



	private _toMatch(): void
	{
		this._rightMove = Math.round( Math.random() );
		this._readyPlayers = 0;

		this._players.forEach( player => player.initState( EState.Match ) );
	}


	toCelebration( instigator: Player, elemNumber?: number ): void
	{
		const instigatorIndex: number = this._players.indexOf( instigator );

		if ( instigatorIndex < 0 )
			return;
		
		const bIsWinner: boolean = elemNumber === undefined
			? false
			: this.getOpponent( instigator ).elemGuessing( elemNumber );

		this._rightMove = bIsWinner
							? instigatorIndex
							: ( instigatorIndex + 1 ) % Game.NUMBER_OF_PLAYERS;

		this._players.forEach( player => player.initState( EState.Celebration ) );

		const loserIndex: number = ( this._rightMove + 1 ) % Game.NUMBER_OF_PLAYERS;
		log(
			'MATCH RESULT',
			`\n===================\
			\nWinner: ${ this._players[ this._rightMove ].name }\
			\nElement: ${ this._players[ this._rightMove ].element }\
			\n\
			\nOpponent: ${ this._players[ loserIndex ].name }\
			\nElement: ${ this._players[ loserIndex ].element }\
			\n===================`,
		);


		setTimeout(
			( player: Player ) => player.destroy(),
			gameConfig.celebrationWaiting,
			this._players[ loserIndex ]
		);
	}


	/**
	 * Закончить игру
	 * 
	 * Уничтожает данные игры и переводит клиентов в состояние Online.
	 */
	destroy(): void
	{
		// Можно вызвать только один раз
		this.destroy = () => {};
		this.delayedSelfDestruction = () => {};
		// Если есть работающий таймер, то его необходимо остановить
		this.preventSelfDestruction();

		// Оборвать все связи между объектами,
		// чтобы игру и 2х игроков мог подобрать мусорщик
		this._players.forEach( ( player ) => player.destroy() );
		this._players = [];
	}

	/**
	 * Установить таймер самоуничтожения
	 */
	delayedSelfDestruction(): void
	{
		this.preventSelfDestruction();

		this._selfDestructionTimer = setTimeout(
			( game: Game ) => game.destroy(),
			gameConfig.gameDestructionWaiting,
			this
		);
	}

	/**
	 * Остановить таймер самоуничтожения, если тот был заведен
	 */
	preventSelfDestruction(): void
	{
		if ( this._selfDestructionTimer )
		{
			clearTimeout( this._selfDestructionTimer );
			this._selfDestructionTimer = undefined;
		}
	}

} // ---------------------------------------------

export default Game;