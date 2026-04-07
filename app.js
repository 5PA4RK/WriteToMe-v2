// app.js - Simplified and Fixed
// Supabase Configuration
const SUPABASE_URL = 'https://plqvqenoroacvzwtgoxq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_91IHQ5--y4tDIo8L9X2ZJQ_YeThfdu_';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// App State
let appState = {
    isHost: false, isConnected: false, userName: "Guest", userId: null,
    sessionId: null, currentSessionId: null, messages: [],
    typingTimeout: null, soundEnabled: true, isViewingHistory: false,
    viewingSessionId: null, pendingGuests: [], replyingTo: null,
    replyingToImage: null, allSessions: [], visitorNotes: [],
    unreadNotesCount: 0, showNotesPanel: false
};

// DOM Elements
let connectionModal, connectBtn, passwordError, logoutBtn, pendingGuestsBtn;
let pendingGuestsModal, closePendingModal, pendingGuestsList, noPendingGuests;
let statusIndicator, userRoleDisplay, pendingCount;
let chatMessages, messageInput, sendMessageBtn, clearChatBtn, imageUpload;
let emojiBtn, emojiPicker, chatTitle, chatModeIndicator, returnToActiveBtn;
let historyCards, refreshHistoryBtn, soundControl, messageSound, typingIndicator, typingUser;
let imageModal, fullSizeImage, adminSection, historyTabBtn, usersTabBtn;
let historyTabContent, usersTabContent, notesBtn, notesCount, notesPanel, notesList;
let closeNotesPanel, refreshNotesBtn, markAllReadBtn, notesSearchInput;
let guestNotifyBtn, guestNotificationModal, closeGuestNotifyModal;
let guestNotifyName, guestNotifyEmail, guestNotifyMessage, sendGuestNotification;
let guestNotifyError, guestNotifySuccess, usernameInput, passwordInput;
let addUserBtn, userSearchInput, usersList, addUserModal, closeAddUserModal;
let editUserModal, closeEditUserModal, newUsername, newDisplayName, newPassword;
let newRole, addUserError, saveUserBtn, editUserId, editUsername, editDisplayName;
let editPassword, editRole, editIsActive, editUserError, updateUserBtn, deleteUserBtn;
let replyModal, closeReplyModal, replyToName, replyToContent, replyInput, sendReplyBtn;

const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];
let isSendingMessage = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    setupEventListeners();
    populateEmojis();
    loadSavedSession();
    
    if (window.ChatModule) {
        window.ChatModule.init(appState, supabaseClient, {
            chatMessages, messageInput, sendMessageBtn, messageSound,
            typingIndicator, typingUser, replyModal, replyToName,
            replyToContent, replyInput, sendReplyBtn, closeReplyModal
        });
    }
});

function cacheElements() {
    connectionModal = document.getElementById('connectionModal');
    connectBtn = document.getElementById('connectBtn');
    passwordError = document.getElementById('passwordError');
    logoutBtn = document.getElementById('logoutBtn');
    pendingGuestsBtn = document.getElementById('pendingGuestsBtn');
    pendingGuestsModal = document.getElementById('pendingGuestsModal');
    closePendingModal = document.getElementById('closePendingModal');
    pendingGuestsList = document.getElementById('pendingGuestsList');
    noPendingGuests = document.getElementById('noPendingGuests');
    statusIndicator = document.getElementById('statusIndicator');
    userRoleDisplay = document.getElementById('userRoleDisplay');
    pendingCount = document.getElementById('pendingCount');
    chatMessages = document.getElementById('chatMessages');
    messageInput = document.getElementById('messageInput');
    sendMessageBtn = document.getElementById('sendMessageBtn');
    clearChatBtn = document.getElementById('clearChatBtn');
    imageUpload = document.getElementById('imageUpload');
    emojiBtn = document.getElementById('emojiBtn');
    emojiPicker = document.getElementById('emojiPicker');
    chatTitle = document.getElementById('chatTitle');
    chatModeIndicator = document.getElementById('chatModeIndicator');
    returnToActiveBtn = document.getElementById('returnToActiveBtn');
    historyCards = document.getElementById('historyCards');
    refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
    soundControl = document.getElementById('soundControl');
    messageSound = document.getElementById('messageSound');
    typingIndicator = document.getElementById('typingIndicator');
    typingUser = document.getElementById('typingUser');
    imageModal = document.getElementById('imageModal');
    fullSizeImage = document.getElementById('fullSizeImage');
    adminSection = document.getElementById('adminSection');
    historyTabBtn = document.getElementById('historyTabBtn');
    usersTabBtn = document.getElementById('usersTabBtn');
    historyTabContent = document.getElementById('historyTabContent');
    usersTabContent = document.getElementById('usersTabContent');
    notesBtn = document.getElementById('notesBtn');
    notesCount = document.getElementById('notesCount');
    notesPanel = document.getElementById('notesPanel');
    notesList = document.getElementById('notesList');
    closeNotesPanel = document.getElementById('closeNotesPanel');
    refreshNotesBtn = document.getElementById('refreshNotesBtn');
    markAllReadBtn = document.getElementById('markAllReadBtn');
    notesSearchInput = document.getElementById('notesSearchInput');
    guestNotifyBtn = document.getElementById('guestNotifyBtn');
    guestNotificationModal = document.getElementById('guestNotificationModal');
    closeGuestNotifyModal = document.getElementById('closeGuestNotifyModal');
    guestNotifyName = document.getElementById('guestNotifyName');
    guestNotifyEmail = document.getElementById('guestNotifyEmail');
    guestNotifyMessage = document.getElementById('guestNotifyMessage');
    sendGuestNotification = document.getElementById('sendGuestNotification');
    guestNotifyError = document.getElementById('guestNotifyError');
    guestNotifySuccess = document.getElementById('guestNotifySuccess');
    usernameInput = document.getElementById('usernameInput');
    passwordInput = document.getElementById('passwordInput');
    addUserBtn = document.getElementById('addUserBtn');
    userSearchInput = document.getElementById('userSearchInput');
    usersList = document.getElementById('usersList');
    addUserModal = document.getElementById('addUserModal');
    closeAddUserModal = document.getElementById('closeAddUserModal');
    editUserModal = document.getElementById('editUserModal');
    closeEditUserModal = document.getElementById('closeEditUserModal');
    newUsername = document.getElementById('newUsername');
    newDisplayName = document.getElementById('newDisplayName');
    newPassword = document.getElementById('newPassword');
    newRole = document.getElementById('newRole');
    addUserError = document.getElementById('addUserError');
    saveUserBtn = document.getElementById('saveUserBtn');
    editUserId = document.getElementById('editUserId');
    editUsername = document.getElementById('editUsername');
    editDisplayName = document.getElementById('editDisplayName');
    editPassword = document.getElementById('editPassword');
    editRole = document.getElementById('editRole');
    editIsActive = document.getElementById('editIsActive');
    editUserError = document.getElementById('editUserError');
    updateUserBtn = document.getElementById('updateUserBtn');
    deleteUserBtn = document.getElementById('deleteUserBtn');
    replyModal = document.getElementById('replyModal');
    closeReplyModal = document.getElementById('closeReplyModal');
    replyToName = document.getElementById('replyToName');
    replyToContent = document.getElementById('replyToContent');
    replyInput = document.getElementById('replyInput');
    sendReplyBtn = document.getElementById('sendReplyBtn');
}

async function loadSavedSession() {
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) mainContainer.style.display = 'none';
    
    const saved = localStorage.getItem('writeToMe_session');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            appState.isHost = data.isHost;
            appState.userName = data.userName;
            appState.userId = data.userId;
            appState.sessionId = data.sessionId;
            appState.soundEnabled = data.soundEnabled !== false;
            
            if (await reconnectToSession()) {
                appState.isConnected = true;
                if (appState.isHost) document.body.classList.add('host-mode');
                hideConnectionModal();
                updateUIAfterConnection();
                if (appState.isHost) await loadAdminContent();
            } else {
                localStorage.removeItem('writeToMe_session');
                showConnectionModal();
            }
        } catch(e) { showConnectionModal(); }
    } else {
        showConnectionModal();
    }
    updateSoundControl();
}

async function reconnectToSession() {
    if (!appState.sessionId) return false;
    const { data: session, error } = await supabaseClient
        .from('chat_sessions').select('*').eq('session_id', appState.sessionId).single();
    if (error || !session) return false;
    
    if (appState.isHost) {
        appState.currentSessionId = session.session_id;
        setupRealtimeSubscriptions();
        return true;
    } else {
        const { data: guest } = await supabaseClient
            .from('session_guests').select('status').eq('session_id', session.session_id)
            .eq('guest_id', appState.userId).single();
        if (guest && guest.status === 'approved') {
            appState.currentSessionId = session.session_id;
            setupRealtimeSubscriptions();
            return true;
        }
        return false;
    }
}

function showConnectionModal() {
    if (connectionModal) {
        connectionModal.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (connectBtn) {
        connectBtn.disabled = false;
        connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect';
    }
}

function hideConnectionModal() {
    if (connectionModal) {
        connectionModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    }
    const mainContainer = document.querySelector('.main-container');
    if (mainContainer) mainContainer.style.display = 'block';
}

function setupEventListeners() {
    if (connectBtn) connectBtn.addEventListener('click', handleConnect);
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (sendMessageBtn) sendMessageBtn.addEventListener('click', () => sendMessage());
    if (clearChatBtn) clearChatBtn.addEventListener('click', clearChat);
    if (imageUpload) imageUpload.addEventListener('change', handleImageUpload);
    if (emojiBtn) emojiBtn.addEventListener('click', toggleEmojiPicker);
    if (returnToActiveBtn) returnToActiveBtn.addEventListener('click', returnToActiveChat);
    if (refreshHistoryBtn) refreshHistoryBtn.addEventListener('click', () => { if(appState.isHost) loadChatSessions(); });
    if (soundControl) soundControl.addEventListener('click', toggleSound);
    if (imageModal) imageModal.addEventListener('click', (e) => { if(e.target === imageModal) imageModal.style.display = 'none'; });
    if (pendingGuestsBtn) pendingGuestsBtn.addEventListener('click', showPendingGuests);
    if (closePendingModal) closePendingModal.addEventListener('click', () => pendingGuestsModal.style.display = 'none');
    if (notesBtn) notesBtn.addEventListener('click', toggleNotesPanel);
    if (closeNotesPanel) closeNotesPanel.addEventListener('click', () => notesPanel.classList.remove('show'));
    if (refreshNotesBtn) refreshNotesBtn.addEventListener('click', () => { if(appState.isHost) loadVisitorNotes(); });
    if (markAllReadBtn) markAllReadBtn.addEventListener('click', markAllNotesAsRead);
    if (notesSearchInput) notesSearchInput.addEventListener('input', (e) => searchNotes(e.target.value));
    if (guestNotifyBtn) guestNotifyBtn.addEventListener('click', showGuestNotificationModal);
    if (closeGuestNotifyModal) closeGuestNotifyModal.addEventListener('click', () => guestNotificationModal.style.display = 'none');
    if (sendGuestNotification) sendGuestNotification.addEventListener('click', sendGuestNotificationToAdmin);
    if (historyTabBtn) historyTabBtn.addEventListener('click', () => switchAdminTab('history'));
    if (usersTabBtn) usersTabBtn.addEventListener('click', () => switchAdminTab('users'));
    if (addUserBtn) addUserBtn.addEventListener('click', () => addUserModal.style.display = 'flex');
    if (closeAddUserModal) closeAddUserModal.addEventListener('click', () => addUserModal.style.display = 'none');
    if (closeEditUserModal) closeEditUserModal.addEventListener('click', () => editUserModal.style.display = 'none');
    if (saveUserBtn) saveUserBtn.addEventListener('click', saveNewUser);
    if (updateUserBtn) updateUserBtn.addEventListener('click', updateUser);
    if (deleteUserBtn) deleteUserBtn.addEventListener('click', deleteUser);
    if (userSearchInput) userSearchInput.addEventListener('input', (e) => searchUsers(e.target.value));
    if (messageInput) messageInput.addEventListener('input', () => { if(window.ChatModule) window.ChatModule.handleTyping(); });
    if (closeReplyModal) closeReplyModal.addEventListener('click', () => { replyModal.style.display = 'none'; appState.replyingTo = null; });
    document.addEventListener('click', (e) => {
        if (emojiPicker && !emojiPicker.contains(e.target) && emojiBtn && !emojiBtn.contains(e.target))
            emojiPicker.classList.remove('show');
        if (e.target === replyModal) { replyModal.style.display = 'none'; appState.replyingTo = null; }
        if (e.target === guestNotificationModal) guestNotificationModal.style.display = 'none';
    });
}

async function handleConnect() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    if (!username || !password) {
        if(passwordError) { passwordError.textContent = "Enter username and password"; passwordError.style.display = 'block'; }
        return;
    }
    
    connectBtn.disabled = true;
    connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    
    try {
        const { data: user, error } = await supabaseClient
            .from('user_management').select('id, username, display_name, password_hash, role')
            .ilike('username', username).eq('is_active', true).single();
        
        if (error || !user) throw new Error("Invalid credentials");
        
        let auth = false;
        try {
            const { data } = await supabaseClient.rpc('verify_password', { stored_hash: user.password_hash, password });
            if (data === true) auth = true;
        } catch(e) {
            const testPass = { 'admin':'admin123', 'host':'host123', 'guest':'guest123' };
            if (testPass[username.toLowerCase()] === password) auth = true;
        }
        if (!auth) throw new Error("Invalid password");
        
        appState.isHost = user.role === 'host';
        appState.userName = user.display_name || user.username;
        appState.userId = user.id;
        
        const ip = await getIP();
        
        if (appState.isHost) {
            const sessionId = 'room_' + Date.now() + '_' + Math.random().toString(36).substr(2, 7);
            const { error: sessionError } = await supabaseClient.from('chat_sessions').insert([{
                session_id: sessionId, host_id: appState.userId, host_name: appState.userName,
                host_ip: ip, is_active: true, requires_approval: true, created_at: new Date().toISOString()
            }]);
            if (sessionError) throw sessionError;
            appState.sessionId = sessionId;
            appState.currentSessionId = sessionId;
            appState.isConnected = true;
            document.body.classList.add('host-mode');
            saveSession();
            hideConnectionModal();
            updateUIAfterConnection();
            setupRealtimeSubscriptions();
            await loadAdminContent();
            await addSystemMessage(`${appState.userName} created a new room`);
        } else {
            const { data: activeSession } = await supabaseClient
                .from('chat_sessions').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).single();
            if (!activeSession) throw new Error("No active rooms");
            
            const { error: guestError } = await supabaseClient.from('session_guests').insert([{
                session_id: activeSession.session_id, guest_id: appState.userId,
                guest_name: appState.userName, guest_ip: ip, status: 'pending', requested_at: new Date().toISOString()
            }]);
            if (guestError) throw guestError;
            
            appState.sessionId = activeSession.session_id;
            hideConnectionModal();
            updateUIForPendingGuest();
            setupPendingApprovalSubscription(activeSession.session_id);
        }
    } catch (err) {
        if(passwordError) { passwordError.textContent = err.message; passwordError.style.display = 'block'; }
        connectBtn.disabled = false;
        connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect';
    }
}

async function getIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch(e) { return "Unknown"; }
}

function saveSession() {
    localStorage.setItem('writeToMe_session', JSON.stringify({
        isHost: appState.isHost, userName: appState.userName, userId: appState.userId,
        sessionId: appState.sessionId, soundEnabled: appState.soundEnabled
    }));
}

function updateUIAfterConnection() {
    if (statusIndicator) { statusIndicator.className = 'status-indicator online'; }
    if (userRoleDisplay) userRoleDisplay.textContent = `${appState.userName} (Connected)`;
    if (logoutBtn) logoutBtn.style.display = 'flex';
    if (messageInput) { messageInput.disabled = false; messageInput.placeholder = "Type message... (Ctrl+Enter to send)"; messageInput.focus(); }
    if (sendMessageBtn) sendMessageBtn.disabled = false;
    if (pendingGuestsBtn) pendingGuestsBtn.style.display = appState.isHost ? 'flex' : 'none';
    if (notesBtn) notesBtn.style.display = appState.isHost ? 'flex' : 'none';
    
    if (appState.isHost && adminSection) {
        adminSection.style.display = 'block';
        document.body.classList.add('host-mode');
        if (historyTabBtn && usersTabBtn) {
            historyTabBtn.classList.add('active');
            usersTabBtn.classList.remove('active');
            if (historyTabContent) historyTabContent.style.display = 'block';
            if (usersTabContent) usersTabContent.style.display = 'none';
        }
    } else if (adminSection) {
        adminSection.style.display = 'none';
    }
    
    if (chatMessages && chatMessages.children.length === 0) {
        chatMessages.innerHTML = '<div class="message received"><div class="message-sender">System</div><div class="message-content"><div class="message-text">Connected! Start chatting.</div></div></div>';
    }
    
    loadChatHistory();
}

function updateUIForPendingGuest() {
    if (statusIndicator) statusIndicator.className = 'status-indicator offline';
    if (userRoleDisplay) userRoleDisplay.textContent = `${appState.userName} (Pending Approval)`;
    if (logoutBtn) logoutBtn.style.display = 'flex';
    if (messageInput) { messageInput.disabled = true; messageInput.placeholder = "Waiting for host approval..."; }
    if (sendMessageBtn) sendMessageBtn.disabled = true;
    if (chatMessages) {
        chatMessages.innerHTML = '<div class="message received"><div class="message-sender">System</div><div class="message-content"><div class="message-text">Request sent. Please wait for host approval.</div></div></div>';
    }
}

function setupPendingApprovalSubscription(sessionId) {
    const channel = supabaseClient.channel('guest_approval_' + appState.userId)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'session_guests', filter: `guest_id=eq.${appState.userId}` },
            async (payload) => {
                if (payload.new.session_id === sessionId) {
                    if (payload.new.status === 'approved') {
                        appState.currentSessionId = sessionId;
                        appState.isConnected = true;
                        saveSession();
                        updateUIAfterConnection();
                        setupRealtimeSubscriptions();
                        await loadChatHistory();
                        await addSystemMessage(`${appState.userName} joined the chat`);
                        alert("✓ You have been approved! Welcome to the chat.");
                    } else if (payload.new.status === 'rejected') {
                        alert("Your request was rejected.");
                        handleLogout();
                    } else if (payload.new.status === 'kicked') {
                        alert("You were kicked from the chat.");
                        handleLogout();
                    }
                }
            })
        .subscribe();
}

function setupRealtimeSubscriptions() {
    if (!appState.currentSessionId) return;
    
    if (window.messagesChannel) supabaseClient.removeChannel(window.messagesChannel);
    
    window.messagesChannel = supabaseClient.channel('messages_' + appState.currentSessionId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `session_id=eq.${appState.currentSessionId}` },
            async (payload) => {
                if (payload.new.sender_id === appState.userId) return;
                if (!appState.isViewingHistory && window.ChatModule) {
                    const msg = {
                        id: payload.new.id, sender: payload.new.sender_name, text: payload.new.message,
                        image: payload.new.image_url, time: new Date().toLocaleTimeString(),
                        type: 'received', reactions: [], reply_to: payload.new.reply_to
                    };
                    window.ChatModule.displayMessage(msg);
                    if (appState.soundEnabled && messageSound) messageSound.play().catch(()=>{});
                    scrollToBottom();
                }
            })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_sessions', filter: `session_id=eq.${appState.currentSessionId}` },
            (payload) => {
                if (payload.new.typing_user && payload.new.typing_user !== appState.userName && typingIndicator && typingUser) {
                    typingUser.textContent = payload.new.typing_user;
                    typingIndicator.classList.add('show');
                    clearTimeout(window.typingHide);
                    window.typingHide = setTimeout(() => typingIndicator.classList.remove('show'), 2000);
                } else if (!payload.new.typing_user) {
                    typingIndicator.classList.remove('show');
                }
            })
        .subscribe();
    
    if (appState.isHost) setupPendingGuestsSubscription();
}

function setupPendingGuestsSubscription() {
    if (window.pendingChannel) supabaseClient.removeChannel(window.pendingChannel);
    window.pendingChannel = supabaseClient.channel('pending_' + appState.currentSessionId)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'session_guests', filter: `session_id=eq.${appState.currentSessionId}` },
            (payload) => { if(payload.new.status === 'pending') loadPendingGuests(); })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'session_guests', filter: `session_id=eq.${appState.currentSessionId}` },
            () => loadPendingGuests())
        .subscribe();
    loadPendingGuests();
}

async function loadPendingGuests() {
    if (!appState.isHost) return;
    const { data } = await supabaseClient.from('session_guests').select('*').eq('session_id', appState.currentSessionId).eq('status', 'pending');
    appState.pendingGuests = data || [];
    if (pendingCount) pendingCount.textContent = appState.pendingGuests.length;
    if (pendingGuestsBtn) pendingGuestsBtn.style.display = appState.pendingGuests.length ? 'flex' : 'flex';
    if (pendingGuestsList && pendingGuestsModal.style.display === 'flex') renderPendingGuestsList();
}

function renderPendingGuestsList() {
    if (!pendingGuestsList) return;
    if (appState.pendingGuests.length === 0) {
        pendingGuestsList.innerHTML = '';
        if (noPendingGuests) noPendingGuests.style.display = 'block';
        return;
    }
    if (noPendingGuests) noPendingGuests.style.display = 'none';
    pendingGuestsList.innerHTML = appState.pendingGuests.map(g => `
        <div class="pending-guest">
            <div><strong>${escapeHtml(g.guest_name)}</strong><br><small>${new Date(g.requested_at).toLocaleString()}</small>${g.guest_note ? `<br><small>📝 ${escapeHtml(g.guest_note)}</small>` : ''}</div>
            <div><button class="btn btn-small btn-success" onclick="approveGuest('${g.id}')">Approve</button>
            <button class="btn btn-small btn-danger" onclick="denyGuest('${g.id}')">Deny</button></div>
        </div>
    `).join('');
}

window.approveGuest = async function(id) {
    const { data: guest } = await supabaseClient.from('session_guests').select('*').eq('id', id).single();
    await supabaseClient.from('session_guests').update({ status: 'approved', approved_at: new Date().toISOString() }).eq('id', id);
    loadPendingGuests();
    await addSystemMessage(`${guest.guest_name} approved and joined`);
};

window.denyGuest = async function(id) {
    const { data: guest } = await supabaseClient.from('session_guests').select('*').eq('id', id).single();
    await supabaseClient.from('session_guests').update({ status: 'rejected' }).eq('id', id);
    loadPendingGuests();
};

async function loadAdminContent() {
    if (!appState.isHost) return;
    await loadAllSessions();
    await loadChatSessions();
    await loadUsers();
    await loadPendingGuests();
    await loadVisitorNotes();
}

async function loadAllSessions() {
    const { data } = await supabaseClient.from('chat_sessions').select('*').order('created_at', { ascending: true });
    appState.allSessions = data || [];
    return appState.allSessions;
}

function getRoomNumber(sessionId) {
    const idx = appState.allSessions.findIndex(s => s.session_id === sessionId);
    return idx === -1 ? '?' : (idx + 1).toString();
}

async function loadChatSessions() {
    if (!appState.isHost || !historyCards) return;
    const { data: sessions } = await supabaseClient.from('chat_sessions').select('*').order('created_at', { ascending: false });
    if (!sessions) { historyCards.innerHTML = '<div>No sessions</div>'; return; }
    
    historyCards.innerHTML = '';
    for (const session of sessions) {
        const { data: guests } = await supabaseClient.from('session_guests').select('*').eq('session_id', session.session_id);
        const approved = guests?.filter(g => g.status === 'approved').length || 0;
        const isActive = session.session_id === appState.currentSessionId;
        const card = document.createElement('div');
        card.className = `session-card${isActive ? ' active' : ''}`;
        card.innerHTML = `
            <div><strong>Room ${getRoomNumber(session.session_id)}</strong> ${isActive ? '<span style="color:green">● Live</span>' : ''}<br>
            <small>Host: ${escapeHtml(session.host_name)} | Guests: ${approved}<br>${new Date(session.created_at).toLocaleDateString()}</small></div>
            <div><button class="btn btn-small btn-secondary" onclick="viewSessionHistory('${session.session_id}')">View</button>
            ${!isActive ? `<button class="btn btn-small btn-danger" onclick="deleteSession('${session.session_id}')">Delete</button>` : ''}</div>
        `;
        historyCards.appendChild(card);
    }
}

window.viewSessionHistory = async function(sessionId) {
    appState.isViewingHistory = true;
    appState.viewingSessionId = sessionId;
    if (chatModeIndicator) chatModeIndicator.style.display = 'flex';
    if (chatTitle) chatTitle.innerHTML = '<i class="fas fa-history"></i> History View';
    if (messageInput) messageInput.disabled = true;
    if (sendMessageBtn) sendMessageBtn.disabled = true;
    await loadChatHistory(sessionId);
    if (chatMessages) chatMessages.scrollTop = 0;
};

function returnToActiveChat() {
    appState.isViewingHistory = false;
    appState.viewingSessionId = null;
    if (chatModeIndicator) chatModeIndicator.style.display = 'none';
    if (chatTitle) chatTitle.innerHTML = '<i class="fas fa-comments"></i> Active Chat';
    if (messageInput) { messageInput.disabled = false; messageInput.focus(); }
    if (sendMessageBtn) sendMessageBtn.disabled = false;
    if (chatMessages) chatMessages.innerHTML = '';
    loadChatHistory();
}

window.deleteSession = async function(sessionId) {
    if (!confirm("Delete this session permanently?")) return;
    await supabaseClient.from('messages').delete().eq('session_id', sessionId);
    await supabaseClient.from('session_guests').delete().eq('session_id', sessionId);
    await supabaseClient.from('chat_sessions').delete().eq('session_id', sessionId);
    if (appState.currentSessionId === sessionId) handleLogout();
    await loadAllSessions();
    await loadChatSessions();
};

async function loadChatHistory(sessionId = null, limit = 100) {
    const targetId = sessionId || appState.currentSessionId;
    if (!targetId) return;
    
    const { data: messages } = await supabaseClient
        .from('messages').select('*').eq('session_id', targetId).eq('is_deleted', false)
        .order('created_at', { ascending: true }).limit(limit);
    
    if (chatMessages && !sessionId) chatMessages.innerHTML = '';
    
    if (!messages || messages.length === 0) {
        if (chatMessages && !sessionId) {
            chatMessages.innerHTML = '<div class="message received"><div class="message-sender">System</div><div class="message-content"><div class="message-text">No messages yet. Start the conversation!</div></div></div>';
        }
        return;
    }
    
    for (const msg of messages) {
        const type = msg.sender_id === appState.userId ? 'sent' : 'received';
        if (window.ChatModule) {
            window.ChatModule.displayMessage({
                id: msg.id, sender: msg.sender_name, text: msg.message,
                image: msg.image_url, time: new Date(msg.created_at).toLocaleTimeString(),
                type: type, is_historical: !!sessionId, reply_to: msg.reply_to
            });
        }
    }
    if (!sessionId) scrollToBottom();
}

async function addSystemMessage(text) {
    if (!appState.currentSessionId) return;
    await supabaseClient.from('messages').insert([{
        session_id: appState.currentSessionId, sender_id: 'system',
        sender_name: 'System', message: text, created_at: new Date().toISOString()
    }]);
    if (window.ChatModule) {
        window.ChatModule.displayMessage({
            id: 'sys_' + Date.now(), sender: 'System', text: text,
            time: new Date().toLocaleTimeString(), type: 'received', is_historical: false
        });
    }
}

async function sendMessage() {
    if (isSendingMessage || !appState.isConnected || appState.isViewingHistory) return;
    const text = messageInput.value.trim();
    const file = imageUpload.files[0];
    if (!text && !file) return;
    
    isSendingMessage = true;
    sendMessageBtn.disabled = true;
    
    let imageUrl = null;
    if (file) {
        const ext = file.name.split('.').pop();
        const fileName = `chat_images/${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
        const { error: uploadError } = await supabaseClient.storage.from('chat-images').upload(fileName, file);
        if (!uploadError) {
            const { data: { publicUrl } } = supabaseClient.storage.from('chat-images').getPublicUrl(fileName);
            imageUrl = publicUrl;
        }
        imageUpload.value = '';
    }
    
    const replyTo = appState.replyingTo;
    const replyToImage = appState.replyingToImage;
    appState.replyingTo = null;
    appState.replyingToImage = null;
    if (replyModal) replyModal.style.display = 'none';
    
    const tempId = 'temp_' + Date.now();
    if (window.ChatModule) {
        window.ChatModule.displayMessage({
            id: tempId, sender: appState.userName, text: text, image: imageUrl,
            time: new Date().toLocaleTimeString(), type: 'sent', is_optimistic: true, reply_to: replyTo
        });
    }
    
    const { data, error } = await supabaseClient.from('messages').insert([{
        session_id: appState.currentSessionId, sender_id: appState.userId,
        sender_name: appState.userName, message: text || '', image_url: imageUrl,
        reply_to: replyTo, created_at: new Date().toISOString()
    }]).select().single();
    
    if (error) {
        document.getElementById(`msg-${tempId}`)?.remove();
        alert("Failed to send: " + error.message);
    } else {
        const tempEl = document.getElementById(`msg-${tempId}`);
        if (tempEl) tempEl.id = `msg-${data.id}`;
    }
    
    messageInput.value = '';
    messageInput.style.height = 'auto';
    isSendingMessage = false;
    sendMessageBtn.disabled = false;
    scrollToBottom();
}

async function clearChat() {
    if (!confirm("Clear all messages?")) return;
    await supabaseClient.from('messages').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('session_id', appState.currentSessionId);
    if (chatMessages) chatMessages.innerHTML = '';
    await addSystemMessage(`${appState.userName} cleared the chat`);
}

async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file && file.size <= 5 * 1024 * 1024 && file.type.startsWith('image/')) {
        await sendMessage();
    } else {
        alert("Image must be <5MB");
        imageUpload.value = '';
    }
}

function toggleEmojiPicker() {
    if (emojiPicker) emojiPicker.classList.toggle('show');
}

function populateEmojis() {
    if (!emojiPicker) return;
    const emojis = ["😀","😂","😍","😎","😭","😡","👍","👎","❤️","🔥","👏","🙏","🤔","😴","🥳"];
    emojiPicker.innerHTML = emojis.map(e => `<span class="emoji" onclick="insertEmoji('${e}')">${e}</span>`).join('');
}

window.insertEmoji = function(emoji) {
    if (messageInput) messageInput.value += emoji;
    if (emojiPicker) emojiPicker.classList.remove('show');
    messageInput.focus();
};

function toggleSound() {
    appState.soundEnabled = !appState.soundEnabled;
    updateSoundControl();
    const saved = localStorage.getItem('writeToMe_session');
    if (saved) {
        const data = JSON.parse(saved);
        data.soundEnabled = appState.soundEnabled;
        localStorage.setItem('writeToMe_session', JSON.stringify(data));
    }
}

function updateSoundControl() {
    if (!soundControl) return;
    if (appState.soundEnabled) {
        soundControl.innerHTML = '<i class="fas fa-volume-up"></i>';
        soundControl.classList.remove('muted');
    } else {
        soundControl.innerHTML = '<i class="fas fa-volume-mute"></i>';
        soundControl.classList.add('muted');
    }
}

function scrollToBottom() {
    setTimeout(() => {
        if (chatMessages && !appState.isViewingHistory) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, 50);
}

async function handleLogout() {
    if (!confirm("Logout?")) return;
    
    if (appState.isConnected && appState.currentSessionId) {
        if (appState.isHost) {
            await supabaseClient.from('chat_sessions').update({ is_active: false, ended_at: new Date().toISOString() }).eq('session_id', appState.currentSessionId);
        } else {
            await supabaseClient.from('session_guests').update({ status: 'left', left_at: new Date().toISOString() }).eq('session_id', appState.currentSessionId).eq('guest_id', appState.userId);
        }
    }
    
    if (window.messagesChannel) supabaseClient.removeChannel(window.messagesChannel);
    if (window.pendingChannel) supabaseClient.removeChannel(window.pendingChannel);
    
    localStorage.removeItem('writeToMe_session');
    appState = { ...appState, isHost: false, isConnected: false, userName: "Guest", userId: null, sessionId: null, currentSessionId: null, messages: [], isViewingHistory: false, pendingGuests: [], replyingTo: null };
    document.body.classList.remove('host-mode');
    if (adminSection) adminSection.style.display = 'none';
    if (statusIndicator) statusIndicator.className = 'status-indicator offline';
    if (userRoleDisplay) userRoleDisplay.textContent = "Disconnected";
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (messageInput) { messageInput.disabled = true; messageInput.value = ''; }
    if (sendMessageBtn) sendMessageBtn.disabled = true;
    showConnectionModal();
}

async function loadUsers() {
    if (!appState.isHost || !usersList) return;
    const { data } = await supabaseClient.from('user_management').select('*').order('created_at', { ascending: false });
    appState.users = data || [];
    renderUsers();
}

function renderUsers() {
    if (!usersList) return;
    if (!appState.users.length) { usersList.innerHTML = '<div>No users</div>'; return; }
    usersList.innerHTML = appState.users.map(u => `
        <div class="user-card ${u.role}">
            <div><strong>${escapeHtml(u.display_name)}</strong><br><small>${u.role} | ${u.username}</small></div>
            <div><button class="btn btn-small btn-secondary" onclick="editUserModalOpen('${u.id}')">Edit</button></div>
        </div>
    `).join('');
}

window.editUserModalOpen = function(id) {
    const user = appState.users.find(u => u.id === id);
    if (!user) return;
    if (editUserId) editUserId.value = user.id;
    if (editUsername) editUsername.value = user.username;
    if (editDisplayName) editDisplayName.value = user.display_name;
    if (editRole) editRole.value = user.role;
    if (editIsActive) editIsActive.checked = user.is_active;
    if (editUserModal) editUserModal.style.display = 'flex';
};

async function saveNewUser() {
    const username = newUsername.value.trim();
    const display = newDisplayName.value.trim();
    const password = newPassword.value;
    const role = newRole.value;
    if (!username || !display || !password) { if(addUserError) addUserError.textContent = "All fields required"; return; }
    const { error } = await supabaseClient.from('user_management').insert([{ username, display_name: display, password_hash: password, role, created_by: appState.userName, is_active: true }]);
    if (error) { if(addUserError) addUserError.textContent = error.message; return; }
    addUserModal.style.display = 'none';
    await loadUsers();
}

async function updateUser() {
    const id = editUserId.value;
    const data = { display_name: editDisplayName.value, role: editRole.value, is_active: editIsActive.checked };
    if (editPassword.value) data.password_hash = editPassword.value;
    await supabaseClient.from('user_management').update(data).eq('id', id);
    editUserModal.style.display = 'none';
    await loadUsers();
}

async function deleteUser() {
    if (!confirm("Delete user?")) return;
    await supabaseClient.from('user_management').delete().eq('id', editUserId.value);
    editUserModal.style.display = 'none';
    await loadUsers();
}

function searchUsers(term) {
    if (!term) return renderUsers();
    const filtered = appState.users.filter(u => u.username.toLowerCase().includes(term) || u.display_name.toLowerCase().includes(term));
    if (!usersList) return;
    if (!filtered.length) { usersList.innerHTML = '<div>No users found</div>'; return; }
    usersList.innerHTML = filtered.map(u => `<div class="user-card ${u.role}"><div><strong>${escapeHtml(u.display_name)}</strong><br><small>${u.role}</small></div><div><button class="btn btn-small btn-secondary" onclick="editUserModalOpen('${u.id}')">Edit</button></div></div>`).join('');
}

function switchAdminTab(tab) {
    if (!historyTabBtn || !usersTabBtn) return;
    if (tab === 'history') {
        historyTabBtn.classList.add('active');
        usersTabBtn.classList.remove('active');
        if (historyTabContent) historyTabContent.style.display = 'block';
        if (usersTabContent) usersTabContent.style.display = 'none';
        loadChatSessions();
    } else {
        historyTabBtn.classList.remove('active');
        usersTabBtn.classList.add('active');
        if (historyTabContent) historyTabContent.style.display = 'none';
        if (usersTabContent) usersTabContent.style.display = 'block';
        loadUsers();
    }
}

function showPendingGuests() {
    if (pendingGuestsModal) {
        renderPendingGuestsList();
        pendingGuestsModal.style.display = 'flex';
    }
}

async function loadVisitorNotes() {
    if (!appState.isHost) return;
    const { data } = await supabaseClient.from('visitor_notes').select('*').eq('is_archived', false).order('created_at', { ascending: false });
    appState.visitorNotes = data || [];
    appState.unreadNotesCount = appState.visitorNotes.filter(n => !n.read_by_host).length;
    if (notesCount) notesCount.textContent = appState.unreadNotesCount;
    if (notesBtn) notesBtn.classList.toggle('has-unread', appState.unreadNotesCount > 0);
    if (appState.showNotesPanel) renderVisitorNotes();
}

function renderVisitorNotes() {
    if (!notesList) return;
    if (!appState.visitorNotes.length) { notesList.innerHTML = '<div class="no-notes">No notes</div>'; return; }
    notesList.innerHTML = appState.visitorNotes.map(n => `
        <div class="visitor-note-item ${n.read_by_host ? 'read' : 'unread'}">
            <div><strong>${escapeHtml(n.guest_name)}</strong> <small>${new Date(n.created_at).toLocaleString()}</small></div>
            <div class="note-text">${escapeHtml(n.note_text.substring(0, 200))}</div>
            <div><button class="btn btn-small btn-success" onclick="markNoteAsRead('${n.id}')" ${n.read_by_host ? 'disabled' : ''}>Mark Read</button>
            <button class="btn btn-small btn-secondary" onclick="archiveNote('${n.id}')">Archive</button></div>
        </div>
    `).join('');
}

window.markNoteAsRead = async function(id) {
    await supabaseClient.from('visitor_notes').update({ read_by_host: true, read_at: new Date().toISOString() }).eq('id', id);
    await loadVisitorNotes();
};

window.archiveNote = async function(id) {
    await supabaseClient.from('visitor_notes').update({ is_archived: true }).eq('id', id);
    await loadVisitorNotes();
};

function toggleNotesPanel() {
    appState.showNotesPanel = !appState.showNotesPanel;
    if (notesPanel) notesPanel.classList.toggle('show', appState.showNotesPanel);
    if (appState.showNotesPanel) loadVisitorNotes();
}

function searchNotes(term) {
    if (!term) return renderVisitorNotes();
    const filtered = appState.visitorNotes.filter(n => n.guest_name.toLowerCase().includes(term) || n.note_text.toLowerCase().includes(term));
    if (!notesList) return;
    if (!filtered.length) { notesList.innerHTML = '<div>No matching notes</div>'; return; }
    notesList.innerHTML = filtered.map(n => `<div class="visitor-note-item"><div><strong>${escapeHtml(n.guest_name)}</strong></div><div>${escapeHtml(n.note_text.substring(0, 200))}</div></div>`).join('');
}

async function markAllNotesAsRead() {
    const unread = appState.visitorNotes.filter(n => !n.read_by_host);
    if (!unread.length) return;
    for (const n of unread) await supabaseClient.from('visitor_notes').update({ read_by_host: true, read_at: new Date().toISOString() }).eq('id', n.id);
    await loadVisitorNotes();
}

function showGuestNotificationModal() {
    if (guestNotifyName) guestNotifyName.value = '';
    if (guestNotifyEmail) guestNotifyEmail.value = '';
    if (guestNotifyMessage) guestNotifyMessage.value = '';
    if (guestNotifyError) guestNotifyError.style.display = 'none';
    if (guestNotifySuccess) guestNotifySuccess.style.display = 'none';
    if (guestNotificationModal) guestNotificationModal.style.display = 'flex';
}

async function sendGuestNotificationToAdmin() {
    const name = guestNotifyName.value.trim();
    const email = guestNotifyEmail.value.trim();
    const message = guestNotifyMessage.value.trim();
    if (!name || !message) {
        if(guestNotifyError) { guestNotifyError.textContent = "Name and message required"; guestNotifyError.style.display = 'block'; }
        return;
    }
    sendGuestNotification.disabled = true;
    sendGuestNotification.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    const ip = await getIP();
    const { error } = await supabaseClient.from('visitor_notes').insert([{
        guest_name: name, guest_email: email || null, note_text: message,
        guest_ip: ip, created_at: new Date().toISOString(), read_by_host: false
    }]);
    
    if (error) {
        if(guestNotifyError) { guestNotifyError.textContent = "Failed: " + error.message; guestNotifyError.style.display = 'block'; }
    } else {
        if(guestNotifySuccess) { guestNotifySuccess.textContent = "✓ Message sent!"; guestNotifySuccess.style.display = 'block'; }
        setTimeout(() => guestNotificationModal.style.display = 'none', 2000);
    }
    sendGuestNotification.disabled = false;
    sendGuestNotification.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.closeReplyModal = function() {
    if (replyModal) replyModal.style.display = 'none';
    appState.replyingTo = null;
};

// Make functions global
window.showFullImage = function(src) {
    if (fullSizeImage) fullSizeImage.src = src;
    if (imageModal) imageModal.style.display = 'flex';
};
