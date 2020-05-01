import log from './log.js';

import type {
	Server,
	Socket,
} from 'socket.io';
import type { RegistrationMessage, AnyClientMessage } from '../game/messages.js';
import EState from '../../common/EState.js';


type ClientInstance = {
	readonly bIsOnline: boolean;
	onReconnection( newSocket: Socket ): void;
};

type ClientStatic = {
	new ( socket: Socket, name: string ): ClientInstance;
};


type InitData = {
	Client: ClientStatic,
	clientList: Map<string, ClientInstance>,
	startAdmin: ( socket: Socket ) => void,
}


function listenOn(
	server: Server,
	{
		Client,
		clientList,
		startAdmin,
	}: InitData
): void
{
	server.on(
		'connection',
		( socket: Socket ) =>
		{
			log(
				'Event',
				`New client: ${socket.id}. Total connected clients: ${clientList.size}`
			);

			function flyAway( data: AnyClientMessage ): void
			{
				if ( data.type === 'flyAway' )
				{
					log(
						socket.id,
						'Client wants to fly away',
						'connection::flyAway'
					);
					socket.disconnect( true );
				}
			}

			socket.on( 'clientMessage', flyAway );

			/**
			 * Регистрация присоединившегося клиента.
			 * 
			 * Если клиент с таким именем сейчас online,
			 * то присоединившийся клиент регистрацию не проходит.
			 * Если информация о клиенте еще хранится после разрыва соединения,
			 * то провести процедуру переприсоединения.
			 * В противном случае создать новый объект клиента.
			 */
			socket.on(
				'registration',
				( data: RegistrationMessage, callback: ( bIsBusy: boolean ) => void ) =>
				{
					console.log( data );
					const client: ClientInstance | undefined = clientList.get( data.name );

					// Имя занято игроком, который сейчас online и прошел регистрацию
					if( client && client.bIsOnline )
					{
						log(
							socket.id,
							`Failed to register. The name <${ data.name }> is busy.`,
							'Registration'
						);

						callback( false );
						if ( data.state !== EState.Registration )
							socket.disconnect( true );
						return;
					}

					callback( true );
					
					// Сохранилась информация о клиенте с таким именем
					if( client )
					{
						log(
							data.name,
							`Reconnected with new socket <${ socket.id }>.`,
							'Registration'
						);

						socket.off( 'clientMessage', flyAway );
						client.onReconnection( socket );
					}
					else // Подключился новый клиент
					{
						log(
							socket.id,
							`New client <${ data.name }>.`,
							'Registration'
						);

						socket.off( 'clientMessage', flyAway );
						clientList.set( data.name, new Client( socket, data.name ) );
					}
					
				}
			);

			socket.on(
				'error',
				( error ) =>
				{
					console.error( error );
				}
			);

			socket.on(
				'disconnect',
				() => log(
					socket.id,
					'Disconnection',
				)
			)

			socket.on(
				'errorResponse',
				( data: any ) => log(
					'Error',
					`Client send invalid server response: <${ data }>`,
					'onErrorResponse'
				)
			);
		}
	);

	server.of( '/admin' ).on(
		'connect',
		( socket: Socket ) =>
		{
			log(
				'ADMIN',
				'Started'
			);
			startAdmin( socket );
		}
	)
}



export {
	listenOn,
}