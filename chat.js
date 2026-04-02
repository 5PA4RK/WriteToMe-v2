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
    let isScrolling = false;

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
    
    // ========== ADD IMAGE WITH DEBUG LOGS (IN CORRECT PLACE) ==========
    console.log('🔍 [CHAT.JS] Message object before image render:', {
        id: message.id,
        sender: message.sender,
        hasImage: !!message.image,
        imageValue: message.image ? message.image.substring(0, 100) : 'null',
        imageType: typeof message.image,
        imageLength: message.image?.length,
        isOptimistic: message.is_optimistic
    });
    
    // Add image if present (uploaded file)
    if (message.image && message.image.trim() !== '') {
        console.log('🎨 [CHAT.JS] Rendering image in message:', message.id);
        console.log('🎨 [CHAT.JS] Full Image URL:', message.image);
        messageContent += `<img src="${message.image}" class="message-image" onclick="window.showFullImage('${message.image}')" loading="lazy">`;
    } else {
        console.log('⚠️ [CHAT.JS] No image to render for message:', message.id, 'image value:', message.image);
    }
    // ========== END IMAGE CODE ==========
    
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
    
    // Smart scroll: only auto-scroll if user is near bottom
    const isNearBottom = elements.chatMessages.scrollHeight - elements.chatMessages.scrollTop - elements.chatMessages.clientHeight < 100;
    
    // Always scroll for user's own messages
    const isOwnMessage = message.type === 'sent';
    
    if (isOwnMessage || (isNearBottom && !appState.isViewingHistory)) {
        setTimeout(() => {
            elements.chatMessages.scrollTo({
                top: elements.chatMessages.scrollHeight,
                behavior: 'smooth'
            });
        }, 50);
        
        // Second attempt for images that load slowly
        if (message.image) {
            setTimeout(() => {
                elements.chatMessages.scrollTo({
                    top: elements.chatMessages.scrollHeight,
                    behavior: 'smooth'
                });
            }, 300);
        }
    }
}

function getReplyQuoteHtml(replyToId, currentMessage) {
    let quotedSender = 'someone';
    let quotedText = 'a message';
    let quotedImage = null;
    let found = false;
    let isImageOnly = false;
    
    // PRIORITY 1: Check currentMessage for reply_to_image (passed from displayMessage)
    if (currentMessage.reply_to_image) {
        quotedImage = currentMessage.reply_to_image;
        console.log('Found reply_to_image in currentMessage:', quotedImage);
    }
    
    // Check if this is a temporary ID that needs mapping to real ID
    let realReplyToId = replyToId;
    if (window._messageIdMap && window._messageIdMap[replyToId]) {
        realReplyToId = window._messageIdMap[replyToId];
        console.log('Mapped temp ID', replyToId, 'to real ID', realReplyToId);
    }
    
    // PRIORITY 2: Try to find in DOM
    let originalMsgElement = document.getElementById(`msg-${realReplyToId}`);
    if (!originalMsgElement && realReplyToId !== replyToId) {
        originalMsgElement = document.getElementById(`msg-${replyToId}`);
    }
    
    if (originalMsgElement) {
        const senderEl = originalMsgElement.querySelector('.message-sender');
        const textEl = originalMsgElement.querySelector('.message-text');
        const imgEl = originalMsgElement.querySelector('.message-image');
        
        if (senderEl) {
            quotedSender = senderEl.textContent;
            found = true;
        }
        
        if (imgEl && imgEl.src) {
            if (!quotedImage) quotedImage = imgEl.src;
            found = true;
            
            const hasText = textEl && textEl.textContent.trim() && 
                           !textEl.textContent.includes('[Image]') &&
                           textEl.textContent !== '';
            
            if (hasText) {
                quotedText = textEl.textContent.replace(/\s*\(edited\)\s*$/, '').substring(0, 100);
                if (quotedText.length > 100) quotedText += '...';
                isImageOnly = false;
            } else {
                quotedText = '[Image]';
                isImageOnly = true;
            }
        } else if (textEl && textEl.textContent.trim()) {
            quotedText = textEl.textContent.replace(/\s*\(edited\)\s*$/, '').substring(0, 100);
            if (quotedText.length > 100) quotedText += '...';
            isImageOnly = false;
        }
    }
    
    // PRIORITY 3: Try appState messages
    if ((!found || !quotedImage) && appState && appState.messages) {
        const originalMsg = appState.messages.find(m => m.id === replyToId || m.id === realReplyToId);
        if (originalMsg) {
            if (!quotedSender) quotedSender = originalMsg.sender;
            found = true;
            
            // Check if it's an image-only message
            const hasImage = originalMsg.image || originalMsg._realImageUrl;
            const hasText = originalMsg.text && originalMsg.text.trim() !== '';
            
            if (hasImage && !quotedImage) {
                quotedImage = originalMsg._realImageUrl || originalMsg.image;
            }
            
            if (!hasText && hasImage) {
                quotedText = '[Image]';
                isImageOnly = true;
            } else if (hasText) {
                quotedText = originalMsg.text.substring(0, 100);
                if (originalMsg.text.length > 100) quotedText += '...';
                isImageOnly = false;
            }
        }
    }
    
    // Build the display text
    let displayText = quotedText;
    if (isImageOnly || (!quotedText && quotedImage)) {
        displayText = '<i class="fas fa-image"></i> [Image]';
    } else if (quotedImage && !displayText.includes('fa-image')) {
        displayText = `${displayText} <i class="fas fa-image"></i>`;
    }
    
    // Handle blob URLs - try to get real URL if available
    let finalImageUrl = quotedImage;
    if (finalImageUrl && finalImageUrl.startsWith('blob:')) {
        const originalMsg = appState.messages.find(m => m.id === replyToId || m.id === realReplyToId);
        if (originalMsg && originalMsg._realImageUrl) {
            finalImageUrl = originalMsg._realImageUrl;
        }
    }
    
    // Create the reply HTML with image preview
    const imagePreviewHtml = finalImageUrl ? `
        <div class="reply-image-preview" data-image-url="${finalImageUrl}">
            <img src="${finalImageUrl}" style="max-width: 40px; max-height: 40px; border-radius: 4px; object-fit: cover;" 
                 onerror="this.style.display='none'"
                 onclick="event.stopPropagation(); window.showFullImage('${finalImageUrl}')">
            <div class="preview-tooltip">
                <img src="${finalImageUrl}" alt="Preview">
            </div>
        </div>
    ` : '<div class="reply-image-preview" style="display: none;"></div>';
    
    return `
        <div class="message-reply-ref" data-original-image="${finalImageUrl || ''}">
            <i class="fas fa-reply"></i> 
            <div class="reply-content">
                <span>Replying to <strong>${escapeHtml(quotedSender)}</strong>: ${displayText}</span>
            </div>
            ${imagePreviewHtml}
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
                <button class="reply-btn" data-message-id="${messageIdStr}" data-sender="${escapeHtml(message.sender)}" data-message-text="${escapeHtml(message.text)}">
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

    function toggleMessageActions(messageId, button) {
        console.log('Toggle message actions called for message:', messageId);
        
        closeMessageActions();
        
        const menu = document.getElementById(`actions-${messageId}`);
        if (menu) {
            if (menu.classList.contains('show')) {
                menu.classList.remove('show');
                menu.style.display = 'none';
            } else {
                // CRITICAL: Ensure menu is appended to body to avoid stacking context issues
                if (menu.parentElement !== document.body) {
                    document.body.appendChild(menu);
                }
                
                menu.classList.add('show');
                menu.style.display = 'block';
                if (appState) appState.activeMessageActions = messageId;
                
                // Get button position relative to viewport
                const rect = button.getBoundingClientRect();
                
                // Get menu dimensions
                menu.style.visibility = 'hidden';
                menu.style.display = 'block';
                const menuRect = menu.getBoundingClientRect();
                menu.style.display = 'none';
                menu.style.visibility = 'visible';
                
                // Calculate position
                let top = rect.bottom + 5;
                let left = rect.left;
                
                // Adjust if menu goes off screen to the right
                if (left + menuRect.width > window.innerWidth) {
                    left = window.innerWidth - menuRect.width - 10;
                }
                
                // Adjust if menu goes off screen to the left
                if (left < 10) {
                    left = 10;
                }
                
                // Check if menu goes off screen at the bottom
                if (top + menuRect.height > window.innerHeight) {
                    // Position above the button instead
                    top = rect.top - menuRect.height - 5;
                }
                
                // Check if menu goes off screen at the top
                if (top < 10) {
                    top = 10;
                }
                
                // Apply position with highest z-index
                menu.style.position = 'fixed';
                menu.style.top = top + 'px';
                menu.style.left = left + 'px';
                menu.style.zIndex = '2147483647';
                menu.style.maxWidth = '280px';
                menu.style.width = 'auto';
                menu.style.display = 'block';
                
                console.log('Actions menu positioned at:', { top, left, width: menuRect.width, height: menuRect.height });
                
                // Add click outside listener
                setTimeout(() => {
                    const handleClickOutside = function(e) {
                        if (!menu.contains(e.target) && !button.contains(e.target)) {
                            closeMessageActions();
                            document.removeEventListener('click', handleClickOutside);
                            document.removeEventListener('touchstart', handleClickOutside);
                        }
                    };
                    document.addEventListener('click', handleClickOutside);
                    document.addEventListener('touchstart', handleClickOutside);
                }, 10);
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
    
    // Close the actions menu
    if (typeof closeMessageActions === 'function') {
        closeMessageActions();
    }
    
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
    
    if (!messageId) {
        console.error('No message ID provided');
        return;
    }
    
    try {
        const messageElement = document.getElementById(`msg-${messageId}`);
        if (!messageElement) {
            console.error('Message element not found for ID:', messageId);
            return;
        }
        
        // Get current reactions from the database
        const { data: reactions, error: fetchError } = await supabaseClient
            .from('message_reactions')
            .select('*')
            .eq('message_id', messageId);
        
        if (fetchError) {
            console.error('Error fetching reactions:', fetchError);
        }
        
        const userReaction = (reactions || []).find(r => r.user_id === appState.userId);
        
        if (userReaction) {
            if (userReaction.emoji !== emoji) {
                // Change existing reaction - delete old, add new
                console.log('Changing reaction from', userReaction.emoji, 'to', emoji);
                
                const { error: deleteError } = await supabaseClient
                    .from('message_reactions')
                    .delete()
                    .eq('id', userReaction.id);
                
                if (deleteError) {
                    console.error('Error deleting reaction:', deleteError);
                }
                
                const { error: insertError } = await supabaseClient
                    .from('message_reactions')
                    .insert([{
                        message_id: messageId,
                        user_id: appState.userId,
                        user_name: appState.userName,
                        emoji: emoji,
                        created_at: new Date().toISOString()
                    }]);
                
                if (insertError) {
                    console.error('Error inserting new reaction:', insertError);
                    throw insertError;
                }
                
                console.log('✅ Reaction changed successfully');
            } else {
                // Remove existing reaction
                console.log('Removing reaction:', userReaction.emoji);
                
                const { error: deleteError } = await supabaseClient
                    .from('message_reactions')
                    .delete()
                    .eq('id', userReaction.id);
                
                if (deleteError) {
                    console.error('Error deleting reaction:', deleteError);
                    throw deleteError;
                }
                
                console.log('✅ Reaction removed successfully');
            }
        } else {
            // Add new reaction
            console.log('Adding new reaction:', emoji);
            
            const { error: insertError } = await supabaseClient
                .from('message_reactions')
                .insert([{
                    message_id: messageId,
                    user_id: appState.userId,
                    user_name: appState.userName,
                    emoji: emoji,
                    created_at: new Date().toISOString()
                }]);
            
            if (insertError) {
                console.error('Error inserting reaction:', insertError);
                throw insertError;
            }
            
            console.log('✅ New reaction added successfully');
        }
        
        // The realtime subscription will handle updating the UI
        
    } catch (error) {
        console.error("❌ Error adding reaction:", error);
        alert("Failed to add reaction: " + (error.message || 'Unknown error'));
    }
}

    // Toggle reaction
    async function toggleReaction(messageId, emoji) {
        await addReaction(messageId, emoji);
    }

    // Get reactions for a message
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
        
        console.log(`Loaded ${data?.length || 0} reactions for message ${messageId}`);
        return data || [];
    } catch (error) {
        console.error("Error getting reactions:", error);
        return [];
    }
}

    function openReplyModal(messageId, senderName, messageText) {
        console.log('Opening reply modal for message:', messageId);
        
        if (!elements.replyModal || !elements.replyToName || !elements.replyToContent || !elements.replyInput) {
            console.error('Reply modal elements not found');
            return;
        }
        
        // CRITICAL: Ensure modal is in body
        if (elements.replyModal.parentElement !== document.body) {
            document.body.appendChild(elements.replyModal);
        }
        
        // Close any open menus
        if (typeof closeMessageActions === 'function') {
            closeMessageActions();
        }
        
        // Close emoji picker
        const emojiPicker = document.getElementById('emojiPicker');
        if (emojiPicker && emojiPicker.classList.contains('show')) {
            emojiPicker.classList.remove('show');
        }
        
        const messageElement = document.getElementById(`msg-${messageId}`);
        let imageUrl = null;
        let actualMessageText = messageText;
        
        if (messageElement) {
            const imgElement = messageElement.querySelector('.message-image');
            if (imgElement && imgElement.src) {
                imageUrl = imgElement.src;
            }
            
            const textElement = messageElement.querySelector('.message-text');
            if (textElement) {
                const rawText = textElement.textContent.replace(/\s*\(edited\)\s*$/, '');
                if (rawText && rawText !== '[Image]') {
                    actualMessageText = rawText;
                } else {
                    actualMessageText = '';
                }
            }
        }
        
        // Check appState for image
        if (!imageUrl && appState && appState.messages) {
            const originalMsg = appState.messages.find(m => m.id === messageId);
            if (originalMsg) {
                imageUrl = originalMsg._realImageUrl || originalMsg.image;
            }
        }
        
        // Store reply data
        window.__replyData = {
            messageId: messageId,
            senderName: senderName,
            messageText: actualMessageText,
            imageUrl: imageUrl
        };
        
        if (appState) {
            appState.replyingTo = messageId;
            appState.replyingToImage = imageUrl;
        }
        
        elements.replyToName.textContent = senderName || 'Unknown';
        
        let displayText = actualMessageText || '';
        let imagePreviewHtml = '';
        
        if (imageUrl) {
            imagePreviewHtml = `<div style="margin-top: 10px; display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.05); padding: 8px; border-radius: 8px;">
                <img src="${imageUrl}" style="max-width: 60px; max-height: 60px; border-radius: 8px; object-fit: cover;">
                <span style="font-size: 0.85rem;"><i class="fas fa-image"></i> Image attached</span>
            </div>`;
            
            if (displayText && displayText.trim() !== '') {
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
        
        // Lock body and show modal
        const scrollY = window.scrollY;
        document.body.classList.add('modal-open');
        document.body.style.top = `-${scrollY}px`;
        
        // Force modal display with highest priority
        elements.replyModal.style.display = 'flex';
        elements.replyModal.style.position = 'fixed';
        elements.replyModal.style.top = '0';
        elements.replyModal.style.left = '0';
        elements.replyModal.style.right = '0';
        elements.replyModal.style.bottom = '0';
        elements.replyModal.style.zIndex = '999999999';
        elements.replyModal.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        elements.replyModal.style.backdropFilter = 'blur(12px)';
        
        // Focus input
        setTimeout(() => {
            if (elements.replyInput) {
                elements.replyInput.focus();
            }
        }, 200);
    }

 
    async function sendReply() {
        console.log('🟢 sendReply called at:', new Date().toISOString());
        
        const replyText = elements.replyInput ? elements.replyInput.value.trim() : '';
        if (!replyText) return;
        
        // Get reply data from global variable or appState
        let replyData = window.__replyData;
        
        if (!replyData && appState) {
            replyData = {
                messageId: appState.replyingTo,
                senderName: null,
                messageText: null,
                imageUrl: appState.replyingToImage
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
        
        // Store the reply info in global variables for sendMessage to access
        window.__tempReplyTo = replyToId;
        window.__tempReplyToImage = replyToImage;
        
        console.log('Set __tempReplyToImage to:', replyToImage);
        
        // Clear the appState and global reply data
        if (appState) {
            appState.replyingTo = null;
            appState.replyingToImage = null;
        }
        window.__replyData = null;
        
        elements.messageInput.value = replyText;
        
        // Close the modal and restore scroll
        if (elements.replyModal) {
            elements.replyModal.style.display = 'none';
            document.body.classList.remove('modal-open');
            // Restore scroll position
            const scrollY = Math.abs(parseInt(document.body.style.top || '0'));
            document.body.style.top = '';
            window.scrollTo(0, scrollY);
        }
        
        if (elements.sendReplyBtn) {
            elements.sendReplyBtn.disabled = true;
        }
        
        if (window.innerWidth <= 768) {
            if (document.activeElement && document.activeElement.blur) {
                document.activeElement.blur();
            }
            await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        elements.messageInput.focus();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (typeof window.sendMessage === 'function') {
            console.log('Calling window.sendMessage with reply image:', replyToImage);
            await window.sendMessage();
            console.log('window.sendMessage completed');
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
// REPLACE the editMessage function in chat.js
async function editMessage(messageId) {
    console.log('Editing message:', messageId);
    closeMessageActions();
    
    if (!supabaseClient) {
        console.error('Supabase client not initialized');
        alert('Cannot edit message: Database connection not initialized');
        return;
    }
    const realId = window._messageIdMap ? window._messageIdMap[messageId] : null;
    const finalId = realId || messageId;
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
            // Update database
            const { data, error } = await supabaseClient
                .from('messages')
                .update({
                    message: newText.trim(),
                    edited_at: new Date().toISOString(),
                    is_edited: true
                })
                .eq('id', messageId)
                .eq('sender_id', appState?.userId)
                .select();
            
            if (error) throw error;
            
            // Update local DOM immediately
            if (textElement) {
                textElement.innerHTML = `${escapeHtml(newText.trim())} <small class="edited-indicator">(edited)</small>`;
            }
            
            // Update appState.messages
            if (appState && appState.messages) {
                const msgIndex = appState.messages.findIndex(m => m.id === messageId);
                if (msgIndex !== -1) {
                    appState.messages[msgIndex].text = newText.trim();
                    appState.messages[msgIndex].is_edited = true;
                }
            }
            
            console.log('Message edited successfully');
        } catch (error) {
            console.error("Error editing message:", error);
            alert("Failed to edit message: " + error.message);
        }
    }
}

// REPLACE the deleteMessage function in chat.js
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
        // Delete reactions first
        await supabaseClient
            .from('message_reactions')
            .delete()
            .eq('message_id', messageId);
        
        // Update message as deleted
        const { error } = await supabaseClient
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
        
        if (error) throw error;
        
        // Update DOM immediately
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
        
        // Update appState.messages
        if (appState && appState.messages) {
            const msgIndex = appState.messages.findIndex(m => m.id === messageId);
            if (msgIndex !== -1) {
                appState.messages[msgIndex].is_deleted = true;
                appState.messages[msgIndex].text = null;
                appState.messages[msgIndex].image = null;
            }
        }
        
        console.log('Message deleted successfully');
    } catch (error) {
        console.error("Error deleting message:", error);
        alert("Failed to delete message: " + error.message);
    }
}

    // Handle typing indicator
    async function handleTyping() {
        if (!appState.currentSessionId || appState.isViewingHistory || !appState.isConnected) {
            console.log('Typing ignored - not in active session');
            return;
        }
        
        console.log('👆 User typing detected:', appState.userName);
        
        try {
            // Only update typing_user in chat_sessions table
            const { error } = await supabaseClient
                .from('chat_sessions')
                .update({ typing_user: appState.userName })
                .eq('session_id', appState.currentSessionId);
            
            if (error) {
                console.error('Error updating typing status:', error);
                return;
            }
            
            console.log('✅ Typing status updated');
            
            if (appState.typingTimeout) {
                clearTimeout(appState.typingTimeout);
            }
            
            appState.typingTimeout = setTimeout(() => {
                console.log('⏱️ Clearing typing status');
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
        console.log('Showing full image:', src);
        const imageModal = document.getElementById('imageModal');
        const fullSizeImage = document.getElementById('fullSizeImage');
        if (imageModal && fullSizeImage) {
            fullSizeImage.src = src;
            imageModal.style.display = 'flex';
        }
    }

    // Handle chat scroll with throttling
    function handleChatScroll() {
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(() => {
            // Throttled scroll handling - can be used for loading more messages
        }, 100);
    }

    // Setup event listeners
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
                
                if (window.ChatModule && typeof window.ChatModule.closeMessageActions === 'function') {
                    window.ChatModule.closeMessageActions();
                }
                
                if (window.ChatModule && typeof window.ChatModule.openReplyModal === 'function') {
                    window.ChatModule.openReplyModal(messageId, sender, messageText);
                }
            }
        };
        
        document.addEventListener('click', handleReplyClick);
        document.addEventListener('touchstart', handleReplyClick, { passive: false });
        
        if (elements.chatMessages) {
            elements.chatMessages.addEventListener('scroll', handleChatScroll, { passive: true });
        }
        
        // Send reply button handler
        if (elements.sendReplyBtn) {
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

    // Escape HTML
    function escapeHtml(text) {
        if (text === undefined || text === null) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Create media embed
    function createMediaEmbed(text) {
        if (!text) return null;
        
        const patterns = {
            image: /(https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp|bmp|svg|avif|ico|tiff)(?:\?[^\s]*)?)/gi,
            youtube: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi,
            vimeo: /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/gi,
            dailymotion: /(?:https?:\/\/)?(?:www\.)?(?:dailymotion\.com\/video\/|dai\.ly\/)([a-zA-Z0-9]+)/gi,
            facebook: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:\d+|[^\/]+\/(?:posts|videos|photos|reel)\/\d+|[^\/]+\/videos\/\d+)/gi,
            instagram: /(?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/gi,
            twitter: /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/gi,
            tiktok: /(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.]+\/video\/(\d+)/gi,
            pinterest: /(?:https?:\/\/)?(?:www\.)?(?:pinterest\.com\/pin\/|pin\.it\/)([a-zA-Z0-9_-]+)/gi,
            twitch: /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/(?:videos\/)?(\d+|[a-zA-Z0-9_]+)/gi,
            video: /(https?:\/\/[^\s]+?\.(?:mp4|webm|ogg|mov|avi|mkv|m4v|3gp|flv|wmv)(?:\?[^\s]*)?)/gi,
            audio: /(https?:\/\/[^\s]+?\.(?:mp3|wav|ogg|m4a|aac|flac|wma|opus)(?:\?[^\s]*)?)/gi,
            pdf: /(https?:\/\/[^\s]+?\.(?:pdf)(?:\?[^\s]*)?)/gi,
            url: /(https?:\/\/[^\s]+)/gi
        };
        
        for (let [type, pattern] of Object.entries(patterns)) {
            pattern.lastIndex = 0;
            const match = pattern.exec(text);
            if (match) {
                const url = match[0];
                const id = match[1] || '';
                
                switch(type) {
                    case 'image': return createImageEmbed(url);
                    case 'youtube': return createYouTubeEmbed(id, url);
                    case 'vimeo': return createVimeoEmbed(id, url);
                    case 'dailymotion': return createDailymotionEmbed(id, url);
                    case 'facebook': return createFacebookEmbed(url);
                    case 'instagram': return createInstagramEmbed(id, url);
                    case 'twitter': return createTwitterEmbed(id, url);
                    case 'tiktok': return createTikTokEmbed(id, url);
                    case 'pinterest': return createPinterestEmbed(id, url);
                    case 'twitch': return createTwitchEmbed(id, url);
                    case 'video': return createVideoEmbed(url);
                    case 'audio': return createAudioEmbed(url);
                    case 'pdf': return createPDFEmbed(url);
                    default: return createLinkEmbed(url);
                }
            }
        }
        return null;
    }

    // Embed creation helpers
    function createImageEmbed(url) {
        return {
            type: 'image',
            url: url,
            embedHtml: `<div class="media-embed image-embed">
                <img src="${url}" class="embedded-image" onclick="window.showFullImage('${url}')" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'embed-error\'><i class=\'fas fa-exclamation-triangle\'></i> Failed to load image. <a href=\'${url}\' target=\'_blank\'>Click here</a> to view.</div>';">
                <div class="media-source"><i class="fas fa-image"></i> <a href="${url}" target="_blank" rel="noopener noreferrer">View Image</a></div>
            </div>`
        };
    }

    function createYouTubeEmbed(videoId, url) {
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

    function createVimeoEmbed(videoId, url) {
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

    function createFacebookEmbed(url) {
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

    function createInstagramEmbed(postId, url) {
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

    function createTwitterEmbed(tweetId, url) {
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

    function createTikTokEmbed(videoId, url) {
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

    function createAudioEmbed(url) {
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

// Global functions for loading social media embeds
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
// Add this after the other global exposures
window.handleTyping = function() {
    if (ChatModule && typeof ChatModule.handleTyping === 'function') {
        ChatModule.handleTyping();
    }
};

// YouTube click handler
document.addEventListener('click', function(e) {
    const placeholder = e.target.closest('.youtube-placeholder');
    if (placeholder) {
        e.preventDefault();
        e.stopPropagation();
        
        const videoId = placeholder.dataset.videoId;
        const url = placeholder.dataset.url;
        
        if (videoId) {
            window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
            
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
            
            setTimeout(() => {
                if (placeholder && placeholder.querySelector('.youtube-message')) {
                    placeholder.innerHTML = originalContent;
                }
            }, 3000);
        }
    }
});

console.log('Chat.js loaded and functions exposed globally');
