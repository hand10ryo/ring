'use strict';

//var conn;
let localStream = null;
let peer = null;
let existingCall=null;
let model = null;
$('#canvas').hide();
var tracker = new tracking.LandmarksTracker();
let myvideo = $('#my-video').get(0);
const CLASSES =  ({0:'😠 angry',1:'😬 disgust',2:'😨 fear',3:'😄 happy', 4:'😢 sad',5:'😮 surprise',6:'😐 neutral'})
const COLORS =  ({0:'red',1:'green',2:'purple',3:'yellow', 4:'blue',5:'skyblue',6:'white'})
let adjust = 640/240;
//let adjust_h = 480/170;
const connectedPeers = {};
var loading_frag = 0;
var peer_id = $('#my-id').text();
var mode = $("#mode").text();
var mystate = "login"
var opstate = "logout"
var login_session = null;
var load_you = 0;
var load_another = 0;
var points = {};
ChangeUI(opstate);

//カメラ起動
navigator.mediaDevices.getUserMedia({video: true, audio: true})
	.then(function (stream) {
		myvideo.srcObject = stream;
		localStream = stream;
	}).catch(function (error) {
    console.error('mediaDevice.getUserMedia() error:', error);
    return;
});

//peerインスタンス化
peer = new Peer(peer_id,{
    key: '1a95b3e4-b885-4943-ade9-d9071931911b',
    debug: 3,
    logFunction: args => {
        const copy = [...args].join(' ');
        $('.log').append(copy + '<br>');
    }
});


//peer起動イベント設定-ビデオ
peer.on('open', function(){
    $('#myid_form').val(peer.id);
    $('#myid_form').attr('readonly',true).hide();
    console.log(peer.id)
    
    //ログイン状態
    const preconnectedPeers = {}
    if (mode == "created"){
        const prerequestedPeer = $('#callto-id').val();
        if (!preconnectedPeers[prerequestedPeer]) {
            const login = peer.connect(prerequestedPeer, {label: 'login', reliable: true});
            login.on('open', () => {
                connect(login);
                ChangeUI("login");
            });
        login.on('error', err => alert(err));
        }   
    }
});


//ビデオチャット着信イベント設定
peer.on('call', function(call){
	call.answer(localStream);
	setupCallEventHandlers(call);
	setEmotionTracking();
    ChangeUI("loading")
});


//データコネクション着信イベント設定
peer.on('connection', c => {
    c.on('open', () => {
        connect(c)
        if (c.label === "login"){
            ChangeUI("login")
        }
    });
});

//エラーイベント設定
peer.on('error', function(err){
    alert(err.message);
});


//全接続終了時イベント設定
peer.on('close', function(){
    ChangeUI("logout");
    tracker = new tracking.LandmarksTracker();
});

//シグナリングサーバ切断イベント設定
peer.on('disconnected', function(){
    alert("Connection with signaling server is dead. Please push reaccess button.")
}); 

// on <--> diconnected
// call/connection <--> close



//発信処理
$('#callbutton').click(function(e){
    e.preventDefault();
	
	//データ
	const requestedPeer = $('#callto-id').val();
      if (!connectedPeers[requestedPeer]) {
		//テキスト
        const chat = peer.connect(requestedPeer, {
          label:    'chat',
          metadata: {message: 'hi i want to chat with you!'},
        });
  
        chat.on('open', () => {
          connect(chat);
          connectedPeers[requestedPeer] = 1;
        });
  
        chat.on('error', err => alert(err));
		//ファイル
        const file = peer.connect(requestedPeer, {label: 'file', reliable: true});
        file.on('open', () => {
          connect(file);
        });
  
        file.on('error', err => alert(err));
		//感情値
		const feel = peer.connect(requestedPeer, {label: 'feel', reliable: true});
        feel.on('open', () => {
          connect(feel);
        });
  
        feel.on('error', err => alert(err));
      }
	
	//ビデオチャット
    const call = peer.call($('#callto-id').val(), localStream);
    setupCallEventHandlers(call);
	setEmotionTracking();
});


//tracking開始処理
function setEmotionTracking(){
	tracker.setInitialScale(4);
	tracker.setStepSize(2);
	tracker.setEdgesDensity(0.1);
	window.requestAnimationFrame((ts) => draw_loading(ts));
	tracking.track(myvideo, tracker);
}


//通信セットアップ
function setupCallEventHandlers(call){
    if (existingCall) {
        existingCall.close();
    };

    existingCall = call;
	//streamイベント設定
    call.on('stream', function(stream){
        addVideo(call,stream);
        $("#their-id").text(call.remoteId);
        ChangeUI("loading");
        //setpoint
        points = [{"id":peer.id,"point":[200,200],"color":'rgb(192, 80, 77)'},
                  {"id":call.remoteId,"point":[200,200],"color":'rgb(155, 187, 89)'}]
    });
	//切断イベント設定
    call.on('close', function(){
        removeVideo(call.remoteId);
        call.answer(localStream);
        ChangeUI("logout");
    });
}


//切断クリック操作
$('#end-call').click(function(){
    closeconnections("closer");
});
                     
//切断関数(全体)                     
function closeconnections(frag){
    //終了情報をつたえる
    if(frag == "closer"){
        eachActiveConnection((c, $c) => {
            if (c.label === 'login') {
                c.send("close");
            }
        });
    }
    
    //トラッキング終了
	tracker = new tracking.LandmarksTracker();
    //ビデオチャット終了
    existingCall.close();
    //データコネクション終了
	eachActiveConnection((c,$c) => {
        if (c.label != "login"){
            c.close();
        }
    });
    //UI変更
    ChangeUI("logout");
}


//相手側カメラ追加
function addVideo(call,stream){
    //srcobjectはDOMobjectなので、jQueryObjectから変換する
    $('#their-video').get(0).srcObject = stream;
}

//切断処理(個別)
function removeVideo(peerId){
    $('#'+peerId).remove();
}

//テキストチャット送信
$('#send_text').on('submit', e => {
	e.preventDefault();
	const msg = $('#text').val();
	eachActiveConnection((c, $c) => {
		if (c.label === 'chat') {
			c.send(msg);
			$c.find('.messages').append('<div><span class="you">You: </span>' + msg+ '</div>');
		}
	});
	$('#text').val('');
	$('#text').focus();
});
  
//ファイル送信
const box = $('#box');
box.on('dragenter', doNothing);
box.on('dragover', doNothing);
box.on('drop', e => {
	e.originalEvent.preventDefault();
	const [file] = e.originalEvent.dataTransfer.files;
	eachActiveConnection((c, $c) => {
		if (c.label === 'file') {
			c.send(file);
			$c.find('.messages').append('<div><span class="file">You sent a file.</span></div>');
		}
	});
});

//無行動処理
function doNothing(e) {
	e.preventDefault();
	e.stopPropagation();
}

//全データコネクション共通処理制御
function eachActiveConnection(fn) {
	const actives = $('.active');
	const checkedIds = {};
	actives.each((_, el) => {
		const peerId = $(el).attr('id');
		if (!checkedIds[peerId]) {
			const conns = peer.connections[peerId];
			for (let i = 0, ii = conns.length; i < ii; i += 1) {
				const conn = conns[i];
				fn(conn, $(el));
			}
		}
		checkedIds[peerId] = 1;
	});
}



//window切断時(強制終了)
window.onunload = window.onbeforeunload = function(e) {
	if (!!peer && !peer.destroyed) {
		peer.destroy();
	}
};

//データコネクション作成
function connect(c) {
	//テキストチャットコネクション
    if (c.label === 'chat') {
        connectedPeers[c.remoteId] = 1;
		const chatbox = $('<div></div>').addClass('connection').addClass('active').attr('id', c.remoteId);
		const header = $('<h5></h5>').html('Chat with <strong>' + c.remoteId + '</strong>');
		const messages = $('<div><em>Peer connected.</em></div>').addClass('messages');
		chatbox.append(header);
		chatbox.append(messages);
        /*chatbox.on('click', () => {
			chatbox.toggleClass('active');
			console.log("chatboxonclick");
		});*/
		$('.filler').hide();
		$('#connections').append(chatbox);
		c.on('data', data => {
			console.log(data);
			messages.append('<div><span class="peer">' + c.remoteId + '</span>: ' + data +'</div>');
			//console.log(data);
		});
		c.on('close', () => {
			alert(c.remoteId + ' has left the chat.');
			chatbox.remove();
			if ($('.connection').length === 0) {
				$('.filler').show();
			}
			delete connectedPeers[c.remoteId];
		});
	//ファイルコネクション
	}else if (c.label === 'file') {
        connectedPeers[c.remoteId] = 1;
		c.on('data', function(data) {
        // If we're getting a file, create a URL for it.
		let dataBlob;
		if (data.constructor === ArrayBuffer) {
			dataBlob = new Blob([new Uint8Array(data)]);
		}else {
			dataBlob = data;
		}
		const filename = dataBlob.name || 'file';
		const url = URL.createObjectURL(dataBlob);
		$('#' + c.remoteId).find('.messages').append('<div><span class="file">' + c.remoteId + 
				' has sent you a <a target="_blank" href="' + url + '" download="' + filename + '">file</a>.</span></div>');
		});
	//感情値コネクション
	}else if (c.label === 'feel') {
        connectedPeers[c.remoteId] = 1;
		c.on('data', function(emotion) {
			if (emotion != "FACE NOT FOUND"){
				var res = new Float32Array(emotion);
                if(opstate == "loading"){
                    load_another = 1;
                    //ChangeUI("calling");
                    loadstate(load_you,load_another);
                }
				draw_chart(res)
                draw_scatter(res,c.remoteId);
				console.log(res);
			}else{
				console.log(res);
			}
		});
    //ログイン状態コネクション
    }else if (c.label === 'login') {
        ChangeUI("login");
        login_session = setInterval("loginsession()",3000);
		c.on('data', function(frag) {
			if (frag == "login" && opstate == "logout"){
				ChangeUI("login");
                console.log(frag);
			}else if(frag == "close"){
                closeconnections("closed");
            }
		});
        c.on('close', () => {
			ChangeUI("logout");
		});
	}
}

//login状況送信
function loginsession(){
    eachActiveConnection((c, $c) => {
		if (c.label === 'login') {
			c.send("login");
		}
	});
    
}


//モデル読み込み関数
async function getModel(){
	console.log("loading");
	model = await tf.loadModel("/static/one2one/emotion_XCEPTION/model.json");
	console.log("loaded");
}
//実行
getModel();

//画像前処理
function preprocessImage(image){
  const channels = 1;
  let tensor = tf.fromPixels(image, channels).resizeNearestNeighbor([64,64]).toFloat();
  let offset = tf.scalar(255);
  return tensor.div(offset).expandDims();
};


//trackingイベント設定
tracker.on('track', function(event) {
	if(event.data.length === 0){
		console.log("FACE NOT FOUND");
		eachActiveConnection((c, $c) => {
			if (c.label === 'feel') {
				c.send("FACE NOT FOUND");
			}
		});
	}else{
		event.data.faces.forEach(function(data) {
			let w = data.width;
			let h = data.height;
			$('#canvas').attr('width',w);
			$('#canvas').attr('height',h);
			var canvas=document.getElementById("canvas");
			var context=canvas.getContext("2d");
			context.drawImage(myvideo,data.x*adjust,data.y*adjust,data.width*adjust,data.height*adjust,0,0,100,100);
			var tensor = preprocessImage(canvas);
			var emotion = model.predict(tensor).dataSync();
            
            if(opstate == "loading"){
                    load_you = 1;
                    loadstate(load_you,load_another);
            }else{
                draw_scatter(emotion,peer.id);
            }
			eachActiveConnection((c, $c) => {
				if (c.label === 'feel') {
					c.send(emotion);
				}
			});
            
			var context_rect = document.getElementById("myvideo-canvas").getContext("2d");
			context_rect.clearRect(0,0,300,180);
			context_rect.beginPath();
			context_rect.rect(data.x,data.y,data.width,data.height);
			context_rect.stroke();
		});
	}
});
