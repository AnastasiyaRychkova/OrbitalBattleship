import io from "socket.io-client";
import { addClientMessage, updateClientMessage, newGameMessage, UserInfo } from "../../common/messages";

type AdminModelType = {
	addClient( client: string ): void;
	updateClient( info: UserInfo, gameId: string ): void;
	newGame( gameId: string, player1: UserInfo, player2: UserInfo ): void;

}

let socket: SocketIOClient.Socket;

function connect( address: string, model: AdminModelType )
{
	socket = io( address+'/admin' );

	socket.on(
		'connect',
		() => {
			console.log( 'Connection', address+'/admin' );
		}
	);

	socket.on(
		'admin',
		( message: addClientMessage | updateClientMessage | newGameMessage ) => {
			switch ( message.action ) {
				case 'addClient':
					model.addClient( ( message as addClientMessage ).name );
					break;

				case 'updateClient':
					{
						const typedMessage = message as updateClientMessage;
						model.updateClient( typedMessage.info1, typedMessage.game );
						typedMessage.info2 && model.updateClient( typedMessage.info2, typedMessage.game );
					}
					break;

				case 'newGame':
					{
						const typedMessage = message as newGameMessage;
						model.newGame( typedMessage.game, typedMessage.player1, typedMessage.player2 )
					}
					break;
			}
		}
	)
}

export {
	connect,
}