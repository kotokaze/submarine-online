'use strict';

const crypto = require('crypto');


const gameObj = {
	playersMap: new Map(),
	itemsMap: new Map(),
	airMap: new Map(),
	fieldWidth: 1000,
	fieldHeight: 1000,
	itemTotal: 15,
	airTotal: 10,
	itemRadius: 4,
	airRadius: 6,
	addAirTime: 30,
	submarineImageWidth: 42
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

const gameTicker = setInterval(() => {

	movePlayers(gameObj.playersMap);  // 潜水艦の移動
	checkGetItem(gameObj.playersMap, gameObj.itemsMap, gameObj.airMap);  // アイテムの取得チェック
}, 33);

function movePlayers(playersMap) {

	for (const [playerId, player] of playersMap) {

		if (player.isAlive === false) {
			continue;
		}

		switch (player.direction) {

			case 'left':
				player.x -= 1;
				break;
			case 'up':
				player.y -= 1;
				break;
			case 'down':
				player.y += 1;
				break;
			case 'right':
				player.x += 1;
				break;
		}

		if (player.x > gameObj.fieldWidth) { player.x -= gameObj.fieldWidth; }
		if (player.x < 0) { player.x += gameObj.fieldWidth; }
		if (player.y < 0) { player.y += gameObj.fieldHeight; }
		if (player.y > gameObj.fieldHeight) { player.y -= gameObj.fieldHeight; }

		player.aliveTime.clock += 1;

		if (player.aliveTime.clock === 30) {

			player.aliveTime.clock = 0;

			player.aliveTime.seconds += 1;
			decreaseAir(player);
			player.score += 1;
		}
	}
}

function decreaseAir(playerObj) {

	playerObj.airTime -= 1;

	if (playerObj.airTime === 0) {
		playerObj.isAlive = false;
	}
}

function checkGetItem(playersMap, itemsMap, airMap) {

	for (const [hashKey, playerObj] of playersMap) {

		if (playerObj.isAlive === false) { continue; }

		// アイテムのミサイル（赤丸）
		for (const [itemKey, itemObj] of itemsMap) {

			const distanceObj = calculationBetweenTwoPoints(playerObj.x, playerObj.y, itemObj.x, itemObj.y, gameObj.fieldWidth, gameObj.fieldHeight);

			if (
				(distanceObj.distanceX <= (gameObj.submarineImageWidth / 2 + gameObj.itemRadius))
				&& (distanceObj.distanceY <= (gameObj.submarineImageWidth / 2 + gameObj.itemRadius))
			) {

				gameObj.itemsMap.delete(itemKey);
				playerObj.missilesMany = playerObj.missilesMany > 5 ? 6 : playerObj.missilesMany + 1;
				addItem();
			}
		}

		// アイテムの空気（青丸）
		for (const [airKey, airObj] of airMap) {

			const distanceObj = calculationBetweenTwoPoints(playerObj.x, playerObj.y, airObj.x, airObj.y, gameObj.fieldWidth, gameObj.fieldHeight);

			if (
				(distanceObj.distanceX <= (gameObj.submarineImageWidth / 2 + gameObj.airRadius))
				&& (distanceObj.distanceY <= (gameObj.submarineImageWidth / 2 + gameObj.airRadius))
			) {

				gameObj.airMap.delete(airKey);

				if (playerObj.airTime + gameObj.addAirTime > 99) {

					playerObj.airTime = 99;
				}
				else playerObj.airTime += gameObj.addAirTime;

				addAir();
			}
		}
	}
}

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
		missilesMany: 0,
		airTime: 99,
		aliveTime: { 'clock': 0, 'seconds': 0 },
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


	for (const [socketId, player] of gameObj.playersMap) {

		const playerDataForSend = [];

		playerDataForSend.push(player.x);
		playerDataForSend.push(player.y);
		playerDataForSend.push(player.playerId);
		playerDataForSend.push(player.displayName);
		playerDataForSend.push(player.score);
		playerDataForSend.push(player.isAlive);
		playerDataForSend.push(player.direction);
		playerDataForSend.push(player.missilesMany);
		playerDataForSend.push(player.airTime);

		playersArray.push(playerDataForSend);
	}

	for (const [id, item] of gameObj.itemsMap) {

		const itemDataForSend = [];

		itemDataForSend.push(item.x);
		itemDataForSend.push(item.y);

		itemsArray.push(itemDataForSend);
	}

	for (const [id, air] of gameObj.airMap) {

		const airDataForSend = [];

		airDataForSend.push(air.x);
		airDataForSend.push(air.y);

		airArray.push(airDataForSend);
	}

	return [playersArray, itemsArray, airArray];
}

function updatePlayerDirection(socketId, direction) {

	const playerObj = gameObj.playersMap.get(socketId);

	playerObj.direction = direction;
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

function calculationBetweenTwoPoints(pX, pY, oX, oY, gameWidth, gameHeight) {

	let distanceX = 99999999;
	let distanceY = 99999999;

	if (pX <= oX) {

		// 右から
		distanceX = oX - pX;

		// 左から
		let tmpDistance = pX + gameWidth - oX;

		if (distanceX > tmpDistance) {

			distanceX = tmpDistance;
		}
	}
	else {

		// 右から
		distanceX = pX - oX;

		// 左から
		let tmpDistance = oX + gameWidth - pX;

		if (distanceX > tmpDistance) {

			distanceX = tmpDistance;
		}
	}

	if (pY <= oY) {

		// 下から
		distanceY = oY - pY;

		// 上から
		let tmpDistance = pY + gameHeight - oY;

		if (distanceY > tmpDistance) {

			distanceY = tmpDistance;
		}
	}
	else {

		// 上から
		distanceY = pY - oY;

		// 下から
		let tmpDistance = oY + gameHeight - pY;

		if (distanceY > tmpDistance) {

			distanceY = tmpDistance;
		}
	}

	return { distanceX, distanceY };
}

module.exports = {

	newConnection,
	getMapData,
	updatePlayerDirection,
	disconnect
};
