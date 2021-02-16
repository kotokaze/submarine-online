'use strict';

const crypto = require('crypto');


const gameObj = {

	playersMap: new Map(),
	itemsMap: new Map(),
	airMap: new Map(),
	fieldWidth: 1000,
	fieldHeight: 1000,
	itemTotal: 15,
	airTotal: 10
};

function init() {

	for (let i = 0; i < gameObj.itemTotal; i++) {

		addItem();
	}

	for (let a = 0; a < gameObj.airTotal; a++) {

		addAir();
	}
}
init();  // 初期化（初期化はサーバー起動時に行う)

function newConnection(socketId, displayName, thumbUrl) {

	const playerX = Math.floor(Math.random() * gameObj.fieldWidth);
	const playerY = Math.floor(Math.random() * gameObj.fieldHeight);
	const playerId = crypto.createHash('sha1').update(socketId).digest('hex');
	const playerObj = {
		x: playerX,
		y: playerY,
		playerId: playerId,
		displayName: displayName,
		thumbUrl: thumbUrl,
		isAlive: true,
		direction: 'right',
		score: 0
	};

	gameObj.playersMap.set(socketId, playerObj);

	const startObj = {

		playerObj: playerObj,
		fieldWidth: gameObj.fieldWidth,
		fieldHeight: gameObj.fieldHeight
	};

	return startObj;
}

function getMapData() {

	const playersArray = [];
	const itemsArray = [];
	const airArray = [];


	for (const [socketId, player] in gameObj.playersMap) {

		const playerDataForSend = [];

		playerDataForSend.push(player.x);
		playerDataForSend.push(player.y);
		playerDataForSend.push(player.playerId);
		playerDataForSend.push(plyer.displayName);
		playerDataForSend.push(plyer.score);
		playerDataForSend.push(plyer.isAlive);
		playerDataForSend.push(plyer.direction);

		playersArray.push(playerDataForSend);
	}

	for (const [id, item] in gameObj.itemsMap) {

		const itemDataForSend = [];

		itemDataForSend.push(item.x);
		itemDataForSend.push(item.y);

		itemsArray.push(itemDataForSend);
	}

	for (const [id, air] in gameObj.airMap) {

		const airDataForSend = [];

		airDataForSend.push(air.x);
		airDataForSend.push(air.y);

		airArray.push(airDataForSend);
	}

	return [playersArray, itemsArray, airArray];
}

function disconnect(socketId) {

	gameObj.playersMap.delete(socketId);
}

function addItem() {

	const itemX = Math.floor(Math.random() * gameObj.fieldWidth);
	const itemY = Math.floor(Math.random() * gameObj.fieldHeight);
	const itemKey = `${itemX}, ${itemY}`;

	// アイテムの位置が被ってしまった場合は作り直し
	if (gameObj.itemsMap.has(itemKey)) { return addItem(); }

	const itemObj = { x: itemX, y: itemY };

	gameObj.itemsMap.set(itemKey, itemObj);
}

function addAir() {

	const airX = Math.floor(Math.random() * gameObj.fieldWidth);
	const airY = Math.floor(Math.random() * gameObj.fieldHeight);
	const airKey = `${airX}, ${airY}`;

	// アイテムの位置が被ってしまった場合は作り直し
	if (gameObj.airMap.has(airKey)) { return addAir(); }

	const airObj = { x: airX, y: airY };

	gameObj.airMap.set(airKey, airObj);
}


module.exports = {

	newConnection,
	getMapData,
	disconnect
};
