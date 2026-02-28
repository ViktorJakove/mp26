from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.contrib.auth.decorators import login_required

urlpatterns = [
    path('admin/', admin.site.urls),
    path('accounts/', include('accounts.urls')),
    path('game/', login_required(TemplateView.as_view(template_name='game.html')), name='game'),
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]