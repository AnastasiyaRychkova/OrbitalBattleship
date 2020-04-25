import DiagramUpdater from "./DiagramUpdater.js";

const updater: DiagramUpdater = new DiagramUpdater();

console.log( 'Updater ready!' );

updater.updateDiagramHidden( false, {
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
} );