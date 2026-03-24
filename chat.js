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
    
    // Check if message already exists (except optimistic messages)
    if (message.id && !message.is_optimistic) {
        const existingMsg = document.getElementById(`msg-${message.id}`);
        if (existingMsg) {
            console.log('Message already exists, skipping display:', message.id);
            return;
        }
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.type}`;
    if (message.is_historical) {
        messageDiv.classList.add('historical');
    }
    if (message.is_optimistic) {
        messageDiv.classList.add('optimistic');
        messageDiv.style.opacity = '0.7';
    }
    messageDiv.id = message.is_optimistic ? `msg-${message.id}` : `msg-${message.id}`;
    
    let messageContent = '';
    
    // Add reply reference if this is a reply
    if (message.reply_to) {
        messageContent += getReplyQuoteHtml(message.reply_to, message);
    }
    
    // Process message text for media embeds
    if (message.text) {
        const escapedText = escapeHtml(message.text);
        const mediaEmbed = createMediaEmbed(message.text);
        
        if (mediaEmbed) {
            const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(message.text);
            const dirAttr = hasArabic ? ' dir="auto"' : '';
            
            const textWithoutUrl = message.text.replace(mediaEmbed.url, '').trim();
            
            if (textWithoutUrl) {
                const textWithBreaks = escapeHtml(textWithoutUrl).replace(/\n/g, '<br>');
                messageContent += `<div class="message-text"${dirAttr}>${textWithBreaks}</div>`;
            }
            
            messageContent += mediaEmbed.embedHtml;
            messageContent += `<div class="media-link-reference"><i class="fas fa-link"></i> <a href="${mediaEmbed.url}" target="_blank">${mediaEmbed.url.substring(0, 50)}${mediaEmbed.url.length > 50 ? '...' : ''}</a></div>`;
        } else {
            const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(message.text);
            const dirAttr = hasArabic ? ' dir="auto"' : '';
            const textWithBreaks = escapedText.replace(/\n/g, '<br>');
            messageContent += `<div class="message-text"${dirAttr}>${textWithBreaks}</div>`;
        }
    }
    
    // Add image if present
    if (message.image) {
        messageContent += `<img src="${message.image}" class="message-image" onclick="window.showFullImage('${message.image}')">`;
    }
    
    // Add reactions section
    const reactionsHtml = `<div class="message-reactions"></div>`;
    
    // Add action button (only for non-optimistic messages)
    const actionButton = message.is_optimistic ? '' : `<button class="message-action-dots" onclick="window.toggleMessageActions('${message.id}', this)"><i class="fas fa-ellipsis-v"></i></button>`;
    
    // Actions menu (only for non-optimistic messages)
    const actionsMenu = message.is_optimistic ? '' : getActionsMenuHtml(message);
    
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
    
    // Store in appState.messages
    if (appState && appState.messages && Array.isArray(appState.messages) && !message.is_optimistic) {
        const exists = appState.messages.some(m => m.id === message.id);
        if (!exists) {
            appState.messages.push(message);
            if (appState.messages.length > 100) {
                appState.messages = appState.messages.slice(-100);
            }
        }
    }
    
    // Scroll to bottom - use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
        if (elements.chatMessages) {
            elements.chatMessages.scrollTo({
                top: elements.chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }
    });
}// Helper function to get reply quote HTML
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
    
    // Handle long messages - truncate for display
    let displayText = messageText || '';
    if (displayText.length > 150) {
        displayText = displayText.substring(0, 150) + '...';
    }
    elements.replyToContent.textContent = displayText;
    
    // Store the full message text as a data attribute
    elements.replyToContent.setAttribute('data-full-text', messageText || '');
    
    // Clear any previous input
    elements.replyInput.value = '';
    
    // Show the modal
    elements.replyModal.style.display = 'flex';
    document.body.classList.add('modal-open');
    
    // For mobile, prevent background scrolling
    if (window.innerWidth <= 768) {
        // Ensure the modal is positioned correctly
        elements.replyModal.style.top = '0';
        elements.replyModal.style.left = '0';
        elements.replyModal.style.right = '0';
        elements.replyModal.style.bottom = '0';
        elements.replyModal.style.position = 'fixed';
        
        // Focus the input with a delay for mobile
        setTimeout(() => {
            if (elements.replyInput) {
                elements.replyInput.focus();
                
                // Scroll the input into view
                setTimeout(() => {
                    elements.replyInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }, 100);
    } else {
        // Desktop: just focus
        setTimeout(() => {
            if (elements.replyInput) {
                elements.replyInput.focus();
            }
        }, 100);
    }
}

// Add debounced scroll handler for performance
let scrollTimeout = null;
function handleChatScroll() {
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(() => {
        // Throttled scroll handling
        if (elements.chatMessages && elements.chatMessages.scrollTop < 50) {
            // User scrolled to top - could load more messages
        }
    }, 100);
}

// Add this to setupEventListeners
function setupEventListeners() {
    // Handle reply button clicks with delegation
    const handleReplyClick = function(e) {
        const replyBtn = e.target.closest('.reply-btn');
        if (replyBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const messageId = replyBtn.dataset.messageId;
            const sender = replyBtn.dataset.sender;
            const messageText = replyBtn.dataset.messageText;
            
            console.log('Reply button clicked:', { messageId, sender });
            
            // Close any open message actions menu
            if (window.ChatModule && typeof window.ChatModule.closeMessageActions === 'function') {
                window.ChatModule.closeMessageActions();
            }
            
            // Call the openReplyModal function
            if (window.ChatModule && typeof window.ChatModule.openReplyModal === 'function') {
                window.ChatModule.openReplyModal(messageId, sender, messageText);
            }
        }
    };
    
    // Add event listeners with passive: false for better touch handling
    document.addEventListener('click', handleReplyClick);
    document.addEventListener('touchstart', handleReplyClick, { passive: false });
    
    // Add scroll listener with throttling
    if (elements.chatMessages) {
        elements.chatMessages.addEventListener('scroll', handleChatScroll, { passive: true });
    }
    
    // Send reply button handler
    if (elements.sendReplyBtn) {
        // Remove any existing listeners
        const oldBtn = elements.sendReplyBtn;
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);
        elements.sendReplyBtn = newBtn;
        
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
    
    // Close reply modal handlers
    if (elements.closeReplyModal) {
        const handleCloseModal = () => {
            elements.replyModal.style.display = 'none';
            document.body.classList.remove('modal-open');
            if (appState) appState.replyingTo = null;
        };
        
        elements.closeReplyModal.addEventListener('click', handleCloseModal);
        elements.closeReplyModal.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleCloseModal();
        }, { passive: false });
    }
    
    // Click outside modal to close
    if (elements.replyModal) {
        elements.replyModal.addEventListener('click', (e) => {
            if (e.target === elements.replyModal) {
                elements.replyModal.style.display = 'none';
                document.body.classList.remove('modal-open');
                if (appState) appState.replyingTo = null;
            }
        });
    }
}
// Send reply - FIXED VERSION
// Replace the sendReply function with this improved version
async function sendReply() {
    console.log('🟢 sendReply called from chat.js at:', new Date().toISOString());
    
    const replyText = elements.replyInput ? elements.replyInput.value.trim() : '';
    if (!replyText) return;
    
    // Store the replyTo ID
    const replyToId = appState ? appState.replyingTo : null;
    console.log('Replying to message ID:', replyToId);
    
    if (!replyToId) {
        console.error('No replyToId found!');
        return;
    }
    
    // Get the message input element
    if (!elements.messageInput) {
        console.error('Message input not found');
        return;
    }
    
    // Set the message input
    elements.messageInput.value = replyText;
    
    // Store the replyToId in a temporary global variable
    window.__tempReplyTo = replyToId;
    
    // Clear the appState replyingTo
    appState.replyingTo = null;
    
    // Close the modal first
    if (elements.replyModal) {
        elements.replyModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    
    // Disable send button temporarily
    if (elements.sendReplyBtn) {
        elements.sendReplyBtn.disabled = true;
    }
    
    // For mobile, ensure the keyboard doesn't interfere
    if (window.innerWidth <= 768) {
        // Blur any focused elements to stabilize viewport
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }
        
        // Small delay to allow modal to close
        await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    // Focus the message input
    elements.messageInput.focus();
    
    // Small delay to ensure focus is set
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Call sendMessage
    if (typeof window.sendMessage === 'function') {
        console.log('Calling window.sendMessage');
        await window.sendMessage();
        console.log('window.sendMessage completed');
    }
    
    // Clear the temporary variable and re-enable button
    window.__tempReplyTo = null;
    
    if (elements.sendReplyBtn) {
        setTimeout(() => {
            if (elements.sendReplyBtn) {
                elements.sendReplyBtn.disabled = false;
            }
        }, 500);
    }
    
    // Force scroll to bottom after sending
    setTimeout(() => {
        if (elements.chatMessages) {
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        }
    }, 200);
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

// Detect and create embed HTML for media links
// Detect and create embed HTML for media links
function createMediaEmbed(text) {
    if (!text) return null;
    
    // Regular expressions for different media types
    const patterns = {
        // Image URLs (common image extensions)
        image: /(https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp|bmp|svg|avif|ico|tiff)(?:\?[^\s]*)?)/gi,
        
        // YouTube URLs (multiple formats)
        youtube: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi,
        
        // Vimeo URLs
        vimeo: /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/gi,
        
        // Dailymotion
        dailymotion: /(?:https?:\/\/)?(?:www\.)?(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/gi,
        
        // Facebook URLs
        facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:\d+|[^\/]+\/(?:posts|videos|photos|reel)\/\d+|[^\/]+\/videos\/\d+)/gi,
        
        // Instagram URLs
        instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/gi,
        
        // Twitter/X URLs
        twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/gi,
        
        // TikTok URLs
        tiktok: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.]+\/video\/(\d+)/gi,
        
        // Pinterest URLs
        pinterest: /(?:https?:\/\/)?(?:www\.)?(?:pinterest\.com\/pin\/|pin\.it\/)([a-zA-Z0-9_-]+)/gi,
        
        // Twitch URLs
        twitch: /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/(?:videos\/)?(\d+|[a-zA-Z0-9_]+)/gi,
        
        // Direct video URLs (common video extensions)
        video: /(https?:\/\/[^\s]+?\.(?:mp4|webm|ogg|mov|avi|mkv|m4v|3gp|flv|wmv)(?:\?[^\s]*)?)/gi,
        
        // Audio URLs
        audio: /(https?:\/\/[^\s]+?\.(?:mp3|wav|ogg|m4a|aac|flac|wma|opus)(?:\?[^\s]*)?)/gi,
        
        // PDF URLs
        pdf: /(https?:\/\/[^\s]+?\.(?:pdf)(?:\?[^\s]*)?)/gi,
        
        // Generic URL (for other sites - will show as link)
        url: /(https?:\/\/[^\s]+)/gi
    };
    
    // Check each pattern in order (most specific first)
    for (let [type, pattern] of Object.entries(patterns)) {
        pattern.lastIndex = 0;
        const match = pattern.exec(text);
        if (match) {
            const url = match[0];
            const id = match[1] || '';
            
            switch(type) {
                case 'image':
                    return createImageEmbed(url);
                case 'youtube':
                    return createYouTubeEmbed(id, url);
                case 'vimeo':
                    return createVimeoEmbed(id, url);
                case 'dailymotion':
                    return createDailymotionEmbed(id, url);
                case 'facebook':
                    return createFacebookEmbed(url);
                case 'instagram':
                    return createInstagramEmbed(id, url);
                case 'twitter':
                    return createTwitterEmbed(id, url);
                case 'tiktok':
                    return createTikTokEmbed(id, url);
                case 'pinterest':
                    return createPinterestEmbed(id, url);
                case 'twitch':
                    return createTwitchEmbed(id, url);
                case 'video':
                    return createVideoEmbed(url);
                case 'audio':
                    return createAudioEmbed(url);
                case 'pdf':
                    return createPDFEmbed(url);
                default:
                    // For other URLs, just return a clickable link
                    return createLinkEmbed(url);
            }
        }
    }
    
    return null;
}

// Create Pinterest embed
function createPinterestEmbed(pinId, url) {
    return {
        type: 'pinterest',
        url: url,
        embedHtml: `<div class="media-embed pinterest-embed">
            <div class="pinterest-placeholder" onclick="window.open('${url}', '_blank', 'noopener,noreferrer')">
                <i class="fab fa-pinterest"></i>
                <span>Pinterest Pin</span>
                <small>Click to open in new tab</small>
            </div>
            <div class="media-source">
                <i class="fab fa-pinterest"></i> 
                <a href="${url}" target="_blank" rel="noopener noreferrer">View on Pinterest</a>
            </div>
        </div>`
    };
}

// Create Dailymotion embed
function createDailymotionEmbed(videoId, url) {
    return {
        type: 'dailymotion',
        url: url,
        embedHtml: `<div class="media-embed dailymotion-embed">
            <div class="dailymotion-placeholder" onclick="window.open('${url}', '_blank', 'noopener,noreferrer')">
                <i class="fab fa-dailymotion"></i>
                <span>Dailymotion Video</span>
                <small>Click to open in new tab</small>
            </div>
            <div class="media-source">
                <i class="fab fa-dailymotion"></i> 
                <a href="${url}" target="_blank" rel="noopener noreferrer">Watch on Dailymotion</a>
            </div>
        </div>`
    };
}

// Create Twitch embed
function createTwitchEmbed(channelId, url) {
    return {
        type: 'twitch',
        url: url,
        embedHtml: `<div class="media-embed twitch-embed">
            <div class="twitch-placeholder" onclick="window.open('${url}', '_blank', 'noopener,noreferrer')">
                <i class="fab fa-twitch"></i>
                <span>Twitch Stream</span>
                <small>Click to open in new tab</small>
            </div>
            <div class="media-source">
                <i class="fab fa-twitch"></i> 
                <a href="${url}" target="_blank" rel="noopener noreferrer">Watch on Twitch</a>
            </div>
        </div>`
    };
}

// Create PDF embed
function createPDFEmbed(url) {
    return {
        type: 'pdf',
        url: url,
        embedHtml: `<div class="media-embed pdf-embed">
            <div class="pdf-placeholder" onclick="window.open('${url}', '_blank', 'noopener,noreferrer')">
                <i class="fas fa-file-pdf"></i>
                <span>PDF Document</span>
                <small>Click to open in new tab</small>
            </div>
            <div class="media-source">
                <i class="fas fa-file-pdf"></i> 
                <a href="${url}" target="_blank" rel="noopener noreferrer">View PDF</a>
            </div>
        </div>`
    };
}

// Create generic link embed (for sites we don't specifically support)
function createLinkEmbed(url) {
    return {
        type: 'link',
        url: url,
        embedHtml: `<div class="media-embed link-embed">
            <div class="link-placeholder" onclick="window.open('${url}', '_blank', 'noopener,noreferrer')">
                <i class="fas fa-link"></i>
                <span>External Link</span>
                <small>${url.substring(0, 50)}${url.length > 50 ? '...' : ''}</small>
            </div>
            <div class="media-source">
                <i class="fas fa-external-link-alt"></i> 
                <a href="${url}" target="_blank" rel="noopener noreferrer">Open Link</a>
            </div>
        </div>`
    };
}

// Update video embed with better sizing
function createVideoEmbed(url) {
    const extension = url.split('.').pop().split('?')[0].toLowerCase();
    return {
        type: 'video',
        url: url,
        embedHtml: `<div class="media-embed video-embed">
            <video controls preload="metadata" playsinline>
                <source src="${url}" type="video/${extension}">
                Your browser does not support the video tag. <a href="${url}" target="_blank" rel="noopener noreferrer">Download video</a>
            </video>
            <div class="media-source"><i class="fas fa-video"></i> <a href="${url}" target="_blank" rel="noopener noreferrer">Download Video</a></div>
        </div>`
    };
}

// Helper functions for different embed types
function createImageEmbed(url, fullText) {
    return {
        type: 'image',
        url: url,
        embedHtml: `<div class="media-embed image-embed">
            <img src="${url}" class="embedded-image" onclick="window.showFullImage('${url}')" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'embed-error\'><i class=\'fas fa-exclamation-triangle\'></i> Failed to load image. <a href=\'${url}\' target=\'_blank\'>Click here</a> to view.</div>';">
            <div class="media-source"><i class="fas fa-image"></i> <a href="${url}" target="_blank" rel="noopener noreferrer">View Image</a></div>
        </div>`
    };
}

// Replace your existing createYouTubeEmbed function with this:
function createYouTubeEmbed(videoId, url, fullText) {
    return {
        type: 'youtube',
        url: url,
        embedHtml: `<div class="media-embed youtube-embed">
            <div class="youtube-placeholder" data-video-id="${videoId}" data-url="${url}">
                <img src="https://img.youtube.com/vi/${videoId}/maxresdefault.jpg" 
                     alt="YouTube video thumbnail" 
                     class="youtube-thumbnail" 
                     loading="lazy"
                     onerror="this.onerror=null; this.src='https://img.youtube.com/vi/${videoId}/hqdefault.jpg';">
                <div class="youtube-play-button">
                    <i class="fas fa-play"></i>
                </div>
                <div class="youtube-privacy-notice">
                    <i class="fas fa-external-link-alt"></i> Click to watch on YouTube
                </div>
            </div>
            <div class="media-source">
                <i class="fab fa-youtube"></i> 
                <a href="${url}" target="_blank" rel="noopener noreferrer">Watch on YouTube</a>
            </div>
        </div>`
    };
}

// Add this click handler for YouTube placeholders
document.addEventListener('click', function(e) {
    // Find if the clicked element is inside a youtube-placeholder
    const placeholder = e.target.closest('.youtube-placeholder');
    if (placeholder) {
        e.preventDefault();
        e.stopPropagation();
        
        const videoId = placeholder.dataset.videoId;
        const url = placeholder.dataset.url;
        
        if (videoId) {
            // Instead of trying to embed, open in new tab (most reliable)
            window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
            
            // Show a brief message
            const originalContent = placeholder.innerHTML;
            placeholder.innerHTML = `
                <div class="youtube-message" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.8); color: white; padding: 20px; text-align: center;">
                    <div>
                        <i class="fab fa-youtube" style="font-size: 48px; color: #ff0000; margin-bottom: 10px; display: block;"></i>
                        <p>Opening YouTube...</p>
                        <p><small>If it doesn't open, <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer" style="color: #ff0000;">click here</a></small></p>
                    </div>
                </div>
            `;
            
            // Restore original after 3 seconds
            setTimeout(() => {
                if (placeholder && placeholder.querySelector('.youtube-message')) {
                    placeholder.innerHTML = originalContent;
                }
            }, 3000);
        }
    }
});

// Remove these functions as they're no longer needed:
// window.loadYouTubeVideo
// window.handleYouTubeVideo

function createVimeoEmbed(videoId, url, fullText) {
    return {
        type: 'vimeo',
        url: url,
        embedHtml: `<div class="media-embed vimeo-embed">
            <div class="vimeo-placeholder" onclick="loadVimeoVideo(this, '${videoId}')">
                <div class="vimeo-thumbnail-placeholder">
                    <i class="fab fa-vimeo"></i>
                    <span>Click to load Vimeo video</span>
                </div>
            </div>
            <div class="media-source"><i class="fab fa-vimeo"></i> <a href="${url}" target="_blank" rel="noopener noreferrer">Watch on Vimeo</a></div>
        </div>`
    };
}

function createInstagramEmbed(postId, url, fullText) {
    return {
        type: 'instagram',
        url: url,
        embedHtml: `<div class="media-embed instagram-embed">
            <div class="instagram-placeholder" onclick="handleInstagramPost(this, '${url}')">
                <i class="fab fa-instagram"></i>
                <span>Instagram Post</span>
                <small>Click to open in new tab</small>
            </div>
            <div class="media-source">
                <i class="fab fa-instagram"></i> 
                <a href="${url}" target="_blank" rel="noopener noreferrer">View on Instagram</a>
            </div>
        </div>`
    };
}

// Replace your existing createFacebookEmbed function with this:
function createFacebookEmbed(url, fullText) {
    // Extract Facebook video/post ID
    const videoMatch = url.match(/\/videos\/(\d+)/);
    const postMatch = url.match(/\/posts\/(\d+)/);
    const id = videoMatch ? videoMatch[1] : (postMatch ? postMatch[1] : '');
    
    return {
        type: 'facebook',
        url: url,
        embedHtml: `<div class="media-embed facebook-embed">
            <div class="facebook-placeholder" onclick="handleFacebookPost(this, '${url}')">
                <i class="fab fa-facebook"></i>
                <span>Facebook Content</span>
                <small>Click to open in new tab</small>
            </div>
            <div class="media-source">
                <i class="fab fa-facebook"></i> 
                <a href="${url}" target="_blank" rel="noopener noreferrer">View on Facebook</a>
            </div>
        </div>`
    };
}

function createTwitterEmbed(tweetId, url, fullText) {
    return {
        type: 'twitter',
        url: url,
        embedHtml: `<div class="media-embed twitter-embed">
            <div class="twitter-placeholder" onclick="loadTwitterPost(this, '${tweetId}', '${url}')">
                <i class="fab fa-twitter"></i>
                <span>Click to load tweet</span>
                <small>(External content)</small>
            </div>
            <div class="media-source"><i class="fab fa-twitter"></i> <a href="${url}" target="_blank" rel="noopener noreferrer">View on Twitter</a></div>
        </div>`
    };
}

function createTikTokEmbed(videoId, url, fullText) {
    return {
        type: 'tiktok',
        url: url,
        embedHtml: `<div class="media-embed tiktok-embed">
            <div class="tiktok-placeholder" onclick="loadTikTokVideo(this, '${videoId}', '${url}')">
                <i class="fab fa-tiktok"></i>
                <span>Click to load TikTok video</span>
                <small>(External content)</small>
            </div>
            <div class="media-source"><i class="fab fa-tiktok"></i> <a href="${url}" target="_blank" rel="noopener noreferrer">View on TikTok</a></div>
        </div>`
    };
}

function createVideoEmbed(url, fullText) {
    const extension = url.split('.').pop().split('?')[0].toLowerCase();
    return {
        type: 'video',
        url: url,
        embedHtml: `<div class="media-embed video-embed">
            <video controls preload="metadata" playsinline>
                <source src="${url}" type="video/${extension}">
                Your browser does not support the video tag. <a href="${url}" target="_blank" rel="noopener noreferrer">Download video</a>
            </video>
            <div class="media-source"><i class="fas fa-video"></i> <a href="${url}" target="_blank" rel="noopener noreferrer">Download Video</a></div>
        </div>`
    };
}

function createAudioEmbed(url, fullText) {
    const extension = url.split('.').pop().split('?')[0].toLowerCase();
    return {
        type: 'audio',
        url: url,
        embedHtml: `<div class="media-embed audio-embed">
            <audio controls preload="metadata">
                <source src="${url}" type="audio/${extension}">
                Your browser does not support the audio tag. <a href="${url}" target="_blank" rel="noopener noreferrer">Download audio</a>
            </audio>
            <div class="media-source"><i class="fas fa-music"></i> <a href="${url}" target="_blank" rel="noopener noreferrer">Download Audio</a></div>
        </div>`
    };
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
// Global functions for loading social media embeds

window.loadVimeoVideo = function(container, videoId) {
    const embedUrl = `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    container.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allowfullscreen allow="autoplay" loading="lazy"></iframe>`;
};

window.loadInstagramPost = function(container, url) {
    // For Instagram, we'll open in a new tab due to embedding restrictions
    window.open(url, '_blank', 'noopener,noreferrer');
    // Show a message
    container.innerHTML = `<div class="embed-message">
        <i class="fab fa-instagram"></i> 
        <p>Instagram posts cannot be embedded directly. <a href="${url}" target="_blank" rel="noopener noreferrer">Click here</a> to open in a new tab.</p>
    </div>`;
};

window.loadFacebookPost = function(container, url) {
    // For Facebook, we'll open in a new tab due to embedding restrictions
    window.open(url, '_blank', 'noopener,noreferrer');
    // Show a message
    container.innerHTML = `<div class="embed-message">
        <i class="fab fa-facebook"></i> 
        <p>Facebook posts cannot be embedded directly. <a href="${url}" target="_blank" rel="noopener noreferrer">Click here</a> to open in a new tab.</p>
    </div>`;
};

window.loadTwitterPost = function(container, tweetId, url) {
    // For Twitter, we'll open in a new tab due to embedding restrictions
    window.open(url, '_blank', 'noopener,noreferrer');
    // Show a message
    container.innerHTML = `<div class="embed-message">
        <i class="fab fa-twitter"></i> 
        <p>Tweets cannot be embedded directly. <a href="${url}" target="_blank" rel="noopener noreferrer">Click here</a> to open in a new tab.</p>
    </div>`;
};

window.loadTikTokVideo = function(container, videoId, url) {
    // For TikTok, we'll open in a new tab due to embedding restrictions
    window.open(url, '_blank', 'noopener,noreferrer');
    // Show a message
    container.innerHTML = `<div class="embed-message">
        <i class="fab fa-tiktok"></i> 
        <p>TikTok videos cannot be embedded directly. <a href="${url}" target="_blank" rel="noopener noreferrer">Click here</a> to open in a new tab.</p>
    </div>`;
};


// Facebook handler - always open in new tab (most reliable)
window.handleFacebookPost = function(container, url) {
    window.open(url, '_blank', 'noopener,noreferrer');
    container.innerHTML = `
        <div class="embed-message facebook-message">
            <i class="fab fa-facebook"></i>
            <p>Opening Facebook in new tab...</p>
            <p><small>If it doesn't open automatically, <a href="${url}" target="_blank" rel="noopener noreferrer">click here</a></small></p>
        </div>
    `;
};

// Instagram handler - always open in new tab (most reliable)
window.handleInstagramPost = function(container, url) {
    window.open(url, '_blank', 'noopener,noreferrer');
    container.innerHTML = `
        <div class="embed-message instagram-message">
            <i class="fab fa-instagram"></i>
            <p>Opening Instagram in new tab...</p>
            <p><small>If it doesn't open automatically, <a href="${url}" target="_blank" rel="noopener noreferrer">click here</a></small></p>
        </div>
    `;
};

// Vimeo handler with fallback
window.handleVimeoVideo = function(container, videoId, url) {
    const embedUrl = `https://player.vimeo.com/video/${videoId}`;
    
    const iframe = document.createElement('iframe');
    iframe.src = embedUrl;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'true');
    iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
    iframe.setAttribute('loading', 'lazy');
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    
    container.innerHTML = '';
    container.style.padding = '0';
    container.style.backgroundColor = '#000';
    container.appendChild(iframe);
    
    iframe.onerror = function() {
        container.innerHTML = `
            <div class="embed-message vimeo-message">
                <i class="fab fa-vimeo"></i>
                <p>This video cannot be embedded.</p>
                <p><a href="${url}" target="_blank" rel="noopener noreferrer">Click here to watch on Vimeo</a></p>
            </div>
        `;
    };
};

// Update Vimeo embed function
function createVimeoEmbed(videoId, url, fullText) {
    return {
        type: 'vimeo',
        url: url,
        embedHtml: `<div class="media-embed vimeo-embed">
            <div class="vimeo-placeholder" onclick="handleVimeoVideo(this, '${videoId}', '${url}')">
                <div class="vimeo-thumbnail-placeholder">
                    <i class="fab fa-vimeo"></i>
                    <span>Click to load Vimeo video</span>
                </div>
            </div>
            <div class="media-source">
                <i class="fab fa-vimeo"></i> 
                <a href="${url}" target="_blank" rel="noopener noreferrer">Watch on Vimeo</a>
            </div>
        </div>`
    };
}

// Update the load functions in the global section
window.loadYouTubeVideo = window.handleYouTubeVideo;
window.loadVimeoVideo = window.handleVimeoVideo;
window.loadInstagramPost = window.handleInstagramPost;
window.loadFacebookPost = window.handleFacebookPost;
window.loadTwitterPost = function(container, tweetId, url) {
    window.open(url, '_blank', 'noopener,noreferrer');
    container.innerHTML = `
        <div class="embed-message twitter-message">
            <i class="fab fa-twitter"></i>
            <p>Opening tweet in new tab...</p>
            <p><small>If it doesn't open automatically, <a href="${url}" target="_blank" rel="noopener noreferrer">click here</a></small></p>
        </div>
    `;
};
window.loadTikTokVideo = function(container, videoId, url) {
    window.open(url, '_blank', 'noopener,noreferrer');
    container.innerHTML = `
        <div class="embed-message tiktok-message">
            <i class="fab fa-tiktok"></i>
            <p>Opening TikTok in new tab...</p>
            <p><small>If it doesn't open automatically, <a href="${url}" target="_blank" rel="noopener noreferrer">click here</a></small></p>
        </div>
    `;
};


console.log('Chat.js loaded and functions exposed globally');
