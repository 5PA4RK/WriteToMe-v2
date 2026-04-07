// chat.js - Simplified
const ChatModule = (function() {
    let appState = null;
    let supabase = null;
    let elements = {};
    const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];
    let activeMessageId = null;

    function init(state, supabaseClient, domElements) {
        appState = state;
        supabase = supabaseClient;
        elements = domElements;
        setupEventListeners();
        console.log("ChatModule initialized");
    }

    function displayMessage(message) {
        if (!elements.chatMessages) return;
        if (appState?.isViewingHistory && !message.is_historical) return;
        
        const existing = document.getElementById(`msg-${message.id}`);
        if (existing && !message.is_optimistic) return;
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${message.type}`;
        if (message.is_historical) msgDiv.classList.add('historical');
        if (message.is_optimistic) msgDiv.style.opacity = '0.7';
        msgDiv.id = `msg-${message.id}`;
        
        let content = '';
        
        if (message.reply_to) {
            content += `<div class="message-reply-ref"><i class="fas fa-reply"></i> Replying to message</div>`;
        }
        
        if (message.text && message.text.trim()) {
            content += `<div class="message-text">${escapeHtml(message.text)}</div>`;
        }
        
        if (message.image && message.image.trim()) {
            content += `<img src="${message.image}" class="message-image" onclick="window.showFullImage('${message.image}')" loading="lazy">`;
        }
        
        const actionsBtn = message.is_optimistic ? '' : `<button class="message-action-dots" onclick="window.toggleMessageActions('${message.id}', this)"><i class="fas fa-ellipsis-v"></i></button>`;
        
        msgDiv.innerHTML = `
            <div class="message-sender">${escapeHtml(message.sender)}</div>
            <div class="message-content">
                ${content}
                <div class="message-reactions"></div>
                <div class="message-footer">
                    <div class="message-time">${message.time || new Date().toLocaleTimeString()}</div>
                    ${actionsBtn}
                </div>
            </div>
            <div class="message-actions-menu" id="actions-${message.id}" style="display:none;">
                ${message.type === 'sent' ? `<button onclick="window.editMessage('${message.id}')"><i class="fas fa-edit"></i> Edit</button>
                <button onclick="window.deleteMessage('${message.id}')"><i class="fas fa-trash"></i> Delete</button>
                <div class="menu-divider"></div>` : ''}
                <button class="reply-btn" data-message-id="${message.id}" data-sender="${escapeHtml(message.sender)}" data-message-text="${escapeHtml(message.text)}">
                    <i class="fas fa-reply"></i> Reply
                </button>
                <div class="menu-divider"></div>
                <div class="reaction-section">
                    <div class="reaction-section-title"><i class="fas fa-smile"></i> React</div>
                    <div class="reaction-quick-picker">
                        ${reactionEmojis.map(e => `<button class="reaction-emoji-btn" onclick="window.addReaction('${message.id}', '${e}')">${e}</button>`).join('')}
                    </div>
                </div>
            </div>
        `;
        
        elements.chatMessages.appendChild(msgDiv);
        
        if (message.reactions?.length) {
            const container = msgDiv.querySelector('.message-reactions');
            if (container) renderReactions(container, message.reactions);
        }
        
        if (message.is_optimistic) {
            setTimeout(() => { if (msgDiv) msgDiv.style.opacity = '1'; }, 200);
        }
        
        const isNearBottom = elements.chatMessages.scrollHeight - elements.chatMessages.scrollTop - elements.chatMessages.clientHeight < 200;
        if (message.type === 'sent' || isNearBottom) {
            setTimeout(() => elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight, 50);
        }
    }

    function renderReactions(container, reactions) {
        if (!reactions.length) { container.innerHTML = ''; return; }
        const counts = {};
        reactions.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
        const messageId = container.closest('.message')?.id.replace('msg-', '');
        container.innerHTML = Object.entries(counts).map(([e, c]) => 
            `<span class="reaction-badge" onclick="window.toggleReaction('${messageId}', '${e}')">${e} ${c}</span>`
        ).join('');
    }

    function toggleMessageActions(messageId, button) {
        const oldMenu = document.getElementById(`actions-${activeMessageId}`);
        if (oldMenu) oldMenu.style.display = 'none';
        
        const menu = document.getElementById(`actions-${messageId}`);
        if (!menu) return;
        
        if (menu.style.display === 'block') {
            menu.style.display = 'none';
            activeMessageId = null;
            return;
        }
        
        activeMessageId = messageId;
        menu.style.display = 'block';
        
        const rect = button.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.left = Math.min(rect.left, window.innerWidth - 200) + 'px';
        menu.style.zIndex = '10000';
        
        const closeHandler = (e) => {
            if (!menu.contains(e.target) && !button.contains(e.target)) {
                menu.style.display = 'none';
                activeMessageId = null;
                document.removeEventListener('click', closeHandler);
            }
        };
        setTimeout(() => document.addEventListener('click', closeHandler), 10);
    }

    function closeMessageActions() {
        if (activeMessageId) {
            const menu = document.getElementById(`actions-${activeMessageId}`);
            if (menu) menu.style.display = 'none';
            activeMessageId = null;
        }
    }

    async function addReaction(messageId, emoji) {
        closeMessageActions();
        if (!supabase || !appState?.userId) return;
        
        const { data: existing } = await supabase.from('message_reactions').select('*').eq('message_id', messageId).eq('user_id', appState.userId).maybeSingle();
        
        if (existing) {
            if (existing.emoji === emoji) {
                await supabase.from('message_reactions').delete().eq('id', existing.id);
            } else {
                await supabase.from('message_reactions').delete().eq('id', existing.id);
                await supabase.from('message_reactions').insert([{ message_id: messageId, user_id: appState.userId, user_name: appState.userName, emoji, created_at: new Date().toISOString() }]);
            }
        } else {
            await supabase.from('message_reactions').insert([{ message_id: messageId, user_id: appState.userId, user_name: appState.userName, emoji, created_at: new Date().toISOString() }]);
        }
        
        const { data: reactions } = await supabase.from('message_reactions').select('*').eq('message_id', messageId);
        const msgEl = document.getElementById(`msg-${messageId}`);
        if (msgEl) {
            const container = msgEl.querySelector('.message-reactions');
            if (container) renderReactions(container, reactions || []);
        }
    }

    function toggleReaction(messageId, emoji) {
        addReaction(messageId, emoji);
    }

    async function getMessageReactions(messageId) {
        if (!supabase) return [];
        const { data } = await supabase.from('message_reactions').select('*').eq('message_id', messageId);
        return data || [];
    }

    function openReplyModal(messageId, senderName, messageText) {
        closeMessageActions();
        if (!elements.replyModal) return;
        
        appState.replyingTo = messageId;
        
        const msgEl = document.getElementById(`msg-${messageId}`);
        let imageUrl = null;
        if (msgEl) {
            const img = msgEl.querySelector('.message-image');
            if (img) imageUrl = img.src;
        }
        appState.replyingToImage = imageUrl;
        
        if (elements.replyToName) elements.replyToName.textContent = senderName || 'User';
        if (elements.replyToContent) elements.replyToContent.textContent = messageText || '[Message]';
        if (elements.replyInput) elements.replyInput.value = '';
        
        elements.replyModal.style.display = 'flex';
        setTimeout(() => elements.replyInput?.focus(), 100);
    }

    function sendReply() {
        const replyText = elements.replyInput?.value.trim();
        if (!replyText || !appState.replyingTo) return;
        
        if (elements.messageInput) elements.messageInput.value = replyText;
        if (elements.replyModal) elements.replyModal.style.display = 'none';
        
        if (typeof window.sendMessage === 'function') {
            window.sendMessage();
        }
        
        appState.replyingTo = null;
        appState.replyingToImage = null;
        if (elements.replyInput) elements.replyInput.value = '';
    }

    async function editMessage(messageId) {
        closeMessageActions();
        const msgEl = document.getElementById(`msg-${messageId}`);
        const textEl = msgEl?.querySelector('.message-text');
        if (!textEl) return;
        
        const current = textEl.textContent.replace(/\s*\(edited\)\s*$/, '');
        const newText = prompt("Edit message:", current);
        if (!newText || newText.trim() === current) return;
        
        const { error } = await supabase.from('messages').update({ message: newText.trim(), edited_at: new Date().toISOString(), is_edited: true }).eq('id', messageId);
        if (!error) {
            textEl.innerHTML = `${escapeHtml(newText.trim())} <small class="edited-indicator">(edited)</small>`;
        }
    }

    async function deleteMessage(messageId) {
        closeMessageActions();
        if (!confirm("Delete this message?")) return;
        
        await supabase.from('message_reactions').delete().eq('message_id', messageId);
        const { error } = await supabase.from('messages').update({ is_deleted: true, deleted_at: new Date().toISOString(), message: null, image_url: null }).eq('id', messageId);
        
        if (!error) {
            const msgEl = document.getElementById(`msg-${messageId}`);
            if (msgEl) {
                msgEl.innerHTML = `<div class="message-sender">${escapeHtml(appState?.userName || 'User')}</div>
                    <div class="message-content"><div class="message-text"><i>Message deleted</i></div>
                    <div class="message-footer"><div class="message-time">${new Date().toLocaleTimeString()}</div></div></div>`;
            }
        }
    }

    function handleTyping() {
        if (!appState?.currentSessionId || appState?.isViewingHistory || !appState?.isConnected) return;
        if (appState.typingTimeout) clearTimeout(appState.typingTimeout);
        
        supabase.from('chat_sessions').update({ typing_user: appState.userName }).eq('session_id', appState.currentSessionId).then(() => {
            appState.typingTimeout = setTimeout(() => {
                supabase.from('chat_sessions').update({ typing_user: null }).eq('session_id', appState.currentSessionId);
            }, 2000);
        }).catch(() => {});
    }

    function showFullImage(src) {
        const modal = document.getElementById('imageModal');
        const img = document.getElementById('fullSizeImage');
        if (modal && img) {
            img.src = src;
            modal.style.display = 'flex';
        }
    }

    function setupEventListeners() {
        document.addEventListener('click', (e) => {
            const replyBtn = e.target.closest('.reply-btn');
            if (replyBtn) {
                e.preventDefault();
                const id = replyBtn.dataset.messageId;
                const sender = replyBtn.dataset.sender;
                const text = replyBtn.dataset.messageText;
                openReplyModal(id, sender, text);
            }
        });
        
        if (elements.sendReplyBtn) {
            elements.sendReplyBtn.addEventListener('click', () => sendReply());
        }
        
        if (elements.closeReplyModal) {
            elements.closeReplyModal.addEventListener('click', () => {
                if (elements.replyModal) elements.replyModal.style.display = 'none';
                appState.replyingTo = null;
            });
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    return {
        init, displayMessage, renderReactions, toggleMessageActions, closeMessageActions,
        addReaction, toggleReaction, getMessageReactions, openReplyModal, sendReply,
        editMessage, deleteMessage, handleTyping, showFullImage, escapeHtml
    };
})();

window.ChatModule = ChatModule;

// Global shortcuts
window.toggleMessageActions = (id, btn) => ChatModule.toggleMessageActions(id, btn);
window.addReaction = (id, emoji) => ChatModule.addReaction(id, emoji);
window.toggleReaction = (id, emoji) => ChatModule.toggleReaction(id, emoji);
window.openReplyModal = (id, name, text) => ChatModule.openReplyModal(id, name, text);
window.editMessage = (id) => ChatModule.editMessage(id);
window.deleteMessage = (id) => ChatModule.deleteMessage(id);
window.showFullImage = (src) => ChatModule.showFullImage(src);
window.handleTyping = () => ChatModule.handleTyping();
window.closeMessageActions = () => ChatModule.closeMessageActions();
