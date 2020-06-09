import { start as serverStart } from './kernel/server.js';
import * as Electron from "./kernel/serverApp.js";
import { listenOn } from './kernel/connection.js';
import { default as Client, clientList} from './game/classes/Client.js';
import { start as adminStart } from "./kernel/admin.js";


const io = serverStart( Electron.getPort() );
Electron.confirmStart();

listenOn(
	io,
	{
		Client,
		clientList,
		startAdmin: adminStart,
	}
);


/* import { start as serverStart } from './kernel/server.js';
import { listenOn } from './kernel/connection.js';
import { default as Client, clientList} from './game/classes/Client.js';
import { start as adminStart } from "./kernel/admin.js";

const io = serverStart( 8081 );

listenOn(
	io,
	{
		Client,
		clientList,
		startAdmin: adminStart,
	}
); */

/* process.addListener(
	'uncaughtException',
	( error ) =>
	{
		console.error( error );
	}
); */