import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

import type { IpcMainEvent } from 'electron';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if ( require( 'electron-squirrel-startup' ) ) { // eslint-disable-line global-require
	app.quit();
}

type mainWindowsType = {
	starter: BrowserWindow | undefined,
	server: BrowserWindow | undefined,
	admin: BrowserWindow | undefined,
};

/** Главные окна, составляющие работу приложения */
const mainWindows: mainWindowsType = {
	starter: undefined,
	server: undefined,
	admin: undefined,
};

let serverPort: number = 8081;

function createStarterWindow()
{
	// Create the browser window.
	const starterWindow = new BrowserWindow({
		height: 600,
		width: 900,
		minWidth: 400,
		minHeight: 500,
		titleBarStyle: 'hidden',
		webPreferences: {
			nodeIntegration: true,
			minimumFontSize: 8,
		}
	});

	// and load the index.html of the app.
	starterWindow.loadFile(path.join(__dirname, '../starter/starter.html'));

	// Open the DevTools.
	starterWindow.webContents.openDevTools();

	starterWindow.on(
		'closed',
		() => {
			mainWindows.starter = undefined;
			if ( mainWindows.server ) // TODO: добавить удаление admin
				destroyServer();
			app.quit();
		}
	);

	mainWindows.starter = starterWindow;
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createStarterWindow);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') {
		app.quit();
	}
});

app.on('activate', () => {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) {
		createStarterWindow();
	}
});



function destroyServer(): void
{
	if ( mainWindows.server !== undefined )
	{
		mainWindows.server.destroy();
		mainWindows.server = undefined;
	}
}

function createServerWindow(): void
{
	
	destroyServer();

	// Create the hidden browser window.
	const newWindow = new BrowserWindow({
		height: 600,
		width: 900,
		// show: false,
		webPreferences: { nodeIntegration: true }
	});

	// and load the index.html of the app.
	newWindow.loadFile(path.join(__dirname, '../server/server.html'));

	newWindow.webContents.openDevTools();

	mainWindows.server = newWindow;
};

ipcMain.on(
	'switch-server-state',
	( event: IpcMainEvent, newState: boolean, port: number ) =>
	{
		if ( newState && mainWindows.server === undefined )
		{
			serverPort = port;
			createServerWindow();
			return;
		}
		
		if ( !newState && mainWindows.server !== undefined )
		{
			destroyServer();
			return;
		}

		event.reply( 'confirmation', 'server', false );
	}
);

ipcMain.on(
	'get-port',
	( event: IpcMainEvent ) =>
	{
		event.returnValue = serverPort;
	}
);

ipcMain.on(
	'serverStarted',
	() =>
	{
		mainWindows.starter?.webContents.send( 'confirmation', 'server', true );
	}
);