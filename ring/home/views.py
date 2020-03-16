from django.shortcuts import render,redirect

def index(request):
    return render(request,"home/index.html")

# Create your views here.
