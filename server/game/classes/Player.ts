import Client from './Client.js';
import Game from './Game.js';
import
{
	EState,
	ETeam,
	ElemConfig,
}
from '../../../common/general.js';

import type
{
	ChemicalElement
}
from './PeriodicTable.js';
import type
{
	UpdateStateMessage,
}
from '../messages.js';

class Player
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
			rightMove: this._game.getRightMove( this ),
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
	private _bindGameEvents(): void
	{
		console.log( "bindGameEvents" );
		//TODO: Повесить слушателей на игровые события
	}
}

export default Player;
