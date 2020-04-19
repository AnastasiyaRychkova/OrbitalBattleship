import type { Socket } from 'socket.io';

interface IUser
{
	readonly name: string;
	readonly bIsOnline: boolean;
	readonly socket: Socket | undefined;

	/** Синхронизировать клиента с данными на сервере */
	updateClient(): void;
	onReconnection( newSocket: Socket ): void;
	onDisconnect(): void;
}

export default IUser;