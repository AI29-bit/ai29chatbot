from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class ChatMessage(db.Model):
    """Model for storing chat messages in the database"""
    id = db.Column(db.Integer, primary_key=True)
    role = db.Column(db.String(10), nullable=False)  # 'user' or 'ai'
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    conversation_id = db.Column(db.String(50), nullable=True)  # For grouping messages in conversations
    
    def __repr__(self):
        return f'<ChatMessage {self.id} | {self.role} | {self.timestamp}>'
    
    def to_dict(self):
        """Convert the model instance to a dictionary"""
        return {
            'id': self.id,
            'role': self.role,
            'content': self.content,
            'timestamp': self.timestamp.isoformat(),
            'conversation_id': self.conversation_id
        }