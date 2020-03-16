from django.shortcuts import render, get_object_or_404, redirect
from django.http import HttpResponseRedirect, HttpResponse
from django.urls import reverse
import random
import os
from .models import create_message,send,id_check_create,id_check_access,insert
from django.template.context_processors import csrf



def invalidID(request):
    context = {"error_message":"IDが不正です"}
    return render(request,'one2one/error.html',context)
    

def index(request):
    if ("age" in request.POST) and ("gender" in request.POST) and ("job" in request.POST):
        myid = get_random_id()
        opid = ""
        mode = "even"
        age = request.POST.get("age")
        gender = request.POST.get("gender")
        job = request.POST.get("job")
        
        if (age == "") or (gender == "") or (job == ""):
            return redirect("/")
        
        context = {'myid': myid,"opponents_id":opid, "mode":mode,"age":age,"gender":gender,"job":job}
        context.update(csrf(request))
        return render(request, 'one2one/one2one.html', context)
    else:
        return redirect("/")

def created(request):
    if ("myid" in request.GET) and ("opponents_id" in request.GET):
        myid = request.GET.get("myid")
        opid = request.GET.get("opponents_id")
        mode = "created"
        if (len(myid) != 18) or (len(opid) != 18) or id_check_access(myid) :
            return invalidID(request)
        
        else:
            context = {'myid': myid,"opponents_id":opid, "mode":mode}
            return render(request, 'one2one/one2one.html', context)
    else:
        return invalidID(request)
    
def reaccess(request):
    if ("myid" in request.POST) and ("opponents_id" in request.POST) and ("mode" in request.POST):
        myid = request.POST.get("myid")
        opid = request.POST.get("opponents_id")
        mode = request.POST.get("mode")
        context = {'myid': myid,"opponents_id":opid, "mode":mode}
        context.update(csrf(request))
        return render(request, 'one2one/one2one.html', context)
    else:
        return index(request)


def create(request):
    if ("myid" in request.POST) and ("myname" in request.POST) and ("opponents-address" in request.POST) :
        myid = request.POST.get("myid")
        myname = request.POST.get("myname")
        TO_ADDRESS = request.POST.get("opponents-address")
        age = int(request.POST.get("age"))
        gender = request.POST.get("gender")
        job = request.POST.get("job")
        
        
        while True:
            opponents_id = get_random_id()
            exID,exMAIL = id_check_create(myid,opponents_id,TO_ADDRESS)
            if exID ==0:break
                
        if exMAIL > 0:
            context = {"error_message":"このアドレスには既にあなたからidが発行されています"}            
            return render(request,'one2one/error.html',context)
        
        msg = create_message(TO_ADDRESS,myname,opponents_id,myid)
        
        try:
            send(msg,TO_ADDRESS)
            context = {'myid': myid,'opponents_id':opponents_id, "mode":"creater","age":age,"gender":gender,"job":job,"mail":TO_ADDRESS}
            insert(context)
            context.update(csrf(request))
            return render(request, 'one2one/one2one.html', context) #正規なアクセスならここ
        
        except:
            context = {"error_message":"メールアドレスが正しくありません"}            
            return render(request,'one2one/error.html',context)
    
    
            
    else:
        context = {"error_message":"不正なアクセスです"}
        return render(request,'one2one/error.html',context)

def get_random_id():
    return "".join([random.choice("abcefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") for i in range(18)])



# Create your views here.
