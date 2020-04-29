import { io } from './kernel/server.js';
import { listenOn } from './kernel/connection.js';
import { default as Client, clientList} from './game/classes/Client.js';

listenOn( io, Client, clientList );

process.addListener(
	'uncaughtException',
	( error ) =>
	{
		console.error( error );
	}
);