document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const chatForm = document.getElementById('chatForm');
    const userInput = document.getElementById('userInput');
    const chatMessages = document.getElementById('chatMessages');
    const typingIndicator = document.getElementById('typingIndicator');
    
    // Load chat history when page loads
    loadChatHistory();
    
    // Event listeners
    chatForm.addEventListener('submit', handleSubmit);
    document.getElementById('newChatBtn').addEventListener('click', startNewChat);
    
    /**
     * Loads chat history from the server
     */
    async function loadChatHistory() {
        try {
            const response = await fetch('/api/history');
            
            if (!response.ok) {
                console.error('Failed to load chat history');
                return;
            }
            
            const data = await response.json();
            
            // Clear any default welcome message if we have history
            if (data.messages && data.messages.length > 0) {
                chatMessages.innerHTML = '';
                
                // Add each message to the chat
                data.messages.forEach(message => {
                    addMessageToChat(message.role, message.content);
                });
                
                // Scroll to the bottom
                scrollToBottom();
            }
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }
    
    /**
     * Handles form submission
     * @param {Event} e - The form submit event
     */
    async function handleSubmit(e) {
        e.preventDefault();
        const message = userInput.value.trim();
        
        if (!message) return;
        
        // Add user message to chat
        addMessageToChat('user', message);
        
        // Clear input field
        userInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        try {
            // Send request to backend
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });
            
            // Process response
            const data = await response.json();
            
            // Hide typing indicator
            hideTypingIndicator();
            
            if (response.ok) {
                // Add AI response to chat
                addMessageToChat('ai', data.reply);
            } else {
                // Handle error
                const errorMessage = data.error || 'An unknown error occurred';
                addErrorMessage(errorMessage);
            }
        } catch (error) {
            console.error('Error communicating with the server:', error);
            hideTypingIndicator();
            addErrorMessage('Failed to connect to the server. Please try again later.');
        }
        
        // Scroll to bottom
        scrollToBottom();
    }
    
    /**
     * Adds a message to the chat container
     * @param {string} role - 'user' or 'ai'
     * @param {string} text - The message text
     */
    function addMessageToChat(role, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}-message`;
        
        // Create message content container
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Create avatar container
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        // Set appropriate icon based on role
        const icon = document.createElement('i');
        icon.className = role === 'user' ? 'fas fa-user' : 'fas fa-heart';
        avatarDiv.appendChild(icon);
        
        // Create text container
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        
        // Process text for line breaks and links
        const formattedText = formatMessage(text);
        textDiv.innerHTML = formattedText;
        
        // Assemble the message
        contentDiv.appendChild(avatarDiv);
        contentDiv.appendChild(textDiv);
        messageDiv.appendChild(contentDiv);
        
        // Add to chat
        chatMessages.appendChild(messageDiv);
        
        // Scroll to the new message
        scrollToBottom();
    }
    
    /**
     * Formats message text for display
     * @param {string} text - The message text
     * @returns {string} - HTML formatted text
     */
    function formatMessage(text) {
        // Convert line breaks to <br> tags
        let formatted = text.replace(/\n/g, '<br>');
        
        // Convert URLs to clickable links
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        formatted = formatted.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
        
        // Wrap text in paragraph
        return `<p>${formatted}</p>`;
    }
    
    /**
     * Adds an error message to the chat
     * @param {string} text - The error message
     */
    function addErrorMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message ai-message';
        
        // Create message content
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        // Create avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        
        const icon = document.createElement('i');
        icon.className = 'fas fa-exclamation-triangle';
        avatarDiv.appendChild(icon);
        
        // Create text content
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.innerHTML = `<p class="text-danger">${text}</p>`;
        
        // Assemble message
        contentDiv.appendChild(avatarDiv);
        contentDiv.appendChild(textDiv);
        messageDiv.appendChild(contentDiv);
        
        // Add to chat
        chatMessages.appendChild(messageDiv);
        
        // Scroll to the new message
        scrollToBottom();
    }
    
    /**
     * Shows the typing indicator
     */
    function showTypingIndicator() {
        typingIndicator.classList.remove('d-none');
        scrollToBottom();
    }
    
    /**
     * Hides the typing indicator
     */
    function hideTypingIndicator() {
        typingIndicator.classList.add('d-none');
    }
    
    /**
     * Scrolls the chat container to the bottom
     */
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    /**
     * Starts a new chat by clearing history
     */
    async function startNewChat() {
        try {
            // Call the clear history API
            const response = await fetch('/api/history/clear', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.error('Failed to clear chat history');
                return;
            }
            
            // Clear the chat UI
            chatMessages.innerHTML = '';
            
            // Add a welcome message
            addMessageToChat('ai', 'Heyya! Your AI29 assistant here. How can I help you today?');
            
            // Focus the input field
            userInput.focus();
            
        } catch (error) {
            console.error('Error starting new chat:', error);
            addErrorMessage('Failed to start a new chat. Please try again.');
        }
    }
});
