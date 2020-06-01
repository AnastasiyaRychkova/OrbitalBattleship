import { io } from './kernel/server.js';
import { listenOn } from './kernel/connection.js';
import { default as Client, clientList} from './game/classes/Client.js';
import { start } from "./kernel/admin.js";

listenOn(
	io,
	{ 
		Client,
		clientList,
		startAdmin: start,
	}
);

/* process.addListener(
	'uncaughtException',
	( error ) =>
	{
		console.error( error );
	}
); */