import os
from flask import Flask
from models import db, ChatMessage
from flask_sqlalchemy import SQLAlchemy

# Import app after setting up the models
from app import app  # noqa: F401

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
