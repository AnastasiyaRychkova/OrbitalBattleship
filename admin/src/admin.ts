import Controller from "./Controller.js";
import AdminModel from "./AdminModel.js";
import Updater from "./Updater.js";
import { connect } from "./connection.js";

const updater: Updater = new Updater();
const model: AdminModel = new AdminModel( updater );
const controller: Controller = new Controller( model );
updater.init( controller, '192.168.0.0:5500' );

connect( 'http://localhost:8081', model );

/* updater.newGame( 
	'player21player55',
	{
		name: 'player55',
		bIsOnline: false,
		state: EState.PeriodicTable,
		team: ETeam.Lanthanoids,
		element: {
			number: 17,
			name: 'Chlor',
			symbol: 'Cl',
		},
		rightMove: false,
	},
	{
		name: 'player21',
		bIsOnline: true,
		state: EState.Preparing,
		team: ETeam.Actinoids,
		element: {
			number: 8,
			name: 'Oxygen',
			symbol: 'O',
		},
		rightMove: true,
	}
);

updater.updateClient( 'player2', false );
updater.updatePlayer(
	{
		name: 'player3',
		bIsOnline: true,
		state: EState.Celebration,
		element: {
			number: 17,
			name: 'Chlor',
			symbol: 'Cl',
		},
		diagramCheck: true,
	}
);

updater.updatePlayer(
	{
		name: 'player1',
		state: EState.Online,
	}
); */

/* updater.updateClient(
	'Player3',
	false,
	{
		counter: {
			games: 10,
			victories: 5,
		},
		timing: {
			totalTime: 35,
			AVGTime: 4,
		}
	}
);

updater.updateClientCounter( 5, 7 ); */

/* updater.updateDiagramHidden( false, {
	client: {
		name: 'New Player',
		bIsOnline: true,
	},
	player: {
		state: 6,
		team: 0,
		diagramCheck: false,
		rightMove: true,
		diagram: {
			main: [ -1, -1, 65533, 0 ],
			base: [ -1, 4194303, 21887, 0 ]
		},
		element: {
			number: 79,
			name: 	'gold',
			symbol: 'Au',
		},
	}
} ); */