import gameConfig from "../../config.js";
import { default as Client, clientList } from './Client.js';
import Player from './Player.js';
import { EState } from '../../../common/general.js';

import {
	ETeam,
	getAnotherTeam,
	getRandomTeam
} from '../../../common/ETeam.js';

import type { RefreshListMessage }  from '../messages.js';

import log from '../../kernel/log.js';
import { toAdmin } from "../../kernel/admin.js";

/**
 * Информация об игре
 * -------------------
 */
class Game
{
	/** ID игры */
	readonly id: string;

	/** Массив участвующих в игре клиентов */
	private _players: Player[];

	/** Счетчик игроков готовых к следующему этапу игры */
	private _readyPlayers: number;

	/** Индекс клиента с правом хода
	 * или победитель игры, т.е. игрок, с правом закончить матч ( нажать на кубок )
	 */
	private _rightMove: number;

	/** Время начала матча (timestamp) */
	readonly startTime: number;

	/** Таймер самоуничтожения */
	private _selfDestructionTimer: NodeJS.Timeout | undefined;

	static readonly NUMBER_OF_PLAYERS = 2;


	constructor( client1: Client, client2: Client )
	{
		this.id = client1.name + client2.name;
		log(
			'INFO',
			'New game: '+this.id
		);

		const randomTeam: ETeam = getRandomTeam();

		this._players = [
			new Player( this, client1, randomTeam ),
			new Player( this, client2, getAnotherTeam( randomTeam ) ),
		];
		this._readyPlayers 	= 0;
		this._rightMove 	= -1;
		this.startTime		= Date.now();

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

		// Отправить всем неиграющим клиентам команду на удаление 2х клиентов
		clientList.forEach(
			( client ) => {
				if ( client.bIsOnline && !client.bHasUnfinishedGame )
					client.socket?.emit(
						'refreshResults',
						message,
					)
			}
		);

		toAdmin( {
			action: 'newGame',
			game: this.id,
			startTime: this.startTime,
			player1: client1.createUserInfo(),
			player2: client2.createUserInfo()
		} );
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
	 * Отметь готовность игрока к началу перестрелки (матча)
	 * 
	 * @returns Количество готовых к матчу игроков
	 */
	registerReadiness(): number
	{
		this._readyPlayers++;
		if ( this._readyPlayers === Game.NUMBER_OF_PLAYERS )
		{
			setTimeout(
				this.toMatch.bind( this ),
				gameConfig.checkResultWaiting
			);
		}
		return this._readyPlayers;
	}


	toMatch(): void
	{
		if (
			!(
				this._players[ 0 ]
				&& this._players[ 0 ].state === EState.Preparing
			)
			|| !(
				this._players[ 1 ]
				&& this._players[ 1 ].state === EState.Preparing
			)
		)
		{
			log(
				'Warn',
				`Failed to go to the Match:\
				\n	${ this._players[ 0 ] ? this._players[ 0 ].name : 'Unknown player' }\,
				\n	${ this._players[ 1 ] ? this._players[ 1 ].name : 'Unknown player' }`,
				'toMatch'
			)
			return;
		}

		log(
			'Event',
			`Match started:\
			\n	> ${ this._players[ 0 ].name },\
			\n	> ${ this._players[ 1 ].name }`,
			'toMatch'
		)

		this._toMatch();
		
		toAdmin( {
			action: 'updateClient',
			game: this.id,
			info1: this._players[0].client!.createUserInfo(),
			info2: this._players[1].client!.createUserInfo(),
		} );
	}


	/**
	 * Выбрать игрока с правом первого хода и перевести обоих в состояние матча
	 * 
	 * Если в сети только один игрок, то право первого хода дается ему
	 */
	private _toMatch(): void
	{
		if ( this._players[0].bIsOnline && !this._players[1].bIsOnline )
			this._rightMove = 0;
		else
			if ( this._players[1].bIsOnline && !this._players[0].bIsOnline )
				this._rightMove = 1;
			else
				this._rightMove = Math.round( Math.random() );

		this._players.forEach( player => player.initState( EState.Match ) );
	}

	/**
	 * Завершить матч, после того, как один из игроков решил назвать
	 * загаданный противником химический элемент.
	 * 
	 * Если `elemNumber` не был передан, то это расценивается
	 * как желание игрока сдаться.
	 * В таком случае победа автоматически достается противнику.
	 * Победитель будет обладать правом хода, т.е. правом закончить игру.
	 * 
	 * @param instigator Инициатор завершения матча
	 * @param elemNumber Предполагаемый номер загаданного оппонентом элемента
	 */
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
		const loserIndex: number = ( this._rightMove + 1 ) % Game.NUMBER_OF_PLAYERS;

		// Пересчитать статистику с учетом завершенного матча
		const matchTime: number = Date.now() - this.startTime;
		this._players[ this._rightMove ].client?.countMatchStatistics( true, matchTime );
		this._players[ loserIndex ].client?.countMatchStatistics( false, matchTime );

		// Перевести игроков в следующее состояние
		this._players.forEach( player => player.initState( EState.Celebration ) );

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

		/* Отпустить проигравшего через заданный временной промежуток,
		если этого раньше не сделает соперник-победитель */
		setTimeout(
			( player: Player ) => player.destroy(),
			gameConfig.celebrationWaiting,
			this._players[ loserIndex ]
		);

		toAdmin( {
			action: 'updateClient',
			game: this.id,
			info1: this._players[0].client!.createUserInfo( true ),
			info2: this._players[1].client!.createUserInfo( true ),
		} );
	}


	/**
	 * Закончить игру
	 * 
	 * Уничтожает данные игры и переводит клиентов в состояние Online.
	 */
	destroy(): void
	{
		log(
			'LOG',
			`Game destruction ( ${this.id} )`,
			'destroy'
		);
		// Можно вызвать только один раз
		this.destroy = () => {};
		this._delayedSelfDestruction = () => {};
		// Если есть работающий таймер, то его необходимо остановить
		this._preventSelfDestruction();

		// Оборвать все связи между объектами,
		// чтобы игру и 2х игроков мог подобрать мусорщик
		this._players.forEach( ( player ) => player.destroy() );
		this._players = [];
		toAdmin( {
			action: 'removeGame',
			game: 	this.id,
		} );
	}

	/**
	 * Установить таймер самоуничтожения игры, если оба игрока отключены
	 * 
	 * @param player Игрок, с кем было потеряно соединение
	 */
	onPlayerDisconnection( player: Player ): void
	{
		if ( !this.getOpponent( player ).bIsOnline )
		{	
			this._delayedSelfDestruction();
		}
	}

	/**
	 * Остановить таймер самоуничтожения, если он был установлен, т.к. один из игроков в сети
	 */
	onPlayerConnection(): void
	{
		this._preventSelfDestruction();
	}

	/**
	 * Установить таймер самоуничтожения
	 */
	private _delayedSelfDestruction(): void
	{
		this._preventSelfDestruction();

		this._selfDestructionTimer = setTimeout(
			( game: Game ) => game.destroy(),
			gameConfig.gameDestructionWaiting,
			this
		);
	}

	/**
	 * Остановить таймер самоуничтожения, если тот был заведен
	 */
	private _preventSelfDestruction(): void
	{
		if ( this._selfDestructionTimer )
		{
			clearTimeout( this._selfDestructionTimer );
			this._selfDestructionTimer = undefined;
		}
	}

} // ---------------------------------------------

export default Game;