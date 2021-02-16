function createWebSocketServer(io, game) {

	const rootIo = io.of('/');

	rootIo.on('connection', (socket) => {

		const displayName = socket.handshake.query.displayName;
		const thumbUrl = socket.handshake.query.thumbUrl;

		console.log('WebSocket のコネクションがありました。');
		socket.emit('start data', {});

		socket.on('disconnect', () => { });
	});

	const socketTicker = setInterval(() => {

		rootIo.volatile.emit('map data', {}); // 全員に送信
	}, 66);
}

module.exports = {

	createWebSocketServer
};
