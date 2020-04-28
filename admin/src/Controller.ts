type AppModel = {
	openDiagram( player: string ): void;
	closeDiagram(): void;
}

/**
 * Обработка действий пользователя
 */
class Controller
{
	/** Открыть окно с диаграммой данного игрока */
	openDiagram: ( event: Event ) => void;

	constructor( model: AppModel )
	{
		this.openDiagram = ( event: Event ) => {
			model.openDiagram( ( event.target as HTMLElement ).id.slice( 2 ) );
		}

		document.getElementById( 'd-close' )!.addEventListener(
			'click',
			() =>
			{
				model.closeDiagram();
			}
		);
	}
}


export default Controller;