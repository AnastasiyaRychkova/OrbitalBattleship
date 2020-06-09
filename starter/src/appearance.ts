/** Кнопка запуска сервера */
const serverBtn = {
	node: document.getElementById('start-server-btn') as HTMLButtonElement,
	name: document.getElementById( 'btn-name' ) as HTMLElement,
	serverStatus: false,
};

/** Кнопка запуска средства мониторинга */
const adminBtn = {
	node: document.getElementById('start-admin-btn') as HTMLButtonElement,
	wrapper: document.getElementById('admin-btn-wrapper') as HTMLElement,
	isHidden: true,
};

/** Экран ожидания отзыва программы */
const loader: HTMLElement = document.getElementById('loader') as HTMLElement;

/** Изменить статус работы сервера. Изменяется также назначение кнопки сервера (вкл/выкл) */
function setServerStatus( newStatus: boolean ): void
{
	serverBtn.serverStatus = newStatus;
	const animation = newStatus ? 'stop' : 'start';
	( document.getElementById( 'animate_to_' + animation ) as any ).beginElement();
	serverBtn.name.textContent = animation + ' server';
}

/** Установить видимость кнопки запуска средства мониторинга */
function setAdminBtnHidden( newHidden: boolean ): void
{
	if ( serverBtn.serverStatus && !newHidden )
	{
		adminBtn.wrapper.style.display = 'block';
		adminBtn.node.disabled = false;
		adminBtn.isHidden = false;
	}
	else
	{
		adminBtn.wrapper.style.display = 'none';
		adminBtn.isHidden = true;
	}
}

/** Установить видимость экрана ожидания */
function setLoaderHidden( newHidden: boolean ): void
{
	loader.style.display = newHidden ? 'none' : 'flex';
}

/**
 * Проверить введенное значение порта на выход за границы допустимого диапазона
 * @param e Input Event – событие изменения содержимого поля ввода
 */
function checkPort( e: Event ): void
{
	let port: number = parseInt( ( e.target as HTMLInputElement ).value );
	if ( port < 1024 ) // MIN
	{
		( e.target as HTMLInputElement ).value = '1024';
		return;
	}
	if ( port > 65535 ) // MAX
	{
		( e.target as HTMLInputElement ).value = '65535';
		return;
	}
}

/**
 * Добавить слушателей на кнопки и установить начальные значения
 * @param port Номер порта
 * @param serverBtnFunc Функция, вызываемая по нажатию на кнопку сервера
 * @param adminBtnFunc Функция, вызываемая по нажатию на кнопку запуска средства мониторинга
 */
function init(
	port: number,
	serverBtnFunc: ( newState: boolean, port: number) => void,
	adminBtnFunc: () => void
)
{
	// Установить начальное значение порта и повесить на него слушателя
	const portInput: HTMLInputElement = ( document.getElementById( 'port' ) as HTMLInputElement );
	portInput.addEventListener( 'input', checkPort );
	portInput.value = port.toString();

	serverBtn.node.addEventListener(
		'click',
		( e ) => {
			setLoaderHidden( false );
			setServerStatus( !serverBtn.serverStatus );
			setAdminBtnHidden( false );
			serverBtnFunc( serverBtn.serverStatus, parseInt( portInput.value ) );
		}
	);

	adminBtn.node.addEventListener(
		'click',
		() =>
		{
			adminBtn.node.disabled = true;
			setLoaderHidden( false );
			adminBtnFunc();
		}
	)
}

/**
 * Отобразить в интерфейсе результат выполнения операции приложением
 * @param type Тип операции
 * @param result Результат (успешно или нет)
 */
function confirmation( event: any, type: 'admin' | 'server', result: boolean ): void
{
	console.log( 'Confirmation', type, result, '//', 1 || event );
	if ( !result )
	{
		switch ( type ) {
			case 'server':
				setServerStatus( false );
				setAdminBtnHidden( true );
				break;

			case 'admin':
				adminBtn.node.disabled = true;
		}

	}
	setLoaderHidden( true );
}

export {
	init,
	confirmation,
};