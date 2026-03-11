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
    }

    // Setup event listeners
    function setupEventListeners() {
        if (sendReplyBtn) {
            sendReplyBtn.addEventListener('click', sendReply);
        }

        if (closeReplyModal) {
            closeReplyModal.addEventListener('click', () => {
                replyModal.style.display = 'none';
                appState.replyingTo = null;
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === replyModal) {
                replyModal.style.display = 'none';
                appState.replyingTo = null;
            }
        });

        // Close message actions when clicking outside
        document.addEventListener('click', (e) => {
            if (appState.activeMessageActions) {
                const actionsMenu = document.getElementById(`actions-${appState.activeMessageActions}`);
                if (actionsMenu && !actionsMenu.contains(e.target) && 
                    !e.target.closest('.message-action-dots')) {
                    closeMessageActions();
                }
            }
        });
    }

    // Display a message in the chat
    function displayMessage(message) {
        if (appState.isViewingHistory && message.is_historical === false) {
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type}`;
        if (message.is_historical) {
            messageDiv.classList.add('historical');
        }
        messageDiv.id = `msg-${message.id}`;
        
        let messageContent = '';
        
        // Add reply reference if this is a reply
        if (message.reply_to) {
            messageContent += `<div class="message-reply-ref"><i class="fas fa-reply"></i> Replying to a message</div>`;
        }
        
        if (message.text) {
            messageContent += `<div class="message-text">${escapeHtml(message.text)}</div>`;
        }
        
        if (message.image) {
            messageContent += `<img src="${message.image}" class="message-image" onclick="window.ChatModule.showFullImage('${message.image}')">`;
        }
        
        // Add reactions section
        const reactionsHtml = `<div class="message-reactions"></div>`;
        
// Add action button (three dots)
const actionButton = `<button class="message-action-dots" onclick="toggleMessageActions('${message.id}', this)"><i class="fas fa-ellipsis-v"></i></button>`;

// Actions menu (initially hidden)
const actionsMenu = `
    <div class="message-actions-menu" id="actions-${message.id}">
        ${message.sender === appState.userName ? `
            <button onclick="editMessage('${message.id}')"><i class="fas fa-edit"></i> Edit</button>
            <button onclick="deleteMessage('${message.id}')"><i class="fas fa-trash"></i> Delete</button>
        ` : ''}
        <button onclick="openReplyModal('${message.id}', '${escapeHtml(message.sender)}', '${escapeHtml(message.text || '')}')">
            <i class="fas fa-reply"></i> Reply
        </button>
        <div class="reaction-section">
            <div class="reaction-section-title"><i class="fas fa-smile"></i> Add Reaction</div>
            <div class="reaction-quick-picker">
                ${reactionEmojis.map(emoji => 
                    `<button onclick="addReaction('${message.id}', '${emoji}')" title="React with ${emoji}">${emoji}</button>`
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
                    <div class="message-time">${message.time}</div>
                    ${actionButton}
                </div>
            </div>
            ${actionsMenu}
        `;
        
        chatMessages.appendChild(messageDiv);
        
        // Render existing reactions
        const reactionsContainer = messageDiv.querySelector('.message-reactions');
        if (message.reactions && message.reactions.length > 0) {
            renderReactions(reactionsContainer, message.reactions);
        }
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Render reactions for a message
function renderReactions(container, reactions) {
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
        const messageId = container.closest('.message').id.replace('msg-', '');
        html += `<span class="reaction-badge" onclick="toggleReaction('${messageId}', '${emoji}')">${emoji} ${count}</span>`;
    }
    
    container.innerHTML = html;
}

    // Toggle message actions menu
    function toggleMessageActions(messageId, button) {
        closeMessageActions();
        
        const menu = document.getElementById(`actions-${messageId}`);
        if (menu) {
            menu.classList.add('show');
            appState.activeMessageActions = messageId;
            
            // Position menu near the button
            const rect = button.getBoundingClientRect();
            const chatRect = chatMessages.getBoundingClientRect();
            
            let top = rect.top - 150;
            let left = rect.left - 200;
            
            // Adjust if out of bounds
            if (top < chatRect.top) top = rect.bottom + 10;
            if (left < chatRect.left) left = rect.right + 10;
            
            menu.style.top = `${top}px`;
            menu.style.left = `${left}px`;
        }
    }

    // Close message actions menu
    function closeMessageActions() {
        if (appState.activeMessageActions) {
            const oldMenu = document.getElementById(`actions-${appState.activeMessageActions}`);
            if (oldMenu) {
                oldMenu.classList.remove('show');
            }
            appState.activeMessageActions = null;
        }
    }

    // Add or remove reaction
    async function addReaction(messageId, emoji) {
        closeMessageActions();
        
        try {
            const messageElement = document.getElementById(`msg-${messageId}`);
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
                    const { error } = await supabaseClient
                        .from('message_reactions')
                        .insert([{
                            message_id: messageId,
                            user_id: appState.userId,
                            user_name: appState.userName,
                            emoji: emoji,
                            created_at: new Date().toISOString()
                        }]);
                    
                    if (error) throw error;
                } else {
                    // User clicked the same emoji - remove it (toggle off)
                    await supabaseClient
                        .from('message_reactions')
                        .delete()
                        .eq('id', userReaction.id);
                }
            } else {
                // No existing reaction, add new one
                const { error } = await supabaseClient
                    .from('message_reactions')
                    .insert([{
                        message_id: messageId,
                        user_id: appState.userId,
                        user_name: appState.userName,
                        emoji: emoji,
                        created_at: new Date().toISOString()
                    }]);
                
                if (error) throw error;
            }
            
            // Get updated reactions
            const updatedReactions = await getMessageReactions(messageId);
            
            // Update the reactions array in the messages table for persistence
            await supabaseClient
                .from('messages')
                .update({ 
                    reactions: updatedReactions,
                    updated_at: new Date().toISOString()
                })
                .eq('id', messageId);
            
            // Update UI
            const reactionsContainer = messageElement.querySelector('.message-reactions');
            renderReactions(reactionsContainer, updatedReactions);
            
            // Also update local appState if it exists
            if (window.appState && window.appState.messages) {
                const messageIndex = window.appState.messages.findIndex(m => m.id === messageId);
                if (messageIndex !== -1) {
                    window.appState.messages[messageIndex].reactions = updatedReactions;
                }
            }
            
        } catch (error) {
            console.error("Error adding reaction:", error);
        }
    }

    // Toggle reaction (wrapper for addReaction)
    async function toggleReaction(messageId, emoji) {
        await addReaction(messageId, emoji);
    }

    // Get reactions for a message
    async function getMessageReactions(messageId) {
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
        replyToName.textContent = senderName;
        replyToContent.textContent = messageText.length > 100 ? messageText.substring(0, 100) + '...' : messageText;
        replyInput.value = '';
        
        appState.replyingTo = messageId;
        
        replyModal.style.display = 'flex';
        replyInput.focus();
    }

    // Send reply
    async function sendReply() {
        const replyText = replyInput.value.trim();
        if (!replyText) return;
        
        messageInput.value = replyText;
        replyModal.style.display = 'none';
        
        // Trigger send message
        if (window.mainApp && window.mainApp.sendMessage) {
            await window.mainApp.sendMessage();
        }
    }

    // Edit message
    async function editMessage(messageId) {
        closeMessageActions();
        
        const messageElement = document.getElementById(`msg-${messageId}`);
        const textElement = messageElement.querySelector('.message-text');
        const currentText = textElement ? textElement.textContent : '';
        
        const newText = prompt("Edit your message:", currentText);
        if (newText !== null && newText.trim() !== '') {
            try {
                const { error } = await supabaseClient
                    .from('messages')
                    .update({
                        message: newText.trim(),
                        edited_at: new Date().toISOString(),
                        is_edited: true
                    })
                    .eq('id', messageId)
                    .eq('sender_id', appState.userId);
                
                if (error) throw error;
                
                if (textElement) {
                    textElement.innerHTML = `${escapeHtml(newText.trim())} <small class="edited-indicator">(edited)</small>`;
                }
            } catch (error) {
                console.error("Error editing message:", error);
                alert("Failed to edit message.");
            }
        }
    }

    // Delete message
    async function deleteMessage(messageId) {
        closeMessageActions();
        
        if (!confirm("Are you sure you want to delete this message?")) return;
        
        try {
            // First delete reactions
            await supabaseClient
                .from('message_reactions')
                .delete()
                .eq('message_id', messageId);
            
            // Then delete/update message
            const { error } = await supabaseClient
                .from('messages')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: appState.userId
                })
                .eq('id', messageId)
                .eq('sender_id', appState.userId);
            
            if (error) throw error;
            
            const messageElement = document.getElementById(`msg-${messageId}`);
            if (messageElement) {
                messageElement.innerHTML = `
                    <div class="message-sender">${escapeHtml(appState.userName)}</div>
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
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Failed to delete message.");
        }
    }

    // Handle typing indicator
    async function handleTyping() {
        if (!appState.currentSessionId || appState.isViewingHistory || !appState.isConnected) return;
        
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
        renderReactions,
        toggleMessageActions,
        closeMessageActions,
        addReaction,
        toggleReaction,
        getMessageReactions,
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
