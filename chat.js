// chat.js - Optimized version

const ChatModule = (function() {
    let appState = null;
    let supabaseClient = null;
    let elements = {};
    const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];
    let scrollTimeout = null;

    const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    };

    const renderReactions = (container, reactions) => {
        if (!container) return;
        if (!reactions?.length) { container.innerHTML = ''; return; }
        const counts = {};
        reactions.forEach(r => counts[r.emoji] = (counts[r.emoji] || 0) + 1);
        const messageId = container.closest('.message')?.id.replace('msg-', '') || '';
        container.innerHTML = Object.entries(counts).map(([emoji, count]) => 
            `<span class="reaction-badge" onclick="window.toggleReaction('${messageId}', '${emoji}')">${emoji} ${count}</span>`
        ).join('');
    };

    const closeMessageActions = () => {
        if (appState?.activeMessageActions) {
            const menu = document.getElementById(`actions-${appState.activeMessageActions}`);
            if (menu) { menu.classList.remove('show'); menu.style.display = 'none'; }
            appState.activeMessageActions = null;
        }
    };

    const getReplyQuoteHtml = (replyToId, currentMessage) => {
        let quotedSender = 'someone', quotedText = 'a message', quotedImage = currentMessage?.reply_to_image;
        let realId = replyToId;
        if (window._messageIdMap?.[replyToId]) realId = window._messageIdMap[replyToId];
        
        const originalEl = document.getElementById(`msg-${realId}`) || document.getElementById(`msg-${replyToId}`);
        if (originalEl) {
            const senderEl = originalEl.querySelector('.message-sender');
            const textEl = originalEl.querySelector('.message-text');
            const imgEl = originalEl.querySelector('.message-image');
            if (senderEl) quotedSender = senderEl.textContent;
            if (imgEl?.src && !quotedImage) quotedImage = imgEl.src;
            if (textEl?.textContent.trim()) {
                quotedText = textEl.textContent.replace(/\s*\(edited\)\s*$/, '').substring(0, 100);
                if (quotedText.length > 100) quotedText += '...';
            } else if (imgEl) quotedText = '[Image]';
        }
        
        if ((!quotedSender || !quotedImage) && appState?.messages) {
            const originalMsg = appState.messages.find(m => m.id === replyToId || m.id === realId);
            if (originalMsg) {
                quotedSender = originalMsg.sender;
                if (originalMsg.image && !quotedImage) quotedImage = originalMsg._realImageUrl || originalMsg.image;
                if (originalMsg.text?.trim()) quotedText = originalMsg.text.substring(0, 100) + (originalMsg.text.length > 100 ? '...' : '');
                else if (originalMsg.image) quotedText = '[Image]';
            }
        }
        
        const hasImage = quotedImage?.trim();
        const imagePreview = hasImage ? `<div class="reply-image-preview"><img src="${quotedImage}" style="max-width:40px;max-height:40px;border-radius:4px;object-fit:cover;" onerror="this.style.display='none'" onclick="event.stopPropagation(); window.showFullImage('${quotedImage}')"><div class="preview-tooltip"><img src="${quotedImage}" alt="Preview"></div></div>` : '';
        const displayText = !quotedText && hasImage ? '' : `${quotedText}${hasImage && quotedText ? ' <i class="fas fa-image"></i>' : ''}`;
        
        return `<div class="message-reply-ref"><i class="fas fa-reply"></i><div class="reply-content"><span>Replying to <strong>${escapeHtml(quotedSender)}</strong>: ${displayText}</span></div>${imagePreview}</div>`;
    };

    const getActionsMenuHtml = (message) => {
        const isOwn = message.sender === (appState?.userName);
        const isMobile = window.innerWidth <= 768;
        return `<div class="message-actions-menu" id="actions-${message.id}" style="display:none;">${isMobile ? '<button class="close-actions-menu" onclick="window.ChatModule.closeMessageActions()" style="position:absolute;top:8px;right:8px;background:transparent;font-size:20px;"><i class="fas fa-times"></i></button>' : ''}${isOwn ? `<button onclick="window.editMessage('${message.id}')"><i class="fas fa-edit"></i> Edit</button><button onclick="window.deleteMessage('${message.id}')"><i class="fas fa-trash"></i> Delete</button><div class="menu-divider"></div>` : ''}<button class="reply-btn" data-message-id="${message.id}" data-sender="${escapeHtml(message.sender)}" data-message-text="${escapeHtml(message.text)}"><i class="fas fa-reply"></i> Reply</button><div class="menu-divider"></div><div class="reaction-section"><div class="reaction-section-title"><i class="fas fa-smile"></i> Add Reaction</div><div class="reaction-quick-picker">${reactionEmojis.map(emoji => `<button class="reaction-emoji-btn" onclick="window.addReaction('${message.id}', '${emoji}')">${emoji}</button>`).join('')}</div></div></div>`;
    };

    const createMediaEmbed = (text) => {
        if (!text) return null;
        const patterns = {
            image: /(https?:\/\/[^\s]+?\.(?:jpg|jpeg|png|gif|webp|bmp|svg|avif|ico|tiff)(?:\?[^\s]*)?)/gi,
            youtube: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/gi,
            vimeo: /(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/|player\.vimeo\.com\/video\/)(\d+)/gi,
            video: /(https?:\/\/[^\s]+?\.(?:mp4|webm|ogg|mov|avi|mkv|m4v|3gp|flv|wmv)(?:\?[^\s]*)?)/gi,
            audio: /(https?:\/\/[^\s]+?\.(?:mp3|wav|ogg|m4a|aac|flac|wma|opus)(?:\?[^\s]*)?)/gi,
            url: /(https?:\/\/[^\s]+)/gi
        };
        
        for (const [type, pattern] of Object.entries(patterns)) {
            pattern.lastIndex = 0;
            const match = pattern.exec(text);
            if (match) {
                const url = match[0], id = match[1] || '';
                if (type === 'image') return { url, embedHtml: `<div class="media-embed image-embed"><img src="${url}" class="embedded-image" onclick="window.showFullImage('${url}')" loading="lazy" onerror="this.onerror=null;this.parentElement.innerHTML='<div class=\'embed-error\'><i class=\'fas fa-exclamation-triangle\'></i> Failed to load image. <a href=\'${url}\' target=\'_blank\'>Click here</a> to view.</div>';"><div class="media-source"><i class="fas fa-image"></i> <a href="${url}" target="_blank">View Image</a></div></div>` };
                if (type === 'youtube') return { url, embedHtml: `<div class="media-embed youtube-embed"><div class="youtube-placeholder" data-video-id="${id}" data-url="${url}" onclick="window.open('https://www.youtube.com/watch?v=${id}','_blank')"><img src="https://img.youtube.com/vi/${id}/maxresdefault.jpg" class="youtube-thumbnail" loading="lazy" onerror="this.src='https://img.youtube.com/vi/${id}/hqdefault.jpg';"><div class="youtube-play-button"><i class="fas fa-play"></i></div><div class="youtube-privacy-notice"><i class="fas fa-external-link-alt"></i> Click to watch on YouTube</div></div><div class="media-source"><i class="fab fa-youtube"></i> <a href="${url}" target="_blank">Watch on YouTube</a></div></div>` };
                if (type === 'vimeo') return { url, embedHtml: `<div class="media-embed vimeo-embed"><div class="vimeo-placeholder" onclick="window.open('${url}','_blank')"><i class="fab fa-vimeo"></i><span>Click to load Vimeo video</span></div><div class="media-source"><i class="fab fa-vimeo"></i> <a href="${url}" target="_blank">Watch on Vimeo</a></div></div>` };
                if (type === 'video') return { url, embedHtml: `<div class="media-embed video-embed"><video controls preload="metadata" playsinline><source src="${url}" type="video/${url.split('.').pop().split('?')[0]}">Your browser does not support video.</video><div class="media-source"><i class="fas fa-video"></i> <a href="${url}" target="_blank">Download Video</a></div></div>` };
                if (type === 'audio') return { url, embedHtml: `<div class="media-embed audio-embed"><audio controls preload="metadata"><source src="${url}" type="audio/${url.split('.').pop().split('?')[0]}">Your browser does not support audio.</audio><div class="media-source"><i class="fas fa-music"></i> <a href="${url}" target="_blank">Download Audio</a></div></div>` };
                return { url, embedHtml: `<div class="media-embed link-embed"><div class="link-placeholder" onclick="window.open('${url}','_blank')"><i class="fas fa-link"></i><span>External Link</span><small>${url.substring(0,50)}${url.length>50?'...':''}</small></div><div class="media-source"><i class="fas fa-external-link-alt"></i> <a href="${url}" target="_blank">Open Link</a></div></div>` };
            }
        }
        return null;
    };

    const displayMessage = (message) => {
        if (!elements.chatMessages) return;
        if (appState?.isViewingHistory && !message.is_historical) return;
        if (message.id && !message.is_optimistic && document.getElementById(`msg-${message.id}`)) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type}${message.is_historical ? ' historical' : ''}${message.is_optimistic ? ' optimistic' : ''}`;
        if (message.is_optimistic) { messageDiv.style.opacity = '0.7'; setTimeout(() => messageDiv.style.opacity = '1', 100); }
        messageDiv.id = `msg-${message.id}`;
        
        let content = '';
        if (message.reply_to) content += getReplyQuoteHtml(message.reply_to, message);
        
        if (message.text?.trim()) {
            const mediaEmbed = createMediaEmbed(message.text);
            const hasArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(message.text);
            const dirAttr = hasArabic ? ' dir="auto"' : '';
            
            if (mediaEmbed) {
                const textWithoutUrl = message.text.replace(mediaEmbed.url, '').trim();
                if (textWithoutUrl) content += `<div class="message-text"${dirAttr}>${escapeHtml(textWithoutUrl).replace(/\n/g, '<br>')}</div>`;
                content += mediaEmbed.embedHtml;
                content += `<div class="media-link-reference"><i class="fas fa-link"></i> <a href="${mediaEmbed.url}" target="_blank">${mediaEmbed.url.substring(0,50)}${mediaEmbed.url.length>50?'...':''}</a></div>`;
            } else {
                content += `<div class="message-text"${dirAttr}>${escapeHtml(message.text).replace(/\n/g, '<br>')}</div>`;
            }
        }
        
        if (message.image?.trim()) content += `<img src="${message.image}" class="message-image" onclick="window.showFullImage('${message.image}')" loading="lazy">`;
        
        const actionBtn = message.is_optimistic ? '' : `<button class="message-action-dots" onclick="window.toggleMessageActions('${message.id}', this)"><i class="fas fa-ellipsis-v"></i></button>`;
        const actionsMenu = message.is_optimistic ? '' : getActionsMenuHtml(message);
        
        messageDiv.innerHTML = `<div class="message-sender">${escapeHtml(message.sender)}</div><div class="message-content">${content}<div class="message-reactions"></div><div class="message-footer"><div class="message-time">${message.time || new Date().toLocaleTimeString()}</div>${actionBtn}</div></div>${actionsMenu}`;
        elements.chatMessages.appendChild(messageDiv);
        
        if (message.reactions?.length) renderReactions(messageDiv.querySelector('.message-reactions'), message.reactions);
        
        if (appState?.messages && !message.is_optimistic) {
            if (!appState.messages.some(m => m.id === message.id)) {
                appState.messages.push(message);
                if (appState.messages.length > 100) appState.messages = appState.messages.slice(-100);
            }
        }
        
        const isNearBottom = elements.chatMessages.scrollHeight - elements.chatMessages.scrollTop - elements.chatMessages.clientHeight < 100;
        const shouldScroll = message.type === 'sent' || (isNearBottom && !appState?.isViewingHistory);
        if (shouldScroll) {
            setTimeout(() => elements.chatMessages.scrollTo({ top: elements.chatMessages.scrollHeight, behavior: 'smooth' }), 50);
            if (message.image) setTimeout(() => elements.chatMessages.scrollTo({ top: elements.chatMessages.scrollHeight, behavior: 'smooth' }), 300);
        }
    };

    const toggleMessageActions = (messageId, button) => {
        closeMessageActions();
        const menu = document.getElementById(`actions-${messageId}`);
        if (!menu) return;
        
        if (menu.classList.contains('show')) {
            menu.classList.remove('show');
            menu.style.display = 'none';
        } else {
            if (menu.parentElement !== document.body) document.body.appendChild(menu);
            menu.classList.add('show');
            menu.style.display = 'block';
            if (appState) appState.activeMessageActions = messageId;
            
            menu.style.visibility = 'hidden';
            menu.style.display = 'block';
            const menuRect = menu.getBoundingClientRect();
            menu.style.display = 'none';
            menu.style.visibility = 'visible';
            
            const rect = button.getBoundingClientRect();
            let top = rect.bottom + 5;
            let left = rect.left;
            if (left + menuRect.width > window.innerWidth) left = window.innerWidth - menuRect.width - 10;
            if (left < 10) left = 10;
            if (top + menuRect.height > window.innerHeight) top = rect.top - menuRect.height - 5;
            if (top < 10) top = 10;
            
            menu.style.cssText = `position:fixed;top:${top}px;left:${left}px;z-index:2147483647;max-width:280px;width:auto;display:block;`;
            
            setTimeout(() => {
                const handler = (e) => {
                    if (!menu.contains(e.target) && !button.contains(e.target)) {
                        closeMessageActions();
                        document.removeEventListener('click', handler);
                        document.removeEventListener('touchstart', handler);
                    }
                };
                document.addEventListener('click', handler);
                document.addEventListener('touchstart', handler);
            }, 10);
        }
    };

    const addReaction = async (messageId, emoji) => {
        closeMessageActions();
        if (!supabaseClient || !appState?.userId || !messageId) return;
        try {
            const { data: reactions } = await supabaseClient.from('message_reactions').select('*').eq('message_id', messageId);
            const userReaction = (reactions || []).find(r => r.user_id === appState.userId);
            
            if (userReaction) {
                if (userReaction.emoji !== emoji) {
                    await supabaseClient.from('message_reactions').delete().eq('id', userReaction.id);
                    await supabaseClient.from('message_reactions').insert([{ message_id: messageId, user_id: appState.userId, user_name: appState.userName, emoji, created_at: new Date().toISOString() }]);
                } else {
                    await supabaseClient.from('message_reactions').delete().eq('id', userReaction.id);
                }
            } else {
                await supabaseClient.from('message_reactions').insert([{ message_id: messageId, user_id: appState.userId, user_name: appState.userName, emoji, created_at: new Date().toISOString() }]);
            }
        } catch (error) { console.error("Error adding reaction:", error); alert("Failed to add reaction"); }
    };

    const openReplyModal = (messageId, senderName, messageText) => {
        if (!elements.replyModal) return;
        if (elements.replyModal.parentElement !== document.body) document.body.appendChild(elements.replyModal);
        closeMessageActions();
        
        const messageElement = document.getElementById(`msg-${messageId}`);
        let imageUrl = null, actualText = messageText;
        if (messageElement) {
            const imgEl = messageElement.querySelector('.message-image');
            if (imgEl?.src) imageUrl = imgEl.src;
            const textEl = messageElement.querySelector('.message-text');
            if (textEl) {
                const raw = textEl.textContent.replace(/\s*\(edited\)\s*$/, '');
                if (raw && raw !== '[Image]') actualText = raw;
                else actualText = '';
            }
        }
        if (!imageUrl && appState?.messages) {
            const originalMsg = appState.messages.find(m => m.id === messageId);
            if (originalMsg) imageUrl = originalMsg._realImageUrl || originalMsg.image;
        }
        
        window.__replyData = { messageId, senderName, messageText: actualText, imageUrl };
        if (appState) { appState.replyingTo = messageId; appState.replyingToImage = imageUrl; }
        
        elements.replyToName.textContent = senderName || 'Unknown';
        let displayText = actualText || '';
        if (imageUrl) displayText = `<div style="margin-top:10px;display:flex;align-items:center;gap:10px;background:rgba(0,0,0,0.05);padding:8px;border-radius:8px;"><img src="${imageUrl}" style="max-width:60px;max-height:60px;border-radius:8px;"><span><i class="fas fa-image"></i> Image attached</span></div>${displayText ? displayText : ''}`;
        if (displayText.length > 150) displayText = displayText.substring(0,150) + '...';
        elements.replyToContent.innerHTML = displayText;
        if (elements.replyInput) elements.replyInput.value = '';
        
        const scrollY = window.scrollY;
        document.body.classList.add('modal-open');
        document.body.style.top = `-${scrollY}px`;
        elements.replyModal.style.cssText = 'display:flex;position:fixed;top:0;left:0;right:0;bottom:0;z-index:999999999;background:rgba(0,0,0,0.95);backdrop-filter:blur(12px);';
        setTimeout(() => elements.replyInput?.focus(), 200);
    };

    const sendReply = async () => {
        const replyText = elements.replyInput?.value.trim();
        if (!replyText) return;
        
        const replyData = window.__replyData || (appState ? { messageId: appState.replyingTo, imageUrl: appState.replyingToImage } : null);
        if (!replyData?.messageId) return;
        
        window.__tempReplyTo = replyData.messageId;
        window.__tempReplyToImage = replyData.imageUrl;
        if (appState) { appState.replyingTo = null; appState.replyingToImage = null; }
        window.__replyData = null;
        
        if (elements.messageInput) elements.messageInput.value = replyText;
        if (elements.replyModal) {
            elements.replyModal.style.display = 'none';
            document.body.classList.remove('modal-open');
            document.body.style.top = '';
        }
        if (elements.sendReplyBtn) elements.sendReplyBtn.disabled = true;
        elements.messageInput?.focus();
        await new Promise(r => setTimeout(r, 100));
        if (typeof window.sendMessage === 'function') await window.sendMessage();
        
        window.__tempReplyTo = null;
        window.__tempReplyToImage = null;
        if (elements.sendReplyBtn) setTimeout(() => { if (elements.sendReplyBtn) elements.sendReplyBtn.disabled = false; }, 500);
        if (elements.messageInput) elements.messageInput.value = '';
        setTimeout(() => elements.chatMessages?.scrollTo({ top: elements.chatMessages.scrollHeight }), 200);
    };

    const editMessage = async (messageId) => {
        closeMessageActions();
        if (!supabaseClient) return;
        const finalId = window._messageIdMap?.[messageId] || messageId;
        const messageElement = document.getElementById(`msg-${messageId}`);
        const textElement = messageElement?.querySelector('.message-text');
        const currentText = textElement ? textElement.textContent.replace(/\s*\(edited\)\s*$/, '') : '';
        const newText = prompt("Edit your message:", currentText);
        if (newText?.trim()) {
            try {
                await supabaseClient.from('messages').update({ message: newText.trim(), edited_at: new Date().toISOString(), is_edited: true }).eq('id', messageId).eq('sender_id', appState?.userId);
                if (textElement) textElement.innerHTML = `${escapeHtml(newText.trim())} <small class="edited-indicator">(edited)</small>`;
                if (appState?.messages) {
                    const msg = appState.messages.find(m => m.id === messageId);
                    if (msg) { msg.text = newText.trim(); msg.is_edited = true; }
                }
            } catch (error) { console.error("Error editing message:", error); alert("Failed to edit message"); }
        }
    };

    const deleteMessage = async (messageId) => {
        closeMessageActions();
        if (!supabaseClient) return;
        if (!confirm("Delete this message?")) return;
        try {
            await supabaseClient.from('message_reactions').delete().eq('message_id', messageId);
            await supabaseClient.from('messages').update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: appState?.userId, message: null, image_url: null }).eq('id', messageId).eq('sender_id', appState?.userId);
            const msgElement = document.getElementById(`msg-${messageId}`);
            if (msgElement) {
                msgElement.innerHTML = `<div class="message-sender">${escapeHtml(appState?.userName || 'User')}</div><div class="message-content"><div class="message-text"><i>Message deleted</i></div><div class="message-footer"><div class="message-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div></div>`;
                document.getElementById(`actions-${messageId}`)?.remove();
            }
            if (appState?.messages) {
                const msg = appState.messages.find(m => m.id === messageId);
                if (msg) { msg.is_deleted = true; msg.text = null; msg.image = null; }
            }
        } catch (error) { console.error("Error deleting message:", error); alert("Failed to delete message"); }
    };

    const getMessageReactions = async (messageId) => {
        if (!supabaseClient) return [];
        try {
            const { data, error } = await supabaseClient.from('message_reactions').select('*').eq('message_id', messageId);
            return error ? [] : (data || []);
        } catch { return []; }
    };

    const setupEventListeners = () => {
        const handleReplyClick = (e) => {
            const btn = e.target.closest('.reply-btn');
            if (btn) {
                e.preventDefault();
                openReplyModal(btn.dataset.messageId, btn.dataset.sender, btn.dataset.messageText);
            }
        };
        document.addEventListener('click', handleReplyClick);
        document.addEventListener('touchstart', handleReplyClick, { passive: false });
        if (elements.chatMessages) elements.chatMessages.addEventListener('scroll', () => { if (scrollTimeout) clearTimeout(scrollTimeout); scrollTimeout = setTimeout(() => {}, 100); }, { passive: true });
        
        if (elements.sendReplyBtn) {
            const newBtn = elements.sendReplyBtn.cloneNode(true);
            elements.sendReplyBtn.parentNode.replaceChild(newBtn, elements.sendReplyBtn);
            elements.sendReplyBtn = newBtn;
            let processing = false;
            const handleSend = (e) => { e.preventDefault(); if (!processing) { processing = true; sendReply().finally(() => setTimeout(() => processing = false, 1000)); } };
            elements.sendReplyBtn.addEventListener('click', handleSend);
            elements.sendReplyBtn.addEventListener('touchstart', handleSend, { passive: false });
        }
        
        if (elements.closeReplyModal) {
            const closeModal = () => { if (elements.replyModal) { elements.replyModal.style.display = 'none'; document.body.classList.remove('modal-open'); document.body.style.top = ''; if (appState) appState.replyingTo = null; } };
            elements.closeReplyModal.addEventListener('click', closeModal);
            elements.closeReplyModal.addEventListener('touchstart', (e) => { e.preventDefault(); closeModal(); }, { passive: false });
        }
        if (elements.replyModal) elements.replyModal.addEventListener('click', (e) => { if (e.target === elements.replyModal) { elements.replyModal.style.display = 'none'; document.body.classList.remove('modal-open'); if (appState) appState.replyingTo = null; } });
    };

    const init = (state, supabase, domElements) => {
        appState = state;
        supabaseClient = supabase;
        elements = domElements;
        setupEventListeners();
    };

    return {
        init, displayMessage, renderReactions, toggleMessageActions, closeMessageActions,
        addReaction, toggleReaction: addReaction, getMessageReactions, openReplyModal,
        sendReply, editMessage, deleteMessage, escapeHtml
    };
})();

window.ChatModule = ChatModule;

// Global exports for onclick handlers
window.toggleMessageActions = (id, btn) => ChatModule.toggleMessageActions(id, btn);
window.addReaction = (id, emoji) => ChatModule.addReaction(id, emoji);
window.toggleReaction = (id, emoji) => ChatModule.addReaction(id, emoji);
window.openReplyModal = (id, sender, text) => ChatModule.openReplyModal(id, sender, text);
window.editMessage = (id) => ChatModule.editMessage(id);
window.deleteMessage = (id) => ChatModule.deleteMessage(id);
window.showFullImage = (src) => { const modal = document.getElementById('imageModal'); const img = document.getElementById('fullSizeImage'); if (modal && img) { img.src = src; modal.style.display = 'flex'; } };
window.ChatModule.closeMessageActions = () => ChatModule.closeMessageActions();
