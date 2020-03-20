import os
import random

from django.shortcuts import redirect, render
from django.template.context_processors import csrf

from .models import send


def index(request):
    "one2oneのindexに飛ばす用のview"

    # 条件に合わないアクセスはhomeにリダイレクト
    if ("age" in request.POST) and ("gender" in request.POST) and ("job" in request.POST):
        myid = get_random_id()
        opid = ""
        mode = "even"
        age = request.POST.get("age")
        gender = request.POST.get("gender")
        job = request.POST.get("job")

        if (age == "") or (gender == "") or (job == ""):
            return redirect("/")

        context = {
            'myid': myid,
            "opponents_id": opid,
            "mode": mode,
            "age": age,
            "gender": gender,
            "job": job
        }

        context.update(csrf(request))
        return render(request, 'one2one/one2one.html', context)
    else:
        return redirect("/")


def invalidID(request):
    "IDが不正なときにエラーページに飛ばす用のview"

    context = {"error_message": "IDが不正です"}
    return render(request, 'one2one/error.html', context)


def get_random_id():
    "ランダムな18桁のIDを生成する関数"

    return "".join([random.choice("abcefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ") for i in range(18)])


def create(request):
    "相手を招待する側のユーザーの挙動を書くview"

    # 自分のID,自分のニックネーム,相手のアドレスがなければエラーページへ
    if ("myid" in request.POST) and ("myname" in request.POST) and ("opponents-address" in request.POST):
        myid = request.POST.get("myid")
        myname = request.POST.get("myname")
        TO_ADDRESS = request.POST.get("opponents-address")
        age = int(request.POST.get("age"))
        gender = request.POST.get("gender")
        job = request.POST.get("job")
        opponents_id = get_random_id()

        # メールを送信
        try:
            send(TO_ADDRESS, myname, opponents_id, myid)
            context = {
                'myid': myid,
                'opponents_id': opponents_id,
                "mode": "creater",
                "age": age,
                "gender": gender,
                "job": job,
                "mail": TO_ADDRESS
            }
            context.update(csrf(request))
            # 正規なアクセスならここ
            return render(request, 'one2one/one2one.html', context)

        #　メールが送れなかったらエラーページへ
        except:
            context = {"error_message": "メールアドレスが正しくないなどのエラーがあります"}
            return render(request, 'one2one/error.html', context)

    else:
        context = {"error_message": "不正なアクセスです"}
        return render(request, 'one2one/error.html', context)


def created(request):
    "招待された側のユーザーの挙動を書くview"

    # 相手のIDと自分のIDがGETできなければエラーページへ
    if ("myid" in request.GET) and ("opponents_id" in request.GET):
        myid = request.GET.get("myid")
        opid = request.GET.get("opponents_id")
        mode = "created"
        context = {'myid': myid, "opponents_id": opid, "mode": mode}
        return render(request, 'one2one/one2one.html', context)

    else:
        return invalidID(request)


def reaccess(request):
    "リロードしたときの挙動を書くview"

    # 必要な情報がなければindexへ
    if ("myid" in request.POST) and ("opponents_id" in request.POST) and ("mode" in request.POST):
        myid = request.POST.get("myid")
        opid = request.POST.get("opponents_id")
        mode = request.POST.get("mode")
        context = {'myid': myid, "opponents_id": opid, "mode": mode}
        context.update(csrf(request))
        return render(request, 'one2one/one2one.html', context)
    else:
        return index(request)
