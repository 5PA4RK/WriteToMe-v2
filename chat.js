// chat.js - Enhanced Chat Functionality
// This file handles all chat-related features: messages, reactions, replies, editing, deleting

const ChatModule = (function() {
    // Private variables
    let appState = null;
    let supabaseClient = null;
    let elements = {};
    
    // Reaction emojis available
    const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];

    // Initialize the chat module
    function init(state, supabase, domElements) {
        console.log("ChatModule initializing...");
        appState = state;
        supabaseClient = supabase;
        elements = domElements;
        
        setupEventListeners();
        console.log("ChatModule initialized successfully");
    }


// Display a message in the chat
function displayMessage(message) {
    if (!elements.chatMessages) {
        console.error('Chat messages container not found');
        return;
    }
    
    // Don't display if viewing history and this is not a historical message
    if (appState && appState.isViewingHistory && !message.is_historical) {
        return;
    }
    
    // Check if message already exists to prevent duplicates
    if (document.getElementById(`msg-${message.id}`)) {
        console.log('Message already exists, skipping display:', message.id);
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
        messageContent += getReplyQuoteHtml(message.reply_to, message);
    }
    
    // FIX 1: Add message text with proper line breaks and RTL/LTR support
    if (message.text) {
        // Escape HTML first
        const escapedText = escapeHtml(message.text);
        
        // Check if text contains Arabic/RTL characters
        const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(message.text);
        
        // Replace newlines with <br> tags to preserve line breaks
        const textWithBreaks = escapedText.replace(/\n/g, '<br>');
        
        // Add direction attribute if Arabic detected
        const dirAttr = hasArabic ? ' dir="auto"' : '';
        
        messageContent += `<div class="message-text"${dirAttr}>${textWithBreaks}</div>`;
    }
    
    // Add image if present
    if (message.image) {
        messageContent += `<img src="${message.image}" class="message-image" onclick="window.showFullImage('${message.image}')">`;
    }
    
    // Add reactions section
    const reactionsHtml = `<div class="message-reactions"></div>`;
    
    // Add action button (three dots)
    const actionButton = `<button class="message-action-dots" onclick="window.toggleMessageActions('${message.id}', this)"><i class="fas fa-ellipsis-v"></i></button>`;
    
    // Actions menu (initially hidden)
    const actionsMenu = getActionsMenuHtml(message);
    
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
    
    elements.chatMessages.appendChild(messageDiv);
    
    // Render existing reactions
    const reactionsContainer = messageDiv.querySelector('.message-reactions');
    if (message.reactions && message.reactions.length > 0) {
        renderReactions(reactionsContainer, message.reactions);
    }
    
    // Store in appState.messages for future reference
    if (appState && appState.messages && Array.isArray(appState.messages)) {
        // Check if message already exists in state
        const exists = appState.messages.some(m => m.id === message.id);
        if (!exists) {
            appState.messages.push(message);
            
            // Keep only last 100 messages in state to prevent memory issues
            if (appState.messages.length > 100) {
                appState.messages = appState.messages.slice(-100);
            }
        }
    }
    
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// Helper function to get reply quote HTML
function getReplyQuoteHtml(replyToId, currentMessage) {
    let quotedSender = 'someone';
    let quotedText = 'a message';
    let found = false;
    
    // Try to find the original message in the DOM first (most reliable for current session)
    const originalMsgElement = document.getElementById(`msg-${replyToId}`);
    if (originalMsgElement) {
        const senderEl = originalMsgElement.querySelector('.message-sender');
        const textEl = originalMsgElement.querySelector('.message-text');
        if (senderEl) {
            quotedSender = senderEl.textContent;
            found = true;
        }
        if (textEl) {
            // Remove any existing (edited) tag and trim
            quotedText = textEl.textContent
                .replace(/\s*\(edited\)\s*$/, '')
                .substring(0, 100);
            if (textEl.textContent.length > 100) quotedText += '...';
            found = true;
        }
    } 
    
    // If not found in DOM, try to find in appState messages
    if (!found && appState && appState.messages) {
        const originalMsg = appState.messages.find(m => m.id === replyToId);
        if (originalMsg) {
            quotedSender = originalMsg.sender;
            quotedText = (originalMsg.text || '').substring(0, 100);
            if (originalMsg.text && originalMsg.text.length > 100) quotedText += '...';
            found = true;
        }
    }
    
    // If still not found, try to fetch from database as a fallback
    if (!found && supabaseClient) {
        // Store the current message ID for the setTimeout
        const currentMsgId = currentMessage.id;
        
        // Fetch immediately
        supabaseClient
            .from('messages')
            .select('sender_name, message')
            .eq('id', replyToId)
            .single()
            .then(({ data, error }) => {
                if (!error && data) {
                    // Update the quote element if it exists
                    const quoteElement = document.querySelector(`#msg-${currentMsgId} .message-reply-ref`);
                    if (quoteElement) {
                        const span = quoteElement.querySelector('span');
                        if (span) {
                            const shortText = data.message.substring(0, 100);
                            span.innerHTML = `Replying to <strong>${escapeHtml(data.sender_name)}</strong>: ${escapeHtml(shortText)}${data.message.length > 100 ? '...' : ''}`;
                        }
                    }
                }
            })
            .catch(e => console.log('Error fetching original message:', e));
        
        // Return loading state
        return `
            <div class="message-reply-ref">
                <i class="fas fa-reply"></i> 
                <span>Loading quoted message...</span>
            </div>
        `;
    }
    
    return `
        <div class="message-reply-ref">
            <i class="fas fa-reply"></i> 
            <span>Replying to <strong>${escapeHtml(quotedSender)}</strong>: ${escapeHtml(quotedText)}</span>
        </div>
    `;
}


// Helper function to get actions menu HTML
function getActionsMenuHtml(message) {
    const isOwnMessage = message.sender === (appState ? appState.userName : '');
    
    // Ensure message.id is a string
    let messageId = message.id;
    if (messageId === undefined || messageId === null) {
        console.error('Message ID is undefined or null', message);
        messageId = 'unknown-' + Date.now();
    }
    
    // Convert to string if it's not already
    const messageIdStr = String(messageId);
    
    // Create a safe ID for data storage (remove any non-alphanumeric chars)
    const safeId = messageIdStr.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Safely escape the message text
    const escapedSender = escapeHtml(message.sender || '');
    const messageText = message.text || '';
    
    return `
        <div class="message-actions-menu" id="actions-${messageIdStr}" style="display: none;">
            ${isOwnMessage ? `
                <button onclick="window.editMessage('${messageIdStr}')"><i class="fas fa-edit"></i> Edit</button>
                <button onclick="window.deleteMessage('${messageIdStr}')"><i class="fas fa-trash"></i> Delete</button>
                <div class="menu-divider"></div>
            ` : ''}
            <button class="reply-btn" data-message-id="${messageIdStr}" data-sender="${escapedSender}" data-message-text="${escapeHtml(messageText)}">
                <i class="fas fa-reply"></i> Reply
            </button>
            <div class="menu-divider"></div>
            <div class="reaction-section">
                <div class="reaction-section-title"><i class="fas fa-smile"></i> Add Reaction</div>
                <div class="reaction-quick-picker">
                    ${reactionEmojis.map(emoji => 
                        `<button class="reaction-emoji-btn" onclick="window.addReaction('${messageIdStr}', '${emoji}')" title="React with ${emoji}">${emoji}</button>`
                    ).join('')}
                </div>
            </div>
        </div>
    `;
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


// Open reply modal - FIXED for long messages and mobile
function openReplyModal(messageId, senderName, messageText) {
    console.log('Opening reply modal for message:', messageId);
    
    if (!elements.replyModal || !elements.replyToName || !elements.replyToContent || !elements.replyInput) {
        console.error('Reply modal elements not found');
        return;
    }
    
    // Store the message we're replying to
    if (appState) {
        appState.replyingTo = messageId;
        console.log('Set replyingTo to:', messageId);
    }
    
    // Set the sender name
    elements.replyToName.textContent = senderName || 'Unknown';
    
    // Handle long messages - truncate for display but keep full for reference
    let displayText = messageText || '';
    if (displayText.length > 150) {
        displayText = displayText.substring(0, 150) + '...';
    }
    elements.replyToContent.textContent = displayText;
    
    // Store the full message text as a data attribute for reference
    elements.replyToContent.setAttribute('data-full-text', messageText || '');
    
    // Clear any previous input
    elements.replyInput.value = '';
    
    // Show the modal
    elements.replyModal.style.display = 'flex';
    
    // On mobile, add a class to body to prevent background scrolling
    document.body.classList.add('modal-open');
    
    // Focus on the input with a delay for mobile
    setTimeout(() => {
        if (elements.replyInput) {
            elements.replyInput.focus();
            // On mobile, try to open the keyboard
            if (window.innerWidth <= 768) {
                elements.replyInput.click();
            }
        }
    }, 300);
}
// Send reply - FIXED VERSION
// Send reply - FIXED VERSION with better desktop handling
async function sendReply() {
    console.log('🟢 sendReply called from chat.js at:', new Date().toISOString());
    
    const replyText = elements.replyInput.value.trim();
    if (!replyText) return;
    
    // Store the replyTo ID in a local variable
    const replyToId = appState ? appState.replyingTo : null;
    console.log('Replying to message ID:', replyToId);
    
    if (!replyToId) {
        console.error('No replyToId found!');
        return;
    }
    
    // Close modal first and disable the button to prevent double-clicks
    elements.replyModal.style.display = 'none';
    
    // Temporarily disable the send button to prevent double-clicks
    if (elements.sendReplyBtn) {
        elements.sendReplyBtn.disabled = true;
    }
    
    // Set the message input
    if (elements.messageInput) {
        elements.messageInput.value = replyText;
        console.log('Message input set to:', replyText);
    }
    
    // IMPORTANT: Store the replyToId in a temporary global variable
    window.__tempReplyTo = replyToId;
    
    // Clear the appState replyingTo immediately
    if (appState) {
        appState.replyingTo = null;
    }
    
    try {
        // Call sendMessage
        if (typeof window.sendMessage === 'function') {
            console.log('Calling window.sendMessage with temp replyTo:', window.__tempReplyTo);
            await window.sendMessage();
            console.log('window.sendMessage completed');
        }
    } catch (error) {
        console.error('Error sending reply:', error);
    } finally {
        // Clear the temp variable and re-enable the button
        window.__tempReplyTo = null;
        if (elements.sendReplyBtn) {
            // Re-enable after a short delay
            setTimeout(() => {
                elements.sendReplyBtn.disabled = false;
            }, 500);
        }
    }
}

// In the setupEventListeners function in chat.js, update the sendReplyBtn handler:
function setupEventListeners() {
    // Handle reply button clicks with long messages - for both mouse and touch
    const handleReplyClick = function(e) {
        const replyBtn = e.target.closest('.reply-btn');
        if (replyBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const messageId = replyBtn.dataset.messageId;
            const sender = replyBtn.dataset.sender;
            const messageText = replyBtn.dataset.messageText;
            
            console.log('Reply button clicked via delegation:', { messageId, sender, messageTextLength: messageText?.length });
            
            // Close any open message actions menu
            if (window.ChatModule && typeof window.ChatModule.closeMessageActions === 'function') {
                window.ChatModule.closeMessageActions();
            }
            
            // Call the openReplyModal function
            if (window.ChatModule && typeof window.ChatModule.openReplyModal === 'function') {
                window.ChatModule.openReplyModal(messageId, sender, messageText);
            } else {
                console.error('ChatModule or openReplyModal not available');
            }
        }
    };

    // Add both click and touch events
    document.addEventListener('click', handleReplyClick);
    document.addEventListener('touchstart', handleReplyClick, { passive: false });

    if (elements.sendReplyBtn) {
        // Remove any existing listeners
        const oldBtn = elements.sendReplyBtn;
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
        elements.sendReplyBtn = newBtn;
        
        // Add fresh listener with debounce for both mouse and touch
        let isProcessing = false;
        
        const handleSendReply = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (isProcessing) {
                console.log('Reply already processing, skipping...');
                return;
            }
            
            isProcessing = true;
            sendReply().finally(() => {
                setTimeout(() => {
                    isProcessing = false;
                }, 1000);
            });
        };
        
        elements.sendReplyBtn.addEventListener('click', handleSendReply);
        elements.sendReplyBtn.addEventListener('touchstart', handleSendReply, { passive: false });
    }

    if (elements.closeReplyModal) {
        elements.closeReplyModal.addEventListener('click', () => {
            elements.replyModal.style.display = 'none';
            if (appState) appState.replyingTo = null;
        });
        
        elements.closeReplyModal.addEventListener('touchstart', (e) => {
            e.preventDefault();
            elements.replyModal.style.display = 'none';
            if (appState) appState.replyingTo = null;
        }, { passive: false });
    }
}

// Escape HTML and quotes for data attributes - handle any input type
function escapeHtml(text) {
    if (text === undefined || text === null) {
        return '';
    }
    
    // Convert to string if it's not already
    const str = String(text);
    
    // First, escape HTML entities
    const div = document.createElement('div');
    div.textContent = str;
    let escaped = div.innerHTML;
    
    // Then escape quotes for HTML attributes
    escaped = escaped.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    
    return escaped;
}
async function sendMessageToDB(text, imageUrl, replyToId = null) {
    console.log('💾 sendMessageToDB called at:', new Date().toISOString());
    console.log('replyToId parameter:', replyToId);
    console.log('appState.replyingTo:', appState.replyingTo);
    console.log('window.__tempReplyTo:', window.__tempReplyTo);
    
    try {
        // Use the passed replyToId, or check temp variable, or fall back to appState.replyingTo
        const finalReplyToId = replyToId || window.__tempReplyTo || appState.replyingTo;
        console.log('FINAL reply_to:', finalReplyToId);
        
        // Clear all sources
        appState.replyingTo = null;
        window.__tempReplyTo = null;
        
        // FIX: Preserve line breaks - don't modify the text
        const messageData = {
            session_id: appState.currentSessionId,
            sender_id: appState.userId,
            sender_name: appState.userName,
            message: text || '',  // Keep original text with line breaks
            created_at: new Date().toISOString(),
            reply_to: finalReplyToId
        };
        
        if (imageUrl) {
            messageData.image_url = imageUrl;
        }
        
        const { data, error } = await supabaseClient
            .from('messages')
            .insert([messageData])
            .select()
            .single();
        
        if (error) {
            console.error("❌ Error sending message:", error);
            throw error;
        }
        
        console.log('✅ Message saved to DB. ID:', data.id);
        console.log('Reply_to in DB:', data.reply_to);
        
        // FIX: Use the original text when displaying
        displayMessage({
            id: data.id,
            sender: appState.userName,
            text: text,  // Use original text, not data.message (they're the same)
            image: imageUrl,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'sent',
            is_historical: false,
            reactions: [],
            reply_to: finalReplyToId
        });
        
        return { success: true, data };
    } catch (error) {
        console.error("❌ Error in sendMessageToDB:", error);
        alert("Failed to send message: " + error.message);
        return null;
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

console.log('Chat.js loaded and functions exposed globally');
