import { Socket } from "socket.io";
import type { AnyServerMessage } from '../../common/messages.js';


let admin: Socket | null = null;

export function start( socket: Socket ): void
{
	admin = socket;
}

export function toAdmin( message: AnyServerMessage )
{
	admin?.emit( 'admin', message );
}