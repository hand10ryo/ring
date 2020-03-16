//UI変更関数
function ChangeUI(to_state){
    opstate = to_state;
    let elem = document.getElementById("state");
    
    if (mode == "even" && opstate == "logout"){
        console.log(1);
        elem.style.background = "#CB845F";
        $("#sharecomment").text("Share this id with others or Make partner's id by right form").show();
        $("#end-call").hide();
        $("#callto-id").attr('readonly',false).show();
        $("#callbutton").prop("disabled", false).show();
        $("#reaccess").show();
        $("#canvas1").hide();
        $("#canvas2").hide();
        $("#canvas3").hide();
        $("#makeurl").show();
        $("#myvideo-canvas").hide();
        
    }else if(mode == "even" && opstate == "loading"){
        console.log(2);
        elem.style.background = "blue";
        $("#sharecomment").hide()
        $("#end-call").show();
        $("#callto-id").attr('readonly',false).hide();
        $("#callbutton").prop("disabled", true).hide();
        $("#reaccess").hide();
        $("#canvas1").show();
        $("#canvas2").show();
        $("#canvas3").hide();
        $("#makeurl").hide();
        $("#myvideo-canvas").hide();
        
    }else if(mode == "even" && opstate == "calling"){
        console.log(3);
        elem.style.background = "blue";
        $("#sharecomment").text("");
        $('#end-call').show();
        $("#callto-id").attr('readonly',false).hide();
        $("#callbutton").prop("disabled", true).hide();
        $("#reaccess").hide();
        $("#canvas1").show();
        $("#canvas2").hide();
        $("#canvas3").hide();
        $("#makeurl").hide();
        $("#myvideo-canvas").show();
        
    }else if(mode == "creater" && opstate == "logout"){
        console.log(4);
        elem.style.background = "#CB845F";
        $("#sharecomment").text("Wait for the frame turning into green").show();
        $("#end-call").hide();
        $("#callto-id").attr('readonly',true).show();
        $("#callbutton").prop("disabled", true).hide();
        $("#reaccess").show();
        $("#canvas1").hide();
        $("#canvas2").hide();
        $("#canvas3").hide();
        $("#makeurl").hide();
        $("#myvideo-canvas").hide();
        
    }else if(mode == "creater" && opstate == "login"){
        console.log(5);
        elem.style.background = "green";
        $("#sharecomment").text("Push the Call button! You can call to this id!").show();
        $("#end-call").hide();
        $("#callto-id").attr('readonly',true).show();
        $("#callbutton").prop("disabled", false).show();
        $("#reaccess").show();
        $("#canvas1").show();
        $("#canvas2").hide();
        $("#canvas3").hide();
        $("#makeurl").hide();
        $("#myvideo-canvas").hide();
        
    }else if(mode == "creater" && opstate == "loading"){
        console.log(6);
        elem.style.background = "blue";
        $("#sharecomment").hide()
        $('#end-call').show();
        $("#callto-id").attr('readonly',true).show();
        $("#callbutton").prop("disabled", true).hide();
        $("#reaccess").hide();
        $("#canvas1").show();
        $("#canvas2").show();
        $("#canvas3").hide();
        $("#makeurl").hide();
        $("#myvideo-canvas").hide();
        
    }else if(mode == "creater" && opstate == "calling"){
        console.log(7);
        elem.style.background = "blue";
        $("#sharecomment").hide();
        $('#end-call').show();
        $("#callto-id").attr('readonly',true).hide();
        $("#callbutton").prop("disabled", true).hide();
        $("#reaccess").hide();
        $("#canvas1").show();
        $("#canvas2").hide();
        $("#canvas3").hide();
        $("#makeurl").hide();
        $("#myvideo-canvas").show();
        
    }else if(mode == "created" && opstate == "logout"){
        console.log(8);
        elem.style.background = "#CB845F";
        $("#sharecomment").text("Confirm this id and Retry").show();
        $("#end-call").hide();
        $("#callto-id").attr('readonly',true).show();
        $("#callbutton").prop("disabled", true).hide();
        $("#reaccess").show();
        $("#canvas1").hide();
        $("#canvas2").hide();
        $("#canvas3").hide();
        $("#makeurl").hide();
        $("#myvideo-canvas").hide();
        
    }else if(mode == "created" && opstate == "login"){
        console.log(9);
        elem.style.background = "green";
        $("#sharecomment").text("Wait for being called").show();
        $("#end-call").hide();
        $("#callto-id").attr('readonly',true).show();
        $("#callbutton").prop("disabled", true).hide();
        $("#reaccess").show();
        $("#canvas1").hide();
        $("#canvas2").hide();
        $("#canvas3").hide();
        $("#makeurl").hide();
        $("#myvideo-canvas").hide();
        
    }else if(mode == "created" && opstate == "loading"){
        console.log(10);
        elem.style.background = "blue";
        $("#sharecomment").hide()
        $('#end-call').show();
        $("#callto-id").attr('readonly',true).hide();
        $("#callbutton").prop("disabled", true).hide();
        $("#reaccess").hide();
        $("#canvas1").show();
        $("#canvas2").show();
        $("#canvas3").hide();
        $("#makeurl").hide();
        $("#myvideo-canvas").hide();
        
    }else if(mode == "created" && opstate == "calling"){
        console.log(11);
        elem.style.background = "blue";
        $("#sharecomment").hide();
        $('#end-call').show();
        $("#callto-id").attr('readonly',true).hide();
        $("#callbutton").prop("disabled", true).hide();
        $("#reaccess").hide();
        $("#canvas1").show();
        $("#canvas2").hide();
        $("#canvas3").hide();
        $("#makeurl").hide();
        $("#myvideo-canvas").show();
        
    }
}

function loadstate(you,other){
    if(you + other == 2){
        ChangeUI("calling");
    }else{
        $("#canvas2").toggle(other==0);
        $("#myvideo-canvas").toggle(you==1);
    }
}
