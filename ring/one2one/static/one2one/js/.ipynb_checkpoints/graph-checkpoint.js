//グラフ描画
function draw_chart(feeling) {
    var cav1 = document.getElementById('canvas1')
    var ctx1 = cav1.getContext('2d');
	ctx1.canvas.height = 300;
    
	var myChart = new Chart(ctx1, {
		type: 'bar', //'horizontalBar',
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
            responsive: true,
             maintainAspectRatio: false,
			scales: {                          //軸設定
				yAxes: [{                      //y軸設定
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
				xAxes: [{                         //x軸設定
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


const p_sitas = [3/4*Math.PI,5/6*Math.PI,2/3*Math.PI,1/6*Math.PI,5/4*Math.PI,1/3*Math.PI,7/4*Math.PI]
const rate = 10
function draw_scatter(feeling,userid) {
    var cav3 = document.getElementById('canvas3')
    var ctx3 = cav3.getContext('2d');
	var w_cav3 = cav3.width;
	var h_cav3 = cav3.height;
    ctx3.canvas.width = w_cav3;
	ctx3.canvas.height = h_cav3;
    
    //移動量計算
    const vec = [0,0]
    feeling.forEach(function(val,ind,ar) {
        var p_sita = p_sitas[ind]
        var ddx = val * Math.cos(p_sita) * rate
        var ddy = val * Math.sin(p_sita) * rate *(-1)
        vec[0] = vec[0] + ddx
        vec[1] = vec[1] + ddy
    })
    //終了
    
    //データ更新処理
    // -> 変更しないデータ抜き出し
    var newpoints = points.filter(function(item, index){
        if (item.id != userid) return true;
    });   
    // -> 変更するデータ抜き出し
    var changepoints = points.filter(function(item, index){
        if (item.id == userid) return true;
    });
    // -> データ変更
    var newpoint = changepoints[0].point;
    newpoint[0] = Math.max(Math.min(newpoint[0] + vec[0],w_cav3),0);
    newpoint[1] = Math.max(Math.min(newpoint[1] + vec[1],h_cav3),0);
    changepoints[0].point = newpoint;
    // -> データ更新
    newpoints.push(changepoints[0]);
    points = newpoints;
    //終了
    
    //密度集計
    var denth_x = [];
    var denth_y = [];
    const split = 2;
    // -> 横軸
    for(var i = 0 ; i < split; i++){
        const s = w_cav3/split * i;
        const e = s + w_cav3/split;
        var ps = points.filter(function(item, index){
            if (item.point[0] >= s && item.point[0] <= e) return true;
        });
        denth_x.push(ps.length/points.length)
    }
    // -> 縦軸
    for(var i = 0 ; i < split; i++){
        const s = h_cav3/split * i;
        const e = s + h_cav3/split;
        var ps = points.filter(function(item, index){
            if (item.point[1] >= s && item.point[1] <= e) return true;
        });
        denth_y.push(ps.length/points.length)
    }
    //終了

    //描画
    // -> 背景
    for(var i = 0 ; i < split ; i++ ){
        for(var j = 0 ; j < split ; j++ ){
            const color = 'rgba(200, 20, 20,' + (denth_x[i] * denth_y[j]*0.5+0.1).toString() +')';
            //console.log(toString(denth_x[i]*denth_y[j]));
            ctx3.beginPath();
            ctx3.fillStyle = color;
            ctx3.strokeStyle = color;
            ctx3.fillRect(w_cav3/split*i,h_cav3/split*j,w_cav3/split,h_cav3/split);
            ctx3.stroke();
        }
    }

    // -> 点
    points.forEach(function(val,ind,ar){
        ctx3.beginPath();
        ctx3.fillStyle = val.color;
        ctx3.strokeStyle = val.color;
        ctx3.arc(val.point[0],val.point[1], 5, 0, Math.PI*2, true);
        ctx3.fill();
        ctx3.stroke();
    })
    //終了
}



//ローディング画面
var sitas = [0,0.3]
//var callbackId;
function draw_loading(ts){
    var cav2 = document.getElementById('canvas2')
    var ctx2 = cav2.getContext('2d');
	var w_cav2 = cav2.width;
	var h_cav2 = cav2.width;
    
	const X = w_cav2/2;
	const Y = h_cav2/2;
	const R = Math.max(w_cav2,h_cav2)/5;
	sitas[0] = sitas[0] +0.02 + 0.14*(1+Math.cos(sitas[0]+2*Math.PI));
	sitas[1] = sitas[1] +0.05 + 0.12*(1+Math.cos(sitas[1]+2*Math.PI));
	if (sitas[0] + 2*Math.PI < sitas[1]){
		var sita0 = sitas[1]- 2*Math.PI
		var sita1 = sitas[0]
		sitas = [sita0,sita1]
	}
	
	if (sitas[0]% (Math.PI*2) < (Math.PI*0.5)){
		var tex = "Loading his/her emotion";
	}else if(sitas[0]% (Math.PI*2) < (Math.PI)){
		var tex = "Loading his/her emotion .";
	}else if(sitas[0]% (Math.PI*2) < (Math.PI*1.5)){
		var tex = "Loading his/her emotion ..";
	}else{
		var tex = "Loading his/her emotion ...";
	}
	
    ctx2.save();
    ctx2.canvas.width = w_cav2;
	ctx2.canvas.height = h_cav2;
	ctx2.translate(X, Y);
	ctx2.arc(0, 0, R, sitas[0], sitas[1]);
	ctx2.font = "10px 'ＭＳ Ｐゴシック'"
	ctx2.fillText(tex,X,Y);
    ctx2.lineWidth = 10;
    ctx2.stroke();
    ctx2.restore();
	window.requestAnimationFrame((ts) => draw_loading(ts));
}



/*
var canvas4 = document.getElementById('canvas4')
var ctx4= canvas4.getContext('2d');
var w=canvas4.width;
var h=canvas4.height;
ctx4.beginPath();
ctx4.fillRect(0,0,w,h);
ctx4.stroke();
*/
