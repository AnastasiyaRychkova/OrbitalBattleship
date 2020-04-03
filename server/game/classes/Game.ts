import Client from './Client.js';
import Player from './Player.js';
import { clientList } from '../../kernel/connection.js';
import { io } from "../../kernel/server.js";

import {
	ETeam,
	getAnotherTeam,
	getRandomTeam
} from '../../../common/ETeam.js';

import type { RefreshListMessage }  from '../messages.js';


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


	constructor( client1: Client, client2: Client )
	{
		const randomTeam: ETeam = getRandomTeam();

		this._players = [
			new Player( this, client1, randomTeam ),
			new Player( this, client2, getAnotherTeam( randomTeam ) ),
		];
		this._readyPlayers 	= 0;
		this._rightMove 	= -1;

		client1.initGame( this._players[ 0 ] );
		client2.initGame( this._players[ 1 ] );

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
	getRightMove( player: Player ): boolean
	{
		return this._rightMove === -1
			? false
			: this._players[ this._rightMove ] === player;
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
} // ---------------------------------------------

export default Game;