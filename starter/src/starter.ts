import * as Appearance from "./appearance.js";
import * as Electron from "./starterApp.js";
import config from "../../server/config.js";

Appearance.init( config.port, Electron.switchServerState, Electron.openAdmin );
Electron.addOnConfirmationFunc( Appearance.confirmation );