from django.db import models
from django.contrib.auth.models import User
import json

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    
    # Game progress
    current_level = models.IntegerField(default=0)
    money = models.IntegerField(default=1000)
    relations = models.IntegerField(default=1)
    
    # Game state as JSON
    areas_json = models.TextField(default='[]')
    rails_json = models.TextField(default='[]')
    stations_json = models.TextField(default='[]')
    
    # Unlocked content
    unlocked_cities_json = models.TextField(default='[]')
    purchased_items_json = models.TextField(default='{}')
    building_state_json = models.TextField(default='{}')
    
    # Bank data
    loan_amount = models.IntegerField(default=0)
    loan_active = models.BooleanField(default=False)
    loan_time_remaining = models.IntegerField(default=0)
    
    # Bison data
    bison_unlocked = models.BooleanField(default=False)
    bison_profit = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
    
    def save_game_state(self, game_data):
        """Save current game state to profile"""
        self.current_level = game_data.get('level', 0)
        self.money = game_data.get('money', 1000)
        self.relations = game_data.get('relations', 1)
        
        self.areas_json = json.dumps(game_data.get('areas', []))
        self.rails_json = json.dumps(game_data.get('rails', []))
        self.stations_json = json.dumps(game_data.get('stations', []))
        self.unlocked_cities_json = json.dumps(list(game_data.get('unlocked_cities', [])))
        self.purchased_items_json = json.dumps(dict(game_data.get('purchased_items', {})))
        self.building_state_json = json.dumps(dict(game_data.get('building_state', {})))
        
        # Bank data
        self.loan_amount = game_data.get('loan_amount', 0)
        self.loan_active = game_data.get('loan_active', False)
        self.loan_time_remaining = game_data.get('loan_time_remaining', 0)
        
        # Bison data
        self.bison_unlocked = game_data.get('bison_unlocked', False)
        self.bison_profit = game_data.get('bison_profit', 0)
        
        self.save()
    
    def load_game_state(self):
        """Load game state from profile"""
        return {
            'level': self.current_level,
            'money': self.money,
            'relations': self.relations,
            'areas': json.loads(self.areas_json) if self.areas_json else [],
            'rails': json.loads(self.rails_json) if self.rails_json else [],
            'stations': json.loads(self.stations_json) if self.stations_json else [],
            'unlocked_cities': list(json.loads(self.unlocked_cities_json)) if self.unlocked_cities_json else [],
            'purchased_items': json.loads(self.purchased_items_json) if self.purchased_items_json else {},
            'building_state': json.loads(self.building_state_json) if self.building_state_json else {},
            'loan_amount': self.loan_amount,
            'loan_active': self.loan_active,
            'loan_time_remaining': self.loan_time_remaining,
            'bison_unlocked': self.bison_unlocked,
            'bison_profit': self.bison_profit,
        }