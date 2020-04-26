import StatUpdater from "./StatUpdater.js";

const updater: StatUpdater = new StatUpdater();

console.log( 'Updater ready!' );

updater.updateClient(
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

updater.updateClientCounter( 5, 7 );

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