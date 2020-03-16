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
var mode = $("mode").text();


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
    //$('#my-id').text(peer.id);
    $('#myid_form').val(peer.id);
    $('#myid_form').attr('readonly',true);
    console.log(peer.id)
    
});

//ビデオチャット着信イベント設定
peer.on('call', function(call){
	call.answer(localStream);
	setupCallEventHandlers(call);
	setEmotionTracking();
});

//データコネクション着信イベント設定
peer.on('connection', c => {
	c.on('open', () => connect(c));
});

//エラーイベント設定
peer.on('error', function(err){
    alert(err.message);
});

//クローズイベント設定
peer.on('close', function(){
});

//データコネクション切断イベント設定
peer.on('disconnected', function(){
}); 




//発信処理
$('#make-call').submit(function(e){
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

//切断処理(全体)
$('#end-call').click(function(){
	tracker.stop();
    existingCall.close();
	eachActiveConnection(c => {
        c.close();
    });
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
        setupEndCallUI();
        $('#their-id').text(call.remoteId);
        console.log(call.remoteId);
        //const conn = peer.connect(call.remoteId);
    });
	//切断イベント設定
    call.on('close', function(){
        removeVideo(call.remoteId);
        setupMakeCallUI();
    });
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

//通信前表示設定
function setupMakeCallUI(){
    $('#make-call').show();
    $('#end-call').hide();
}

//通信時表示設定
function setupEndCallUI() {
    $('#make-call').hide();
    $('#end-call').show();
}


//テキストチャット受信
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
  
//ファイルボックス
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

//全体処理制御
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
		const chatbox = $('<div></div>').addClass('connection').addClass('active').attr('id', c.remoteId);
		const header = $('<h5></h5>').html('Chat with <strong>' + c.remoteId + '</strong>');
		const messages = $('<div><em>Peer connected.</em></div>').addClass('messages');
		chatbox.append(header);
		chatbox.append(messages);
		chatbox.on('click', () => {
			chatbox.toggleClass('active');
			console.log("chatboxonclick");
		});
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
		c.on('data', function(emotion) {
			if (emotion != "FACE NOT FOUND"){
				var res = new Float32Array(emotion);
				draw_chart(res)
				console.log(res);
			}else{
				console.log(res);
			}
		});
	}
    //ログイン状態コネクション
	}else if (c.label === 'login') {
		c.on('data', function(frag) {
			if (frag == true){
				$("#login").val("able to connect !!");
			}else{
				$("#login").val("not able to connect");
			}
		});
	}
	connectedPeers[c.remoteId] = 1;
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
			eachActiveConnection((c, $c) => {
				if (c.label === 'feel') {
					c.send(emotion);
				}
			});
			canvas = document.getElementById("myvideo-canvas");
			context=canvas.getContext("2d");
			context.clearRect(0,0,300,180);
			context.beginPath();
			context.rect(data.x,data.y,data.width,data.height);
			context.stroke();
		});
	}
});

//グラフ描画
function draw_chart(feeling) {
	$("#canvas2").hide();
	var ctx = document.getElementById('canvas1').getContext('2d');
	ctx.canvas.width = 400;
	ctx.canvas.height = 400;
	var myChart = new Chart(ctx, {
		type: 'horizontalBar',
		data: {
		//['red','green','purple','yellow','blue','skyblue','white']
			labels: ['😠 angry','😬 disgust','😨 fear','😄 happy', '😢 sad','😮 surprise','😐 neutral'],
			datasets: [{
				label: 'FeelingChart',
				data: feeling,
				backgroundColor: [
					'rgba(255, 0, 132, 0.2)',
					'rgba(54, 162, 235, 0.2)',
					'rgba(255, 206, 86, 0.2)',
					'rgba(75, 192, 192, 0.2)',
					'rgba(153, 102, 255, 0.2)',
					'rgba(255, 159, 64, 0.2)'
				],
				borderColor: [
					'rgba(255,99,132,1)',
					'rgba(54, 162, 235, 1)',
					'rgba(255, 206, 86, 1)',
					'rgba(75, 192, 192, 1)',
					'rgba(153, 102, 255, 1)',
					'rgba(255, 159, 64, 1)'
				],
				borderWidth: 1
			}]
		},
		options:{
			scales: {                          //軸設定
				xAxes: [{                      //y軸設定
					display: false,             //表示設定
					scaleLabel: {              //軸ラベル設定
						display: false,          //表示設定
						labelString: '',  //ラベル
						fontSize: 18               //フォントサイズ
						},
					ticks: {                      //最大値最小値設定
						min: 0,                   //最小値
						max: 1,                  //最大値
						fontSize: 18,             //フォントサイズ
						stepSize: 5,              //軸間隔
						beginAtZero:true
					},
				}],
				yAxes: [{                         //x軸設定
					display: true,                //表示設定
					barPercentage: 1,           //棒グラフ幅
					categoryPercentage: 1,      //棒グラフ幅
					scaleLabel: {                 //軸ラベル設定
						display: false,             //表示設定
						labelString: '',  //ラベル
						fontSize: 18               //フォントサイズ
					},
					ticks: {
						fontSize: 18             //フォントサイズ
					},
				}],
			},
			legend:{
				display:false,
			},
			title:{
				display:false,
				fontSize:18,
				//text:"Feeling Chart"
			},
			animation:false,
		}
	})
}


//ローディング画面
var sitas = [0,0.3]
//var callbackId;
function draw_loading(ts){
	const X = 212.5;
	const Y = 200;
	const R = 100;
	sitas[0] = sitas[0] +0.02 + 0.14*(1+Math.cos(sitas[0]+2*Math.PI));
	sitas[1] = sitas[1] +0.05 + 0.12*(1+Math.cos(sitas[1]+2*Math.PI));
	if (sitas[0] + 2*Math.PI < sitas[1]){
		var sita0 = sitas[1]- 2*Math.PI
		var sita1 = sitas[0]
		sitas = [sita0,sita1]
	}
	
	if (sitas[0]% (Math.PI*2) < (Math.PI*0.5)){
		var tex = "Getting Ready";
	}else if(sitas[0]% (Math.PI*2) < (Math.PI)){
		var tex = "Getting Ready .";
	}else if(sitas[0]% (Math.PI*2) < (Math.PI*1.5)){
		var tex = "Getting Ready ..";
	}else{
		var tex = "Getting Ready ...";
	}
	
	const ctx = document.getElementById('canvas2').getContext('2d');
	ctx.save();
	ctx.canvas.width = 400;
	ctx.canvas.height = 400;
	ctx.translate(X, Y);
	ctx.arc(0, 0, R, sitas[0], sitas[1]);
	ctx.font = "25px 'ＭＳ Ｐゴシック'"
	ctx.fillText(tex,-90,10);
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.restore();
	window.requestAnimationFrame((ts) => draw_loading(ts));
}

//ログイン状態
const preconnectedPeers = {}
if (mode == "created"){
    const prerequestedPeer = $('#callto-id').val();
    if (!preconnectedPeers[prerequestedPeer]) {
        const login = peer.connect(requestedPeer, {label: 'login', reliable: true});
        login.on('open', () => {
            connect(login);
        });
        login.on('error', err => alert(err));
    }
}


/*
$("#makeurl").click(function(){
    var url = "http://127.0.0.1:8000/one2one/create_opponent"; 
    var request = new XMLHttpRequest();
    var myaddress = $("#myaddress").val();
	var opponents_address = $("#opponents-address").val();
    url = url + "?myadress=" + myaddress +"?opponents_address=" + opponents_address;
    request.open('GET', url);
    console.log(url);
    
    request.onreadystatechange = function () {
        if (request.readyState != 4) {
            // リクエスト中
            console.log("リクエスト中")
        } else if (request.status != 200) {
            // 失敗
            console.log("失敗")
        } else {
            // 取得成功
            console.log("成功")
        }
    };
	//$("#callto-id").val("aaaaaaaaaaa");
    
})
*/

