var socket = io();

var userName = '';

// ステータス
var status = '';

// ステータス値
var CONNECT = 'connect';
var JOIN = 'join'
var GAME_READY = 'game ready';
var GAME_WAIT  = 'game wait';
var GAME_CONCENTRATE = 'game concentrate';
var GAME_FIGHT = 'game fight';

/**
 * 最初に接続したとき
 */
socket.on('iai connect', function(msg){
	console.log('User Connected = ' + socket.id);

	var joinUserStr = getJoinUserHtml(msg, socket.id);

	$('#join-user').html('<span>' + joinUserStr + '</span>');

	printInfoLog('プレイヤー名を入力し、参加ボタンを押して試合に参加してください。');

});

/**
 * 誰かが切断したとき
 */
socket.on('user disconnect', function(msg){
	console.log('User Disconnected');

	// 参加ユーザの取得
	var joinUserStr = getJoinUserHtml(msg.userStore, socket.id);
	$('#join-user').html('<span>' + joinUserStr + '</span>');

	// 準備完了ユーザの取得
	var readyUserStr = getReadyUserHtml(msg.userStore);
	$('#ready-user-name').html('<span>' + readyUserStr + '</span>');

	// ゲーム開始ボタン状態更新
	startGameButtonActive(msg.world.allUserReady);

	printInfoLog('プレイヤーが離脱しました。');

});

/**
 * 誰かが参加したとき
 */
socket.on('join user', function(msg){
	console.log('User Join');

	// 参加ユーザの取得
	var joinUserStr = getJoinUserHtml(msg, socket.id);
	$('#join-user').html('<span>' + joinUserStr + '</span>');

	printInfoLog('プレイヤーが参加しました。');

});

/**
 * 誰かが準備完了にしたとき
 */
socket.on('ready user', function(msg){
	console.log('Ready User Update');

	// 準備完了ユーザの取得
	var readyUserStr = getReadyUserHtml(msg.userStore);
	$('#ready-user-name').html('<span>' + readyUserStr + '</span>');

	printInfoLog('[ ' + msg.readyUserName + ' ]は準備完了です。');

});

/**
 * 誰かが待機中になったとき
 */
socket.on('wait user', function(msg){
	console.log('Wait User Update');

	var readyUserStr = getReadyUserHtml(msg.userStore);

	$('#ready-user-name').html('<span>' + readyUserStr + '</span>');

	// ゲーム開ボタンを非表示
	startGameButtonActive(false);

	printInfoLog('[ ' + msg.readyUserName + ' ]は待機中です。');

});

/**
 * 全ユーザが準備完了になったとき
 */
socket.on('all user ready', function(msg){
	console.log('All User ready');

	printInfoLog('ゲームを開始できます。');

	// ゲーム開始ボタンを表示
	startGameButtonActive(true);

});

/**
 * フィールドに突入したとき
 */
socket.on('enter field', function(msg){
	console.log('Enter Field');

	// 集中ステータスに更新
	status = GAME_CONCENTRATE;

	// スラッシュボタン表示
	slashButtonActive(true);

});


/**
 * 決闘開始
 */
socket.on('fight', function(msg){
	console.log('fight');

	// 斬るステータスに更新
	status = GAME_FIGHT;

	// 斬るメッセージを表示
	showFightMessage(true);

});

/**
 * 決闘継続
 */
socket.on('fight continue', function(msg){
	console.log('fight continue');
});

/**
 * 決闘終了
 */
socket.on('fight end', function(msg){
	console.log('fight end');

	var winnerStr = getWinnerHtml(msg);

	// 勝者名を作成
	$('#winner-name').html('<span>' + winnerStr + '</span>');

	// 勝者を表示
	showWinnerName(true);

	// 再戦ボタンを表示
	retryButtonActive(true);

});

/**
 * 再戦：準備状態に戻る
 */
socket.on('back to ready', function(msg){
	console.log('Back To Ready');

	// ステータスを準備中に戻す
	status = GAME_WAIT;

	retryInit(true);

});

/*
 * 参加中のユーザ一覧HTMLを取得
 */
function getJoinUserHtml(msg, socketId){
	var joinUserStr = '';

	// 他のユーザのみ表示する
	for (var key in msg) {

		if(key === '/#' + socketId){

		}else{

			// 空文字(未参加ユーザ)の場合は対象外
			if(msg[key].userName === ''){

			}else{
				joinUserStr += msg[key].userName + ', ';
			}
		}
	}

	return '<span>' + joinUserStr + '</span>';
}

/**
 * 準備完了状態のユーザ名を表示するHTMLを作成する
 * @param msg
 * @returns {String}
 */
function getReadyUserHtml(msg){
	var str = '';

	// 準備完了フラグがTrueのものだけ取得
	for(key in msg){
		if(msg[key].ready){
			str += msg[key].userName + ',';
		}
	}

	return '<span>' + str + '</span>';
}

/**
 * 勝者の名前を取得
 * @param fightResult
 * @returns {String}
 */
function getWinnerHtml(fightResult){

	var winnerName = fightResult.winner;
	return '勝者... ' + winnerName;

}

/**
 * 参加する処理
 */
function join(){

	console.log('JOIN')

	var msg = {};

	msg.name = document.getElementById('user-name').value;
	msg.roomid = document.getElementById('room-id').value;
	msg.socketId = socket.id;

	// 未入力チェック
	if(msg.name === ''){

		// 準備完了ボタンの非表示
		showPlayerNameEmptyMessage(true);
		return false;

	}else{
		// 準備完了ボタンの非表示
		showPlayerNameEmptyMessage(false);
	}

	// 自分のユーザ名
	userName = msg.name;

	// 自分のユーザ名を更新
	fixUserName(userName);

	// 自分のユーザ名を表示
	showFixUserName(true);

	// ユーザ名の入力フィールドを非表示にする
	userNameFieldActive(false);

	// 準備完了ボタンの非表示
	readyButtonActive(true);

	// 待機ボタンの非表示
	// waitButtonActive(true);

	// ステータスを待機中に設定
	status = GAME_WAIT;

	socket.emit('join', msg);
}

/**
 * 準備完了
 */
function ready(){

	// 既に準備完了中の場合は何もしない
	if(status !== GAME_WAIT){
		return false;
	}

	// ステータスを準備完了に設定
	status = GAME_READY;

	// 準備完了ボタンの非表示
	readyButtonActive(false);

	// 待機ボタンの表示
	waitButtonActive(true);

	socket.emit('ready', socket.id);
}

/**
 * 待機中
 */
function wait(){

	// 既に待機中の場合は何もしない
	if(status !== GAME_READY){
		return false;
	}

	// ステータスを準備完了に設定
	status = GAME_WAIT;

	// 準備完了ボタンの表示
	readyButtonActive(true);

	// 待機ボタンの非表示表示
	waitButtonActive(false);

	socket.emit('wait', socket.id);
}

function startGame(){
	socket.emit('game start', null);
}

/**
 * 斬る
 */
function slash(){
	socket.emit('slash', socket.id);
}

function retry(){
	socket.emit('retry', null);
}

/**
 * ユーザ名を固定
 */
function fixUserName(name){
	$('#fix-user-name').text(name);
}

/**
 * ユーザ名表示
 */
function showFixUserName(flag){

	if(flag){
		$('#fix-user-name-text').show();
	}else{
		$('#fix-user-name-text').hide();
	}
}

/**
 * インフォメーションメッセージの更新
 * @param msg
 */
function updateInfoMessage(msg){

	$('#info-message').text('');
	$('#info-message').text(msg);

}

/**
 * インフォメーションログを出力
 * @param msg
 */
function printInfoLog(msg){

	var infoLog = $('#info-log');

	infoLog.append('<div>' + msg + '</div>');

	if(infoLog.length == 0) return;
	infoLog.scrollTop(infoLog[0].scrollHeight);

}

/**
 * ユーザ名入力フィールドの状態変更
 * @param flag
 */
function userNameFieldActive(flag){

	if(flag){
		$('#user-name-field').show();
	}else{
		$('#user-name-field').hide();
	}
}

/**
 * ユーザ名入力フィールドの状態変更
 * @param flag
 */
function startGameButtonActive(flag){

	if(flag){
		$('#btn-start-game').show();
	}else{
		$('#btn-start-game').hide();
	}
}

/**
 * プレイヤー名未入力警告文の表示切替
 * @param flag
 */
function showPlayerNameEmptyMessage(flag){

	if(flag){
		$('#user-name-empty-message').show();
	}else{
		$('#user-name-empty-message').hide();
	}
}

/**
 * 準備完了ボタンの表示切替
 * @param flag
 */
function readyButtonActive(flag){

	if(flag){
		$('#btn-ready').show();
	}else{
		$('#btn-ready').hide();
	}
}

/**
 * 待機ボタンの表示切替
 * @param flag
 */
function waitButtonActive(flag){

	if(flag){
		$('#btn-wait').show();
	}else{
		$('#btn-wait').hide();
	}
}

/**
 * スラッシュボタンの状態切替
 * @param flag
 */
function slashButtonActive(flag){

	if(flag){
		$('#btn-slash').show();
	}else{
		$('#btn-slash').hide();
	}
}

/**
 * 戦闘開始メッセージ表示切替
 * @param flag
 */
function showFightMessage(flag){

	if(flag){
		$('#fight-message').show();
	}else{
		$('#fight-message').hide();
	}
}

/**
 * 勝者名表示切替
 * @param flag
 */
function showWinnerName(flag){

	if(flag){
		$('#winner-name').show();
	}else{
		$('#winner-name').hide();
	}
}

/**
 * リトライボタン状態切替
 * @param flag
 */
function retryButtonActive(flag){

	if(flag){
		$('#btn-retry').show();
	}else{
		$('#btn-retry').hide();
	}
}


/**
 * 初期処理
 */
function init(){

	// ユーザ名非表示
	showFixUserName(false);

	// リトライ用初期化
	retryInit(false);

}

/**
 * リトライ用初期化
 */
function retryInit(retryFlag){

	// 未入力警告文非表示
	showPlayerNameEmptyMessage(false);

	// ゲーム開始ボタンの非表示
	startGameButtonActive(false);

	// 準備完了ボタンの非表示
	readyButtonActive(retryFlag);

	// 待機ボタンの非表示
	waitButtonActive(false);

	// スラッシュボタンの非表示
	slashButtonActive(false);

	// 決闘メッセージの非表示
	showFightMessage(false);

	// リトライボタン非表示
	retryButtonActive(false);

	// 勝者名
	showWinnerName(false);

	// 準備状態のユーザ名
	$('#ready-user-name').html('<span></span>');
}

/**
 * 初期処理
 */
$(document).ready(function(){
	console.log('INITIALIZE');
	init();
})