import gameConfig from "../../config.json";

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
import type
{
	UpdateStateMessage,
}
from '../messages.js';

class Player implements IUser
{
	/** Основная информация об игроке */
	private _client: Client;

	/** Основная информация об игроке */
	private _game: Game;

	/** Текущее состояние игры */
	private _state: EState;

	/** Назначенная игроку команда */
	private _team: ETeam;

	/** Выбранный элемент */
	private _element: ChemicalElement | undefined;

	/** Диаграмма, заполненная игроком */
	private _diagram: ElemConfig | undefined;

	/** Диаграмма, заполненная игроком */
	private _diagramCheck: boolean;

	/** Выстрелы игрока по диаграмме соперника */
	private _shots: ElemConfig | undefined;

	constructor( game: Game, client: Client, team: ETeam )
	{
		this._client 	= client;
		this._game 		= game;
		this._state 	= EState.PeriodicTable;
		this._team 		= team;
		this._element 	= undefined;
		this._diagram 	= undefined;
		this._diagramCheck = false;
		this._shots 	= undefined;

		client.socket?.emit(
			'changeState',
			this.createStateObject(),
		);

		//TODO: Bind game events
	}

	get name(): string
	{
		return this._client.name;
	}

	get bIsOnline(): boolean
	{
		return this._client.bIsOnline;
	}

	get socket(): Socket | undefined
	{
		return this._client.socket;
	}

	get state(): EState
	{
		return this._state;
	}


	/**
	 * Создать объект, содержащий информацию о текущем состоянии игры,
	 * для дальнейшей отправки клиенту
	 */
	createStateObject(): UpdateStateMessage
	{
		const opponent: Player | undefined = this._game.getOpponent( this );

		return {
			state: this._state,
			team: this._team,
			element: this._element === undefined
				? {
					number: -1,
					name: "",
					symbol: "",
				}
				: {
					number: this._element.number,
					name: this._element.name,
					symbol: this._element.symbol,
				},
			diagram: this._diagram === undefined
				? []
				: opponent._shots === undefined
					? this._diagram.toArray()
					: ElemConfig.getDiagramState( this._diagram, opponent._shots ),
			diagramCheck: this._diagramCheck,
			opDiagram: opponent._diagram === undefined
				? []
				: this._shots === undefined
					? opponent._diagram.toArray()
					: ElemConfig.getDiagramState( opponent._diagram, this._shots ),
			rightMove: this._game.hasRightMove( this ),
			opElement: opponent._element === undefined ?
				{
					number: -1,
					name: "",
					symbol: "",
				} :
				{
					number: opponent._element.number,
					name: opponent._element.name,
					symbol: opponent._element.symbol,
				},
		}
	}

	/**
	 * Повесить слушателей на игровые события
	 * 
	 * Вызывается при создании объекта _игры_
	 * и при повторном подключении клиента после разрыва соединения,
	 * т.е. на событие connection, когда раннее было событие disconnection
	 */
	bindEvents(): void
	{
		console.log( "bindGameEvents" );
		//TODO: Повесить слушателей на игровые события
	}

	initMatch(): void
	{
		this._state = EState.Match;
		this._shots = new ElemConfig();
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
				`Event instigator does not have appropriate rights ( 'name': ${ this._client.name }, 'state': ${ this._state } )`,
				'onElemSelection'
			);
			return;
		}

		if ( this._element !== undefined )
		{
			log(
				'Cheater',
				`Player has chosen the element yet ( 
					'name': ${ this._client.name }, 
					'player element': ${ this._element.symbol }[${ this._element.number }], 
					'request': ${ elemNumber } )`,
				'onElemSelection'
			);
			return;
		}

		if ( elemNumber < 1 || elemNumber > 118 )
		{
			log(
				'Error',
				`Player selected the invalid element ( 
					'name': ${ this._client.name }, 
					'number': ${ elemNumber } )`,
				'onElemSelection'
			);
			return;
		}

		this._element = periodicTable[ elemNumber - 1 ];

		log(
			this._client.name,
			`Element was selected: 
				Number: ${ this._element.number }, 
				Name:   ${ this._element.name }, 
				Symbol: ${ this._element.symbol }, 
				Config: ${ this._element.config }`,
			'ElementSelection'
		);

		this._state = EState.Preparing;

		this._client.socket?.emit(
			'changeState',
			this.createStateObject(),
		);

		this._diagram = new ElemConfig();

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
				`Event instigator does not have appropriate rights ( 'name': ${ this._client.name }, 'state': ${ this._state } )`,
				'onCheckConfig'
			);
			callback( false );
			return;
		}

		this._diagram = new ElemConfig( config );

		this._checkDiagram( callback );
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
		if ( ElemConfig.isEqual( this._diagram!, this._element!.config ) )
		{ // правильно
			const ready: number = this._game.registerReadiness();
			log(
				this._client.name,
				`Checking filling the diagram. 
					Result: true, 
					Ready players: ${ ready },
					D: ${ this._diagram!.toArray() } `,
				'onCheckConfig'
			);
			this._diagramCheck = true;
			callback( true );

			if ( !this._game.getOpponent( this )._client.bIsOnline )
			{
				this._client.socket?.emit( 'opDisconnection ' );
				return;
			}

			if ( ready === 2 )
				setTimeout(
					this._game.toMatch.bind( this._game ),
					gameConfig.checkResultWaiting // FIXME:
				);

		}
		else // неправильно
		{
			log(
				this._client.name,
				`Checking filling the diagram. 
					Result: false, 
					D: ${ this._diagram!.toArray() } 
					E: ${ this._element?.config.toArray() }`,
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
		if ( this._state === EState.Match )
		{
			log(
				'Cheater',
				`Event instigator is in an invalid state ( 
					'name': ${ this.name }, 
					'state': ${ this._state }
				)`,
				'onShot'
			);
			callback( false );
			return;
		}

		// Имеет ли игрок право хода
		if ( this._game.hasRightMove( this ) )
		{
			log(
				'Cheater',
				`Event instigator does not have the right move (
					'name': ${ this.name }
				)`,
				'onShot'
			);
			callback( false );
			return;
		}

		/* Проверить вхождение переданного значения номера спина 
		в допустимый диапазон */
		if ( spin < 1 || spin > 118 )
		{
			log(
				'Cheater',
				`Invalid value of spin number (
					'name': ${ this.name },
					'spin': ${ spin }
				)`,
				'onShot' );
			callback( false );
			return;
		}

		if ( this._shots?.hasSpin( spin ) )
		{
			callback( false );
			this.socket?.emit(
				'changeState',
				this.createStateObject()
			)
			return;
		}

		log(
			this.name,
			`Shot >> ${ spin }`
		);

		const opponent: Player = this._game.getOpponent( this );

		callback( opponent._markOpShot( spin ) );
		
		this._shots?.write( spin, true );
		this._game.nextMove( this );

		if ( !opponent.bIsOnline )
			this.socket?.emit( 'opDisconnection' );
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
				spin
			);
		
		return this._element!.config.hasSpin( spin );
	}
}

export default Player;
