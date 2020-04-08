import type { Socket } from 'socket.io';
import type { UpdateStateMessage } from '../messages.js';

interface IUser
{
	readonly name: string;
	readonly bIsOnline: boolean;
	readonly socket: Socket | undefined;
	bindEvents(): void;
	createStateObject(): UpdateStateMessage;
	updateClient(): void;
}

export default IUser;