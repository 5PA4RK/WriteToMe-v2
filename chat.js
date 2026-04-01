// chat.js - Enhanced Chat Functionality
// This file handles all chat-related features: messages, reactions, replies, editing, deleting

const ChatModule = (function() {
    // Private variables
    let appState = null;
    let supabaseClient = null;
    let elements = {};
    
    // Reaction emojis available
    const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];
    
    // Scroll handling for performance
    let scrollTimeout = null;

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
        console.log('🎨 displayMessage called:', { 
            id: message.id, 
            sender: message.sender, 
            type: message.type,
            hasImage: !!message.image,
            isOptimistic: message.is_optimistic
        });
        
        if (!elements.chatMessages) {
            console.error('Chat messages container not found');
            return;
        }
        
        // Don't display if viewing history and this is not a historical message
        if (appState && appState.isViewingHistory && !message.is_historical) {
            console.log('Skipping display - viewing history');
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
            messageDiv.style.transition = 'opacity 0.3s ease';
            
            setTimeout(() => {
                if (messageDiv) {
                    messageDiv.style.opacity = '1';
                }
            }, 100);
        }
        messageDiv.id = `msg-${message.id}`;
        
        let messageContent = '';
        
        // Add reply reference if this is a reply
        if (message.reply_to) {
            messageContent += getReplyQuoteHtml(message.reply_to, message);
        }
        
        // Process message text for media embeds
        if (message.text && message.text.trim()) {
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
        
        // Add image if present (uploaded file)
        if (message.image && message.image.trim() !== '') {
            console.log('🎨 Rendering image in message:', message.id);
            console.log('🎨 Image URL:', message.image);
            messageContent += `<img src="${message.image}" class="message-image" onclick="window.showFullImage('${message.image}')" loading="lazy">`;
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
        
        // Store in appState.messages (skip optimistic messages)
        if (appState && appState.messages && Array.isArray(appState.messages) && !message.is_optimistic) {
            const exists = appState.messages.some(m => m.id === message.id);
            if (!exists) {
                appState.messages.push(message);
                if (appState.messages.length > 100) {
                    appState.messages = appState.messages.slice(-100);
                }
            }
        }
        
        // Scroll to bottom
        setTimeout(() => {
            if (elements.chatMessages) {
                elements.chatMessages.scrollTo({
                    top: elements.chatMessages.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }, 50);
    }

    // Get reply quote HTML - FIXED for immediate image display
    function getReplyQuoteHtml(replyToId, currentMessage) {
        let quotedSender = 'someone';
        let quotedText = 'a message';
        let quotedImage = null;
        let found = false;
        let isImageOnly = false;
        
        // CHECK 1: Does the current message have a reply_to_image property?
        if (currentMessage.reply_to_image && currentMessage.reply_to_image.trim() !== '') {
            quotedImage = currentMessage.reply_to_image;
            console.log('Using reply_to_image from message:', quotedImage);
            
            // Try to get sender from appState messages
            const originalMsg = appState.messages.find(m => m.id === replyToId);
            if (originalMsg) {
                quotedSender = originalMsg.sender;
                found = true;
                isImageOnly = !originalMsg.text || originalMsg.text.trim() === '';
                quotedText = isImageOnly ? '[Image]' : (originalMsg.text || '').substring(0, 100);
            }
        }
        
        // CHECK 2: Check stored image from reply modal (for immediate display when composing)
        if (!found && appState && appState.replyingToImage && replyToId === appState.replyingTo) {
            quotedImage = appState.replyingToImage;
            if (quotedImage) {
                const originalMsg = appState.messages.find(m => m.id === replyToId);
                if (originalMsg) {
                    quotedSender = originalMsg.sender;
                    found = true;
                    isImageOnly = !originalMsg.text || originalMsg.text.trim() === '';
                    quotedText = isImageOnly ? '[Image]' : (originalMsg.text || '').substring(0, 100);
                    console.log('Using stored image from reply modal:', quotedImage);
                }
            }
        }
        
        // CHECK 3: Check if this is a temporary ID that needs mapping to real ID
        let realReplyToId = replyToId;
        if (window._messageIdMap && window._messageIdMap[replyToId]) {
            realReplyToId = window._messageIdMap[replyToId];
            console.log('Mapped temp ID', replyToId, 'to real ID', realReplyToId);
        }
        
        // CHECK 4: Try to find in DOM first using both possible IDs
        if (!found) {
            let originalMsgElement = document.getElementById(`msg-${realReplyToId}`);
            if (!originalMsgElement && realReplyToId !== replyToId) {
                originalMsgElement = document.getElementById(`msg-${replyToId}`);
            }
            
            if (originalMsgElement) {
                const senderEl = originalMsgElement.querySelector('.message-sender');
                const textEl = originalMsgElement.querySelector('.message-text');
                const imageEl = originalMsgElement.querySelector('.message-image');
                
                if (senderEl) {
                    quotedSender = senderEl.textContent;
                    found = true;
                }
                
                if (imageEl) {
                    quotedImage = imageEl.src;
                    found = true;
                    
                    if (textEl) {
                        const textContent = textEl.textContent
                            .replace(/\s*\(edited\)\s*$/, '')
                            .trim();
                        
                        if (textContent && textContent !== '[Image]') {
                            quotedText = textContent.substring(0, 100);
                            if (textContent.length > 100) quotedText += '...';
                            isImageOnly = false;
                        } else {
                            quotedText = '[Image]';
                            isImageOnly = true;
                        }
                    } else {
                        quotedText = '[Image]';
                        isImageOnly = true;
                    }
                } else if (textEl) {
                    quotedText = textEl.textContent
                        .replace(/\s*\(edited\)\s*$/, '')
                        .substring(0, 100);
                    if (textEl.textContent.length > 100) quotedText += '...';
                    isImageOnly = false;
                }
            }
        }
        
        // CHECK 5: If not found in DOM, try appState messages
        if (!found && appState && appState.messages) {
            const originalMsg = appState.messages.find(m => m.id === replyToId || m.id === realReplyToId);
            if (originalMsg) {
                quotedSender = originalMsg.sender;
                
                if (originalMsg.image && (!originalMsg.text || originalMsg.text.trim() === '')) {
                    quotedText = '[Image]';
                    quotedImage = originalMsg.image;
                    isImageOnly = true;
                } else if (originalMsg.image && originalMsg.text) {
                    quotedText = (originalMsg.text || '').substring(0, 100);
                    if (originalMsg.text && originalMsg.text.length > 100) quotedText += '...';
                    quotedImage = originalMsg.image;
                    isImageOnly = false;
                } else {
                    quotedText = (originalMsg.text || '').substring(0, 100);
                    if (originalMsg.text && originalMsg.text.length > 100) quotedText += '...';
                    isImageOnly = false;
                }
                found = true;
            }
        }
        
        // CHECK 6: If still not found, try to fetch from database (async)
        if (!found && supabaseClient) {
            const currentMsgId = currentMessage.id;
            
            supabaseClient
                .from('messages')
                .select('sender_name, message, image_url')
                .eq('id', realReplyToId)
                .single()
                .then(({ data, error }) => {
                    if (!error && data) {
                        const quoteElement = document.querySelector(`#msg-${currentMsgId} .message-reply-ref`);
                        if (quoteElement) {
                            const contentDiv = quoteElement.querySelector('.reply-content');
                            if (contentDiv) {
                                let displayText = '';
                                let hasImage = data.image_url && data.image_url.trim() !== '';
                                let hasText = data.message && data.message.trim() !== '';
                                
                                if (hasImage && !hasText) {
                                    displayText = '<i class="fas fa-image"></i> [Image]';
                                } else if (hasImage && hasText) {
                                    displayText = `${escapeHtml(data.message.substring(0, 100))} <i class="fas fa-image"></i>`;
                                    if (data.message.length > 100) displayText += '...';
                                } else {
                                    displayText = escapeHtml(data.message.substring(0, 100));
                                    if (data.message && data.message.length > 100) displayText += '...';
                                }
                                contentDiv.innerHTML = `Replying to <strong>${escapeHtml(data.sender_name)}</strong>: ${displayText}`;
                                
                                if (data.image_url) {
                                    const previewDiv = quoteElement.querySelector('.reply-image-preview');
                                    if (previewDiv) {
                                        previewDiv.innerHTML = `<img src="${data.image_url}" style="max-width: 50px; max-height: 50px; border-radius: 4px;">`;
                                        previewDiv.style.display = 'block';
                                    }
                                }
                            }
                        }
                    }
                })
                .catch(e => console.log('Error fetching original message:', e));
            
            // Return loading state with placeholder
            return `
                <div class="message-reply-ref">
                    <i class="fas fa-reply"></i> 
                    <div class="reply-content">
                        <span>Loading quoted message...</span>
                    </div>
                    <div class="reply-image-preview" style="display: none;"></div>
                </div>
            `;
        }
        
        // Build the display text with image indicator
        let displayText = quotedText;
        if (isImageOnly) {
            displayText = '<i class="fas fa-image"></i> [Image]';
        } else if (quotedImage && !quotedText.includes('[Image]') && !quotedText.includes('fa-image')) {
            displayText = `${quotedText} <i class="fas fa-image"></i>`;
        }
        
        // Fix blob URLs - convert to real URL if available
        let finalImageUrl = quotedImage;
        if (finalImageUrl && finalImageUrl.startsWith('blob:')) {
            const originalMsg = appState.messages.find(m => m.id === replyToId || m.id === realReplyToId);
            if (originalMsg && originalMsg._realImageUrl) {
                finalImageUrl = originalMsg._realImageUrl;
                console.log('Converted blob URL to real URL:', finalImageUrl);
            }
        }
        
        return `
            <div class="message-reply-ref" data-original-image="${finalImageUrl || ''}">
                <i class="fas fa-reply"></i> 
                <div class="reply-content">
                    <span>Replying to <strong>${escapeHtml(quotedSender)}</strong>: ${displayText}</span>
                </div>
                ${finalImageUrl ? `<div class="reply-image-preview"><img src="${finalImageUrl}" style="max-width: 50px; max-height: 50px; border-radius: 4px;" onerror="this.style.display='none'"></div>` : '<div class="reply-image-preview" style="display: none;"></div>'}
            </div>
        `;
    }

    // Get actions menu HTML
    function getActionsMenuHtml(message) {
        const isOwnMessage = message.sender === (appState ? appState.userName : '');
        const messageIdStr = String(message.id);
        
        return `
            <div class="message-actions-menu" id="actions-${messageIdStr}" style="display: none;">
                ${isOwnMessage ? `
                    <button onclick="window.editMessage('${messageIdStr}')"><i class="fas fa-edit"></i> Edit</button>
                    <button onclick="window.deleteMessage('${messageIdStr}')"><i class="fas fa-trash"></i> Delete</button>
                    <div class="menu-divider"></div>
                ` : ''}
                <button class="reply-btn" data-message-id="${messageIdStr}" data-sender="${escapeHtml(message.sender)}" data-message-text="${escapeHtml(message.text || '')}">
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
        
        closeMessageActions();
        
        const menu = document.getElementById(`actions-${messageId}`);
        if (menu) {
            if (menu.classList.contains('show')) {
                menu.classList.remove('show');
                menu.style.display = 'none';
            } else {
                menu.classList.add('show');
                menu.style.display = 'block';
                if (appState) appState.activeMessageActions = messageId;
                
                const rect = button.getBoundingClientRect();
                
                menu.style.position = 'fixed';
                menu.style.top = (rect.bottom + 5) + 'px';
                menu.style.left = rect.left + 'px';
                menu.style.zIndex = '9999';
                
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
        console.log('🔵 addReaction called with:', { messageId, emoji });
        
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
                console.error('Message element not found for ID:', messageId);
                return;
            }
            
            const reactions = await getMessageReactions(messageId);
            const userReaction = reactions.find(r => r.user_id === appState.userId);
            
            if (userReaction) {
                if (userReaction.emoji !== emoji) {
                    await supabaseClient
                        .from('message_reactions')
                        .delete()
                        .eq('id', userReaction.id);
                    
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
                    await supabaseClient
                        .from('message_reactions')
                        .delete()
                        .eq('id', userReaction.id);
                }
            } else {
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
            
            const updatedReactions = await getMessageReactions(messageId);
            const reactionsContainer = messageElement.querySelector('.message-reactions');
            if (reactionsContainer) {
                renderReactions(reactionsContainer, updatedReactions);
            }
            
        } catch (error) {
            console.error("Error adding reaction:", error);
            alert("Failed to add reaction: " + error.message);
        }
    }

    // Toggle reaction
    async function toggleReaction(messageId, emoji) {
        await addReaction(messageId, emoji);
    }

    // Get reactions for a message
    async function getMessageReactions(messageId) {
        if (!supabaseClient) return [];
        
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

    // Open reply modal - FIXED
    function openReplyModal(messageId, senderName, messageText) {
        console.log('Opening reply modal for message:', messageId);
        
        if (!elements.replyModal || !elements.replyToName || !elements.replyToContent || !elements.replyInput) {
            console.error('Reply modal elements not found');
            return;
        }
        
        const messageElement = document.getElementById(`msg-${messageId}`);
        let imageUrl = null;
        let actualMessageText = messageText;
        
        if (messageElement) {
            const imgElement = messageElement.querySelector('.message-image');
            if (imgElement && imgElement.src) {
                imageUrl = imgElement.src;
                console.log('Found image in message:', imageUrl);
            }
            
            const textElement = messageElement.querySelector('.message-text');
            if (textElement) {
                actualMessageText = textElement.textContent.replace(/\s*\(edited\)\s*$/, '');
            }
        }
        
        if (!imageUrl && appState && appState.messages) {
            const originalMsg = appState.messages.find(m => m.id === messageId);
            if (originalMsg && originalMsg.image) {
                imageUrl = originalMsg.image;
                if (imageUrl && imageUrl.startsWith('blob:') && originalMsg._realImageUrl) {
                    imageUrl = originalMsg._realImageUrl;
                }
                console.log('Found image in appState:', imageUrl);
            }
        }
        
        // Store in global for immediate access
        window.__pendingReply = {
            messageId: messageId,
            imageUrl: imageUrl,
            senderName: senderName,
            messageText: actualMessageText
        };
        
        if (appState) {
            appState.replyingTo = messageId;
            appState.replyingToImage = imageUrl;
        }
        
        elements.replyToName.textContent = senderName || 'Unknown';
        
        let displayText = actualMessageText || '';
        let imagePreviewHtml = '';
        
        if (imageUrl) {
            imagePreviewHtml = `<div style="margin-top: 10px;"><img src="${imageUrl}" style="max-width: 100px; max-height: 100px; border-radius: 8px; object-fit: cover;"></div>`;
            if (displayText) {
                displayText = displayText + imagePreviewHtml;
            } else {
                displayText = '<i class="fas fa-image"></i> [Image]' + imagePreviewHtml;
            }
        }
        
        if (displayText.length > 150) {
            displayText = displayText.substring(0, 150) + '...';
        }
        elements.replyToContent.innerHTML = displayText;
        elements.replyToContent.setAttribute('data-full-text', actualMessageText || '');
        elements.replyToContent.setAttribute('data-image-url', imageUrl || '');
        
        elements.replyInput.value = '';
        elements.replyModal.style.display = 'flex';
        document.body.classList.add('modal-open');
        
        setTimeout(() => {
            if (elements.replyInput) {
                elements.replyInput.focus();
            }
        }, 100);
    }

    // Send reply - FIXED
    async function sendReply() {
        console.log('🟢 sendReply called');
        
        const replyText = elements.replyInput ? elements.replyInput.value.trim() : '';
        if (!replyText) return;
        
        // Get reply data from global
        let replyData = window.__pendingReply;
        
        if (!replyData && appState) {
            replyData = {
                messageId: appState.replyingTo,
                imageUrl: appState.replyingToImage,
                senderName: null,
                messageText: null
            };
        }
        
        const replyToId = replyData ? replyData.messageId : null;
        const replyToImage = replyData ? replyData.imageUrl : null;
        
        console.log('Replying to message ID:', replyToId);
        console.log('Replying to image URL:', replyToImage);
        
        if (!replyToId) {
            console.error('No replyToId found!');
            return;
        }
        
        if (!elements.messageInput) {
            console.error('Message input not found');
            return;
        }
        
        // Store for sendMessage to use
        window.__tempReplyTo = replyToId;
        window.__tempReplyToImage = replyToImage;
        
        // Clear pending data
        if (appState) {
            appState.replyingTo = null;
            appState.replyingToImage = null;
        }
        window.__pendingReply = null;
        
        elements.messageInput.value = replyText;
        
        if (elements.replyModal) {
            elements.replyModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }
        
        if (elements.sendReplyBtn) {
            elements.sendReplyBtn.disabled = true;
        }
        
        elements.messageInput.focus();
        
        if (typeof window.sendMessage === 'function') {
            await window.sendMessage();
        }
        
        window.__tempReplyTo = null;
        window.__tempReplyToImage = null;
        
        if (elements.sendReplyBtn) {
            setTimeout(() => {
                if (elements.sendReplyBtn) {
                    elements.sendReplyBtn.disabled = false;
                }
            }, 500);
        }
        
        elements.messageInput.value = '';
        
        setTimeout(() => {
            if (elements.chatMessages) {
                elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
            }
        }, 200);
    }

    // Edit message
    async function editMessage(messageId) {
        console.log('Editing message:', messageId);
        closeMessageActions();
        
        if (!supabaseClient) {
            alert('Cannot edit message: Database connection not initialized');
            return;
        }
        
        const messageElement = document.getElementById(`msg-${messageId}`);
        if (!messageElement) return;
        
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
                
                if (appState && appState.messages) {
                    const msgIndex = appState.messages.findIndex(m => m.id === messageId);
                    if (msgIndex !== -1) {
                        appState.messages[msgIndex].text = newText.trim();
                        appState.messages[msgIndex].is_edited = true;
                    }
                }
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
            alert('Cannot delete message: Database connection not initialized');
            return;
        }
        
        if (!confirm("Are you sure you want to delete this message?")) return;
        
        try {
            await supabaseClient
                .from('message_reactions')
                .delete()
                .eq('message_id', messageId);
            
            await supabaseClient
                .from('messages')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: appState?.userId,
                    message: null,
                    image_url: null
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
                            <div class="message-time">${new Date().toLocaleTimeString()}</div>
                        </div>
                    </div>
                `;
                
                const actionsMenu = document.getElementById(`actions-${messageId}`);
                if (actionsMenu) actionsMenu.remove();
            }
            
            if (appState && appState.messages) {
                const msgIndex = appState.messages.findIndex(m => m.id === messageId);
                if (msgIndex !== -1) {
                    appState.messages[msgIndex].is_deleted = true;
                    appState.messages[msgIndex].text = null;
                    appState.messages[msgIndex].image = null;
                }
            }
        } catch (error) {
            console.error("Error deleting message:", error);
            alert("Failed to delete message: " + error.message);
        }
    }

    // Handle typing indicator
    async function handleTyping() {
        if (!appState?.currentSessionId || appState?.isViewingHistory || !appState?.isConnected) return;
        
        try {
            await supabaseClient
                .from('chat_sessions')
                .update({ typing_user: appState.userName })
                .eq('session_id', appState.currentSessionId);
            
            if (appState.typingTimeout) clearTimeout(appState.typingTimeout);
            
            appState.typingTimeout = setTimeout(() => {
                supabaseClient
                    .from('chat_sessions')
                    .update({ typing_user: null })
                    .eq('session_id', appState.currentSessionId)
                    .catch(e => console.log("Error clearing typing:", e));
            }, 2000);
        } catch (error) {
            console.log("Typing indicator error:", error);
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

    // Handle chat scroll
    function handleChatScroll() {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {}, 100);
    }

    // Setup event listeners
    function setupEventListeners() {
        const handleReplyClick = function(e) {
            const replyBtn = e.target.closest('.reply-btn');
            if (replyBtn) {
                e.preventDefault();
                e.stopPropagation();
                
                const messageId = replyBtn.dataset.messageId;
                const sender = replyBtn.dataset.sender;
                const messageText = replyBtn.dataset.messageText;
                
                closeMessageActions();
                openReplyModal(messageId, sender, messageText);
            }
        };
        
        document.addEventListener('click', handleReplyClick);
        document.addEventListener('touchstart', handleReplyClick, { passive: false });
        
        if (elements.chatMessages) {
            elements.chatMessages.addEventListener('scroll', handleChatScroll, { passive: true });
        }
        
        if (elements.sendReplyBtn) {
            const oldBtn = elements.sendReplyBtn;
            const newBtn = oldBtn.cloneNode(true);
            oldBtn.parentNode.replaceChild(newBtn, oldBtn);
            elements.sendReplyBtn = newBtn;
            
            let isProcessing = false;
            
            const handleSendReply = function(e) {
                e.preventDefault();
                e.stopPropagation();
                if (isProcessing) return;
                isProcessing = true;
                sendReply().finally(() => setTimeout(() => { isProcessing = false; }, 1000));
            };
            
            elements.sendReplyBtn.addEventListener('click', handleSendReply);
            elements.sendReplyBtn.addEventListener('touchstart', handleSendReply, { passive: false });
        }
        
        if (elements.closeReplyModal) {
            elements.closeReplyModal.addEventListener('click', () => {
                elements.replyModal.style.display = 'none';
                document.body.classList.remove('modal-open');
                if (appState) appState.replyingTo = null;
                window.__pendingReply = null;
            });
        }
        
        if (elements.replyModal) {
            elements.replyModal.addEventListener('click', (e) => {
                if (e.target === elements.replyModal) {
                    elements.replyModal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                    if (appState) appState.replyingTo = null;
                    window.__pendingReply = null;
                }
            });
        }
    }

    // Escape HTML
    function escapeHtml(text) {
        if (text === undefined || text === null) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Create media embed (simplified for brevity - keep your existing implementation)
    function createMediaEmbed(text) {
        if (!text) return null;
        
        // URL patterns
        const patterns = {
            image: /(https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp|bmp|svg)(?:\?[^\s]*)?)/gi,
            youtube: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi,
            url: /(https?:\/\/[^\s]+)/gi
        };
        
        for (let [type, pattern] of Object.entries(patterns)) {
            pattern.lastIndex = 0;
            const match = pattern.exec(text);
            if (match) {
                const url = match[0];
                if (type === 'image') {
                    return {
                        type: 'image',
                        url: url,
                        embedHtml: `<div class="media-embed"><img src="${url}" style="max-width: 100%; max-height: 200px; border-radius: 8px;" onclick="window.showFullImage('${url}')"></div>`
                    };
                } else if (type === 'youtube') {
                    const videoId = match[1];
                    return {
                        type: 'youtube',
                        url: url,
                        embedHtml: `<div class="media-embed"><a href="https://www.youtube.com/watch?v=${videoId}" target="_blank">Watch on YouTube</a></div>`
                    };
                }
            }
        }
        return null;
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

// Make ChatModule globally available
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

window.handleTyping = function() {
    ChatModule.handleTyping();
};

console.log('Chat.js loaded and functions exposed globally');
