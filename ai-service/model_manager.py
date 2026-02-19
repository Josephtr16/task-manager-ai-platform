import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error
import joblib
import os

class ModelManager:
    def __init__(self):
        self.duration_model = LinearRegression()
        self.is_trained = False
        self.mean_absolute_error = 0.0
        self.tasks_processed = 0
        
        # Simple heuristic weights for cold start
        self.category_weights = {
            'Work': 1.2,
            'Personal': 0.8,
            'Learning': 1.5,
            'Health': 1.0,
            'Shopping': 0.5,
            'Family': 0.9
        }

    def _preprocess(self, data):
        # Convert to DataFrame if dict
        if isinstance(data, dict):
            df = pd.DataFrame([data])
        else:
            df = pd.DataFrame(data)
            
        # Feature Engineering
        # Map categories to numeric weights
        df['category_weight'] = df['category'].map(self.category_weights).fillna(1.0)
        
        # Complexity based on subtasks
        if 'subtask_count' in df.columns:
             df['complexity'] = df['subtask_count'] * 0.5 + 1
        else:
             df['complexity'] = 1.0

        return df[['category_weight', 'complexity']]

    def train(self, training_data):
        """
        Train the model with historical data.
        expected training_data: list of dicts with 'category', 'subtask_count', 'actual_duration'
        """
        if not training_data:
            return
            
        df = pd.DataFrame(training_data)
        X = self._preprocess(df)
        y = df['actual_duration']
        
        self.duration_model.fit(X, y)
        self.is_trained = True
        
        # Calculate initial MAE
        predictions = self.duration_model.predict(X)
        self.mean_absolute_error = mean_absolute_error(y, predictions)

    def predict_duration(self, task_features):
        """
        Predict duration in minutes.
        """
        X = self._preprocess(task_features)
        
        if self.is_trained:
            prediction = self.duration_model.predict(X)[0]
        else:
            # Cold start heuristic
            base_duration = 30 # minutes
            prediction = base_duration * X.iloc[0]['category_weight'] * X.iloc[0]['complexity']
            
        return max(5, round(prediction)) # Minimum 5 minutes

    def calculate_priority_score(self, task):
        """
        Calculate priority score (0-100) based on deadline and importance.
        """
        score = 50
        
        # Deadline factor
        if task.get('days_until_deadline') is not None:
            days = task['days_until_deadline']
            if days <= 0: score += 40
            elif days <= 1: score += 30
            elif days <= 3: score += 20
            elif days <= 7: score += 10
            
        # Priority label factor
        priority_map = {'low': -10, 'medium': 0, 'high': 20, 'urgent': 40}
        score += priority_map.get(task.get('priority', 'medium'), 0)
        
        return min(100, max(0, score))

    def update_metrics(self, actual_duration, predicted_duration):
        """
        Update the running MAE.
        """
        error = abs(actual_duration - predicted_duration)
        total_error = self.mean_absolute_error * self.tasks_processed
        self.tasks_processed += 1
        self.mean_absolute_error = (total_error + error) / self.tasks_processed

model_manager = ModelManager()
