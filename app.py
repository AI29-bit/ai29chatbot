import os
import logging
import uuid
from flask import Flask, render_template, request, jsonify, session
from openai import OpenAI
from models import db, ChatMessage

# Configure logging
logging.basicConfig(level=logging.DEBUG)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")

# Make sure DATABASE_URL is properly set
database_url = os.environ.get("DATABASE_URL")
if database_url:
    logging.info(f"Database URL is set: {database_url[:20]}...")
else:
    logging.error("DATABASE_URL environment variable is not set!")

# Configure and initialize the database
app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

# Create database tables
with app.app_context():
    db.create_all()
    logging.info("Database tables created successfully")

# Initialize OpenAI client
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
client = OpenAI(api_key=OPENAI_API_KEY)

@app.route('/')
def index():
    """Render the main chat interface"""
    # Create a unique conversation ID if one doesn't exist in the session
    if 'conversation_id' not in session:
        session['conversation_id'] = str(uuid.uuid4())
    
    return render_template('index.html')

@app.route('/api/history', methods=['GET'])
def get_chat_history():
    """Retrieve chat history for the current conversation"""
    try:
        # Get conversation ID from session
        conversation_id = session.get('conversation_id')
        
        if not conversation_id:
            return jsonify({"messages": []})
        
        # Query messages for this conversation, ordered by timestamp
        messages = ChatMessage.query.filter_by(conversation_id=conversation_id).order_by(ChatMessage.timestamp).all()
        
        # Convert to list of dictionaries
        messages_list = [message.to_dict() for message in messages]
        
        return jsonify({"messages": messages_list})
        
    except Exception as e:
        logging.error(f"Error retrieving chat history: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/history/clear', methods=['POST'])
def clear_chat_history():
    """Clear chat history and start a new conversation"""
    try:
        # Create a new conversation ID
        new_conversation_id = str(uuid.uuid4())
        session['conversation_id'] = new_conversation_id
        
        return jsonify({"success": True, "message": "Chat history cleared and new conversation started"})
        
    except Exception as e:
        logging.error(f"Error clearing chat history: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    """Handle chat API requests to OpenAI"""
    try:
        # Get the user message from the request
        data = request.get_json()
        user_message = data.get('message', '')
        
        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        
        if not OPENAI_API_KEY:
            return jsonify({"error": "OpenAI API key not configured"}), 500
        
        # Create or get conversation ID from session
        if 'conversation_id' not in session:
            session['conversation_id'] = str(uuid.uuid4())
        conversation_id = session['conversation_id']
        
        # Log the received message
        logging.debug(f"Received message: {user_message} for conversation: {conversation_id}")
        
        # Save user message to database
        user_db_message = ChatMessage(
            role='user',
            content=user_message,
            conversation_id=conversation_id
        )
        db.session.add(user_db_message)
        db.session.commit()
        
        # Call OpenAI API
        # The newest OpenAI model is "gpt-4o" which was released May 13, 2024.
        # Do not change this unless explicitly requested by the user
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are AI29, a helpful and friendly assistant."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=500
        )
        
        # Extract the assistant's reply
        assistant_reply = response.choices[0].message.content
        
        # Save AI response to database
        ai_db_message = ChatMessage(
            role='ai',
            content=assistant_reply,
            conversation_id=conversation_id
        )
        db.session.add(ai_db_message)
        db.session.commit()
        
        # Log the response
        logging.debug(f"AI response: {assistant_reply}")
        
        return jsonify({"reply": assistant_reply})
    
    except Exception as e:
        logging.error(f"Error in chat endpoint: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
