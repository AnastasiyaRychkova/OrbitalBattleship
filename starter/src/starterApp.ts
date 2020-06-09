const { ipcRenderer } = require( "electron" );
import type { IpcRendererEvent } from 'electron';


function switchServerState( newState: boolean, port: number = 8080 ): void
{
	console.log( 'switchServerState', newState, port );
	ipcRenderer.send( 'switch-server-state', newState, port );
}


function openAdmin(): void
{
	ipcRenderer.send( 'open-admin' );
}


function addOnConfirmationFunc( func: ( event: IpcRendererEvent, type: 'admin'|'server', result: boolean ) => void )
{
	ipcRenderer.on(
		'confirmation',
		func
	);
}

export {
	switchServerState,
	openAdmin,
	addOnConfirmationFunc,
};