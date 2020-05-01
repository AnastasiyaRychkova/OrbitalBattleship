import IUser from './User.js';
import Player from './Player.js';
import Game from "./Game.js";
import {
	EState,
	ETeam,
} from '../../../common/general.js';
import log from '../../kernel/log.js';
import { toAdmin } from '../../kernel/admin.js';

import type { Socket } from 'socket.io';
import type {
	UpdateStateMessage,
	ClientInfoRow,
	RefreshListMessage,
	AnyClientMessage,
} from '../messages.js';
import type { UserInfo } from '../../../common/messages.js';


class Client implements IUser
{
	/**
	 * Текущее соединение игрока
	 */
	private _socket: Socket | undefined;

	/**
	 * Имя игрока (идентификатор)
	 */
	readonly name: string;

	/**
	 * Приглашающие на игру клиенты
	 */
	private _inviters: Set<Client>;

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
		this.name 		= name;
		this._inviters	= new Set<Client>();
		this._player	= undefined;

		this.bindEvents();

		toAdmin(
			{
				action: 'addClient',
				name: name,
			}
		);

		this.updateClient();
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

	/**
	 * Удалить клиента из списка приглашающих
	 * @param inviter Приглашающий клиент
	 */
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
		this._inviters.clear();

		this.updateClient();
	}

	/**
	 * Синхронизировать клиента с сервером
	 */
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
		const client: Client = this;
		log(
			this.name,
			'Bind functions to socket events'
		);

		this.socket?.on(
			'clientMessage',
			( message: AnyClientMessage, callback? ) =>
			{
				log(
					'Event',
					`New client message: <${message.data}>`,
					'onClientMessage'
				);
				switch ( message.type ) {
					case 'refreshList':
						client.onRefreshList( callback )
						.catch( ( error ) => log( 'Error', error ) );
						break;
					
					case 'invite':
						client.onInvite( message.data.name, callback );
						break;
					
					case 'elemSelection':
						client._player?.onElemSelection( message.data.elemNumber );
						break;
					
					case 'checkConfig':
						client._player?.onCheckConfig( message.data.config, callback );
						break;
					
					case 'shot':
						client._player?.onShot( message.data.spin, callback );
						break;

					case 'nameElement':
						client._player?.onNameElement( message.data.elemNumber );
						break;

					case 'endGame':
						client._player?.onEndGame();
						break;

					case 'flyAway':
						client.onFlyAway();
						break;
				}
			}
		);

		this.socket?.on(
			'disconnect',
			( reason: string ) =>
			{
				log(
					'Event',
					'Client disconnected. Reason: '+reason,
					client.name
				);
				client.onDisconnect();
			}
		)
	}

	/**
	 * Создать объект для отправки администратору
	 * @param stateObject Объект, подготовленный для отправки клиенту
	 */
	createUserInfo(): UserInfo
	{
		if ( this._player !== undefined )
		{
			return {
				client: {
					name: this.name,
					bIsOnline: this.bIsOnline,
				},
				player: this._player.createPlayerInfo(),
			};
		}

		return {
			client: {
				name: this.name,
				bIsOnline: this.bIsOnline,
			},
			player: {
				state: EState.Online,
				team: ETeam.None,
				element: {
					number: -1,
					name: '',
					symbol: '',
				},
				diagramCheck: false,
				rightMove: false,
				diagram: {
					main: [ 0, 0, 0, 0 ],
					base: [ 0, 0, 0, 0 ],
				},
			},
		};
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

		if ( this._player )
			this._player.onReconnection();
		else
			toAdmin( {
				action: 'updateClient',
				game: '',
				info1: this.createUserInfo(),
			} );

		this.bindEvents();
		this.updateClient();
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
					name: client.name,
					bIsInvited: this._inviters.has( client ),
					bIsInviting: client._inviters.has( this ),
				};
			}
			: ( client: Client ) =>
			{
				return {
					name: client.name,
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
	 * @param callback Функция, которая будет вызвана на клиенте. Принимает готовый список
	 */
	async onRefreshList( callback: ( list: ClientInfoRow[] ) => void ): Promise<void>
	{
		log(
			this.name,
			'The client asks for a list of all non-playing connected clients',
			'RefreshList'
		);

		const list: ClientInfoRow[] = this.getClientsList( true );
		callback( list );
	}

	/**
	 * Пригласить клиента на совместную игру.
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
				this.name,
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
				`${ this.name } is trying to invite invalid client <${ name }>`,
				'onInvite'
			);
			callback( false );
			return;
		}

		log(
			this.name,
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
						name: this.name,
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

	/**
	 * Клиента прошел регистрацию на сервере и просит либо закончить игру, либо отключиться
	 */
	onFlyAway(): void
	{
		log(
			this.name,
			'Client wants to fly away',
			'Client::onFlyAway'
		);
		if ( this._player )
			this._player.onFlyAway();
		else
			this._socket?.disconnect( true );
	}

	/**
	 * Отключение клиента от сервера
	 * 
	 * 1. Отчищает ссылку на сокет.
	 * 2. Если соединение оборвалось во время матча, то необходимо оповестить об отключении оппонента.
	 * 3. Если клиент не играл, то его необходимо удалить из списка приглашающих, а также необходимо оповестить о его уходе остальных неиграющих клиентов
	 */
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
					{
						client.removeInviter( this );
						client.socket?.emit(
							'refreshResults',
							message,
						);
					}
				}
			);
		}

		toAdmin( {
			action: 'updateClient',
			game: this._player ? this._player.gameId : '',
			info1: this.createUserInfo(),
		} );
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