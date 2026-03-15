// ============================================
// SUPABASE CONFIGURATION
// ============================================
const SUPABASE_URL = 'https://plqvqenoroacvzwtgoxq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_91IHQ5--y4tDIo8L9X2ZJQ_YeThfdu_';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// APP STATE
// ============================================
const appState = {
    isHost: false,
    isConnected: false,
    userName: "Guest",
    userId: null,
    sessionId: null,
    currentSessionId: null,
    messages: [],
    typingTimeout: null,
    realtimeSubscription: null,
    typingSubscription: null,
    pendingSubscription: null,
    soundEnabled: true,
    isViewingHistory: false,
    viewingSessionId: null,
    pendingGuests: [],
    emojis: ["😀", "😂", "😍", "😎", "😭", "😡", "👍", "👎", "❤️", "🔥", "👏", "🙏", "🤔", "😴", "🥳"],
    users: [],
    guestNote: "",
    visitorNotes: [],
    unreadNotesCount: 0,
    showNotesPanel: false,
    allSessions: [],
    replyingTo: null,
    activeMessageActions: null
};

// ============================================
// DOM ELEMENTS
// ============================================
const elements = {
    connectionModal: document.getElementById('connectionModal'),
    connectBtn: document.getElementById('connectBtn'),
    passwordError: document.getElementById('passwordError'),
    logoutBtn: document.getElementById('logoutBtn'),
    pendingGuestsBtn: document.getElementById('pendingGuestsBtn'),
    pendingGuestsModal: document.getElementById('pendingGuestsModal'),
    closePendingModal: document.getElementById('closePendingModal'),
    pendingGuestsList: document.getElementById('pendingGuestsList'),
    noPendingGuests: document.getElementById('noPendingGuests'),
    statusIndicator: document.getElementById('statusIndicator'),
    userRoleDisplay: document.getElementById('userRoleDisplay'),
    pendingCount: document.getElementById('pendingCount'),
    chatMessages: document.getElementById('chatMessages'),
    messageInput: document.getElementById('messageInput'),
    sendMessageBtn: document.getElementById('sendMessageBtn'),
    clearChatBtn: document.getElementById('clearChatBtn'),
    imageUpload: document.getElementById('imageUpload'),
    emojiBtn: document.getElementById('emojiBtn'),
    emojiPicker: document.getElementById('emojiPicker'),
    chatTitle: document.getElementById('chatTitle'),
    chatModeIndicator: document.getElementById('chatModeIndicator'),
    returnToActiveBtn: document.getElementById('returnToActiveBtn'),
    historyCards: document.getElementById('historyCards'),
    refreshHistoryBtn: document.getElementById('refreshHistoryBtn'),
    soundControl: document.getElementById('soundControl'),
    messageSound: document.getElementById('messageSound'),
    typingIndicator: document.getElementById('typingIndicator'),
    typingUser: document.getElementById('typingUser'),
    imageModal: document.getElementById('imageModal'),
    fullSizeImage: document.getElementById('fullSizeImage'),
    adminSection: document.getElementById('adminSection'),
    historyTabBtn: document.getElementById('historyTabBtn'),
    usersTabBtn: document.getElementById('usersTabBtn'),
    historyTabContent: document.getElementById('historyTabContent'),
    usersTabContent: document.getElementById('usersTabContent'),
    guestNoteInput: document.getElementById('guestNoteInput'),
    usernameInput: document.getElementById('usernameInput'),
    passwordInput: document.getElementById('passwordInput'),
    notesBtn: document.getElementById('notesBtn'),
    notesCount: document.getElementById('notesCount'),
    notesPanel: document.getElementById('notesPanel'),
    notesList: document.getElementById('notesList'),
    closeNotesPanel: document.getElementById('closeNotesPanel'),
    refreshNotesBtn: document.getElementById('refreshNotesBtn'),
    markAllReadBtn: document.getElementById('markAllReadBtn'),
    notesSearchInput: document.getElementById('notesSearchInput'),
    guestNotifyBtn: document.getElementById('guestNotifyBtn'),
    guestNotificationModal: document.getElementById('guestNotificationModal'),
    closeGuestNotifyModal: document.getElementById('closeGuestNotifyModal'),
    guestNotifyName: document.getElementById('guestNotifyName'),
    guestNotifyEmail: document.getElementById('guestNotifyEmail'),
    guestNotifyMessage: document.getElementById('guestNotifyMessage'),
    sendGuestNotification: document.getElementById('sendGuestNotification'),
    guestNotifyError: document.getElementById('guestNotifyError'),
    guestNotifySuccess: document.getElementById('guestNotifySuccess'),
    replyModal: document.getElementById('replyModal'),
    closeReplyModal: document.getElementById('closeReplyModal'),
    replyToName: document.getElementById('replyToName'),
    replyToContent: document.getElementById('replyToContent'),
    replyInput: document.getElementById('replyInput'),
    sendReplyBtn: document.getElementById('sendReplyBtn'),
    addUserBtn: document.getElementById('addUserBtn'),
    userSearchInput: document.getElementById('userSearchInput'),
    usersList: document.getElementById('usersList'),
    addUserModal: document.getElementById('addUserModal'),
    closeAddUserModal: document.getElementById('closeAddUserModal'),
    editUserModal: document.getElementById('editUserModal'),
    closeEditUserModal: document.getElementById('closeEditUserModal'),
    newUsername: document.getElementById('newUsername'),
    newDisplayName: document.getElementById('newDisplayName'),
    newPassword: document.getElementById('newPassword'),
    newRole: document.getElementById('newRole'),
    addUserError: document.getElementById('addUserError'),
    saveUserBtn: document.getElementById('saveUserBtn'),
    editUserId: document.getElementById('editUserId'),
    editUsername: document.getElementById('editUsername'),
    editDisplayName: document.getElementById('editDisplayName'),
    editPassword: document.getElementById('editPassword'),
    editRole: document.getElementById('editRole'),
    editIsActive: document.getElementById('editIsActive'),
    editUserError: document.getElementById('editUserError'),
    updateUserBtn: document.getElementById('updateUserBtn'),
    deleteUserBtn: document.getElementById('deleteUserBtn')
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', initApp);

// Auto-resize textarea
if (elements.messageInput) {
    elements.messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}

// Initialize ChatModule after DOM is ready
setTimeout(() => {
    if (window.ChatModule) {
        window.ChatModule.init(appState, supabaseClient, {
            chatMessages: elements.chatMessages,
            messageInput: elements.messageInput,
            sendMessageBtn: elements.sendMessageBtn,
            messageSound: elements.messageSound,
            typingIndicator: elements.typingIndicator,
            typingUser: elements.typingUser,
            replyModal: elements.replyModal,
            replyToName: elements.replyToName,
            replyToContent: elements.replyToContent,
            replyInput: elements.replyInput,
            sendReplyBtn: elements.sendReplyBtn,
            closeReplyModal: elements.closeReplyModal
        });
    }
}, 100);

// ============================================
// CORE FUNCTIONS
// ============================================

async function initApp() {
    console.log("🚀 Initializing WriteToMira App...");
    
    hideMainContainer();
    document.body.classList.remove('host-mode');
    
    const savedSession = localStorage.getItem('writeToMe_session');
    
    if (savedSession) {
        await handleSavedSession(savedSession);
    } else {
        showConnectionModal();
    }

    updateSoundControl();
    setupEventListeners();
    setupUserManagementListeners();
    populateEmojis();
    
    if (appState.isHost || savedSession) {
        await loadAllSessions();
        loadChatSessions();
    }
    
    setInterval(checkAndReconnectSubscriptions, 15000);
}

function hideMainContainer() {
    const mainContainer = document.querySelector('.main-container') || document.querySelector('.app-container');
    if (mainContainer) mainContainer.style.display = 'none';
}

async function handleSavedSession(savedSession) {
    try {
        const sessionData = JSON.parse(savedSession);
        Object.assign(appState, {
            isHost: sessionData.isHost,
            userName: sessionData.userName,
            userId: sessionData.userId,
            sessionId: sessionData.sessionId,
            soundEnabled: sessionData.soundEnabled !== false
        });
        
        if (await reconnectToSession()) {
            appState.isConnected = true;
            if (appState.isHost) document.body.classList.add('host-mode');
            hideConnectionModal();
            updateUIAfterConnection();
        } else {
            clearSavedSession();
        }
    } catch (e) {
        console.error("Error parsing saved session:", e);
        clearSavedSession();
    }
}

function clearSavedSession() {
    localStorage.removeItem('writeToMe_session');
    showConnectionModal();
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function showConnectionModal() {
    elements.connectionModal.style.display = 'flex';
    elements.connectionModal.classList.add('show');
    document.body.classList.add('modal-open');
    
    hideMainContainer();
    
    if (elements.usernameInput) elements.usernameInput.value = '';
    if (elements.passwordInput) elements.passwordInput.value = '';
    if (elements.guestNoteInput) elements.guestNoteInput.value = '';
    if (elements.passwordError) elements.passwordError.style.display = 'none';
    
    const passwordHint = document.getElementById('passwordHint');
    if (passwordHint) passwordHint.style.display = 'none';
    
    if (elements.connectBtn) {
        elements.connectBtn.disabled = false;
        elements.connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect';
    }
}

function hideConnectionModal() {
    elements.connectionModal.style.display = 'none';
    elements.connectionModal.classList.remove('show');
    document.body.classList.remove('modal-open');
    
    const mainContainer = document.querySelector('.main-container') || document.querySelector('.app-container');
    if (mainContainer) mainContainer.style.display = 'block';
}

// ============================================
// RECONNECT FUNCTION
// ============================================

async function reconnectToSession() {
    try {
        if (!appState.sessionId) return false;
        
        const { data: session, error } = await supabaseClient
            .from('sessions')
            .select('*')
            .eq('session_id', appState.sessionId)
            .single();
        
        if (error || !session) return false;
        
        if (appState.isHost) {
            if (session.host_id === appState.userId) {
                appState.currentSessionId = session.session_id;
                setupRealtimeSubscriptions();
                setupPendingGuestsSubscription();
                await loadChatHistory();
                await loadPendingGuests();
                return true;
            }
            return false;
        } else {
            const { data: guestStatus } = await supabaseClient
                .from('session_guests')
                .select('status')
                .eq('session_id', session.session_id)
                .eq('guest_id', appState.userId)
                .single();
            
            if (!guestStatus) return false;
            
            if (guestStatus.status === 'approved') {
                appState.currentSessionId = session.session_id;
                setupRealtimeSubscriptions();
                await loadChatHistory();
                return true;
            } else if (guestStatus.status === 'pending') {
                appState.currentSessionId = session.session_id;
                updateUIForPendingGuest();
                setupPendingApprovalSubscription(session.session_id);
                return false;
            }
            return false;
        }
    } catch (error) {
        console.error("Error reconnecting:", error);
        return false;
    }
}

// ============================================
// SESSION MANAGEMENT
// ============================================

async function loadAllSessions() {
    try {
        const { data: sessions, error } = await supabaseClient
            .from('sessions')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        appState.allSessions = sessions || [];
        return appState.allSessions;
    } catch (error) {
        console.error("Error loading all sessions:", error);
        appState.allSessions = [];
        return [];
    }
}

function getStableRoomNumber(sessionId) {
    const index = appState.allSessions.findIndex(s => s.session_id === sessionId);
    return index === -1 ? '?' : (index + 1).toString();
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {
    // Connection modal
    if (elements.usernameInput) {
        elements.usernameInput.addEventListener('input', () => {
            if (elements.passwordError) elements.passwordError.style.display = 'none';
        });
    }
    
    if (elements.passwordInput) {
        elements.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleConnect();
        });
    }
    
    if (elements.connectBtn) {
        elements.connectBtn.addEventListener('click', handleConnect);
    }
    
    // Guest notification
    if (elements.guestNotifyBtn) {
        elements.guestNotifyBtn.addEventListener('click', showGuestNotificationModal);
    }
    
    if (elements.closeGuestNotifyModal) {
        elements.closeGuestNotifyModal.addEventListener('click', () => {
            elements.guestNotificationModal.style.display = 'none';
        });
    }
    
    if (elements.sendGuestNotification) {
        elements.sendGuestNotification.addEventListener('click', sendGuestNotificationToAdmin);
    }
    
    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Pending guests
    if (elements.pendingGuestsBtn) {
        elements.pendingGuestsBtn.addEventListener('click', showPendingGuests);
    }
    
    if (elements.closePendingModal) {
        elements.closePendingModal.addEventListener('click', () => {
            elements.pendingGuestsModal.style.display = 'none';
        });
    }
    
    // Chat functionality
    if (elements.messageInput) {
        elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        elements.messageInput.addEventListener('input', handleTyping);
    }
    
    if (elements.sendMessageBtn) {
        elements.sendMessageBtn.addEventListener('click', sendMessage);
    }
    
    if (elements.clearChatBtn) {
        elements.clearChatBtn.addEventListener('click', clearChat);
    }
    
    // Image upload
    if (elements.imageUpload) {
        elements.imageUpload.addEventListener('change', handleImageUpload);
    }
    
    // Emoji picker
    if (elements.emojiBtn) {
        elements.emojiBtn.addEventListener('click', toggleEmojiPicker);
    }
    
    // Return to active chat
    if (elements.returnToActiveBtn) {
        elements.returnToActiveBtn.addEventListener('click', returnToActiveChat);
    }
    
    // History refresh
    if (elements.refreshHistoryBtn) {
        elements.refreshHistoryBtn.addEventListener('click', async () => {
            await loadAllSessions();
            loadChatSessions();
        });
    }
    
    // Sound control
    if (elements.soundControl) {
        elements.soundControl.addEventListener('click', toggleSound);
    }
    
    // Image modal
    if (elements.imageModal) {
        elements.imageModal.addEventListener('click', (e) => {
            if (e.target === elements.imageModal || e.target.classList.contains('image-modal-overlay')) {
                elements.imageModal.style.display = 'none';
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.imageModal.style.display === 'flex') {
                elements.imageModal.style.display = 'none';
            }
        });
    }
    
    // Click outside handlers
    document.addEventListener('click', (e) => {
        // Close emoji picker
        if (elements.emojiPicker && elements.emojiPicker.classList.contains('show')) {
            if (!elements.emojiPicker.contains(e.target) && elements.emojiBtn && !elements.emojiBtn.contains(e.target)) {
                elements.emojiPicker.classList.remove('show');
            }
        }
        
        // Close message actions
        if (appState.activeMessageActions) {
            const actionsMenu = document.getElementById(`actions-${appState.activeMessageActions}`);
            if (actionsMenu && !actionsMenu.contains(e.target) && !e.target.closest('.message-action-dots')) {
                closeMessageActions();
            }
        }
        
        // Close notes panel
        if (elements.notesPanel && elements.notesPanel.classList.contains('show') && 
            !elements.notesPanel.contains(e.target) && elements.notesBtn && !elements.notesBtn.contains(e.target)) {
            elements.notesPanel.classList.remove('show');
            appState.showNotesPanel = false;
        }
    });
    
    // Tab switching
    if (elements.historyTabBtn) {
        elements.historyTabBtn.addEventListener('click', () => switchAdminTab('history'));
    }
    
    if (elements.usersTabBtn) {
        elements.usersTabBtn.addEventListener('click', () => switchAdminTab('users'));
    }
    
    // Notes panel
    if (elements.notesBtn) {
        elements.notesBtn.addEventListener('click', toggleNotesPanel);
    }
    
    if (elements.closeNotesPanel) {
        elements.closeNotesPanel.addEventListener('click', () => {
            elements.notesPanel.classList.remove('show');
            appState.showNotesPanel = false;
        });
    }
    
    if (elements.refreshNotesBtn) {
        elements.refreshNotesBtn.addEventListener('click', loadVisitorNotes);
    }
    
    if (elements.markAllReadBtn) {
        elements.markAllReadBtn.addEventListener('click', markAllNotesAsRead);
    }
    
    if (elements.notesSearchInput) {
        elements.notesSearchInput.addEventListener('input', function() {
            searchNotes(this.value.toLowerCase());
        });
    }
    
    // Reply modal
    if (elements.closeReplyModal) {
        elements.closeReplyModal.addEventListener('click', () => {
            elements.replyModal.style.display = 'none';
            appState.replyingTo = null;
        });
    }
    
    if (elements.sendReplyBtn) {
        elements.sendReplyBtn.addEventListener('click', sendReply);
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === elements.replyModal) {
            elements.replyModal.style.display = 'none';
            appState.replyingTo = null;
        }
        if (e.target === elements.guestNotificationModal) {
            elements.guestNotificationModal.style.display = 'none';
        }
    });
}

// ============================================
// TAB SWITCHING
// ============================================

function switchAdminTab(tabName) {
    [elements.historyTabBtn, elements.usersTabBtn].forEach(btn => btn?.classList.remove('active'));
    [elements.historyTabContent, elements.usersTabContent].forEach(content => {
        if (content) {
            content.style.display = 'none';
            content.classList.remove('active');
        }
    });
    
    if (tabName === 'history') {
        elements.historyTabBtn?.classList.add('active');
        if (elements.historyTabContent) {
            elements.historyTabContent.style.display = 'block';
            elements.historyTabContent.classList.add('active');
            loadChatSessions();
        }
    } else if (tabName === 'users') {
        elements.usersTabBtn?.classList.add('active');
        if (elements.usersTabContent) {
            elements.usersTabContent.style.display = 'block';
            elements.usersTabContent.classList.add('active');
            loadUsers();
        }
    }
}

// ============================================
// CLEAR CHAT
// ============================================

async function clearChat() {
    if (!appState.isConnected || !appState.currentSessionId) {
        alert("You must be connected to clear chat.");
        return;
    }
    
    if (!confirm("Are you sure you want to clear messages?")) return;
    
    try {
        if (appState.isHost) {
            const { error } = await supabaseClient
                .from('messages')
                .update({ is_deleted: true, deleted_at: new Date().toISOString(), deleted_by: appState.userId })
                .eq('session_id', appState.currentSessionId);
            
            if (error) throw error;
            
            if (elements.chatMessages) elements.chatMessages.innerHTML = '';
            appState.messages = [];
            addSystemMessage(`Chat cleared by host ${appState.userName}`);
        } else {
            document.querySelectorAll('.message').forEach(msg => {
                if (msg.querySelector('.message-sender')?.textContent === appState.userName) {
                    msg.remove();
                }
            });
            addSystemMessage(`You cleared your view of the chat`, true);
        }
    } catch (error) {
        console.error("Error clearing chat:", error);
        alert("Failed to clear chat: " + error.message);
    }
}

// ============================================
// SYSTEM MESSAGE HELPER
// ============================================

function addSystemMessage(text, isLocal = false) {
    if (!elements.chatMessages) return;
    
    const systemMsg = document.createElement('div');
    systemMsg.className = 'message received';
    if (isLocal) systemMsg.classList.add('local-system');
    
    systemMsg.innerHTML = `
        <div class="message-sender">System</div>
        <div class="message-content">
            <div class="message-text">${text}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
    `;
    
    elements.chatMessages.appendChild(systemMsg);
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// ============================================
// AUTHENTICATION & CONNECTION
// ============================================

async function handleConnect() {
    const username = elements.usernameInput.value.trim();
    const password = elements.passwordInput.value;
    const guestNote = elements.guestNoteInput ? elements.guestNoteInput.value.trim() : "";
    
    elements.passwordError.style.display = 'none';
    disableConnectButton();
    
    if (!username || !password) {
        showAuthError("Please enter both username and password.");
        return;
    }
    
    try {
        const { data: userData, error: userError } = await supabaseClient
            .from('user_management')
            .select('id, username, display_name, password_hash, role, is_active')
            .ilike('username', username)
            .eq('is_active', true)
            .single();
        
        if (userError || !userData) {
            showAuthError("Invalid username or password.");
            return;
        }
        
        if (!await authenticateUser(userData, password)) {
            showAuthError("Invalid username or password.");
            return;
        }
        
        Object.assign(appState, {
            isHost: userData.role === 'host',
            userName: userData.display_name || userData.username,
            userId: userData.id,
            guestNote
        });
        
        await updateLastLogin(userData.id);
        
        const userIP = await getRealIP();
        
        if (appState.isHost) {
            await connectAsHost(userIP);
        } else {
            await connectAsGuest(userIP);
        }
    } catch (error) {
        console.error("Error in authentication:", error);
        showAuthError("Authentication error. Please try again.");
    }
}

function disableConnectButton() {
    if (elements.connectBtn) {
        elements.connectBtn.disabled = true;
        elements.connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    }
}

function resetConnectButton() {
    if (elements.connectBtn) {
        elements.connectBtn.disabled = false;
        elements.connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect';
    }
}

function showAuthError(message) {
    if (elements.passwordError) {
        elements.passwordError.style.display = 'block';
        elements.passwordError.textContent = message;
    }
    resetConnectButton();
}

async function authenticateUser(userData, password) {
    try {
        const { data: authResult } = await supabaseClient
            .rpc('verify_password', { stored_hash: userData.password_hash, password });
        
        if (authResult === true) return true;
    } catch (rpcError) {
        // Fallback to test passwords
        const testPasswords = { 'admin': 'admin123', 'host': 'host123', 'guest': 'guest123' };
        if (testPasswords[userData.username.toLowerCase()] === password) return true;
    }
    return false;
}

async function updateLastLogin(userId) {
    try {
        await supabaseClient
            .from('user_management')
            .update({ last_login: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq('id', userId);
    } catch (error) {
        console.log("Could not update last login:", error);
    }
}

async function connectAsHost(userIP) {
    try {
        const sessionId = 'room_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
        
        const { error } = await supabaseClient
            .from('sessions')
            .insert([{
                session_id: sessionId,
                host_id: appState.userId,
                host_name: appState.userName,
                host_ip: userIP,
                is_active: true,
                requires_approval: true,
                created_at: new Date().toISOString(),
                max_guests: 50
            }]);
        
        if (error) throw error;
        
        await loadAllSessions();
        
        Object.assign(appState, {
            sessionId,
            currentSessionId: sessionId,
            isConnected: true
        });
        
        document.body.classList.add('host-mode');
        saveSessionToStorage();
        hideConnectionModal();
        resetConnectButton();
        updateUIAfterConnection();
        
        setupRealtimeSubscriptions();
        setupPendingGuestsSubscription();
        
        await Promise.all([
            loadPendingGuests(),
            loadChatHistory(),
            loadChatSessions()
        ]);
        
        await saveMessageToDB('System', `${appState.userName} has created a new chat room.`);
    } catch (error) {
        console.error("Error in host connection:", error);
        alert("Failed to create session: " + error.message);
        resetConnectButton();
        appState.isConnected = false;
        clearSavedSession();
        document.body.classList.remove('host-mode');
    }
}

async function connectAsGuest(userIP) {
    try {
        const { data: activeSessions, error: sessionError } = await supabaseClient
            .from('sessions')
            .select('session_id, host_name, host_id')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (sessionError || !activeSessions?.length) {
            alert("No active rooms available.");
            resetConnectButton();
            return;
        }
        
        const targetSession = activeSessions[0];
        
        const { data: existingRequest } = await supabaseClient
            .from('session_guests')
            .select('status, id')
            .eq('session_id', targetSession.session_id)
            .eq('guest_id', appState.userId)
            .maybeSingle();
        
        if (existingRequest) {
            if (existingRequest.status === 'pending') {
                appState.sessionId = targetSession.session_id;
                hideConnectionModal();
                resetConnectButton();
                updateUIForPendingGuest();
                setupPendingApprovalSubscription(targetSession.session_id);
                return;
            } else if (existingRequest.status === 'approved') {
                completeGuestConnection(targetSession.session_id);
                return;
            }
        }
        
        await createNewGuestRequest(targetSession, userIP);
    } catch (error) {
        console.error("Error in guest connection:", error);
        alert("An error occurred: " + error.message);
        resetConnectButton();
    }
}

async function createNewGuestRequest(session, userIP) {
    try {
        const { error: insertError } = await supabaseClient
            .from('session_guests')
            .insert([{
                session_id: session.session_id,
                guest_id: appState.userId,
                guest_name: appState.userName,
                guest_ip: userIP,
                guest_note: appState.guestNote || "",
                status: 'pending',
                requested_at: new Date().toISOString()
            }]);
        
        if (insertError) {
            alert("Failed to request access: " + insertError.message);
            resetConnectButton();
            return;
        }
        
        if (appState.guestNote?.trim()) {
            await saveVisitorNote(session.session_id, appState.guestNote, userIP);
        }
        
        await supabaseClient
            .from('messages')
            .insert([{
                session_id: session.session_id,
                sender_id: 'system',
                sender_name: 'System',
                message: `🔔 New guest request from ${appState.userName}${appState.guestNote ? ': ' + appState.guestNote : ''}`,
                created_at: new Date().toISOString()
            }]);
        
        appState.sessionId = session.session_id;
        hideConnectionModal();
        resetConnectButton();
        updateUIForPendingGuest();
        setupPendingApprovalSubscription(session.session_id);
    } catch (error) {
        console.error("Error creating guest request:", error);
        alert("An error occurred: " + error.message);
        resetConnectButton();
    }
}

function completeGuestConnection(sessionId) {
    Object.assign(appState, {
        sessionId,
        currentSessionId: sessionId,
        isConnected: true
    });
    
    saveSessionToStorage();
    hideConnectionModal();
    resetConnectButton();
    updateUIAfterConnection();
    setupRealtimeSubscriptions();
    loadChatHistory();
    loadChatSessions();
    saveMessageToDB('System', `${appState.userName} has joined the chat.`);
}

function saveSessionToStorage() {
    localStorage.setItem('writeToMe_session', JSON.stringify({
        isHost: appState.isHost,
        userName: appState.userName,
        userId: appState.userId,
        sessionId: appState.sessionId,
        soundEnabled: appState.soundEnabled
    }));
}

// ============================================
// PENDING GUESTS SYSTEM
// ============================================

function setupPendingGuestsSubscription() {
    if (!appState.isHost || !appState.currentSessionId) {
        if (elements.pendingGuestsBtn) elements.pendingGuestsBtn.style.display = 'none';
        return;
    }
    
    if (appState.pendingSubscription) {
        supabaseClient.removeChannel(appState.pendingSubscription);
    }
    
    appState.pendingSubscription = supabaseClient
        .channel(`pending-${appState.currentSessionId}-${Date.now()}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'session_guests',
            filter: `session_id=eq.${appState.currentSessionId}`
        }, (payload) => {
            if (payload.new?.status === 'pending') {
                if (!appState.pendingGuests.some(g => g.id === payload.new.id)) {
                    appState.pendingGuests.push(payload.new);
                }
                updatePendingButtonUI();
                showGuestNotification(payload.new);
                
                if (appState.soundEnabled) {
                    elements.messageSound?.play().catch(e => console.log("Sound play failed:", e));
                }
                
                addSystemMessage(`🔔 New guest request from ${payload.new.guest_name}${payload.new.guest_note ? ': ' + payload.new.guest_note : ''}`);
                
                if (elements.pendingGuestsModal.style.display === 'flex') {
                    showPendingGuests();
                }
            }
        })
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'session_guests',
            filter: `session_id=eq.${appState.currentSessionId}`
        }, () => loadPendingGuests())
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') loadPendingGuests();
            if (err) console.error('❌ Subscription error:', err);
        });
}

async function loadPendingGuests() {
    if (!appState.isHost || !appState.currentSessionId) return;
    
    try {
        const { data: guests, error } = await supabaseClient
            .from('session_guests')
            .select('*')
            .eq('session_id', appState.currentSessionId)
            .eq('status', 'pending')
            .order('requested_at', { ascending: false });
        
        if (error) throw error;
        
        appState.pendingGuests = guests || [];
        updatePendingButtonUI();
        
        if (elements.pendingGuestsModal.style.display === 'flex') {
            renderPendingGuestsList();
        }
    } catch (error) {
        console.error("Error loading pending guests:", error);
    }
}

function updatePendingButtonUI() {
    if (!elements.pendingGuestsBtn || !elements.pendingCount) return;
    
    const count = appState.pendingGuests.length;
    elements.pendingCount.textContent = count;
    
    if (count > 0) {
        elements.pendingGuestsBtn.style.display = 'flex';
        elements.pendingGuestsBtn.classList.add('has-pending');
        elements.pendingGuestsBtn.innerHTML = `<i class="fas fa-user-clock"></i> <span id="pendingCount">${count}</span> Pending`;
    } else {
        elements.pendingGuestsBtn.style.display = 'flex';
        elements.pendingGuestsBtn.classList.remove('has-pending');
        elements.pendingGuestsBtn.innerHTML = `<i class="fas fa-user-clock"></i> <span id="pendingCount">0</span> Pending`;
    }
}

function showGuestNotification(guest) {
    document.querySelectorAll('.guest-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'guest-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon"><i class="fas fa-user-plus"></i></div>
            <div class="notification-text">
                <strong>New Guest Request!</strong>
                <span>${guest.guest_name} wants to join</span>
                ${guest.guest_note ? `<small>📝 ${guest.guest_note}</small>` : ''}
            </div>
            <div class="notification-actions">
                <button onclick="viewPendingGuestsNow()" class="btn btn-small btn-success"><i class="fas fa-eye"></i> View</button>
                <button onclick="this.closest('.guest-notification').remove()" class="btn btn-small btn-secondary"><i class="fas fa-times"></i></button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 15000);
}

function showPendingGuests() {
    renderPendingGuestsList();
    elements.pendingGuestsModal.style.display = 'flex';
}

function renderPendingGuestsList() {
    if (!elements.pendingGuestsList) return;
    
    elements.pendingGuestsList.innerHTML = '';
    
    if (appState.pendingGuests.length === 0) {
        if (elements.noPendingGuests) {
            elements.noPendingGuests.style.display = 'block';
            elements.noPendingGuests.innerHTML = '<i class="fas fa-check-circle"></i> No pending guest requests';
        }
        return;
    }
    
    if (elements.noPendingGuests) elements.noPendingGuests.style.display = 'none';
    
    appState.pendingGuests.forEach(guest => {
        const guestDiv = document.createElement('div');
        guestDiv.className = 'pending-guest';
        guestDiv.dataset.guestId = guest.id;
        
        guestDiv.innerHTML = `
            <div class="guest-info">
                <div class="guest-name"><i class="fas fa-user"></i> <strong>${guest.guest_name}</strong></div>
                <div class="guest-details">
                    <small><i class="fas fa-calendar"></i> ${new Date(guest.requested_at).toLocaleString()}</small>
                    <small><i class="fas fa-network-wired"></i> IP: ${guest.guest_ip || 'Unknown'}</small>
                    ${guest.guest_note ? `<div class="guest-note"><i class="fas fa-sticky-note"></i> ${guest.guest_note}</div>` : ''}
                </div>
            </div>
            <div class="guest-actions">
                <button class="btn btn-success btn-small" onclick="approveGuest('${guest.id}')"><i class="fas fa-check"></i> Approve</button>
                <button class="btn btn-danger btn-small" onclick="denyGuest('${guest.id}')"><i class="fas fa-times"></i> Deny</button>
            </div>
        `;
        
        elements.pendingGuestsList.appendChild(guestDiv);
    });
}

async function approveGuest(guestRecordId) {
    try {
        const { data: guest, error: fetchError } = await supabaseClient
            .from('session_guests')
            .select('*')
            .eq('id', guestRecordId)
            .single();
        
        if (fetchError || !guest) throw new Error("Guest not found");
        
        const { error } = await supabaseClient
            .from('session_guests')
            .update({ status: 'approved', approved_at: new Date().toISOString() })
            .eq('id', guestRecordId);
        
        if (error) throw error;
        
        appState.pendingGuests = appState.pendingGuests.filter(g => g.id !== guestRecordId);
        updatePendingButtonUI();
        
        if (elements.pendingGuestsModal.style.display === 'flex') {
            renderPendingGuestsList();
        }
        
        await saveMessageToDB('System', `${guest.guest_name} has been approved and joined the chat.`);
    } catch (error) {
        console.error("Error approving guest:", error);
        alert("Failed to approve guest: " + error.message);
    }
}

async function denyGuest(guestRecordId) {
    try {
        const { data: guest, error: fetchError } = await supabaseClient
            .from('session_guests')
            .select('*')
            .eq('id', guestRecordId)
            .single();
        
        if (fetchError || !guest) throw new Error("Guest not found");
        
        const { error } = await supabaseClient
            .from('session_guests')
            .update({ status: 'rejected', left_at: new Date().toISOString() })
            .eq('id', guestRecordId);
        
        if (error) throw error;
        
        appState.pendingGuests = appState.pendingGuests.filter(g => g.id !== guestRecordId);
        updatePendingButtonUI();
        
        if (elements.pendingGuestsModal.style.display === 'flex') {
            renderPendingGuestsList();
        }
    } catch (error) {
        console.error("Error denying guest:", error);
        alert("Failed to deny guest: " + error.message);
    }
}

window.kickGuest = async function(guestId, guestName) {
    if (!appState.isHost || !appState.currentSessionId) {
        alert("Only hosts can kick guests.");
        return;
    }
    
    if (!confirm(`Are you sure you want to kick ${guestName} from the chat?`)) return;
    
    try {
        const { error } = await supabaseClient
            .from('session_guests')
            .update({ status: 'kicked', left_at: new Date().toISOString() })
            .eq('id', guestId)
            .eq('session_id', appState.currentSessionId);
        
        if (error) throw error;
        
        await saveMessageToDB('System', `${guestName} has been kicked from the chat by host.`);
        await loadPendingGuests();
        await loadChatSessions();
        alert(`${guestName} has been kicked.`);
    } catch (error) {
        console.error("Error kicking guest:", error);
        alert("Failed to kick guest: " + error.message);
    }
};

function setupPendingApprovalSubscription(sessionId) {
    if (appState.pendingSubscription) {
        supabaseClient.removeChannel(appState.pendingSubscription);
    }
    
    appState.pendingSubscription = supabaseClient
        .channel('guest_approval_' + appState.userId)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'session_guests',
            filter: `guest_id=eq.${appState.userId}`
        }, async (payload) => {
            if (payload.new?.session_id !== sessionId) return;
            
            if (payload.new.status === 'approved') {
                appState.currentSessionId = sessionId;
                appState.isConnected = true;
                saveSessionToStorage();
                
                supabaseClient.removeChannel(appState.pendingSubscription);
                appState.pendingSubscription = null;
                
                updateUIAfterConnection();
                setupRealtimeSubscriptions();
                await loadChatHistory();
                await saveMessageToDB('System', `${appState.userName} has joined the chat.`);
                alert("🎉 You have been approved! Welcome to the chat.");
            } else if (payload.new.status === 'rejected') {
                alert("Your access request was rejected by the host.");
                location.reload();
            } else if (payload.new.status === 'kicked') {
                alert("You have been kicked from the chat by the host.");
                handleLogout();
            }
        })
        .subscribe();
}

// ============================================
// GUEST NOTIFICATION TO ADMIN
// ============================================

function showGuestNotificationModal() {
    if (elements.guestNotifyName) elements.guestNotifyName.value = '';
    if (elements.guestNotifyEmail) elements.guestNotifyEmail.value = '';
    if (elements.guestNotifyMessage) elements.guestNotifyMessage.value = '';
    if (elements.guestNotifyError) elements.guestNotifyError.style.display = 'none';
    if (elements.guestNotifySuccess) elements.guestNotifySuccess.style.display = 'none';
    elements.guestNotificationModal.style.display = 'flex';
}

async function sendGuestNotificationToAdmin() {
    const name = elements.guestNotifyName.value.trim();
    const email = elements.guestNotifyEmail.value.trim();
    const message = elements.guestNotifyMessage.value.trim();
    
    if (!name || !message) {
        showGuestNotifyError("Please enter your name and message.");
        return;
    }
    
    if (email && (!email.includes('@') || !email.includes('.'))) {
        showGuestNotifyError("Please enter a valid email address or leave it blank.");
        return;
    }
    
    disableGuestNotifyButton();
    
    try {
        const userIP = await getRealIP();
        const noteText = `📬 GUEST NOTIFICATION\nFrom: ${name}\n${email ? 'Email: ' + email + '\n' : ''}Message: ${message}`;
        
        await supabaseClient
            .from('visitor_notes')
            .insert([{
                guest_name: name,
                guest_email: email || null,
                note_text: noteText,
                guest_ip: userIP,
                created_at: new Date().toISOString(),
                read_by_host: false,
                is_guest_notification: true
            }]);
        
        showGuestNotifySuccess();
    } catch (error) {
        console.error("Error sending notification:", error);
        showGuestNotifyError("Failed to send message. Please try again.");
    } finally {
        enableGuestNotifyButton();
    }
}

function showGuestNotifyError(message) {
    if (elements.guestNotifyError) {
        elements.guestNotifyError.textContent = message;
        elements.guestNotifyError.style.display = 'block';
    }
    if (elements.guestNotifySuccess) elements.guestNotifySuccess.style.display = 'none';
}

function showGuestNotifySuccess() {
    if (elements.guestNotifySuccess) {
        elements.guestNotifySuccess.innerHTML = '<i class="fas fa-check-circle"></i> ✅ Your message has been sent to the administrator!';
        elements.guestNotifySuccess.style.display = 'block';
    }
    
    if (elements.guestNotifyName) elements.guestNotifyName.value = '';
    if (elements.guestNotifyEmail) elements.guestNotifyEmail.value = '';
    if (elements.guestNotifyMessage) elements.guestNotifyMessage.value = '';
    
    setTimeout(() => {
        elements.guestNotificationModal.style.display = 'none';
        if (elements.guestNotifySuccess) elements.guestNotifySuccess.style.display = 'none';
    }, 3000);
}

function disableGuestNotifyButton() {
    if (elements.sendGuestNotification) {
        elements.sendGuestNotification.disabled = true;
        elements.sendGuestNotification.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    }
}

function enableGuestNotifyButton() {
    if (elements.sendGuestNotification) {
        elements.sendGuestNotification.disabled = false;
        elements.sendGuestNotification.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
    }
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

function setupRealtimeSubscriptions() {
    if (!appState.currentSessionId) return;
    
    cleanupSubscriptions();
    
    appState.realtimeSubscription = supabaseClient
        .channel('messages_' + appState.currentSessionId)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `session_id=eq.${appState.currentSessionId}`
        }, handleNewMessage)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
            filter: `session_id=eq.${appState.currentSessionId}`
        }, handleUpdatedMessage)
        .subscribe((status) => {
            console.log('📡 Messages subscription status:', status);
        });
    
    appState.typingSubscription = supabaseClient
        .channel('typing_' + appState.currentSessionId)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'sessions',
            filter: `session_id=eq.${appState.currentSessionId}`
        }, handleTypingUpdate)
        .subscribe();
    
    if (appState.isHost) {
        setupPendingGuestsSubscription();
        loadBackupNotifications();
    }
}

function cleanupSubscriptions() {
    if (appState.realtimeSubscription) {
        supabaseClient.removeChannel(appState.realtimeSubscription);
        appState.realtimeSubscription = null;
    }
    if (appState.typingSubscription) {
        supabaseClient.removeChannel(appState.typingSubscription);
        appState.typingSubscription = null;
    }
}

function handleNewMessage(payload) {
    if (!payload.new || payload.new.session_id !== appState.currentSessionId) return;
    
    // Check for duplicates
    if (document.getElementById(`msg-${payload.new.id}`)) return;
    
    const messageType = payload.new.sender_id === appState.userId ? 'sent' : 'received';
    
    if (!appState.isViewingHistory) {
        getMessageReactions(payload.new.id).then(reactions => {
            window.ChatModule?.displayMessage({
                id: payload.new.id,
                sender: payload.new.sender_name,
                text: payload.new.message,
                image: payload.new.image_url,
                time: new Date(payload.new.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                type: messageType,
                is_historical: false,
                reactions: reactions,
                reply_to: payload.new.reply_to
            });
        });
        
        // Play sound for received messages
        if (appState.soundEnabled && messageType === 'received' && !payload.new.is_notification) {
            elements.messageSound?.play().catch(e => console.log("Audio play failed:", e));
        }
    }
}

function handleUpdatedMessage(payload) {
    const messageElement = document.getElementById(`msg-${payload.new.id}`);
    if (!messageElement) return;
    
    if (payload.new.is_deleted) {
        messageElement.innerHTML = `
            <div class="message-sender">${escapeHtml(payload.new.sender_name)}</div>
            <div class="message-content">
                <div class="message-text"><i>Message deleted</i></div>
                <div class="message-footer">
                    <div class="message-time">${new Date(payload.new.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            </div>
        `;
        document.getElementById(`actions-${payload.new.id}`)?.remove();
    } else {
        const textElement = messageElement.querySelector('.message-text');
        if (textElement && !textElement.innerHTML.includes('Message deleted')) {
            textElement.innerHTML = `${escapeHtml(payload.new.message)} <small class="edited-indicator">(edited)</small>`;
        }
    }
    
    // Update reactions
    getMessageReactions(payload.new.id).then(reactions => {
        const reactionsContainer = messageElement.querySelector('.message-reactions');
        if (reactionsContainer && window.ChatModule) {
            window.ChatModule.renderReactions(reactionsContainer, reactions);
        }
    });
}

function handleTypingUpdate(payload) {
    if (payload.new?.typing_user && payload.new.typing_user !== appState.userName) {
        if (elements.typingUser) elements.typingUser.textContent = payload.new.typing_user;
        if (elements.typingIndicator) elements.typingIndicator.classList.add('show');
        
        setTimeout(() => {
            if (elements.typingUser?.textContent === payload.new.typing_user) {
                elements.typingIndicator?.classList.remove('show');
            }
        }, 3000);
    }
}

function checkAndReconnectSubscriptions() {
    if (!appState.isConnected || !appState.currentSessionId) return;
    
    if (!appState.realtimeSubscription) setupRealtimeSubscriptions();
    if (appState.isHost && !appState.pendingSubscription) setupPendingGuestsSubscription();
}

// ============================================
// CHAT FUNCTIONS
// ============================================

async function handleTyping() {
    if (!appState.currentSessionId || appState.isViewingHistory || !appState.isConnected) return;
    
    try {
        await supabaseClient
            .from('sessions')
            .update({ typing_user: appState.userName, updated_at: new Date().toISOString() })
            .eq('session_id', appState.currentSessionId);
        
        if (appState.typingTimeout) clearTimeout(appState.typingTimeout);
        
        appState.typingTimeout = setTimeout(() => {
            supabaseClient
                .from('sessions')
                .update({ typing_user: null, updated_at: new Date().toISOString() })
                .eq('session_id', appState.currentSessionId)
                .catch(e => console.log("Error clearing typing:", e));
        }, 1000);
    } catch (error) {
        console.log("Typing indicator error:", error);
    }
}

async function sendMessage() {
    if (!appState.isConnected || appState.isViewingHistory) {
        alert("You cannot send messages right now.");
        return;
    }
    
    const messageText = elements.messageInput?.value.trim() || '';
    const imageFile = elements.imageUpload?.files[0];
    
    if (!messageText && !imageFile) return;
    
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            await sendMessageToDB(messageText, e.target.result);
            if (elements.imageUpload) elements.imageUpload.value = '';
        };
        reader.readAsDataURL(imageFile);
    } else {
        await sendMessageToDB(messageText, null);
    }
    
    if (elements.messageInput) {
        elements.messageInput.value = '';
        elements.messageInput.style.height = 'auto';
    }
    appState.replyingTo = null;
}

async function sendMessageToDB(text, imageUrl) {
    try {
        const messageData = {
            session_id: appState.currentSessionId,
            sender_id: appState.userId,
            sender_name: appState.userName,
            message: text || '',
            created_at: new Date().toISOString(),
            reply_to: appState.replyingTo || null
        };
        
        if (imageUrl) messageData.image_url = imageUrl;
        
        const { error } = await supabaseClient
            .from('messages')
            .insert([messageData]);
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error("❌ Error sending message:", error);
        alert("Failed to send message: " + error.message);
        return null;
    }
}

function displayMessage(message) {
    window.ChatModule?.displayMessage(message);
}

// ============================================
// LOAD CHAT HISTORY
// ============================================

async function loadChatHistory(sessionId = null) {
    const targetSessionId = sessionId || appState.currentSessionId;
    if (!targetSessionId) return;
    
    try {
        const { data: messages, error } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('session_id', targetSessionId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (elements.chatMessages) elements.chatMessages.innerHTML = '';
        appState.messages = [];
        
        if (sessionId) {
            await addHistoryHeader(sessionId);
        }
        
        if (!messages?.length) {
            addEmptyStateMessage();
            return;
        }
        
        const reactionPromises = messages.map(msg => 
            window.ChatModule?.getMessageReactions(msg.id) || []
        );
        const allReactions = await Promise.all(reactionPromises);
        
        appState.messages = messages.map((msg, index) => ({
            id: msg.id,
            sender: msg.sender_name,
            text: msg.message,
            image: msg.image_url,
            time: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: msg.sender_id === appState.userId ? 'sent' : 'received',
            is_historical: !!sessionId,
            reactions: allReactions[index] || [],
            reply_to: msg.reply_to
        }));
        
        appState.messages.forEach(msg => {
            window.ChatModule?.displayMessage(msg);
        });
        
        if (elements.chatMessages) {
            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
        }
    } catch (error) {
        console.error("Error loading chat history:", error);
        showChatError(error.message);
    }
}

async function addHistoryHeader(sessionId) {
    const { data: session } = await supabaseClient
        .from('sessions')
        .select('created_at, host_name')
        .eq('session_id', sessionId)
        .single();
    
    if (session && elements.chatMessages) {
        const roomNumber = getStableRoomNumber(sessionId);
        const header = document.createElement('div');
        header.className = 'message received historical';
        header.innerHTML = `
            <div class="message-sender">System</div>
            <div class="message-content">
                <div class="message-text">
                    <i class="fas fa-door-open"></i> Chat History - Room ${roomNumber}
                    <br><small>Host: ${session.host_name} | Date: ${new Date(session.created_at).toLocaleDateString()}</small>
                </div>
            </div>
        `;
        elements.chatMessages.appendChild(header);
    }
}

function addEmptyStateMessage() {
    if (!elements.chatMessages) return;
    const emptyMsg = document.createElement('div');
    emptyMsg.className = 'message received';
    emptyMsg.innerHTML = `
        <div class="message-sender">System</div>
        <div class="message-content">
            <div class="message-text">No messages in this room yet.</div>
        </div>
    `;
    elements.chatMessages.appendChild(emptyMsg);
}

function showChatError(message) {
    if (!elements.chatMessages) return;
    const errorMsg = document.createElement('div');
    errorMsg.className = 'message received';
    errorMsg.innerHTML = `
        <div class="message-sender">System</div>
        <div class="message-content">
            <div class="message-text">Error loading messages: ${message}</div>
        </div>
    `;
    elements.chatMessages.appendChild(errorMsg);
}

// ============================================
// UI FUNCTIONS
// ============================================

function updateUIForPendingGuest() {
    if (elements.statusIndicator) elements.statusIndicator.className = 'status-indicator offline';
    if (elements.userRoleDisplay) elements.userRoleDisplay.textContent = `${appState.userName} (Pending Approval)`;
    if (elements.logoutBtn) elements.logoutBtn.style.display = 'flex';
    if (elements.pendingGuestsBtn) elements.pendingGuestsBtn.style.display = 'none';
    
    if (elements.messageInput) {
        elements.messageInput.disabled = true;
        elements.messageInput.placeholder = "Waiting for host approval...";
    }
    
    if (elements.sendMessageBtn) elements.sendMessageBtn.disabled = true;
    
    if (elements.chatMessages) {
        elements.chatMessages.innerHTML = `
            <div class="message received">
                <div class="message-sender">System</div>
                <div class="message-content">
                    <div class="message-text">Your access request has been sent to the host. Please wait for approval.</div>
                </div>
            </div>
        `;
    }
}

function updateUIAfterConnection() {
    if (!elements.statusIndicator || !elements.userRoleDisplay || !elements.logoutBtn) return;
    
    elements.statusIndicator.className = 'status-indicator online';
    elements.userRoleDisplay.textContent = `${appState.userName} (Connected)`;
    elements.logoutBtn.style.display = 'flex';
    
    if (elements.messageInput) {
        elements.messageInput.disabled = false;
        elements.messageInput.placeholder = "Type your message here... (Press Enter to send, Shift+Enter for new line)";
        elements.messageInput.focus();
    }
    
    if (elements.sendMessageBtn) elements.sendMessageBtn.disabled = false;
    
    // Re-initialize ChatModule
    window.ChatModule?.init(appState, supabaseClient, {
        chatMessages: elements.chatMessages,
        messageInput: elements.messageInput,
        sendMessageBtn: elements.sendMessageBtn,
        messageSound: elements.messageSound,
        typingIndicator: elements.typingIndicator,
        typingUser: elements.typingUser,
        replyModal: elements.replyModal,
        replyToName: elements.replyToName,
        replyToContent: elements.replyToContent,
        replyInput: elements.replyInput,
        sendReplyBtn: elements.sendReplyBtn,
        closeReplyModal: elements.closeReplyModal
    });
    
    setTimeout(() => loadChatHistory(), 500);
    
    if (elements.adminSection) {
        if (appState.isHost) {
            elements.adminSection.style.display = 'block';
            document.body.classList.add('host-mode');
            if (elements.notesBtn) elements.notesBtn.style.display = 'flex';
            
            if (elements.historyTabBtn && elements.usersTabBtn && elements.historyTabContent && elements.usersTabContent) {
                elements.historyTabBtn.classList.add('active');
                elements.usersTabBtn.classList.remove('active');
                elements.historyTabContent.style.display = 'block';
                elements.historyTabContent.classList.add('active');
                elements.usersTabContent.style.display = 'none';
                elements.usersTabContent.classList.remove('active');
            }
            
            loadChatSessions();
            setTimeout(() => {
                loadPendingGuests();
                loadVisitorNotes();
            }, 1000);
        } else {
            elements.adminSection.style.display = 'none';
            document.body.classList.remove('host-mode');
            if (elements.notesBtn) elements.notesBtn.style.display = 'none';
        }
    }
    
    if (elements.pendingGuestsBtn) {
        elements.pendingGuestsBtn.style.display = appState.isHost && appState.currentSessionId ? 'flex' : 'none';
        if (appState.isHost) setupPendingGuestsSubscription();
    }
    
    if (appState.isViewingHistory) returnToActiveChat();
}

// ============================================
// LOGOUT
// ============================================

async function handleLogout() {
    if (!confirm("Are you sure you want to logout?")) return;
    
    if (elements.chatMessages) {
        elements.chatMessages.innerHTML = `
            <div class="message received">
                <div class="message-sender">System</div>
                <div class="message-content">
                    <div class="message-text">Disconnected. Please reconnect to continue.</div>
                </div>
            </div>
        `;
    }
    
    if (elements.statusIndicator) elements.statusIndicator.className = 'status-indicator offline';
    if (elements.userRoleDisplay) elements.userRoleDisplay.textContent = "Disconnected";
    if (elements.logoutBtn) elements.logoutBtn.style.display = 'none';
    if (elements.pendingGuestsBtn) elements.pendingGuestsBtn.style.display = 'none';
    
    if (elements.messageInput) {
        elements.messageInput.disabled = true;
        elements.messageInput.value = '';
        elements.messageInput.placeholder = "Please connect to start chatting";
    }
    
    if (elements.sendMessageBtn) elements.sendMessageBtn.disabled = true;
    if (elements.adminSection) elements.adminSection.style.display = 'none';
    
    document.body.classList.remove('host-mode');
    
    await updateSessionOnLogout();
    cleanupSubscriptions();
    if (appState.pendingSubscription) {
        supabaseClient.removeChannel(appState.pendingSubscription);
        appState.pendingSubscription = null;
    }
    
    clearSavedSession();
    resetAppState();
    showConnectionModal();
}

async function updateSessionOnLogout() {
    if (!appState.isConnected || !appState.currentSessionId) return;
    
    try {
        if (appState.isHost) {
            await supabaseClient
                .from('sessions')
                .update({ is_active: false, ended_at: new Date().toISOString() })
                .eq('session_id', appState.currentSessionId);
        } else {
            await supabaseClient
                .from('session_guests')
                .update({ status: 'left', left_at: new Date().toISOString() })
                .eq('session_id', appState.currentSessionId)
                .eq('guest_id', appState.userId);
        }
    } catch (error) {
        console.error("Error updating session on logout:", error);
    }
}

function resetAppState() {
    Object.assign(appState, {
        isHost: false,
        isConnected: false,
        userName: "Guest",
        userId: null,
        sessionId: null,
        currentSessionId: null,
        messages: [],
        isViewingHistory: false,
        viewingSessionId: null,
        pendingGuests: [],
        guestNote: "",
        replyingTo: null
    });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getRealIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || "Unknown";
    } catch (error) {
        return "Unknown";
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function saveMessageToDB(senderName, messageText) {
    try {
        const { error } = await supabaseClient
            .from('messages')
            .insert([{
                session_id: appState.currentSessionId,
                sender_id: 'system',
                sender_name: senderName,
                message: messageText,
                created_at: new Date().toISOString()
            }]);
        
        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error("Error saving system message:", error);
        return null;
    }
}

async function saveVisitorNote(sessionId, noteText, userIP) {
    try {
        const { error } = await supabaseClient
            .from('visitor_notes')
            .insert([{
                guest_id: appState.userId,
                guest_name: appState.userName,
                session_id: sessionId,
                note_text: noteText,
                guest_ip: userIP,
                created_at: new Date().toISOString(),
                read_by_host: false
            }]);
        
        if (error) throw error;
    } catch (error) {
        console.error("Error saving visitor note:", error);
    }
}

function loadBackupNotifications() {
    try {
        const stored = localStorage.getItem('guest_notifications_backup');
        if (stored && appState.isHost) {
            const backups = JSON.parse(stored);
            if (!appState.visitorNotes) appState.visitorNotes = [];
            
            backups.forEach(backup => {
                if (!appState.visitorNotes.some(n => n.id === backup.id)) {
                    appState.visitorNotes.unshift({
                        id: backup.id,
                        guest_name: backup.guest_name,
                        guest_email: backup.guest_email,
                        note_text: `📬 GUEST NOTIFICATION (Backup)\nFrom: ${backup.guest_name}\n${backup.guest_email ? 'Email: ' + backup.guest_email + '\n' : ''}Message: ${backup.message}`,
                        guest_ip: backup.guest_ip,
                        created_at: backup.created_at,
                        read_by_host: false,
                        is_guest_notification: true
                    });
                }
            });
            
            appState.unreadNotesCount = appState.visitorNotes.filter(n => !n.read_by_host).length;
            updateNotesButtonUI();
        }
    } catch (e) {
        console.log("Error loading backup notifications:", e);
    }
}

// ============================================
// IMAGE HANDLING
// ============================================

async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert("❌ Image size should be less than 5MB.");
        if (elements.imageUpload) elements.imageUpload.value = '';
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        alert("❌ Please select an image file.");
        if (elements.imageUpload) elements.imageUpload.value = '';
        return;
    }
    
    disableSendButton();
    
    const reader = new FileReader();
    
    reader.onload = async (e) => {
        try {
            const result = await sendMessageToDB('', e.target.result);
            if (result?.success) {
                if (elements.imageUpload) elements.imageUpload.value = '';
            }
        } catch (error) {
            console.error("❌ Error sending image:", error);
            alert("Failed to send image: " + error.message);
        } finally {
            enableSendButton();
        }
    };
    
    reader.onerror = () => {
        alert("Error reading image file.");
        if (elements.imageUpload) elements.imageUpload.value = '';
        enableSendButton();
    };
    
    reader.readAsDataURL(file);
}

function disableSendButton() {
    if (elements.sendMessageBtn) {
        elements.sendMessageBtn.disabled = true;
        elements.sendMessageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    }
}

function enableSendButton() {
    if (elements.sendMessageBtn) {
        elements.sendMessageBtn.disabled = false;
        elements.sendMessageBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
    }
}

// ============================================
// EMOJI FUNCTIONS
// ============================================

function toggleEmojiPicker() {
    elements.emojiPicker?.classList.toggle('show');
}

function populateEmojis() {
    if (!elements.emojiPicker) return;
    
    elements.emojiPicker.innerHTML = '';
    appState.emojis.forEach(emoji => {
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'emoji';
        emojiSpan.textContent = emoji;
        emojiSpan.onclick = () => {
            if (elements.messageInput) {
                elements.messageInput.value += emoji;
                elements.emojiPicker.classList.remove('show');
                elements.messageInput.focus();
            }
        };
        elements.emojiPicker.appendChild(emojiSpan);
    });
}

// ============================================
// SOUND FUNCTIONS
// ============================================

function toggleSound() {
    appState.soundEnabled = !appState.soundEnabled;
    updateSoundControl();
    
    const savedSession = localStorage.getItem('writeToMe_session');
    if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        sessionData.soundEnabled = appState.soundEnabled;
        localStorage.setItem('writeToMe_session', JSON.stringify(sessionData));
    }
}

function updateSoundControl() {
    if (!elements.soundControl) return;
    
    if (appState.soundEnabled) {
        elements.soundControl.innerHTML = '<i class="fas fa-volume-up"></i> <span>Sound On</span>';
        elements.soundControl.classList.remove('muted');
    } else {
        elements.soundControl.innerHTML = '<i class="fas fa-volume-mute"></i> <span>Sound Off</span>';
        elements.soundControl.classList.add('muted');
    }
}

// ============================================
// HISTORY & SESSION FUNCTIONS
// ============================================

async function loadChatSessions() {
    if (!appState.isHost) {
        if (elements.historyCards) {
            elements.historyCards.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-lock" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <div>History view requires host privileges</div>
                </div>
            `;
        }
        return;
    }
    
    try {
        const { data: sessions, error } = await supabaseClient
            .from('sessions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!elements.historyCards) return;
        elements.historyCards.innerHTML = '';
        
        for (const session of sessions) {
            const card = await createSessionCard(session);
            elements.historyCards.appendChild(card);
        }
    } catch (error) {
        console.error("Error loading sessions:", error);
        if (elements.historyCards) {
            elements.historyCards.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">Error loading sessions</div>';
        }
    }
}

async function createSessionCard(session) {
    const isActive = session.session_id === appState.currentSessionId && session.is_active;
    const roomNumber = getStableRoomNumber(session.session_id);
    
    const { data: guests } = await supabaseClient
        .from('session_guests')
        .select('*')
        .eq('session_id', session.session_id);
    
    const approvedGuests = guests?.filter(g => g.status === 'approved') || [];
    const startDate = new Date(session.created_at);
    const duration = calculateDuration(startDate, session.ended_at);
    
    const card = document.createElement('div');
    card.className = 'session-card';
    if (isActive) card.classList.add('active');
    
    card.innerHTML = `
        <div class="session-card-header">
            <div class="session-header-left">
                <div class="session-id" title="${session.session_id}">
                    <i class="fas fa-door-open"></i> Room ${roomNumber}
                </div>
                <div class="session-stats">
                    <div class="stat-item guest-count" title="Approved guests">
                        <i class="fas fa-users"></i> <span>${approvedGuests.length} Guests</span>
                    </div>
                    <div class="stat-item duration-badge" title="Session duration">
                        <i class="fas fa-clock"></i> <span>${duration}</span>
                    </div>
                    <div class="stat-item status-badge">
                        <i class="fas fa-${session.is_active ? 'play-circle' : 'stop-circle'}"></i>
                        <span>${session.is_active ? 'Active' : 'Ended'}</span>
                    </div>
                </div>
            </div>
            ${isActive ? '<div class="session-active-badge"><i class="fas fa-circle"></i> Live</div>' : ''}
        </div>
        
        <div class="session-info">
            <div class="session-info-section">
                <div class="session-info-section-title"><i class="fas fa-info-circle"></i> Room Information</div>
                <div class="guest-info-rows">
                    <div class="guest-info-row">
                        <span class="guest-info-label"><i class="fas fa-user-crown"></i> Host:</span>
                        <span class="guest-info-value">${session.host_name}</span>
                    </div>
                    <div class="guest-info-row">
                        <span class="guest-info-label"><i class="fas fa-calendar-alt"></i> Created:</span>
                        <span class="guest-info-value">${startDate.toLocaleString()}</span>
                    </div>
                    <div class="guest-info-row">
                        <span class="guest-info-label"><i class="fas fa-network-wired"></i> Host IP:</span>
                        <span class="guest-info-value">${session.host_ip || 'Unknown'}</span>
                    </div>
                </div>
            </div>
            
            ${guests?.length ? createGuestsSection(guests, isActive) : ''}
        </div>
        
        <div class="session-actions">
            <button class="btn btn-secondary btn-small" onclick="viewSessionHistory('${session.session_id}')" title="View chat history">
                <i class="fas fa-eye"></i> View Chat
            </button>
            <button class="btn btn-info btn-small" onclick="showSessionGuests('${session.session_id}')" title="View all guest details">
                <i class="fas fa-users"></i> Guest Details
            </button>
            ${appState.isHost && !isActive ? `
                <button class="btn btn-danger btn-small" onclick="deleteSession('${session.session_id}')" title="Delete this session">
                    <i class="fas fa-trash"></i> Delete
                </button>
            ` : ''}
        </div>
    `;
    
    return card;
}

function calculateDuration(startDate, endedAt) {
    if (!endedAt) return 'Ongoing';
    
    const endDate = new Date(endedAt);
    const diffMs = endDate - startDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
    if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
    return `${diffMins}m`;
}

function createGuestsSection(guests, isActive) {
    return `
        <div class="session-info-section">
            <div class="session-info-section-title"><i class="fas fa-users"></i> Guests (${guests.length})</div>
            <div class="guest-list-container">
                <div class="guest-list">
                    ${guests.slice(0, 3).map(guest => `
                        <div class="guest-item">
                            <div class="guest-item-info">
                                <div class="guest-name"><i class="fas fa-user"></i> ${guest.guest_name}</div>
                                <div class="guest-meta">
                                    <span title="Status: ${guest.status}">
                                        <i class="fas fa-${guest.status === 'approved' ? 'check-circle' : guest.status === 'pending' ? 'clock' : 'times-circle'}"></i> 
                                        ${guest.status}
                                    </span>
                                    <span title="IP: ${guest.guest_ip || 'Unknown'}">
                                        <i class="fas fa-network-wired"></i> ${guest.guest_ip || 'Unknown'}
                                    </span>
                                </div>
                                ${guest.guest_note ? `<div class="guest-note small"><i class="fas fa-sticky-note"></i> ${guest.guest_note}</div>` : ''}
                            </div>
                            ${isActive && guest.status === 'approved' && guest.guest_id !== appState.userId ? `
                                <button class="btn btn-danger btn-small" onclick="kickGuest('${guest.id}', '${guest.guest_name}')">
                                    <i class="fas fa-user-slash"></i> Kick
                                </button>
                            ` : ''}
                        </div>
                    `).join('')}
                    
                    ${guests.length > 3 ? `
                        <div class="guest-item" style="justify-content: center; background: rgba(138, 43, 226, 0.1);">
                            <div class="guest-name"><i class="fas fa-ellipsis-h"></i> ${guests.length - 3} more guests...</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

async function viewSessionHistory(sessionId) {
    appState.isViewingHistory = true;
    appState.viewingSessionId = sessionId;
    
    if (elements.chatModeIndicator) elements.chatModeIndicator.style.display = 'flex';
    if (elements.chatTitle) elements.chatTitle.innerHTML = `<i class="fas fa-door-open"></i> History View`;
    if (elements.messageInput) {
        elements.messageInput.disabled = true;
        elements.messageInput.placeholder = "Cannot send messages in historical view";
    }
    if (elements.sendMessageBtn) elements.sendMessageBtn.disabled = true;
    
    await loadChatHistory(sessionId);
    if (elements.chatMessages) elements.chatMessages.scrollTop = 0;
}

function returnToActiveChat() {
    appState.isViewingHistory = false;
    appState.viewingSessionId = null;
    
    if (elements.chatModeIndicator) elements.chatModeIndicator.style.display = 'none';
    if (elements.chatTitle) elements.chatTitle.innerHTML = '<i class="fas fa-comments"></i> Active Chat';
    if (elements.messageInput) {
        elements.messageInput.disabled = false;
        elements.messageInput.placeholder = "Type your message here... (Press Enter to send, Shift+Enter for new line)";
        elements.messageInput.focus();
    }
    if (elements.sendMessageBtn) elements.sendMessageBtn.disabled = false;
    
    loadChatHistory();
}

async function deleteSession(sessionId) {
    if (!appState.isHost) {
        alert("Only hosts can delete sessions.");
        return;
    }
    
    if (!confirm("⚠️ WARNING: Are you sure you want to delete this session?\n\nThis will permanently delete all messages, guest data, and visitor notes!\n\nThis action CANNOT be undone!")) {
        return;
    }
    
    try {
        // Disable delete buttons
        document.querySelectorAll(`[onclick*="deleteSession('${sessionId}')"]`).forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
            }
        });

        if (appState.currentSessionId === sessionId) {
            cleanupSubscriptions();
        }

        // Delete in correct order
        await supabaseClient.from('visitor_notes').delete().eq('session_id', sessionId);
        await supabaseClient.from('messages').delete().eq('session_id', sessionId);
        await supabaseClient.from('session_guests').delete().eq('session_id', sessionId);
        await supabaseClient.from('sessions').delete().eq('session_id', sessionId);

        await loadAllSessions();
        
        if (appState.currentSessionId === sessionId) {
            appState.currentSessionId = null;
            appState.isConnected = false;
            if (elements.chatMessages) {
                elements.chatMessages.innerHTML = `
                    <div class="message received">
                        <div class="message-sender">System</div>
                        <div class="message-content">
                            <div class="message-text">Your current room was deleted. Please reconnect.</div>
                        </div>
                    </div>
                `;
            }
        }

        if (appState.viewingSessionId === sessionId) returnToActiveChat();

        await loadChatSessions();
        addSystemMessage("✅ Session deleted successfully", true);
    } catch (error) {
        console.error("❌ Error deleting session:", error);
        alert("Failed to delete session: " + error.message);
        await loadAllSessions();
        await loadChatSessions();
    } finally {
        // Re-enable delete buttons
        document.querySelectorAll(`[onclick*="deleteSession('${sessionId}')"]`).forEach(btn => {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-trash"></i> Delete';
            }
        });
    }
}

// ============================================
// USER MANAGEMENT FUNCTIONS
// ============================================

function setupUserManagementListeners() {
    if (elements.addUserBtn) elements.addUserBtn.addEventListener('click', showAddUserModal);
    if (elements.closeAddUserModal) elements.closeAddUserModal.addEventListener('click', () => elements.addUserModal.style.display = 'none');
    if (elements.closeEditUserModal) elements.closeEditUserModal.addEventListener('click', () => elements.editUserModal.style.display = 'none');
    if (elements.saveUserBtn) elements.saveUserBtn.addEventListener('click', saveNewUser);
    if (elements.updateUserBtn) elements.updateUserBtn.addEventListener('click', updateUser);
    if (elements.deleteUserBtn) elements.deleteUserBtn.addEventListener('click', deleteUser);
    if (elements.userSearchInput) elements.userSearchInput.addEventListener('input', function() {
        searchUsers(this.value.toLowerCase());
    });
}

async function loadUsers() {
    if (!appState.isHost) return;
    
    try {
        const { data: users, error } = await supabaseClient
            .from('user_management')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        appState.users = users || [];
        renderUsers(users);
    } catch (error) {
        console.error("Error loading users:", error);
        if (elements.usersList) {
            elements.usersList.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--danger-red);">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>Error loading users</div>
                </div>
            `;
        }
    }
}

function renderUsers(users) {
    if (!elements.usersList) return;
    
    if (!users?.length) {
        elements.usersList.innerHTML = `
            <div style="padding: 40px; text-align: center; color: var(--text-secondary);">
                <i class="fas fa-users-slash" style="font-size: 48px; margin-bottom: 15px;"></i>
                <h3>No Users Found</h3>
                <p>Click "Add New User" to create your first user.</p>
            </div>
        `;
        return;
    }
    
    elements.usersList.innerHTML = '';
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = `user-card ${user.role} ${user.is_active ? '' : 'inactive'}`;
        
        userCard.innerHTML = `
            <div class="user-header">
                <div class="user-name"><i class="fas fa-user"></i> <h3>${user.display_name}</h3></div>
                <div class="user-badges">
                    <span class="user-badge badge-${user.role}">${user.role}</span>
                    ${!user.is_active ? '<span class="user-badge badge-inactive">Inactive</span>' : ''}
                </div>
            </div>
            <div class="user-details">
                <div class="user-detail"><span class="user-detail-label">Username:</span> <span class="user-detail-value">${user.username}</span></div>
                <div class="user-detail"><span class="user-detail-label">Created:</span> <span class="user-detail-value">${new Date(user.created_at).toLocaleDateString()}</span></div>
                <div class="user-detail"><span class="user-detail-label">Last Login:</span> <span class="user-detail-value">${user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</span></div>
            </div>
            <div class="user-actions">
                <button class="btn btn-secondary btn-small" onclick="editUserModalOpen('${user.id}')"><i class="fas fa-edit"></i> Edit</button>
            </div>
        `;
        
        elements.usersList.appendChild(userCard);
    });
}

function showAddUserModal() {
    if (!appState.isHost) return;
    
    if (elements.newUsername) elements.newUsername.value = '';
    if (elements.newDisplayName) elements.newDisplayName.value = '';
    if (elements.newPassword) elements.newPassword.value = '';
    if (elements.newRole) elements.newRole.value = 'guest';
    if (elements.addUserError) elements.addUserError.style.display = 'none';
    
    elements.addUserModal.style.display = 'flex';
}

async function saveNewUser() {
    if (!appState.isHost) return;
    
    const username = elements.newUsername.value.trim();
    const displayName = elements.newDisplayName.value.trim();
    const password = elements.newPassword.value;
    const role = elements.newRole.value;
    
    if (!username || !displayName || !password) {
        if (elements.addUserError) {
            elements.addUserError.textContent = "All fields are required.";
            elements.addUserError.style.display = 'block';
        }
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('user_management')
            .insert([{
                username, display_name: displayName, password_hash: password, role,
                created_by: appState.userName, is_active: true
            }]);
        
        if (error) throw error;
        
        elements.addUserModal.style.display = 'none';
        await loadUsers();
        alert(`User "${username}" created successfully!`);
    } catch (error) {
        console.error("Error creating user:", error);
        if (elements.addUserError) {
            elements.addUserError.textContent = `Error: ${error.message}`;
            elements.addUserError.style.display = 'block';
        }
    }
}

function editUserModalOpen(userId) {
    const user = appState.users.find(u => u.id === userId);
    if (!user) return;
    
    if (elements.editUserId) elements.editUserId.value = user.id;
    if (elements.editUsername) elements.editUsername.value = user.username;
    if (elements.editDisplayName) elements.editDisplayName.value = user.display_name;
    if (elements.editPassword) elements.editPassword.value = '';
    if (elements.editRole) elements.editRole.value = user.role;
    if (elements.editIsActive) elements.editIsActive.checked = user.is_active;
    if (elements.editUserError) elements.editUserError.style.display = 'none';
    
    elements.editUserModal.style.display = 'flex';
}

async function updateUser() {
    if (!appState.isHost) return;
    
    const userId = elements.editUserId.value;
    if (!userId) return;
    
    try {
        const updateData = {
            display_name: elements.editDisplayName.value.trim(),
            role: elements.editRole.value,
            is_active: elements.editIsActive.checked,
            updated_at: new Date().toISOString()
        };
        
        if (elements.editPassword.value) {
            updateData.password_hash = elements.editPassword.value;
        }
        
        const { error } = await supabaseClient
            .from('user_management')
            .update(updateData)
            .eq('id', userId);
        
        if (error) throw error;
        
        elements.editUserModal.style.display = 'none';
        await loadUsers();
        alert("User updated successfully!");
    } catch (error) {
        console.error("Error updating user:", error);
        if (elements.editUserError) {
            elements.editUserError.textContent = `Error: ${error.message}`;
            elements.editUserError.style.display = 'block';
        }
    }
}

async function deleteUser() {
    if (!appState.isHost) return;
    
    const userId = elements.editUserId.value;
    if (!userId) return;
    
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    try {
        const { error } = await supabaseClient
            .from('user_management')
            .delete()
            .eq('id', userId);
        
        if (error) throw error;
        
        elements.editUserModal.style.display = 'none';
        await loadUsers();
        alert("User deleted successfully!");
    } catch (error) {
        console.error("Error deleting user:", error);
        alert("Error deleting user: " + error.message);
    }
}

function searchUsers(searchTerm) {
    if (!searchTerm) {
        renderUsers(appState.users);
        return;
    }
    
    const filtered = appState.users.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.display_name.toLowerCase().includes(searchTerm) ||
        user.role.toLowerCase().includes(searchTerm)
    );
    
    renderUsers(filtered);
}

// ============================================
// VISITOR NOTES FUNCTIONS
// ============================================

async function loadVisitorNotes() {
    if (!appState.isHost) return;
    
    try {
        const { data: notes, error } = await supabaseClient
            .from('visitor_notes')
            .select('*')
            .eq('is_archived', false)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        appState.visitorNotes = notes || [];
        appState.unreadNotesCount = appState.visitorNotes.filter(n => !n.read_by_host).length;
        
        updateNotesButtonUI();
        
        if (appState.showNotesPanel) {
            renderVisitorNotes(appState.visitorNotes);
        }
    } catch (error) {
        console.error("Error loading visitor notes:", error);
    }
}

function renderVisitorNotes(notes) {
    if (!elements.notesList) return;
    
    if (!notes?.length) {
        elements.notesList.innerHTML = `
            <div class="no-notes-message">
                <i class="fas fa-sticky-note"></i>
                <p>No visitor notes yet</p>
                <small>Notes from guests will appear here</small>
            </div>
        `;
        return;
    }
    
    elements.notesList.innerHTML = '';
    
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = `visitor-note-item ${note.read_by_host ? 'read' : 'unread'}`;
        noteElement.dataset.noteId = note.id;
        
        const isGuestNotification = note.is_guest_notification || note.note_text?.includes('GUEST NOTIFICATION');
        const { displayName, displayMessage, emailInfo } = parseNoteContent(note, isGuestNotification);
        
        noteElement.innerHTML = `
            <div class="note-header">
                <div class="note-guest-info">
                    <i class="fas ${isGuestNotification ? 'fa-bell' : 'fa-user'}"></i>
                    <strong>${isGuestNotification ? '📬 Guest Message' : (displayName || 'Anonymous')}</strong>
                    ${!note.read_by_host ? '<span class="unread-badge">New</span>' : ''}
                </div>
                <div class="note-time"><i class="fas fa-clock"></i> ${new Date(note.created_at).toLocaleString()}</div>
            </div>
            <div class="note-content">
                <div class="note-from"><i class="fas fa-user"></i> From: ${displayName}</div>
                ${emailInfo}
                <div class="note-text">${escapeHtml(displayMessage)}</div>
                ${note.guest_ip ? `<div class="note-ip"><i class="fas fa-network-wired"></i> IP: ${note.guest_ip}</div>` : ''}
                ${note.guest_email ? `<div class="note-email"><i class="fas fa-envelope"></i> Email: ${note.guest_email}</div>` : ''}
            </div>
            <div class="note-actions">
                <button class="btn btn-small btn-success" onclick="markNoteAsRead('${note.id}')" ${note.read_by_host ? 'disabled' : ''}>
                    <i class="fas fa-check"></i> Mark Read
                </button>
                <button class="btn btn-small btn-info" onclick="archiveNote('${note.id}')">
                    <i class="fas fa-archive"></i> Archive
                </button>
            </div>
        `;
        
        elements.notesList.appendChild(noteElement);
    });
}

function parseNoteContent(note, isGuestNotification) {
    let displayName = note.guest_name || 'Unknown';
    let displayMessage = note.note_text || 'No message';
    let emailInfo = '';
    
    if (isGuestNotification && note.note_text) {
        const lines = note.note_text.split('\n');
        displayName = lines.find(l => l.startsWith('From:'))?.replace('From:', '').trim() || displayName;
        
        const emailLine = lines.find(l => l.startsWith('Email:'));
        if (emailLine) {
            emailInfo = `<div class="note-email"><i class="fas fa-envelope"></i> ${emailLine.replace('Email:', '').trim()}</div>`;
        }
        
        const msgLine = lines.find(l => l.startsWith('Message:'));
        if (msgLine) {
            displayMessage = msgLine.replace('Message:', '').trim();
        }
    }
    
    return { displayName, displayMessage, emailInfo };
}

window.markNoteAsRead = async function(noteId) {
    if (!appState.isHost) return;
    
    try {
        await supabaseClient
            .from('visitor_notes')
            .update({ read_by_host: true, read_at: new Date().toISOString(), host_id: appState.userId })
            .eq('id', noteId);
        
        const note = appState.visitorNotes.find(n => n.id === noteId);
        if (note) {
            note.read_by_host = true;
            appState.unreadNotesCount = appState.visitorNotes.filter(n => !n.read_by_host).length;
        }
        
        updateNotesButtonUI();
        renderVisitorNotes(appState.visitorNotes);
    } catch (error) {
        console.error("Error marking note as read:", error);
    }
};

window.archiveNote = async function(noteId) {
    if (!appState.isHost) return;
    if (!confirm("Are you sure you want to archive this note?")) return;
    
    try {
        await supabaseClient
            .from('visitor_notes')
            .update({ is_archived: true })
            .eq('id', noteId);
        
        appState.visitorNotes = appState.visitorNotes.filter(n => n.id !== noteId);
        appState.unreadNotesCount = appState.visitorNotes.filter(n => !n.read_by_host).length;
        
        updateNotesButtonUI();
        renderVisitorNotes(appState.visitorNotes);
    } catch (error) {
        console.error("Error archiving note:", error);
    }
};

function toggleNotesPanel() {
    if (!elements.notesPanel) return;
    
    appState.showNotesPanel = !appState.showNotesPanel;
    
    if (appState.showNotesPanel) {
        elements.notesPanel.classList.add('show');
        loadVisitorNotes();
    } else {
        elements.notesPanel.classList.remove('show');
    }
}

function searchNotes(searchTerm) {
    if (!searchTerm) {
        renderVisitorNotes(appState.visitorNotes);
        return;
    }
    
    const filtered = appState.visitorNotes.filter(note => 
        note.guest_name?.toLowerCase().includes(searchTerm) ||
        note.note_text?.toLowerCase().includes(searchTerm) ||
        note.guest_ip?.includes(searchTerm)
    );
    
    renderVisitorNotes(filtered);
}

function updateNotesButtonUI() {
    if (!elements.notesBtn || !elements.notesCount) return;
    
    elements.notesCount.textContent = appState.unreadNotesCount || 0;
    
    if (appState.unreadNotesCount > 0) {
        elements.notesBtn.classList.add('has-unread');
        elements.notesCount.style.display = 'inline';
        elements.notesBtn.title = `${appState.unreadNotesCount} unread notification${appState.unreadNotesCount > 1 ? 's' : ''}`;
    } else {
        elements.notesBtn.classList.remove('has-unread');
        elements.notesCount.style.display = 'none';
        elements.notesBtn.title = 'No unread notifications';
    }
}

async function markAllNotesAsRead() {
    if (!appState.isHost) return;
    
    const unreadNotes = appState.visitorNotes.filter(n => !n.read_by_host);
    if (!unreadNotes.length) {
        alert("No unread notes to mark.");
        return;
    }
    
    try {
        await supabaseClient
            .from('visitor_notes')
            .update({ read_by_host: true, read_at: new Date().toISOString(), host_id: appState.userId })
            .in('id', unreadNotes.map(n => n.id));
        
        appState.visitorNotes.forEach(note => note.read_by_host = true);
        appState.unreadNotesCount = 0;
        
        updateNotesButtonUI();
        renderVisitorNotes(appState.visitorNotes);
    } catch (error) {
        console.error("Error marking all notes as read:", error);
    }
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================

window.showFullImage = function(src) {
    if (elements.fullSizeImage) elements.fullSizeImage.src = src;
    if (elements.imageModal) elements.imageModal.style.display = 'flex';
};

window.viewPendingGuestsNow = function() {
    showPendingGuests();
    document.querySelectorAll('.guest-notification').forEach(n => n.remove());
};

window.showSessionGuests = async function(sessionId) {
    try {
        const { data: guests } = await supabaseClient
            .from('session_guests')
            .select('*')
            .eq('session_id', sessionId)
            .order('requested_at', { ascending: true });
        
        if (!guests) return;
        
        const guestInfo = generateGuestInfoHTML(guests, sessionId);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; max-height: 80vh;">
                <div class="modal-header">
                    <h2><i class="fas fa-users"></i> Session Guests</h2>
                    <button class="btn btn-secondary btn-small close-guest-modal"><i class="fas fa-times"></i> Close</button>
                </div>
                <div class="modal-body" style="overflow-y: auto;">${guestInfo}</div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-guest-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch (error) {
        console.error("Error loading session guests:", error);
        alert("Failed to load guest details.");
    }
};

function generateGuestInfoHTML(guests, sessionId) {
    const approved = guests.filter(g => g.status === 'approved');
    const pending = guests.filter(g => g.status === 'pending');
    const kicked = guests.filter(g => g.status === 'kicked');
    
    return `
        <div class="guest-details-modal">
            <h3><i class="fas fa-users"></i> Guest Details</h3>
            <p><strong>Session ID:</strong> ${sessionId.substring(0, 20)}...</p>
            
            <div class="guest-status-section">
                <h4><i class="fas fa-check-circle" style="color: var(--success-green);"></i> Approved Guests (${approved.length})</h4>
                ${approved.length ? approved.map(g => `
                    <div class="guest-detail">
                        <strong>${g.guest_name}</strong>
                        <div class="guest-meta">
                            <small>Joined: ${new Date(g.approved_at).toLocaleString()}</small>
                            <small>IP: ${g.guest_ip || 'Not recorded'}</small>
                            ${g.guest_note ? `<small>Note: ${g.guest_note}</small>` : ''}
                        </div>
                    </div>
                `).join('') : '<p>No approved guests</p>'}
            </div>
            
            ${pending.length ? `
                <div class="guest-status-section">
                    <h4><i class="fas fa-clock" style="color: var(--warning-yellow);"></i> Pending Guests (${pending.length})</h4>
                    ${pending.map(g => `
                        <div class="guest-detail">
                            <strong>${g.guest_name}</strong>
                            <div class="guest-meta">
                                <small>Requested: ${new Date(g.requested_at).toLocaleString()}</small>
                                <small>IP: ${g.guest_ip || 'Not recorded'}</small>
                                ${g.guest_note ? `<small>Note: ${g.guest_note}</small>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${kicked.length ? `
                <div class="guest-status-section">
                    <h4><i class="fas fa-user-slash" style="color: var(--danger-red);"></i> Kicked Guests (${kicked.length})</h4>
                    ${kicked.map(g => `
                        <div class="guest-detail">
                            <strong>${g.guest_name}</strong>
                            <div class="guest-meta">
                                <small>Kicked: ${new Date(g.left_at).toLocaleString()}</small>
                                <small>IP: ${g.guest_ip || 'Not recorded'}</small>
                            </div>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

// Global function references
window.approveGuest = approveGuest;
window.denyGuest = denyGuest;
window.kickGuest = kickGuest;
window.viewSessionHistory = viewSessionHistory;
window.deleteSession = deleteSession;
window.editUserModalOpen = editUserModalOpen;

// ChatModule wrappers
window.editMessage = (messageId) => window.ChatModule?.editMessage(messageId);
window.deleteMessage = (messageId) => window.ChatModule?.deleteMessage(messageId);
window.addReaction = (messageId, emoji) => window.ChatModule?.addReaction(messageId, emoji);
window.toggleReaction = (messageId, emoji) => window.ChatModule?.toggleReaction(messageId, emoji);
window.toggleMessageActions = (messageId, button) => window.ChatModule?.toggleMessageActions(messageId, button);
window.openReplyModal = (messageId, senderName, messageText) => window.ChatModule?.openReplyModal(messageId, senderName, messageText);
window.sendReply = () => window.ChatModule?.sendReply();
window.closeMessageActions = () => window.ChatModule?.closeMessageActions();
window.getMessageReactions = async (messageId) => window.ChatModule?.getMessageReactions(messageId) || [];
window.sendMessage = sendMessage;
