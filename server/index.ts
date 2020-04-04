import { io } from './kernel/server.js';
import { listenOn } from './kernel/connection.js';
import { default as Client, clientList} from './game/classes/Client.js';

listenOn( io, Client, clientList );


class Client
{
	private _socket: Socket | undefined;
	private _name: string;

	constructor( socket: Socket, name: string )
	{
		...
	}

	get bIsOnline(): boolean
	{
		return this._socket !== undefined;
	}

	onReconnection( newSocket: Socket, data: RegistrationMessage ): void
	{
		...
	}
}