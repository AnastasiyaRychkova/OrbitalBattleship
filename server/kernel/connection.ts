import log from './log.js';

import type {
	Server,
	Socket,
} from 'socket.io';
import type { RegistrationMessage } from '../game/messages.js';


type ClientInstance = {
	readonly bIsOnline: boolean;
	onReconnection( newSocket: Socket, data: RegistrationMessage ): void;
};

type ClientStatic = {
	new ( socket: Socket, name: string ): ClientInstance;
};


function listenOn( server: Server, Client: ClientStatic, clientList: Map<string, ClientInstance> ): void
{
	server.on(
		'connection',
		( socket: Socket ) =>
		{
			log(
				'Event',
				`New client: ${socket.id}. Total connected clients: ${clientList.size}`
			);

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
					const client: ClientInstance | undefined = clientList.get( data.name );

					if( client && client.bIsOnline )
					{
						log(
							socket.id,
							`Failed to register. The name <${ data.name }> is busy.`,
							'Registration'
						);

						callback( false );
						return;
					}

					callback( true );
					
					if( client )
					{
						log(
							data.name,
							`Reconnected with new socket <${ socket.id }>.`,
							'Registration'
						);

						client.onReconnection( socket, data );
					}
					else
					{
						log(
							socket.id,
							`New client <${ data.name }>.`,
							'Registration'
						);

						clientList.set( data.name, new Client( socket, data.name ) );
					}
					
				}
			);
		}
	);
}

export {
	listenOn,
}