import IUser from './User.js';
import Player from './Player.js';
import Game from "./Game.js";
import {
	EState,
	ETeam,
} from '../../../common/general.js';
import log from '../../kernel/log.js';

import type { Socket } from 'socket.io';
import type {
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
		this._player	= undefined;

		this.updateClient();
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

		this.updateClient();
	}

	updateClient(): void
	{
		if ( this.bIsOnline )
			this._socket?.emit(
				'changeState',
				this.createStateObject()
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
	 * Переподключение клиента.
	 * 
	 * 1. Останавливается таймер самоуничтожения игры, если был заведен.
	 * 2. Противник получает уведомление о восстановлении связи, если он онлайн.
	 * 3. Заново вешаются слушатели на новый сокет.
	 * 4. Клиент синхронизируется.
	 * 
	 * @param newSocket Новая сессия
	 */
	onReconnection( newSocket: Socket ): void
	{
		this._socket = newSocket;

		this._player && this._player.onReconnection();

		this.bindEvents();
		this.updateClient();
	}


	onDisconnection(): void
	{
		// TODO: Отключение игрока
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

	/**
	 * Пригласить клиента совместную на игру.
	 * 
	 * Если оба клиента выразили обоюдное желание сыграть друг с другом,
	 * начнется игра для этой пары клиентов.
	 * Остальные неиграющие игроки получат команду на удаление из списка потенциальных игроков ушедших играть клиентов.
	 * 
	 * @param name Имя игрока, которого данный клиент хочет пригласить
	 * @param callback Функция, которая будет вызвана на клиенте. Принимает булево значение, было ли отправлено приглашение
	 */
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
			callback( false );
			this.updateClient();
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
			new Game( this, client );
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

	/**
	 * Закончить матч.
	 * 
	 * Обнуляется ссылка на игрока, и отсылается сообщение клиенту
	 * о переходе в состояние Online.
	 */
	finishMatch(): void
	{
		this._player = undefined;

		this.updateClient();
	}


	onDisconnect(): void
	{
		this._socket = undefined;
		if ( this._player )
			this._player.onDisconnect();
		else
		{
			const message: RefreshListMessage = {
				action: 'remove',
				data: [
					{
						name: this.name,
						bIsInvited: false,
						bIsInviting: false,
					}
				],
			}

			// Отправить всем неиграющим клиентам команду на удаление клиента
			clientList.forEach(
				( client ) => {
					if ( client.bIsOnline && !client.bHasUnfinishedGame )
						client.socket?.emit(
							'refreshResults',
							message,
						)
				}
			);
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