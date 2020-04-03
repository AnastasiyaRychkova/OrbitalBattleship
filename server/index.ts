import { io } from './kernel/server.js';
import { listenOn } from './kernel/connection.js';
import Client from './game/classes/Client.js';

listenOn( io, Client );