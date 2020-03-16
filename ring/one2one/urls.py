from django.urls import path
from . import views
app_name = "one2one"

urlpatterns = [
    path('', views.index, name='index'),
    path('create',views.create,name="create"),
    path('created',views.created,name="created"),
    path('reaccess',views.reaccess,name="reaccess"),
]
