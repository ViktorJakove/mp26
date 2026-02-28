from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
import json
from .models import UserProfile

def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            login(request, user)
            UserProfile.objects.get_or_create(user=user)
            return redirect('/game/')
        else:
            messages.error(request, 'Invalid username or password')
    
    return render(request, 'accounts/login.html')

def register_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        password2 = request.POST.get('password2')
        
        if password != password2:
            messages.error(request, 'Passwords do not match')
            return render(request, 'accounts/register.html')
        
        if User.objects.filter(username=username).exists():
            messages.error(request, 'Username already exists')
            return render(request, 'accounts/register.html')
        
        user = User.objects.create_user(username=username, password=password)
        UserProfile.objects.create(user=user)
        login(request, user)
        return redirect('/')
    
    return render(request, 'accounts/register.html')

def logout_view(request):
    logout(request)
    return redirect('/')

@login_required
def profile_view(request):
    profile = request.user.profile
    context = {
        'profile': profile,
        'user': request.user
    }
    return render(request, 'accounts/profile.html', context)

@login_required
@csrf_exempt
def save_game(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            profile = request.user.profile
            profile.save_game_state(data)
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    return JsonResponse({'status': 'error'}, status=400)

@login_required
@csrf_exempt
def load_game(request):
    if request.method == 'GET':
        profile = request.user.profile
        data = profile.load_game_state()
        return JsonResponse({'status': 'success', 'data': data})
    return JsonResponse({'status': 'error'}, status=400)