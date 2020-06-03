import IUser from './User.js';
import Client from './Client.js';
import Game from './Game.js';
import log from '../../kernel/log.js';
import periodicTable from "./PeriodicTable.js";
import
{
	EState,
	ETeam,
	ElemConfig,
}
from '../../../common/general.js';

import type { Socket } from 'socket.io';
import type { ChemicalElement } from './PeriodicTable.js';
import type { UpdateStateMessage } from '../messages.js';
import type { PlayerInfo } from "../../../common/messages.js";
import { toAdmin } from "../../kernel/admin.js";


/** Объект, содержащий всю игровую информацию */
type AdminGameInfo = {
	id: string,
	player: PlayerInfo,
	startTime: number,
};


/**
 * Игровой профиль игрока
 */
class Player implements IUser
{
	/** Основная информация об игроке */
	private _client: Client | undefined;

	/** Основная информация об игроке */
	private _game: Game;

	/** Текущее состояние игры */
	private _state: EState;

	/** Назначенная игроку команда */
	private _team: ETeam;

	/** Выбранный элемент */
	private _element: ChemicalElement;

	/** Диаграмма, заполненная игроком */
	private _diagram: ElemConfig;

	/** Диаграмма, заполненная игроком */
	private _diagramCheck: boolean;

	/** Выстрелы игрока по диаграмме соперника */
	private _shots: ElemConfig;

	constructor( game: Game, client: Client, team: ETeam )
	{
		this._client 	= client;
		this._game 		= game;
		this._state 	= EState.PeriodicTable;
		this._team 		= team;
		this._element 	= {
			name: '',
			number: -1,
			symbol: '',
			config: new ElemConfig(),
		};
		this._diagram 	= new ElemConfig();
		this._diagramCheck = false;
		this._shots 	= new ElemConfig();

		this._client.initGame( this );
	}

	get name(): string
	{
		return this._client ? this._client.name : "Unknown";
	}

	get bIsOnline(): boolean
	{
		return this._client ? this._client.bIsOnline : false;
	}

	get socket(): Socket | undefined
	{
		return this._client ? this._client.socket : undefined;
	}

	get state(): EState
	{
		return this._state;
	}

	elemGuessing( elemNumber: number ): boolean
	{
		return this._element.number === elemNumber;
	}

	get element(): string
	{
		return `${ this._element.symbol } [${ this._element.number }] (${ this._element.name })`;
	}

	get gameId(): string
	{
		return this._game.id;
	}

	get client(): Client | undefined
	{
		return this._client;
	}

	/**
	 * Создать объект для отправки администратору
	 */
	createPlayerInfo(): PlayerInfo
	{
		/* До начала матча admin накладывает диаграмму игрока на диаграмму элемента,
		после начала – выстрелы соперника поверх диаграммы игрока */
		return {
			state: this._state,
			team: this._team,
			element: {
				number: this._element.number,
				name: this._element.name,
				symbol: this._element.symbol,
			},
			diagramCheck: this._diagramCheck,
			rightMove: this._game.hasRightMove( this ),
			diagram: {
				main: this._state > EState.Preparing ? this._game.getOpponent( this )._shots.toNumArray() : this._diagram.toNumArray(),
				base: this._state > EState.Preparing ? this._diagram.toNumArray() : this._element.config.toNumArray(),
			}
		}
	}

	/**
	 * Создать объект, содержащий всю игровую информацию,
	 * для отправки администратору при отправке слепка состояния сервера
	 */
	createAdminGameInfo(): AdminGameInfo
	{
		return {
			id: this._game.id,
			player: this.createPlayerInfo(),
			startTime: this._game.startTime,
		};
	}


	/**
	 * Создать объект, содержащий информацию о текущем состоянии игры,
	 * для дальнейшей отправки клиенту
	 */
	createStateObject(): UpdateStateMessage
	{
		if ( this._state > EState.PeriodicTable )
		{
			const opponent: Player | undefined = this._game.getOpponent( this );

			return {
				state: this._state,
				team: this._team,
				element: {
					number: this._element.number,
					name: this._element.name,
					symbol: this._element.symbol,
				},
				diagram: ElemConfig.getDiagramState( this._diagram, opponent._shots ),
				diagramCheck: this._diagramCheck,
				opDiagram: ElemConfig.getDiagramState( opponent._diagram, this._shots, true ),
				rightMove: this._game.hasRightMove( this ),
				opElement: this._state === EState.Celebration
					? {
						number: opponent._element.number,
						name: opponent._element.name,
						symbol: opponent._element.symbol,
					}
					: {
						number: -1,
						name: '',
						symbol: '',
					},
			};
		}
		else
			return {
				state: this._state,
				team: this._team,
				element: {
					number: this._element.number,
					name: this._element.name,
					symbol: this._element.symbol,
				},
				diagram: [],
				diagramCheck: false,
				opDiagram: [],
				rightMove: false,
				opElement: {
					number: -1,
					name: '',
					symbol: '',
				},
			}
		
	}


	/**
	 * Перейти в новое состояние игры и синхронизировать клиента
	 * 
	 * @param state Новое состояние игры
	 */
	initState( state: EState ): void
	{
		this._state = state;
		this.updateClient();
	}

	updateClient(): void
	{
		if ( this.bIsOnline )
			this._client!.socket?.emit(
				'changeState',
				this.createStateObject()
			);
	}

	/**
	 * Восстановлено подключение к серверу.
	 * 
	 * * Если оппонент есть в сети, то его необходимо оповестить о подключении противника.
	 * * В противном случае, обязательно нужно остановить таймер самоуничтожения игры.
	 */
	onReconnection(): void
	{
		
		const opponent: Player = this._game.getOpponent( this );

		if ( opponent.bIsOnline )
		{
			opponent.socket?.emit( 'opConnection' );
			this.socket?.emit( 'opConnection' );
		}
		else
		{
			this._game.onPlayerConnection();
			if ( ( this._state === EState.Preparing && this._diagramCheck )
				|| ( this._state === EState.Match && !this._game.hasRightMove( this ) )
			)
				this.socket?.emit( 'opDisconnection' );
		}
		
		toAdmin( {
			action: 'updateClient',
			game: this._game.id,
			info1: this._client!.createUserInfo(),
		} );
	}

	/**
	 * Событие отключения клиента от сервера
	 * 
	 * * Если противник онлайн, то его необходимо оповестить об отключении игрока.
	 * * Если противник отключился раньше, то для игры необходимо установить таймер самоуничтожения, который сработает, если никто из игроков раньше не вернется. Время таймера задано в конфигурационном файле.
	 */
	onDisconnect(): void
	{
		this._game.onPlayerDisconnection( this );
	}


	/**
	 * Слушатель события выбора химического элемента игроком.
	 * Предварительно проверяет:
	 * * что игрок находится в нужном состоянии,
	 * * что он не выбрал другой элемент раннее,
	 * * что номер выбранного химического элемента
	 * находится в пределах допустимых значений.
	 * В случае, если правила не были нарушены,
	 * сервер переводит игрока в состояние подготовки к матчу.
	 * 
	 * @param elemNumber Номер выбранного игроком химического элемента
	 */
	onElemSelection( elemNumber: number )
	{
		if ( this._state !== EState.PeriodicTable )
		{
			log(
				'Cheater',
				`Event instigator does not have appropriate rights (\
				\n  'name': ${ this.name },\
				\n  'state': ${ this._state }\
				\n)`,
				'onElemSelection'
			);
			return;
		}

		if ( this._element.number > 0 )
		{
			log(
				'Cheater',
				`Player has chosen the element yet (\
				\n  'name': ${ this.name },\
				\n  'player element': ${ this._element.symbol }[${ this._element.number }],\
				\n  'request': ${ elemNumber }\
				\n)`,
				'onElemSelection'
			);
			return;
		}

		if ( elemNumber < 1 || elemNumber > 118 )
		{
			log(
				'Error',
				`Player selected the invalid element (\
				\n  'name': ${ this.name },\
				\n  'number': ${ elemNumber }\
				\n)`,
				'onElemSelection'
			);
			return;
		}

		this._element = periodicTable[ elemNumber - 1 ];

		log(
			this.name,
			`Element was selected:\
			\n  Number: ${ this._element.number },\
			\n  Name:   ${ this._element.name },\
			\n  Symbol: ${ this._element.symbol },\
			\n  Config: ${ this._element.config }`,
			'ElementSelection'
		);

		this._state = EState.Preparing;

		this.updateClient();
		toAdmin( {
			action: 'updateClient',
			game: this._game.id,
			info1: this._client!.createUserInfo(),
		} );

	}

	/**
	 * Выполнить проверку диаграммы, заполненной клиентом,
	 * сверив ее с конфигурацией загаданного элемента.
	 * 
	 * Вначале проводится проверка того, что у клиента
	 * есть все необходимые права для выполнения данной операции,
	 * и только после этого проверяется присланная диаграмма.
	 * 
	 * @param config Переданное клиентом состояние диаграммы ( 4 числа )
	 * @param callback Функция, вызываемая на клиенте, в которую необходимо передать результат проверки диаграммы
	 */
	onCheckConfig( config: number[], callback: ( result: boolean ) => void ): void
	{
		if ( this._state !== EState.Preparing )
		{
			log(
				'Cheater',
				`Event instigator does not have appropriate rights (\
				\n  'name': ${ this.name },\
				\n  'state': ${ this._state }\
				\n)`,
				'onCheckConfig'
			);
			callback( false );
			return;
		}

		this._diagram = new ElemConfig( config );

		this._checkDiagram( callback );
		toAdmin( {
			action: 'updateClient',
			game: this._game.id,
			info1: this._client!.createUserInfo(),
		} );
	}

	/**
	 * Проверить текущее состояние диаграммы игрока с конфигурацией загаданного элемента.
	 * 
	 * Функция закрытая, поэтому в ней отсутствуют проверки. Считается, что при вызове данной функции все данные являются валидными.
	 * Проверки находятся в открытой функции `onCheckConfig()`.
	 * 
	 * @param callback Функция, вызываемая на клиенте, в которую необходимо передать результат проверки диаграммы
	 */
	private _checkDiagram( callback: ( result: boolean ) => void ): void
	{
		// сравнить диаграмму и конфигурацию загаданного элемента
		if ( ElemConfig.isEqual( this._diagram, this._element.config ) )
		{ // правильно
			log(
				this.name,
				`Checking filling the diagram.\
				\n  Result: true,\
				\n  D: ${ this._diagram!.toArray() }`,
				'onCheckConfig'
			);
			this._diagramCheck = true;
			callback( true );

			this._game.registerReadiness()
		}
		else // неправильно
		{
			log(
				this.name,
				`Checking filling the diagram.\
				\n  Result: false,\
				\n  D: ${ this._diagram.toArray() }\
				\n  E: ${ this._element.config.toArray() }`,
				'onCheckConfig'
			);
			callback( false );
		}
	}

	/**
	 * Событие выстрела игроком.
	 * 
	 * Проверяет
	 * + нахождение игрока в состоянии матча
	 * + наличие права хода
	 * + нахождение переданного номера спина в допустимом диапазоне
	 * + наличие раннее сделанного выстрела по данному спину
	 * 
	 * Если оппонент отключен, то сообщает об этом текущему игроку.
	 * 
	 * @param spin Номер спина
	 * @param callback Функция, вызываемая на клиенте, в которую необходимо передать результат выстрела ( попадание: true или промах: false )
	 */
	onShot( spin: number, callback: ( result: boolean ) => void ): void
	{
		// Действительно ли сейчас матч
		if ( this._state !== EState.Match )
		{
			log(
				'Cheater',
				`Event instigator is in an invalid state (\
				\n  'name': ${ this.name },\
				\n  'state': ${ this._state }\
				\n)`,
				'onShot'
			);
			callback( false );
			this.updateClient();
			return;
		}

		// Имеет ли игрок право хода
		if ( !this._game.hasRightMove( this ) )
		{
			log(
				'Cheater',
				`Event instigator does not have the right move (\
				\n  'name': ${ this.name }\
				\n)`,
				'onShot'
			);
			callback( false );
			this.updateClient();
			return;
		}

		/* Проверить вхождение переданного значения номера спина 
		в допустимый диапазон */
		if ( spin < 1 || spin > 118 )
		{
			log(
				'Cheater',
				`Invalid value of spin number (\
				\n  'name': ${ this.name },\
				\n  'spin': ${ spin }\
				\n)`,
				'onShot'
			);
			callback( false );
			this.updateClient();
			return;
		}

		// Делался ли выстрел по этому спину ранее
		if ( this._shots.hasSpin( spin ) )
		{
			callback( false );
			this.updateClient();
			return;
		}

		log(
			this.name,
			`Shot >> ${ spin }`
		);

		const opponent: Player = this._game.getOpponent( this );

		callback( opponent._markOpShot( spin ) );
		
		this._shots.write( spin, true );
		this._game.nextMove( this );

		if ( !opponent.bIsOnline )
			this.socket?.emit( 'opDisconnection' );
		
		toAdmin( {
			action: 'updateClient',
			game: this._game.id,
			info1: this._client!.createUserInfo(),
			info2: opponent._client!.createUserInfo(),
		} );
	}

	/**
	 * Отметить выстрел по диаграмме игрока
	 * 
	 * @param spin Номер спина
	 * @returns Попадание или промах
	 */
	private _markOpShot( spin: number ): boolean
	{
		if ( this.bIsOnline )
			this.socket?.emit(
				'shot',
				{
					number: spin,
				}
			);
		
		return this._element.config.hasSpin( spin );
	}

	/**
	 * Попытка игрока отгадать элемент, загаданный противником
	 * 
	 * Вне зависимости от того, отгадал игрок элемент или нет,
	 * матч считается законченным, и оба игрока отправляются в состояние Celebration
	 * для объявления итогов.
	 * 
	 * @param elemNumber Номер названного элемента
	 */
	onNameElement( elemNumber: number ): void
	{
		if ( this._state !== EState.Match )
		{
			log(
				'Cheater',
				`Event instigator is in an invalid state (\
				\n  'name': ${ this.name },\
				\n  'state': ${ this._state }\
				\n)`,
				'onNameElement'
			);
			this.updateClient();
			return;
		}

		// Имеет ли игрок право хода
		if ( !this._game.hasRightMove( this ) )
		{
			log(
				'Cheater',
				`Event instigator does not have the right move (\
				\n  'name': ${ this.name }\
				\n)`,
				'onNameElement'
			);
			this.updateClient();
			return;
		}

		/* Проверить вхождение переданного значения номера спина 
		в допустимый диапазон */
		if ( elemNumber < 1 || elemNumber > 118 )
		{
			log(
				'Cheater',
				`Invalid value of element number (\
				\n  'name': ${ this.name },\
				\n  'number': ${ elemNumber }\
				\n)`,
				'onNameElement'
			);
			this.updateClient();
			return;
		}

		log(
			this.name,
			`Wants to name element >> ${ elemNumber }`,
			'onNameElement'
		);

		this._game.toCelebration( this, elemNumber );
	}


	/**
	 * Событие окончания игры.
	 * 
	 * Может быть вызвано только победителем
	 * только в самом конце матча (EState.Celebration)
	 */
	onEndGame(): void
	{
		if ( this._state !== EState.Celebration )
		{
			log(
				'Cheater',
				`Event instigator is in an invalid state (\
				\n  'name': ${ this.name },\
				\n  'state': ${ this._state }\
				\n)`,
				'onEndGame'
			);
			this.updateClient();
			return;
		}

		// Является ли игрок победителем
		if ( !this._game.hasRightMove( this ) )
		{
			log(
				'Cheater',
				`Event instigator is not a winner (\
				\n  'name': ${ this.name }\
				\n)`,
				'onEndGame'
			);
			this.updateClient();
			return;
		}

		log(
			this.name,
			'Winner confirmed the end of the game',
			'onEndGame'
		);

		this._game.destroy();
	}

	/**
	 * Окончить игру, оборвав связи между объектами, чтобы данный объект мог подобрать мусорщик.
	 * 
	 * Если игру завешает только один игрок, а второй остается,
	 * то объект не будет уничтожен, потому что останется ссылка в объекте `_game`.
	 */
	destroy(): void
	{
		this.destroy = () => {};
		if ( this._client )
		{
			if ( this._game.getOpponent( this ).bIsOnline )
				toAdmin( {
					action: 'updateClient',
					game: '',
					info1: this._client!.createUserInfo(),
				} );
			
			this._client.finishMatch(); // отправить клиентов в состояние Online
			this._client = undefined;
		}
		this._game = null as unknown as Player[ '_game' ];
	}

	/**
	 * Покинуть игру.
	 * 
	 * Если противник онлайн, значит игрок хочет сдаться,
	 * в противном случае это означает, что игрок не хочет дожидаться подключения
	 * противника, поэтому игра уничтожается, и игрок переходит состояние Online.
	 */
	onFlyAway(): void
	{
		log(
			this.name,
			'Client wants to fly away',
			'Player::onFlyAway'
		);
		if ( this._game.getOpponent( this ).bIsOnline )
			this._game.toCelebration( this );
		else
			this._game.destroy();
	}
}

export default Player;
