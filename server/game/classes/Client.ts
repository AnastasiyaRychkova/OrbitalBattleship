import IUser from './User.js';
import Player from './Player.js';
import Game from "./Game.js";
import {
	EState,
	ETeam,
} from '../../../common/general.js';
import { clientList } from '../../kernel/connection.js';
import log from '../../kernel/log.js';

import type { Socket } from 'socket.io';
import type {
	RegistrationMessage,
	UpdateStateMessage,
	ClientInfoRow,
	RefreshListMessage,
} from '../messages.js';


class Client implements IUser
{
	/**
	 * Текущее соединение игрока
	 */
	private _socket: Socket | undefined;

	/**
	 * Имя игрока (идентификатор)
	 */
	private _name: string;

	/**
	 * Приглашающие на игру клиенты
	 */
	private _inviters: WeakSet<Client>;

	/**
	 * Ссылка на объект игрока, т.е. на объект, содержащий информацию по текущему матчу клиента
	 */
	private _player: Player | undefined;

	/**
	 * @param socket 	Сессия игрока
	 * @param name		Идентификатор игрока
	 * @param state 	Состояние игры на клиенте
	 */
	constructor( socket: Socket, name: string )
	{
		this._socket 	= socket;
		this._name 		= name;
		this._inviters	= new WeakSet<Client>();
		this._player		= undefined;
	}

	get name(): string
	{
		return this._name;
	}

	get bIsOnline(): boolean
	{
		return this._socket !== undefined;
	}

	get socket(): Socket | undefined
	{
		return this._socket;
	}

	get bHasUnfinishedGame(): boolean
	{
		return this._player !== undefined;
	}

	removeInviter( inviter: Client ): void
	{
		this._inviters.delete( inviter );
	}

	/**
	 * Создать слепок системы
	 * @param state Состояние игры, в которое необходимо перевести клиента
	 */
	createStateObject( state?: EState ): UpdateStateMessage
	{
		return this._player === undefined
			? {
				state: state !== undefined
					? state
					: EState.Online,
				team: ETeam.None,
				element: {
					number: -1,
					name: "",
					symbol: "",
				},
				diagram: [],
				diagramCheck: false,
				opDiagram: [],
				rightMove: false,
				opElement: {
					number: -1,
					name: "",
					symbol: "",
				},
			}
			: this._player.createStateObject();
	}

	/**
	 * Инициализация игры для клиента
	 * @param player Объект с игровой информацией данного клиента
	 */
	initGame( player: Player ): void
	{
		this._player = player;
		this._inviters = new WeakSet<Client>();

		this._socket?.emit(
			'changeState',
			player.createStateObject(),
		);
	}

	/**
	 * Повесить слушателей на основные сетевые события
	 * 
	 * Вызывается при создании объекта _клиента_
	 * и при повторном подключении клиента после разрыва соединения,
	 * т.е. на событие connection, когда раннее было событие disconnection
	 */
	bindEvents(): void
	{
		console.log( 'bindBasicEvents' );
		//TODO: Повесить слушателей на основные сетевые события
	}


	/**
	 * Восстановить состояние клиента на основе данных, хранящихся на сервере
	 * @param newSocket Новая сессия
	 * @param data Данные, пришедшие от клиента
	 */
	onReconnection( newSocket: Socket, data: RegistrationMessage ): void
	{
		this._socket = newSocket;

		/*TODO: Восстановление состояния клиента и оповещение соперника */
	}

	/**
	 * Получить список неиграющих online клиентов
	 * @param bCheckInvitations Нужно ли проверять проверять полученные и отправленные приглашения. Если нет, то считаем, что приглашений нет.
	 */
	getClientsList( bCheckInvitations: boolean = false ): ClientInfoRow[]
	{
		/**
		 * Функция создания объекта с краткой информацией о клиенте.
		 * Назначается в зависимости от того, нужно ли проверять отправленные и полученные приглашения клиента или нет.
		 */
		const getRow: ( client: Client ) => ClientInfoRow = bCheckInvitations
			? ( client: Client ) =>
			{
				return {
					name: client._name,
					bIsInvited: this._inviters.has( client ),
					bIsInviting: client._inviters.has( this ),
				};
			}
			: ( client: Client ) =>
			{
				return {
					name: client._name,
					bIsInvited: false,
					bIsInviting: false,
				}
			};

		const list: ClientInfoRow[] = [];

		clientList.forEach(
			( client ) =>
			{
				if ( client !== this && !client.bIsOnline && client.bHasUnfinishedGame )
					list.push( getRow( client ) );
			}
		);

		return list;
	}

	/**
	 * Обновить список клиентов, с которыми можно поиграть
	 * @param data Заглушка. Пустой объект
	 * @param callback Функция, которая будет вызвана на клиенте. Принимает готовый список
	 */
	onRefreshList( data: unknown, callback: ( list: ClientInfoRow[] ) => void ): void
	{
		log(
			this._name,
			'The client asks for a list of all non-playing connected clients',
			'RefreshList'
		);

		const list: ClientInfoRow[] = this.getClientsList( true );
		callback( list );
	}

	onInvite( name: string, callback: ( bIsItSent: boolean ) => void )
	{
		// Приглашение отправлено клиентом, который имеет неоконченную игру
		if ( this.bHasUnfinishedGame )
		{
			log(
				this._name,
				'Can not send invitation because the client has an unfinished game',
				'onInvite',
			);
			// TODO: добавить отправку команды Update State
			return;
		}

		const client: Client | undefined = clientList.get( name );

		if ( client === undefined || !client.bIsOnline || client.bHasUnfinishedGame )
		{
			log(
				'Error',
				`${ this._name } is trying to invite invalid client <${ name }>`,
				'onInvite'
			);
			callback( false );
			return;
		}

		log(
			this._name,
			`Sent invitation to <${ name }>`,
			'onInvite',
		);

		// Если оба игрока пригласили друг друга, то можно начинать игру
		if ( client._inviters.has( this ) )
		{
			const game = new Game( this, client );
		}
		else // если второй игрок еще не приглашал текущего
		{
			client._inviters.add( this );
			const message: RefreshListMessage = {
				action: 'add',
				data: [
					{
						name: this._name,
						bIsInvited: false,
						bIsInviting: true,
					}
				],
			};

			// Отправить клиенту сообщение о том, что его пригласили
			client._socket!.emit(
				'refreshResults',
				message
			);
			// Отправителю сообщить, что приглашение отправлено
			callback( true );
		}
	}
}

/**
 * Контейнер для хранения информации о клиентах
 */
const clientList = new Map<string, Client>();

export default Client;
export {
	clientList,
}