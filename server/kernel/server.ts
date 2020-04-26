import SocketIO from 'socket.io';
import { port } from '../config.json';
import ip from 'ip';
import log from './log.js';

const io: SocketIO.Server = SocketIO( port );
const ipv4: string = ip.address();

log( 'INFO', `The server was started at ${ ipv4 }:${ port }`, 'SERVER' );

export {
	io,
	ipv4,
}