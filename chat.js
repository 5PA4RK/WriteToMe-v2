// chat.js - Enhanced Chat Functionality
// This file handles all chat-related features: messages, reactions, replies, editing, deleting

const ChatModule = (function() {
    // Private variables
    let appState = null;
    let supabaseClient = null;
    let messageSound = null;
    let chatMessages = null;
    let messageInput = null;
    let sendMessageBtn = null;
    let typingIndicator = null;
    let typingUser = null;
    let replyModal = null;
    let replyToName = null;
    let replyToContent = null;
    let replyInput = null;
    let sendReplyBtn = null;
    let closeReplyModal = null;

    // Reaction emojis available
    const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];

    // Initialize the chat module
    function init(state, supabase, elements) {
        console.log("ChatModule initializing...");
        appState = state;
        supabaseClient = supabase;
        
        // DOM elements
        chatMessages = elements.chatMessages;
        messageInput = elements.messageInput;
        sendMessageBtn = elements.sendMessageBtn;
        messageSound = elements.messageSound;
        typingIndicator = elements.typingIndicator;
        typingUser = elements.typingUser;
        replyModal = elements.replyModal;
        replyToName = elements.replyToName;
        replyToContent = elements.replyToContent;
        replyInput = elements.replyInput;
        sendReplyBtn = elements.sendReplyBtn;
        closeReplyModal = elements.closeReplyModal;

        setupEventListeners();
        console.log("ChatModule initialized successfully");
    }

    // Setup event listeners
    function setupEventListeners() {
        if (sendReplyBtn) {
            sendReplyBtn.addEventListener('click', sendReply);
        }

        if (closeReplyModal) {
            closeReplyModal.addEventListener('click', () => {
                replyModal.style.display = 'none';
                if (appState) appState.replyingTo = null;
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === replyModal) {
                replyModal.style.display = 'none';
                if (appState) appState.replyingTo = null;
            }
        });

        // Close message actions when clicking outside
        document.addEventListener('click', (e) => {
            if (appState && appState.activeMessageActions) {
                const actionsMenu = document.getElementById(`actions-${appState.activeMessageActions}`);
                if (actionsMenu && 
                    !actionsMenu.contains(e.target) && 
                    !e.target.closest('.message-action-dots')) {
                    closeMessageActions();
                }
            }
        });
    }

    // Get message by ID
    async function getMessageById(messageId) {
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            return null;
        }
        
        if (!messageId) {
            console.error('No message ID provided');
            return null;
        }
        
        try {
            console.log('Fetching message by ID:', messageId);
            
            // Convert to number if it's a string number
            const id = typeof messageId === 'string' && !isNaN(messageId) ? parseInt(messageId) : messageId;
            
            const { data, error } = await supabaseClient
                .from('messages')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) {
                console.error('Error fetching message:', error);
                return null;
            }
            
            console.log('Found original message:', data);
            return data;
        } catch (error) {
            console.error("Error in getMessageById:", error);
            return null;
        }
    }

    // Load all quoted messages after chat history is loaded
    function loadAllQuotedMessages() {
        console.log('Loading all quoted messages...');
        const containers = document.querySelectorAll('.quoted-message-container');
        console.log('Found containers:', containers.length);
        
        containers.forEach(container => {
            const messageId = container.dataset.messageId;
            const replyToId = container.dataset.replyId;
            
            if (messageId && replyToId) {
                loadQuotedMessage(messageId, replyToId);
            }
        });
    }

    // Helper function to load quoted message
    async function loadQuotedMessage(messageId, replyToId) {
        try {
            console.log(`Loading quoted message for ${messageId}, reply to: ${replyToId}`);
            
            const container = document.querySelector(`.quoted-message-container[data-message-id="${messageId}"]`);
            if (!container) {
                console.log('Container not found for message:', messageId);
                return;
            }
            
            // Show loading state
            container.innerHTML = `<div class="quoted-message loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>`;
            
            const originalMsg = await getMessageById(replyToId);
            
            if (originalMsg) {
                const originalText = originalMsg.message || 'Image message';
                const previewText = originalText.length > 100 ? originalText.substring(0, 100) + '...' : originalText;
                
                container.innerHTML = `
                    <div class="quoted-message">
                        <div class="quoted-sender">
                            <i class="fas fa-reply"></i> ${escapeHtml(originalMsg.sender_name)}:
                        </div>
                        <div class="quoted-text">${escapeHtml(previewText)}</div>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="quoted-message error">
                        <i class="fas fa-exclamation-circle"></i> Message not found
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error loading quoted message:', error);
            const container = document.querySelector(`.quoted-message-container[data-message-id="${messageId}"]`);
            if (container) {
                container.innerHTML = `
                    <div class="quoted-message error">
                        <i class="fas fa-exclamation-circle"></i> Error loading
                    </div>
                `;
            }
        }
    }

    // Display a message in the chat
    async function displayMessage(message) {
        if (!chatMessages) {
            console.error('Chat messages container not found');
            return;
        }
        
        if (appState && appState.isViewingHistory && message.is_historical === false) {
            return;
        }
        
        // Check if message already exists
        if (document.getElementById(`msg-${message.id}`)) {
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type}`;
        if (message.is_historical) {
            messageDiv.classList.add('historical');
        }
        messageDiv.id = `msg-${message.id}`;
        messageDiv.dataset.messageId = message.id;
        
        let messageContent = '';
        
        // Check for reply_to_id (prioritize this) or reply_to as fallback
        const replyToId = message.reply_to_id || message.reply_to;
        console.log('Displaying message with reply_to_id:', replyToId, 'Full message:', message);
        
        // If this is a reply, create a container that will be updated
        if (replyToId) {
            messageContent += `<div class="quoted-message-container" data-reply-id="${replyToId}" data-message-id="${message.id}"></div>`;
        }
        
        if (message.text) {
            messageContent += `<div class="message-text">${escapeHtml(message.text)}</div>`;
        }
        
        if (message.image) {
            messageContent += `<img src="${message.image}" class="message-image" onclick="window.showFullImage('${message.image}')">`;
        }
        
        // Add reactions section
        const reactionsHtml = `<div class="message-reactions"></div>`;
        
        // Add action button (three dots)
        const actionButton = `<button class="message-action-dots" onclick="window.toggleMessageActions('${message.id}', this)"><i class="fas fa-ellipsis-v"></i></button>`;
        
        // Actions menu (initially hidden)
        const actionsMenu = `
            <div class="message-actions-menu" id="actions-${message.id}" style="display: none;">
                ${message.sender === (appState ? appState.userName : '') ? `
                    <button onclick="window.editMessage('${message.id}')"><i class="fas fa-edit"></i> Edit</button>
                    <button onclick="window.deleteMessage('${message.id}')"><i class="fas fa-trash"></i> Delete</button>
                    <div class="menu-divider"></div>
                ` : ''}
                <button onclick="window.openReplyModal('${message.id}', '${escapeHtml(message.sender)}', '${escapeHtml(message.text || '')}')">
                    <i class="fas fa-reply"></i> Reply
                </button>
                <div class="menu-divider"></div>
                <div class="reaction-section">
                    <div class="reaction-section-title"><i class="fas fa-smile"></i> Add Reaction</div>
                    <div class="reaction-quick-picker">
                        ${reactionEmojis.map(emoji => 
                            `<button class="reaction-emoji-btn" onclick="window.addReaction('${message.id}', '${emoji}')" title="React with ${emoji}">${emoji}</button>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
        
        messageDiv.innerHTML = `
            <div class="message-sender">${escapeHtml(message.sender)}</div>
            <div class="message-content">
                ${messageContent}
                ${reactionsHtml}
                <div class="message-footer">
                    <div class="message-time">${message.time || new Date().toLocaleTimeString()}</div>
                    ${actionButton}
                </div>
            </div>
            ${actionsMenu}
        `;
        
        chatMessages.appendChild(messageDiv);
        
        // If this is a reply, load the quoted message
        if (replyToId) {
            // Use setTimeout to ensure the DOM is ready
            setTimeout(() => {
                loadQuotedMessage(message.id, replyToId);
            }, 100);
        }
        
        // Render existing reactions
        const reactionsContainer = messageDiv.querySelector('.message-reactions');
        if (message.reactions && message.reactions.length > 0) {
            renderReactions(reactionsContainer, message.reactions);
        }
        
        // Store in appState.messages if available
        if (appState && appState.messages && Array.isArray(appState.messages)) {
            appState.messages.push(message);
        }
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Render reactions for a message
    function renderReactions(container, reactions) {
        if (!container) return;
        
        if (!reactions || reactions.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        // Group reactions by emoji
        const reactionCounts = {};
        reactions.forEach(r => {
            reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
        });
        
        let html = '';
        for (const [emoji, count] of Object.entries(reactionCounts)) {
            const messageId = container.closest('.message')?.id.replace('msg-', '') || '';
            html += `<span class="reaction-badge" onclick="window.toggleReaction('${messageId}', '${emoji}')">${emoji} ${count}</span>`;
        }
        
        container.innerHTML = html;
    }

    // Toggle message actions menu
    function toggleMessageActions(messageId, button) {
        console.log('Toggle message actions called for message:', messageId);
        
        // Close any open menus first
        closeMessageActions();
        
        const menu = document.getElementById(`actions-${messageId}`);
        if (menu) {
            // Toggle the menu
            if (menu.classList.contains('show')) {
                menu.classList.remove('show');
                menu.style.display = 'none';
            } else {
                menu.classList.add('show');
                menu.style.display = 'block';
                if (appState) appState.activeMessageActions = messageId;
                
                // Position menu near the button
                const rect = button.getBoundingClientRect();
                
                menu.style.position = 'fixed';
                menu.style.top = (rect.bottom + 5) + 'px';
                menu.style.left = rect.left + 'px';
                menu.style.zIndex = '9999';
                
                // Ensure menu stays within viewport
                const menuRect = menu.getBoundingClientRect();
                if (menuRect.right > window.innerWidth) {
                    menu.style.left = (window.innerWidth - menuRect.width - 10) + 'px';
                }
                if (menuRect.bottom > window.innerHeight) {
                    menu.style.top = (rect.top - menuRect.height - 5) + 'px';
                }
            }
        }
    }

    // Close message actions menu
    function closeMessageActions() {
        if (appState && appState.activeMessageActions) {
            const oldMenu = document.getElementById(`actions-${appState.activeMessageActions}`);
            if (oldMenu) {
                oldMenu.classList.remove('show');
                oldMenu.style.display = 'none';
            }
            appState.activeMessageActions = null;
        }
    }

    // Add or remove reaction
    async function addReaction(messageId, emoji) {
        console.log('Adding reaction:', emoji, 'to message:', messageId);
        closeMessageActions();
        
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            alert('Cannot add reaction: Database connection not initialized');
            return;
        }
        
        if (!appState || !appState.userId) {
            console.error('User not logged in');
            alert('You must be logged in to add reactions');
            return;
        }
        
        try {
            const messageElement = document.getElementById(`msg-${messageId}`);
            if (!messageElement) {
                console.error('Message element not found');
                return;
            }
            
            const reactions = await getMessageReactions(messageId);
            
            // Check if user already reacted with ANY emoji on this message
            const userReaction = reactions.find(r => r.user_id === appState.userId);
            
            if (userReaction) {
                // If user already reacted with a different emoji, remove the old one first
                if (userReaction.emoji !== emoji) {
                    // Remove old reaction
                    await supabaseClient
                        .from('message_reactions')
                        .delete()
                        .eq('id', userReaction.id);
                    
                    // Add new reaction
                    await supabaseClient
                        .from('message_reactions')
                        .insert([{
                            message_id: messageId,
                            user_id: appState.userId,
                            user_name: appState.userName,
                            emoji: emoji,
                            created_at: new Date().toISOString()
                        }]);
                } else {
                    // User clicked the same emoji - remove it (toggle off)
                    await supabaseClient
                        .from('message_reactions')
                        .delete()
                        .eq('id', userReaction.id);
                }
            } else {
                // No existing reaction, add new one
                await supabaseClient
                    .from('message_reactions')
                    .insert([{
                        message_id: messageId,
                        user_id: appState.userId,
                        user_name: appState.userName,
                        emoji: emoji,
                        created_at: new Date().toISOString()
                    }]);
            }
            
            // Get updated reactions
            const updatedReactions = await getMessageReactions(messageId);
            
            // Update UI
            const reactionsContainer = messageElement.querySelector('.message-reactions');
            if (reactionsContainer) {
                renderReactions(reactionsContainer, updatedReactions);
            }
            
            console.log('Reaction added successfully');
            
        } catch (error) {
            console.error("Error adding reaction:", error);
            alert("Failed to add reaction: " + error.message);
        }
    }

    // Toggle reaction (wrapper for addReaction)
    async function toggleReaction(messageId, emoji) {
        await addReaction(messageId, emoji);
    }

    // Get reactions for a message
    async function getMessageReactions(messageId) {
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            return [];
        }
        
        try {
            const { data, error } = await supabaseClient
                .from('message_reactions')
                .select('*')
                .eq('message_id', messageId);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error("Error getting reactions:", error);
            return [];
        }
    }

    // Open reply modal
    function openReplyModal(messageId, senderName, messageText) {
        console.log('Opening reply modal for message:', messageId);
        
        if (!replyModal || !replyToName || !replyToContent || !replyInput) {
            console.error('Reply modal elements not found');
            return;
        }
        
        replyToName.textContent = senderName || 'Unknown';
        replyToContent.textContent = messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText;
        replyInput.value = '';
        
        // Store in both dataset and appState
        replyModal.dataset.replyingTo = messageId;
        if (appState) appState.replyingTo = messageId;
        
        replyModal.style.display = 'flex';
        replyInput.focus();
    }

    // Send reply
    async function sendReply() {
        const replyText = replyInput.value.trim();
        if (!replyText) return;
        
        // Get the message ID we're replying to
        const replyingToId = replyModal.dataset.replyingTo || (appState ? appState.replyingTo : null);
        
        console.log('Sending reply to message ID:', replyingToId);
        
        if (messageInput) {
            messageInput.value = replyText;
        }
        
        // Make sure appState.replyingTo is set
        if (appState && replyingToId) {
            appState.replyingTo = replyingToId;
        }
        
        replyModal.style.display = 'none';
        
        // Clear the dataset
        delete replyModal.dataset.replyingTo;
        
        // Trigger send message
        if (typeof window.sendMessage === 'function') {
            await window.sendMessage();
        } else {
            console.warn('No sendMessage function found');
            alert('Cannot send reply: Message function not available');
        }
    }

    // Edit message
    async function editMessage(messageId) {
        console.log('Editing message:', messageId);
        closeMessageActions();
        
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            alert('Cannot edit message: Database connection not initialized');
            return;
        }
        
        const messageElement = document.getElementById(`msg-${messageId}`);
        if (!messageElement) {
            console.error('Message element not found');
            return;
        }
        
        const textElement = messageElement.querySelector('.message-text');
        const currentText = textElement ? textElement.textContent.replace(/\s*\(edited\)\s*$/, '') : '';
        
        const newText = prompt("Edit your message:", currentText);
        if (newText !== null && newText.trim() !== '') {
            try {
                await supabaseClient
                    .from('messages')
                    .update({
                        message: newText.trim(),
                        edited_at: new Date().toISOString(),
                        is_edited: true
                    })
                    .eq('id', messageId)
                    .eq('sender_id', appState?.userId);
                
                if (textElement) {
                    textElement.innerHTML = `${escapeHtml(newText.trim())} <small class="edited-indicator">(edited)</small>`;
                }
                
                console.log('Message edited successfully');
            } catch (error) {
                console.error("Error editing message:", error);
                alert("Failed to edit message: " + error.message);
            }
        }
    }

    // Delete message
    async function deleteMessage(messageId) {
        console.log('Deleting message:', messageId);
        closeMessageActions();
        
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            alert('Cannot delete message: Database connection not initialized');
            return;
        }
        
        if (!confirm("Are you sure you want to delete this message?")) return;
        
        try {
            // First delete reactions
            await supabaseClient
                .from('message_reactions')
                .delete()
                .eq('message_id', messageId);
            
            // Then delete/update message
            await supabaseClient
                .from('messages')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: appState?.userId
                })
                .eq('id', messageId)
                .eq('sender_id', appState?.userId);
            
            const messageElement = document.getElementById(`msg-${messageId}`);
            if (messageElement) {
                messageElement.innerHTML = `
                    <div class="message-sender">${escapeHtml(appState?.userName || 'User')}</div>
                    <div class="message-content">
                        <div class="message-text"><i>Message deleted</i></div>
                        <div class="message-footer">
                            <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                        </div>
                    </div>
                `;
                
                // Remove actions menu
                const actionsMenu = document.getElementById(`actions-${messageId}`);
                if (actionsMenu) actionsMenu.remove();
            }
            
            console.log('Message deleted successfully');
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Failed to delete message: " + error.message);
        }
    }

    // Handle typing indicator
    async function handleTyping() {
        if (!appState || !appState.currentSessionId || appState.isViewingHistory || !appState.isConnected) return;
        if (!supabaseClient) return;
        
        try {
            await supabaseClient
                .from('sessions')
                .update({ 
                    typing_user: appState.userName,
                    updated_at: new Date().toISOString()
                })
                .eq('session_id', appState.currentSessionId);
            
            if (appState.typingTimeout) {
                clearTimeout(appState.typingTimeout);
            }
            
            appState.typingTimeout = setTimeout(() => {
                supabaseClient
                    .from('sessions')
                    .update({ 
                        typing_user: null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('session_id', appState.currentSessionId)
                    .catch(e => console.log("Error clearing typing:", e));
            }, 1000);
        } catch (error) {
            console.log("Typing indicator error:", error);
        }
    }

    // Show typing indicator
    function showTypingIndicator(userName) {
        if (typingUser && typingIndicator) {
            typingUser.textContent = userName;
            typingIndicator.classList.add('show');
            
            setTimeout(() => {
                if (typingUser.textContent === userName) {
                    typingIndicator.classList.remove('show');
                }
            }, 3000);
        }
    }

    // Show full image
    function showFullImage(src) {
        console.log('Showing full image:', src);
        const imageModal = document.getElementById('imageModal');
        const fullSizeImage = document.getElementById('fullSizeImage');
        if (imageModal && fullSizeImage) {
            fullSizeImage.src = src;
            imageModal.style.display = 'flex';
        }
    }

    // Escape HTML to prevent XSS
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Public API
    return {
        init,
        displayMessage,
        loadAllQuotedMessages,
        renderReactions,
        toggleMessageActions,
        closeMessageActions,
        addReaction,
        toggleReaction,
        getMessageReactions,
        getMessageById,
        openReplyModal,
        sendReply,
        editMessage,
        deleteMessage,
        handleTyping,
        showTypingIndicator,
        showFullImage,
        escapeHtml
    };
})();

// Make sure all functions are globally available
window.ChatModule = ChatModule;

// Expose individual functions directly for onclick handlers
window.toggleMessageActions = function(messageId, button) {
    ChatModule.toggleMessageActions(messageId, button);
};

window.addReaction = function(messageId, emoji) {
    ChatModule.addReaction(messageId, emoji);
};

window.toggleReaction = function(messageId, emoji) {
    ChatModule.toggleReaction(messageId, emoji);
};

window.openReplyModal = function(messageId, senderName, messageText) {
    ChatModule.openReplyModal(messageId, senderName, messageText);
};

window.editMessage = function(messageId) {
    ChatModule.editMessage(messageId);
};

window.deleteMessage = function(messageId) {
    ChatModule.deleteMessage(messageId);
};

window.showFullImage = function(src) {
    ChatModule.showFullImage(src);
};

window.getMessageById = function(messageId) {
    return ChatModule.getMessageById(messageId);
};

console.log('Chat.js loaded and functions exposed globally');
