let playing = false;

/* document.getElementById('start-server-btn').addEventListener( 'click', ( e ) => {
	
} ); */


function showServerStatus()
{
	const animation = playing ? 'stop' : 'start';
	document.getElementById( 'animate_to_' + animation ).beginElement();
	document.getElementById( 'btn-name' ).textContent = animation + ' server';
}