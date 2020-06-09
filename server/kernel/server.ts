/* import SocketIO from 'socket.io';
import ip from 'ip'; */
const SocketIO = require('socket.io');
const ip = require('ip');
import log from './log.js';

let io: SocketIO.Server = null as unknown as SocketIO.Server;
const ipv4: string = ip.address();

/**
 * Запустить сервер на указанном порту
 * @param port Номер порта
 */
function start( port: number )
{
	io = SocketIO( port );

	log( 'INFO', `The server was started at ${ ipv4 }:${ port }`, 'SERVER' );

	return io;
}

export {
	start,
	ipv4,
}