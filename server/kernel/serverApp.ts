const { ipcRenderer } = require( "electron" );

function getPort(): number
{
	return ipcRenderer.sendSync( 'get-port' ) as number;
}

/* function getPort(): number
{
	return 8081;
} */

function confirmStart(): void
{
	ipcRenderer.send( 'serverStarted' );
}

export {
	getPort,
	confirmStart,
}