import { addClientMessage, updateClientMessage, newGameMessage, UserInfo, removeGameMessage, reloadAdminMessage, AdminUser } from "../../common/messages";

type AdminModelType = {
	addClient( client: string ): void;
	updateClient( info: UserInfo, gameId: string ): void;
	newGame( gameId: string, startTime: number, player1: UserInfo, player2: UserInfo ): void;
	removeGame( gameId: string ): void;
	clear(): void;
	reload( newModel: AdminUser[] ): void;
}

let socket: SocketIOClient.Socket;

function connect( address: string, model: AdminModelType )
{
	socket = io( address+'/admin' );

	socket.on(
		'connect',
		() => {
			console.log( 'Connection', address+'/admin' );
			model.clear();
		}
	);

	socket.on(
		'admin',
		( message: addClientMessage | updateClientMessage | newGameMessage | removeGameMessage | reloadAdminMessage ) => {
			console.log( 'New message:', message );
			switch ( message.action ) {
				case 'addClient':
					model.addClient( message.name );
					break;

				case 'updateClient':
					model.updateClient( message.info1, message.game );
						message.info2 && model.updateClient( message.info2, message.game );
					break;

				case 'newGame':
					model.newGame(
						message.game,
						message.startTime,
						message.player1,
						message.player2
					);
					break;

				case 'removeGame':
					model.removeGame( message.game );
					break;

				case 'reloadAdmin':
					model.reload( message.model );
					break;
			}
		}
	)
}

export {
	connect,
}