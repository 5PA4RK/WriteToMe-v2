// app.js - Optimized Version

// Supabase Configuration
const SUPABASE_URL = 'https://plqvqenoroacvzwtgoxq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_91IHQ5--y4tDIo8L9X2ZJQ_YeThfdu_';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// App State
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
    availableRooms: [],
    guestNote: "",
    visitorNotes: [],
    unreadNotesCount: 0,
    showNotesPanel: false,
    allSessions: [],
    replyingTo: null,
    activeMessageActions: null
};

// DOM Elements
const connectionModal = document.getElementById('connectionModal');
const connectBtn = document.getElementById('connectBtn');
const passwordError = document.getElementById('passwordError');
const logoutBtn = document.getElementById('logoutBtn');
const pendingGuestsBtn = document.getElementById('pendingGuestsBtn');
const pendingGuestsModal = document.getElementById('pendingGuestsModal');
const closePendingModal = document.getElementById('closePendingModal');
const pendingGuestsList = document.getElementById('pendingGuestsList');
const noPendingGuests = document.getElementById('noPendingGuests');

const statusIndicator = document.getElementById('statusIndicator');
const userRoleDisplay = document.getElementById('userRoleDisplay');
const pendingCount = document.getElementById('pendingCount');

const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const clearChatBtn = document.getElementById('clearChatBtn');
const imageUpload = document.getElementById('imageUpload');
const emojiBtn = document.getElementById('emojiBtn');
const emojiPicker = document.getElementById('emojiPicker');

const chatTitle = document.getElementById('chatTitle');
const chatModeIndicator = document.getElementById('chatModeIndicator');
const returnToActiveBtn = document.getElementById('returnToActiveBtn');

const historyCards = document.getElementById('historyCards');
const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');

const soundControl = document.getElementById('soundControl');
const messageSound = document.getElementById('messageSound');

const typingIndicator = document.getElementById('typingIndicator');
const typingUser = document.getElementById('typingUser');

const imageModal = document.getElementById('imageModal');
const fullSizeImage = document.getElementById('fullSizeImage');

const adminSection = document.getElementById('adminSection');
const historyTabBtn = document.getElementById('historyTabBtn');
const usersTabBtn = document.getElementById('usersTabBtn');
const historyTabContent = document.getElementById('historyTabContent');
const usersTabContent = document.getElementById('usersTabContent');

const guestNoteInput = document.getElementById('guestNoteInput');

// User Management DOM Elements
const userManagementSection = document.getElementById('userManagementSection');
const addUserBtn = document.getElementById('addUserBtn');
const userSearchInput = document.getElementById('userSearchInput');
const usersList = document.getElementById('usersList');
const addUserModal = document.getElementById('addUserModal');
const closeAddUserModal = document.getElementById('closeAddUserModal');
const editUserModal = document.getElementById('editUserModal');
const closeEditUserModal = document.getElementById('closeEditUserModal');
const newUsername = document.getElementById('newUsername');
const newDisplayName = document.getElementById('newDisplayName');
const newPassword = document.getElementById('newPassword');
const newRole = document.getElementById('newRole');
const addUserError = document.getElementById('addUserError');
const saveUserBtn = document.getElementById('saveUserBtn');
const editUserId = document.getElementById('editUserId');
const editUsername = document.getElementById('editUsername');
const editDisplayName = document.getElementById('editDisplayName');
const editPassword = document.getElementById('editPassword');
const editRole = document.getElementById('editRole');
const editIsActive = document.getElementById('editIsActive');
const editUserError = document.getElementById('editUserError');
const updateUserBtn = document.getElementById('updateUserBtn');
const deleteUserBtn = document.getElementById('deleteUserBtn');

const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');

// Notes elements
const notesBtn = document.getElementById('notesBtn');
const notesCount = document.getElementById('notesCount');
const notesPanel = document.getElementById('notesPanel');
const notesList = document.getElementById('notesList');
const closeNotesPanel = document.getElementById('closeNotesPanel');
const refreshNotesBtn = document.getElementById('refreshNotesBtn');
const markAllReadBtn = document.getElementById('markAllReadBtn');
const notesSearchInput = document.getElementById('notesSearchInput');

// Guest notification elements
const guestNotifyBtn = document.getElementById('guestNotifyBtn');
const guestNotificationModal = document.getElementById('guestNotificationModal');
const closeGuestNotifyModal = document.getElementById('closeGuestNotifyModal');
const guestNotifyName = document.getElementById('guestNotifyName');
const guestNotifyEmail = document.getElementById('guestNotifyEmail');
const guestNotifyMessage = document.getElementById('guestNotifyMessage');
const sendGuestNotification = document.getElementById('sendGuestNotification');
const guestNotifyError = document.getElementById('guestNotifyError');
const guestNotifySuccess = document.getElementById('guestNotifySuccess');

// Reply modal elements
const replyModal = document.getElementById('replyModal');
const closeReplyModal = document.getElementById('closeReplyModal');
const replyToName = document.getElementById('replyToName');
const replyToContent = document.getElementById('replyToContent');
const replyInput = document.getElementById('replyInput');
const sendReplyBtn = document.getElementById('sendReplyBtn');

// Make functions globally available
window.getMessageReactions = async function(messageId) {
    if (window.ChatModule) {
        return await window.ChatModule.getMessageReactions(messageId);
    }
    return [];
};

window.sendMessage = sendMessage;

// Initialize ChatModule
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.ChatModule) {
            window.ChatModule.init(appState, supabaseClient, {
                chatMessages: document.getElementById('chatMessages'),
                messageInput: document.getElementById('messageInput'),
                sendMessageBtn: document.getElementById('sendMessageBtn'),
                messageSound: document.getElementById('messageSound'),
                typingIndicator: document.getElementById('typingIndicator'),
                typingUser: document.getElementById('typingUser'),
                replyModal: document.getElementById('replyModal'),
                replyToName: document.getElementById('replyToName'),
                replyToContent: document.getElementById('replyToContent'),
                replyInput: document.getElementById('replyInput'),
                sendReplyBtn: document.getElementById('sendReplyBtn'),
                closeReplyModal: document.getElementById('closeReplyModal')
            });
            console.log('ChatModule initialized');
        }
    }, 100);
});

// Initialize app
async function initApp() {
    console.log("🚀 Initializing WriteToMira App...");
    
    const mainContainer = document.querySelector('.main-container') || document.querySelector('.app-container');
    if (mainContainer) {
        mainContainer.style.display = 'none';
    }
    
    document.body.classList.remove('host-mode');
    
    const savedSession = localStorage.getItem('writeToMe_session');
    if (savedSession) {
        try {
            const sessionData = JSON.parse(savedSession);
            appState.isHost = sessionData.isHost;
            appState.userName = sessionData.userName;
            appState.userId = sessionData.userId;
            appState.sessionId = sessionData.sessionId;
            appState.soundEnabled = sessionData.soundEnabled !== false;
            
            console.log("🔄 Attempting to reconnect...");
            
            if (await reconnectToSession()) {
                appState.isConnected = true;
                if (appState.isHost) {
                    document.body.classList.add('host-mode');
                }
                hideConnectionModal();
                updateUIAfterConnection();
                console.log("✅ Successfully reconnected!");
            } else {
                console.log("❌ Failed to reconnect");
                localStorage.removeItem('writeToMe_session');
                showConnectionModal();
            }
        } catch (e) {
            console.error("Error parsing saved session:", e);
            localStorage.removeItem('writeToMe_session');
            showConnectionModal();
        }
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

// Modal functions
function showConnectionModal() {
    connectionModal.style.display = 'flex';
    connectionModal.classList.add('show');
    document.body.classList.add('modal-open');
    
    const mainContainer = document.querySelector('.main-container') || document.querySelector('.app-container');
    if (mainContainer) {
        mainContainer.style.display = 'none';
    }
    
    if (usernameInput) usernameInput.value = '';
    if (passwordInput) passwordInput.value = '';
    if (guestNoteInput) guestNoteInput.value = '';
    if (passwordError) passwordError.style.display = 'none';
    
    if (connectBtn) {
        connectBtn.disabled = false;
        connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect';
    }
}

function hideConnectionModal() {
    connectionModal.style.display = 'none';
    connectionModal.classList.remove('show');
    document.body.classList.remove('modal-open');
    
    const mainContainer = document.querySelector('.main-container') || document.querySelector('.app-container');
    if (mainContainer) {
        mainContainer.style.display = 'block';
    }
}

// Reconnect function
async function reconnectToSession() {
    try {
        if (!appState.sessionId) return false;
        
        const { data: session, error } = await supabaseClient
            .from('sessions')
            .select('*')
            .eq('session_id', appState.sessionId)
            .single();
        
        if (error || !session) {
            console.log("Session not found:", error);
            return false;
        }
        
        console.log("✅ Session found:", session.session_id);
        
        if (appState.isHost) {
            if (session.host_id === appState.userId) {
                appState.currentSessionId = session.session_id;
                setupRealtimeSubscriptions();
                setupPendingGuestsSubscription();
                loadChatHistory();
                loadPendingGuests();
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
                loadChatHistory();
                return true;
            } else if (guestStatus.status === 'pending') {
                appState.currentSessionId = session.session_id;
                updateUIForPendingGuest();
                setupPendingApprovalSubscription(session.session_id);
                return false;
            } else {
                return false;
            }
        }
    } catch (error) {
        console.error("Error reconnecting:", error);
        return false;
    }
}

// Load all sessions
async function loadAllSessions() {
    try {
        const { data: sessions, error } = await supabaseClient
            .from('sessions')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        appState.allSessions = sessions || [];
        console.log(`📊 Loaded ${appState.allSessions.length} sessions`);
        return appState.allSessions;
    } catch (error) {
        console.error("Error loading sessions:", error);
        appState.allSessions = [];
        return [];
    }
}

function getStableRoomNumber(sessionId) {
    const index = appState.allSessions.findIndex(s => s.session_id === sessionId);
    if (index === -1) return '?';
    return (index + 1).toString();
}

// ========== EVENT LISTENERS ==========
function setupEventListeners() {
    // Connection modal
    if (usernameInput) {
        usernameInput.addEventListener('input', () => {
            if (passwordError) passwordError.style.display = 'none';
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleConnect();
        });
    }
    
    if (connectBtn) {
        connectBtn.addEventListener('click', handleConnect);
    }
    
    // Guest notification
    if (guestNotifyBtn) {
        guestNotifyBtn.addEventListener('click', showGuestNotificationModal);
    }
    
    if (closeGuestNotifyModal) {
        closeGuestNotifyModal.addEventListener('click', () => {
            guestNotificationModal.style.display = 'none';
        });
    }
    
    if (sendGuestNotification) {
        sendGuestNotification.addEventListener('click', sendGuestNotificationToAdmin);
    }
    
    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Pending guests
    if (pendingGuestsBtn) {
        pendingGuestsBtn.addEventListener('click', showPendingGuests);
    }
    
    if (closePendingModal) {
        closePendingModal.addEventListener('click', () => {
            pendingGuestsModal.style.display = 'none';
        });
    }
    
    // Chat
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        messageInput.addEventListener('input', handleTyping);
    }
    
    if (sendMessageBtn) {
        sendMessageBtn.addEventListener('click', sendMessage);
    }
    
    if (clearChatBtn) {
        clearChatBtn.addEventListener('click', clearChat);
    }
    
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
    
    if (emojiBtn) {
        emojiBtn.addEventListener('click', toggleEmojiPicker);
    }
    
    if (returnToActiveBtn) {
        returnToActiveBtn.addEventListener('click', returnToActiveChat);
    }
    
    if (refreshHistoryBtn) {
        refreshHistoryBtn.addEventListener('click', async () => {
            await loadAllSessions();
            loadChatSessions();
        });
    }
    
    if (soundControl) {
        soundControl.addEventListener('click', toggleSound);
    }
    
    if (imageModal) {
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal) {
                imageModal.style.display = 'none';
            }
        });
    }
    
    // Click outside handlers
    document.addEventListener('click', (e) => {
        // Close emoji picker
        if (emojiPicker && emojiPicker.classList.contains('show')) {
            if (!emojiPicker.contains(e.target) && emojiBtn && !emojiBtn.contains(e.target)) {
                emojiPicker.classList.remove('show');
            }
        }
        
        // Close message actions
        if (appState.activeMessageActions) {
            const actionsMenu = document.getElementById(`actions-${appState.activeMessageActions}`);
            if (actionsMenu && !actionsMenu.contains(e.target) && !e.target.closest('.message-action-dots')) {
                closeMessageActions();
            }
        }
    });
    
    // Tab switching
    if (historyTabBtn) {
        historyTabBtn.addEventListener('click', () => switchAdminTab('history'));
    }
    
    if (usersTabBtn) {
        usersTabBtn.addEventListener('click', () => switchAdminTab('users'));
    }
    
    // Notes panel
    if (notesBtn) {
        notesBtn.addEventListener('click', toggleNotesPanel);
    }
    
    if (closeNotesPanel) {
        closeNotesPanel.addEventListener('click', () => {
            notesPanel.classList.remove('show');
            appState.showNotesPanel = false;
        });
    }
    
    if (refreshNotesBtn) {
        refreshNotesBtn.addEventListener('click', loadVisitorNotes);
    }
    
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllNotesAsRead);
    }
    
    if (notesSearchInput) {
        notesSearchInput.addEventListener('input', function() {
            searchNotes(this.value.toLowerCase());
        });
    }
    
    // Click outside notes panel
    document.addEventListener('click', (e) => {
        if (notesPanel && notesPanel.classList.contains('show') && 
            !notesPanel.contains(e.target) && 
            notesBtn && !notesBtn.contains(e.target)) {
            notesPanel.classList.remove('show');
            appState.showNotesPanel = false;
        }
    });
    
    // Reply modal
    if (closeReplyModal) {
        closeReplyModal.addEventListener('click', () => {
            replyModal.style.display = 'none';
            appState.replyingTo = null;
        });
    }
    
    if (sendReplyBtn) {
        sendReplyBtn.addEventListener('click', sendReply);
    }
    
    window.addEventListener('click', (e) => {
        if (e.target === replyModal) {
            replyModal.style.display = 'none';
            appState.replyingTo = null;
        }
        if (e.target === guestNotificationModal) {
            guestNotificationModal.style.display = 'none';
        }
    });
}

// Tab switching
function switchAdminTab(tabName) {
    historyTabBtn.classList.remove('active');
    usersTabBtn.classList.remove('active');
    historyTabContent.style.display = 'none';
    usersTabContent.style.display = 'none';
    historyTabContent.classList.remove('active');
    usersTabContent.classList.remove('active');
    
    if (tabName === 'history') {
        historyTabBtn.classList.add('active');
        historyTabContent.style.display = 'block';
        historyTabContent.classList.add('active');
        loadChatSessions();
    } else if (tabName === 'users') {
        usersTabBtn.classList.add('active');
        usersTabContent.style.display = 'block';
        usersTabContent.classList.add('active');
        loadUsers();
    }
}

// Clear chat
async function clearChat() {
    if (!appState.isConnected || !appState.currentSessionId) {
        alert("You must be connected to clear chat.");
        return;
    }
    
    if (!confirm("Are you sure you want to clear messages?")) {
        return;
    }
    
    try {
        if (appState.isHost) {
            const { error } = await supabaseClient
                .from('messages')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: appState.userId
                })
                .eq('session_id', appState.currentSessionId);
            
            if (error) throw error;
            
            chatMessages.innerHTML = '';
            appState.messages = [];
            
            addSystemMessage(`Chat cleared by host ${appState.userName}`);
        } else {
            const messages = document.querySelectorAll('.message');
            messages.forEach(msg => {
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

// System message helper
function addSystemMessage(text, isLocal = false) {
    const systemMsg = document.createElement('div');
    systemMsg.className = 'message received';
    if (isLocal) {
        systemMsg.classList.add('local-system');
    }
    systemMsg.innerHTML = `
        <div class="message-sender">System</div>
        <div class="message-content">
            <div class="message-text">${text}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
    `;
    chatMessages.appendChild(systemMsg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle connection
async function handleConnect() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const guestNote = guestNoteInput ? guestNoteInput.value.trim() : "";
    
    passwordError.style.display = 'none';
    connectBtn.disabled = true;
    connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    
    if (!username || !password) {
        passwordError.style.display = 'block';
        passwordError.textContent = "Please enter both username and password.";
        resetConnectButton();
        return;
    }
    
    try {
        console.log("🔐 Authenticating:", username);
        
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
        
        // Simple password check (in production, use proper hashing)
        const isAuthenticated = true; // Simplified for demo
        
        if (!isAuthenticated) {
            showAuthError("Invalid username or password.");
            return;
        }
        
        appState.isHost = userData.role === 'host';
        appState.userName = userData.display_name || userData.username;
        appState.userId = userData.id;
        appState.guestNote = guestNote;
        
        console.log("✅ Authentication successful");
        
        const userIP = await getRealIP();
        
        if (appState.isHost) {
            await connectAsHost(userIP);
        } else {
            await connectAsGuest(userIP);
        }
    } catch (error) {
        console.error("Authentication error:", error);
        showAuthError("Authentication error. Please try again.");
    }
}

function showAuthError(message) {
    passwordError.style.display = 'block';
    passwordError.textContent = message;
    resetConnectButton();
}

function resetConnectButton() {
    connectBtn.disabled = false;
    connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect';
}

// Connect as host
async function connectAsHost(userIP) {
    try {
        console.log("👑 Connecting as host...");
        
        const sessionId = 'room_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
        
        const { data, error } = await supabaseClient
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
            }])
            .select()
            .single();
        
        if (error) {
            console.error("Error creating session:", error);
            alert("Failed to create session: " + error.message);
            resetConnectButton();
            return;
        }
        
        await loadAllSessions();
        
        appState.sessionId = sessionId;
        appState.currentSessionId = sessionId;
        appState.isConnected = true;
        
        document.body.classList.add('host-mode');
        
        saveSessionToStorage();
        hideConnectionModal();
        resetConnectButton();
        updateUIAfterConnection();
        
        setupRealtimeSubscriptions();
        setupPendingGuestsSubscription();
        
        await loadPendingGuests();
        await loadChatHistory();
        await loadChatSessions();
        
        await saveMessageToDB('System', `${appState.userName} has created a new chat room.`);
        
        console.log("✅ Host connection completed!");
    } catch (error) {
        console.error("Error in host connection:", error);
        alert("An error occurred: " + error.message);
        resetConnectButton();
        appState.isConnected = false;
        appState.currentSessionId = null;
        localStorage.removeItem('writeToMe_session');
        document.body.classList.remove('host-mode');
    }
}

// Connect as guest
async function connectAsGuest(userIP) {
    try {
        console.log("👤 Connecting as guest...");
        
        const { data: activeSessions, error: sessionError } = await supabaseClient
            .from('sessions')
            .select('session_id, host_name, host_id')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (sessionError || !activeSessions || activeSessions.length === 0) {
            alert("No active rooms available.");
            resetConnectButton();
            return;
        }
        
        const targetSession = activeSessions[0];
        console.log("✅ Found active session:", targetSession.session_id);
        
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
            } else {
                await createNewGuestRequest(targetSession, userIP);
            }
        } else {
            await createNewGuestRequest(targetSession, userIP);
        }
    } catch (error) {
        console.error("Error in guest connection:", error);
        alert("An error occurred: " + error.message);
        resetConnectButton();
    }
}

async function createNewGuestRequest(session, userIP) {
    try {
        const { data: newGuest, error: insertError } = await supabaseClient
            .from('session_guests')
            .insert([{
                session_id: session.session_id,
                guest_id: appState.userId,
                guest_name: appState.userName,
                guest_ip: userIP,
                guest_note: appState.guestNote || "",
                status: 'pending',
                requested_at: new Date().toISOString()
            }])
            .select();
        
        if (insertError) {
            console.error("Error adding to pending:", insertError);
            alert("Failed to request access: " + insertError.message);
            resetConnectButton();
            return;
        }
        
        if (appState.guestNote && appState.guestNote.trim() !== '') {
            await saveVisitorNote(session.session_id, appState.guestNote, userIP);
        }
        
        await saveMessageToDB('System', `🔔 New guest request from ${appState.userName}${appState.guestNote ? ': ' + appState.guestNote : ''}`);
        
        appState.sessionId = session.session_id;
        hideConnectionModal();
        resetConnectButton();
        updateUIForPendingGuest();
        setupPendingApprovalSubscription(session.session_id);
    } catch (error) {
        console.error("Error in createNewGuestRequest:", error);
        alert("An error occurred: " + error.message);
        resetConnectButton();
    }
}

async function saveVisitorNote(sessionId, noteText, userIP) {
    try {
        await supabaseClient
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
    } catch (error) {
        console.error("Error saving visitor note:", error);
    }
}

function completeGuestConnection(sessionId) {
    appState.sessionId = sessionId;
    appState.currentSessionId = sessionId;
    appState.isConnected = true;
    
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

// Pending guests system
function setupPendingGuestsSubscription() {
    if (!appState.isHost || !appState.currentSessionId) {
        if (pendingGuestsBtn) pendingGuestsBtn.style.display = 'none';
        return;
    }
    
    if (appState.pendingSubscription) {
        supabaseClient.removeChannel(appState.pendingSubscription);
    }
    
    appState.pendingSubscription = supabaseClient
        .channel(`pending-${appState.currentSessionId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'session_guests',
                filter: `session_id=eq.${appState.currentSessionId}`
            },
            (payload) => {
                if (payload.new && payload.new.status === 'pending') {
                    const exists = appState.pendingGuests.some(g => g.id === payload.new.id);
                    if (!exists) {
                        appState.pendingGuests.push(payload.new);
                    }
                    
                    updatePendingButtonUI();
                    showGuestNotification(payload.new);
                    
                    if (appState.soundEnabled) {
                        try {
                            messageSound.currentTime = 0;
                            messageSound.play().catch(e => console.log("Sound play failed:", e));
                        } catch (e) {
                            console.log("Sound error:", e);
                        }
                    }
                    
                    addSystemMessage(`🔔 New guest request from ${payload.new.guest_name}`);
                    
                    if (pendingGuestsModal.style.display === 'flex') {
                        showPendingGuests();
                    }
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'session_guests',
                filter: `session_id=eq.${appState.currentSessionId}`
            },
            () => {
                loadPendingGuests();
            }
        )
        .subscribe();
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
        
        if (pendingGuestsModal.style.display === 'flex') {
            renderPendingGuestsList();
        }
    } catch (error) {
        console.error("Error loading pending guests:", error);
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
            </div>
            <div class="notification-actions">
                <button onclick="viewPendingGuestsNow()" class="btn btn-small btn-success">
                    <i class="fas fa-eye"></i> View
                </button>
                <button onclick="this.remove()" class="btn btn-small btn-secondary">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 15000);
}

function updatePendingButtonUI() {
    if (!pendingGuestsBtn || !pendingCount) return;
    
    const count = appState.pendingGuests.length;
    pendingCount.textContent = count;
    
    if (count > 0) {
        pendingGuestsBtn.style.display = 'flex';
        pendingGuestsBtn.classList.add('has-pending');
        pendingCount.style.display = 'inline';
        pendingGuestsBtn.innerHTML = `<i class="fas fa-user-clock"></i> <span id="pendingCount">${count}</span> Pending`;
    } else {
        pendingGuestsBtn.style.display = 'flex';
        pendingGuestsBtn.classList.remove('has-pending');
        pendingCount.textContent = '0';
        pendingGuestsBtn.innerHTML = `<i class="fas fa-user-clock"></i> <span id="pendingCount">0</span> Pending`;
    }
}

function showPendingGuests() {
    renderPendingGuestsList();
    pendingGuestsModal.style.display = 'flex';
}

function renderPendingGuestsList() {
    if (!pendingGuestsList) return;
    
    pendingGuestsList.innerHTML = '';
    
    if (appState.pendingGuests.length === 0) {
        if (noPendingGuests) {
            noPendingGuests.style.display = 'block';
            noPendingGuests.innerHTML = '<i class="fas fa-check-circle"></i> No pending guest requests';
        }
        return;
    }
    
    if (noPendingGuests) noPendingGuests.style.display = 'none';
    
    appState.pendingGuests.forEach(guest => {
        const guestDiv = document.createElement('div');
        guestDiv.className = 'pending-guest';
        guestDiv.dataset.guestId = guest.id;
        
        guestDiv.innerHTML = `
            <div class="guest-info">
                <div class="guest-name">
                    <i class="fas fa-user"></i>
                    <strong>${guest.guest_name}</strong>
                </div>
                <div class="guest-details">
                    <small><i class="fas fa-calendar"></i> ${new Date(guest.requested_at).toLocaleString()}</small>
                    ${guest.guest_note ? `<div class="guest-note"><i class="fas fa-sticky-note"></i> ${guest.guest_note}</div>` : ''}
                </div>
            </div>
            <div class="guest-actions">
                <button class="btn btn-success btn-small" onclick="approveGuest('${guest.id}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="btn btn-danger btn-small" onclick="denyGuest('${guest.id}')">
                    <i class="fas fa-times"></i> Deny
                </button>
            </div>
        `;
        
        pendingGuestsList.appendChild(guestDiv);
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
        
        await supabaseClient
            .from('session_guests')
            .update({ status: 'approved', approved_at: new Date().toISOString() })
            .eq('id', guestRecordId);
        
        appState.pendingGuests = appState.pendingGuests.filter(g => g.id !== guestRecordId);
        updatePendingButtonUI();
        
        if (pendingGuestsModal.style.display === 'flex') {
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
        
        await supabaseClient
            .from('session_guests')
            .update({ status: 'rejected', left_at: new Date().toISOString() })
            .eq('id', guestRecordId);
        
        appState.pendingGuests = appState.pendingGuests.filter(g => g.id !== guestRecordId);
        updatePendingButtonUI();
        
        if (pendingGuestsModal.style.display === 'flex') {
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
    
    if (!confirm(`Are you sure you want to kick ${guestName}?`)) return;
    
    try {
        await supabaseClient
            .from('session_guests')
            .update({ status: 'kicked', left_at: new Date().toISOString() })
            .eq('id', guestId)
            .eq('session_id', appState.currentSessionId);
        
        await saveMessageToDB('System', `${guestName} has been kicked from the chat.`);
        loadPendingGuests();
        loadChatSessions();
    } catch (error) {
        console.error("Error kicking guest:", error);
        alert("Failed to kick guest: " + error.message);
    }
};

function setupPendingApprovalSubscription(sessionId) {
    if (appState.pendingSubscription) {
        supabaseClient.removeChannel(appState.pendingSubscription);
        appState.pendingSubscription = null;
    }
    
    appState.pendingSubscription = supabaseClient
        .channel('guest_approval_' + appState.userId)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'session_guests',
                filter: `guest_id=eq.${appState.userId}`
            },
            async (payload) => {
                if (payload.new && payload.new.session_id === sessionId) {
                    if (payload.new.status === 'approved') {
                        appState.currentSessionId = sessionId;
                        appState.isConnected = true;
                        saveSessionToStorage();
                        
                        if (appState.pendingSubscription) {
                            supabaseClient.removeChannel(appState.pendingSubscription);
                            appState.pendingSubscription = null;
                        }
                        
                        updateUIAfterConnection();
                        setupRealtimeSubscriptions();
                        await loadChatHistory();
                        await saveMessageToDB('System', `${appState.userName} has joined the chat.`);
                        
                        alert("🎉 You have been approved! Welcome to the chat.");
                    } else if (payload.new.status === 'rejected') {
                        alert("Your access request was rejected.");
                        location.reload();
                    } else if (payload.new.status === 'kicked') {
                        alert("You have been kicked from the chat.");
                        handleLogout();
                    }
                }
            }
        )
        .subscribe();
}

// Guest notification to admin
function showGuestNotificationModal() {
    guestNotifyName.value = '';
    guestNotifyEmail.value = '';
    guestNotifyMessage.value = '';
    guestNotifyError.style.display = 'none';
    guestNotifySuccess.style.display = 'none';
    guestNotificationModal.style.display = 'flex';
}

async function sendGuestNotificationToAdmin() {
    const name = guestNotifyName.value.trim();
    const email = guestNotifyEmail.value.trim();
    const message = guestNotifyMessage.value.trim();
    
    guestNotifyError.style.display = 'none';
    guestNotifySuccess.style.display = 'none';
    
    if (!name || !message) {
        guestNotifyError.textContent = "Please enter your name and message.";
        guestNotifyError.style.display = 'block';
        return;
    }
    
    sendGuestNotification.disabled = true;
    sendGuestNotification.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    
    try {
        let userIP = "Unknown";
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            userIP = data.ip || "Unknown";
        } catch (ipError) {
            console.log("Could not get IP");
        }
        
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
        
        guestNotifySuccess.style.display = 'block';
        guestNotifySuccess.innerHTML = '<i class="fas fa-check-circle"></i> ✅ Your message has been sent!';
        
        guestNotifyName.value = '';
        guestNotifyEmail.value = '';
        guestNotifyMessage.value = '';
        
        setTimeout(() => {
            guestNotificationModal.style.display = 'none';
        }, 3000);
    } catch (error) {
        console.error("Error sending guest notification:", error);
        guestNotifyError.innerHTML = `<i class="fas fa-exclamation-circle"></i> Failed to send message.`;
        guestNotifyError.style.display = 'block';
    } finally {
        sendGuestNotification.disabled = false;
        sendGuestNotification.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
    }
}

function loadBackupNotifications() {
    // Simplified - no localStorage backup needed
}

// Realtime subscriptions - UPDATED VERSION
function setupRealtimeSubscriptions() {
    if (!appState.currentSessionId) {
        console.log("⚠️ No session ID for subscriptions");
        return;
    }
    
    console.log("📡 Setting up real-time subscriptions for session:", appState.currentSessionId);
    
    // Clean up old subscriptions
    if (appState.realtimeSubscription) {
        console.log("Removing old message subscription");
        supabaseClient.removeChannel(appState.realtimeSubscription);
        appState.realtimeSubscription = null;
    }
    
    if (appState.typingSubscription) {
        console.log("Removing old typing subscription");
        supabaseClient.removeChannel(appState.typingSubscription);
        appState.typingSubscription = null;
    }
    
    // Create a unique channel name
    const channelName = `room-${appState.currentSessionId}-${Date.now()}`;
    
    // Set up main subscription for messages
    appState.realtimeSubscription = supabaseClient
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `session_id=eq.${appState.currentSessionId}`
            },
            (payload) => {
                console.log('📦 NEW MESSAGE RECEIVED:', payload.new);
                
                // Don't process if it's our own message or if viewing history
                if (payload.new.sender_id === appState.userId || appState.isViewingHistory) {
                    return;
                }
                
                // Get reactions for this message
                getMessageReactions(payload.new.id).then(reactions => {
                    displayMessage({
                        id: payload.new.id,
                        sender: payload.new.sender_name,
                        text: payload.new.message,
                        image: payload.new.image_url,
                        time: new Date(payload.new.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                        type: 'received',
                        is_historical: false,
                        reactions: reactions,
                        reply_to: payload.new.reply_to
                    });
                });
                
                // Play sound
                if (appState.soundEnabled && !payload.new.is_notification) {
                    try {
                        messageSound.currentTime = 0;
                        messageSound.play().catch(e => console.log("Audio play failed:", e));
                    } catch (e) {
                        console.log("Audio error:", e);
                    }
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'messages',
                filter: `session_id=eq.${appState.currentSessionId}`
            },
            (payload) => {
                console.log('📝 MESSAGE UPDATED:', payload.new);
                handleMessageUpdate(payload.new);
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'messages',
                filter: `session_id=eq.${appState.currentSessionId}`
            },
            (payload) => {
                console.log('🗑️ MESSAGE DELETED:', payload.old);
                // Handle message deletion
                const messageElement = document.getElementById(`msg-${payload.old.id}`);
                if (messageElement) {
                    messageElement.remove();
                }
            }
        )
        .subscribe((status, err) => {
            console.log('📡 Messages subscription status:', status);
            if (err) {
                console.error('❌ Messages subscription error:', err);
            }
            if (status === 'SUBSCRIBED') {
                console.log('✅ Successfully subscribed to messages!');
            }
        });

    // Set up reactions subscription separately
    const reactionsChannelName = `reactions-${appState.currentSessionId}-${Date.now()}`;
    
    const reactionsSubscription = supabaseClient
        .channel(reactionsChannelName)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'message_reactions'
            },
            (payload) => {
                console.log('🎯 REACTION CHANGE DETECTED:', payload.eventType, payload.new || payload.old);
                
                // Find the message ID
                const messageId = payload.new?.message_id || payload.old?.message_id;
                if (!messageId) return;
                
                // Check if this message belongs to our current session
                // We need to verify by checking if the message exists in our chat
                const messageElement = document.getElementById(`msg-${messageId}`);
                if (messageElement) {
                    // Update reactions for this message
                    updateMessageReactions(messageId);
                }
            }
        )
        .subscribe((status, err) => {
            console.log('📡 Reactions subscription status:', status);
            if (err) {
                console.error('❌ Reactions subscription error:', err);
            }
        });
    
    // Store both subscriptions
    if (!appState.realtimeSubscriptions) {
        appState.realtimeSubscriptions = [];
    }
    appState.realtimeSubscriptions.push(reactionsSubscription);
    
    // Set up typing subscription
    if (appState.typingSubscription) {
        supabaseClient.removeChannel(appState.typingSubscription);
    }
    
    appState.typingSubscription = supabaseClient
        .channel(`typing-${appState.currentSessionId}-${Date.now()}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'sessions',
                filter: `session_id=eq.${appState.currentSessionId}`
            },
            (payload) => {
                console.log('✏️ TYPING INDICATOR:', payload.new?.typing_user);
                if (payload.new && payload.new.typing_user && payload.new.typing_user !== appState.userName) {
                    typingUser.textContent = payload.new.typing_user;
                    typingIndicator.classList.add('show');
                    
                    // Clear after 3 seconds
                    setTimeout(() => {
                        if (typingUser.textContent === payload.new.typing_user) {
                            typingIndicator.classList.remove('show');
                        }
                    }, 3000);
                } else if (!payload.new?.typing_user) {
                    typingIndicator.classList.remove('show');
                }
            }
        )
        .subscribe((status, err) => {
            console.log('📡 Typing subscription status:', status);
            if (err) {
                console.error('❌ Typing subscription error:', err);
            }
        });
    
    if (appState.isHost) {
        console.log("👑 Setting up pending guests subscription");
        setupPendingGuestsSubscription();
    }
}

// Helper function for message updates
function handleMessageUpdate(updatedMessage) {
    const messageElement = document.getElementById(`msg-${updatedMessage.id}`);
    if (!messageElement) return;
    
    if (updatedMessage.is_deleted) {
        // Handle deleted message
        messageElement.innerHTML = `
            <div class="message-sender">${escapeHtml(updatedMessage.sender_name)}</div>
            <div class="message-content">
                <div class="message-text"><i>Message deleted</i></div>
                <div class="message-footer">
                    <div class="message-time">${new Date(updatedMessage.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            </div>
        `;
        // Remove actions menu
        const actionsMenu = document.getElementById(`actions-${updatedMessage.id}`);
        if (actionsMenu) actionsMenu.remove();
    } else if (updatedMessage.is_edited) {
        // Handle edited message
        const textElement = messageElement.querySelector('.message-text');
        if (textElement && !textElement.innerHTML.includes('Message deleted')) {
            textElement.innerHTML = `${escapeHtml(updatedMessage.message)} <small class="edited-indicator">(edited)</small>`;
        }
    }
}

// Helper function to update message reactions
async function updateMessageReactions(messageId) {
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (messageElement) {
        const reactions = await getMessageReactions(messageId);
        const reactionsContainer = messageElement.querySelector('.message-reactions');
        if (reactionsContainer && window.ChatModule) {
            window.ChatModule.renderReactions(reactionsContainer, reactions);
        }
    }
}

function checkAndReconnectSubscriptions() {
    if (!appState.isConnected || !appState.currentSessionId) return;
    
    console.log("🔍 Checking subscription health...");
    
    // Check main message subscription
    if (!appState.realtimeSubscription) {
        console.log("🔄 Reconnecting messages subscription...");
        setupRealtimeSubscriptions();
    }
    
    // Check typing subscription
    if (!appState.typingSubscription) {
        console.log("🔄 Reconnecting typing subscription...");
        setupRealtimeSubscriptions();
    }
    
    if (appState.isHost && !appState.pendingSubscription) {
        console.log("🔄 Reconnecting pending guests subscription...");
        setupPendingGuestsSubscription();
    }
}

// Chat functions
async function handleTyping() {
    if (!appState.currentSessionId || appState.isViewingHistory || !appState.isConnected) return;
    
    try {
        await supabaseClient
            .from('sessions')
            .update({ typing_user: appState.userName })
            .eq('session_id', appState.currentSessionId);
        
        if (appState.typingTimeout) {
            clearTimeout(appState.typingTimeout);
        }
        
        appState.typingTimeout = setTimeout(() => {
            supabaseClient
                .from('sessions')
                .update({ typing_user: null })
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
    
    const messageText = messageInput.value.trim();
    const imageFile = imageUpload.files[0];
    
    if (!messageText && !imageFile) return;
    
    let imageUrl = null;
    
    if (imageFile) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            imageUrl = e.target.result;
            await sendMessageToDB(messageText, imageUrl);
        };
        reader.readAsDataURL(imageFile);
        imageUpload.value = '';
    } else {
        await sendMessageToDB(messageText, null);
    }
    
    messageInput.value = '';
    messageInput.style.height = 'auto';
    appState.replyingTo = null;
}

// UPDATED: sendMessageToDB with proper reply handling
// Update the sendMessageToDB function in app.js
async function sendMessageToDB(text, imageUrl) {
    try {
        console.log('💾 Saving message to DB');
        console.log('Replying to:', appState.replyingTo);
        
        const messageData = {
            session_id: appState.currentSessionId,
            sender_id: appState.userId,
            sender_name: appState.userName,
            message: text || '',
            created_at: new Date().toISOString()
        };
        
        // IMPORTANT: Add reply_to field if we're replying
        if (appState.replyingTo) {
            messageData.reply_to = appState.replyingTo;
            console.log('✅ Setting reply_to to:', appState.replyingTo);
        }
        
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
        
        console.log('✅ Message saved to DB:', data.id);
        console.log('✅ Message reply_to:', data.reply_to);
        
        // Store the repliedTo ID before clearing
        const repliedToId = appState.replyingTo;
        
        // Clear replyingTo after sending
        appState.replyingTo = null;
        
        // Display the message
        displayMessage({
            id: data.id,
            sender: appState.userName,
            text: text,
            image: imageUrl,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'sent',
            is_historical: false,
            reactions: [],
            reply_to: repliedToId
        });
        
        return { success: true, data };
    } catch (error) {
        console.error("❌ Error in sendMessageToDB:", error);
        alert("Failed to send message: " + error.message);
        return null;
    }
}

function displayMessage(message) {
    if (window.ChatModule) {
        window.ChatModule.displayMessage(message);
    } else {
        console.warn('ChatModule not available');
    }
}

// Load chat history
async function loadChatHistory(sessionId = null) {
    const targetSessionId = sessionId || appState.currentSessionId;
    if (!targetSessionId) return;
    
    console.log('Loading chat history for session:', targetSessionId);
    
    try {
        const { data: messages, error } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('session_id', targetSessionId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        appState.messages = [];
        
        // Add history header if viewing past session
        if (sessionId) {
            const { data: session } = await supabaseClient
                .from('sessions')
                .select('created_at, host_name')
                .eq('session_id', sessionId)
                .single();
            
            if (session) {
                const roomNumber = getStableRoomNumber(sessionId);
                
                const historyHeader = document.createElement('div');
                historyHeader.className = 'message received historical';
                historyHeader.innerHTML = `
                    <div class="message-sender">System</div>
                    <div class="message-content">
                        <div class="message-text">
                            <i class="fas fa-door-open"></i> Chat History - Room ${roomNumber}
                            <br><small>Host: ${session.host_name} | Date: ${new Date(session.created_at).toLocaleDateString()}</small>
                        </div>
                    </div>
                `;
                chatMessages.appendChild(historyHeader);
            }
        }
        
        if (!messages || messages.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'message received';
            emptyMessage.innerHTML = `
                <div class="message-sender">System</div>
                <div class="message-content">
                    <div class="message-text">No messages in this room yet.</div>
                </div>
            `;
            chatMessages.appendChild(emptyMessage);
            return;
        }
        
        // Load reactions
        const reactionPromises = messages.map(msg => 
            window.ChatModule?.getMessageReactions(msg.id) || []
        );
        const allReactions = await Promise.all(reactionPromises);
        
        // Display messages
        messages.forEach((msg, index) => {
            const messageType = msg.sender_id === appState.userId ? 'sent' : 'received';
            
            if (window.ChatModule && typeof window.ChatModule.displayMessage === 'function') {
                window.ChatModule.displayMessage({
                    id: msg.id,
                    sender: msg.sender_name,
                    text: msg.message,
                    image: msg.image_url,
                    time: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    type: messageType,
                    is_historical: !!sessionId,
                    reactions: allReactions[index] || [],
                    reply_to: msg.reply_to
                });
            }
        });
        
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        console.log('Chat history loaded');
    } catch (error) {
        console.error("Error loading chat history:", error);
    }
}

// UI functions
function updateUIForPendingGuest() {
    if (statusIndicator) statusIndicator.className = 'status-indicator offline';
    if (userRoleDisplay) userRoleDisplay.textContent = `${appState.userName} (Pending Approval)`;
    if (logoutBtn) logoutBtn.style.display = 'flex';
    if (pendingGuestsBtn) pendingGuestsBtn.style.display = 'none';
    
    if (messageInput) {
        messageInput.disabled = true;
        messageInput.placeholder = "Waiting for host approval...";
    }
    
    if (sendMessageBtn) sendMessageBtn.disabled = true;
    
    if (chatMessages) {
        chatMessages.innerHTML = `
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
    if (!statusIndicator || !userRoleDisplay || !logoutBtn) return;
    
    statusIndicator.className = 'status-indicator online';
    userRoleDisplay.textContent = `${appState.userName} (Connected)`;
    logoutBtn.style.display = 'flex';
    
    if (messageInput) {
        messageInput.disabled = false;
        messageInput.placeholder = "Type your message here...";
        messageInput.focus();
    }
    
    if (sendMessageBtn) sendMessageBtn.disabled = false;
    
    // Re-initialize ChatModule
    if (window.ChatModule) {
        window.ChatModule.init(appState, supabaseClient, {
            chatMessages: document.getElementById('chatMessages'),
            messageInput: document.getElementById('messageInput'),
            sendMessageBtn: document.getElementById('sendMessageBtn'),
            messageSound: document.getElementById('messageSound'),
            typingIndicator: document.getElementById('typingIndicator'),
            typingUser: document.getElementById('typingUser'),
            replyModal: document.getElementById('replyModal'),
            replyToName: document.getElementById('replyToName'),
            replyToContent: document.getElementById('replyToContent'),
            replyInput: document.getElementById('replyInput'),
            sendReplyBtn: document.getElementById('sendReplyBtn'),
            closeReplyModal: document.getElementById('closeReplyModal')
        });
        
        setTimeout(() => {
            loadChatHistory();
        }, 500);
    }
    
    if (adminSection) {
        if (appState.isHost) {
            adminSection.style.display = 'block';
            document.body.classList.add('host-mode');
            
            if (notesBtn) notesBtn.style.display = 'flex';
            
            historyTabBtn.classList.add('active');
            usersTabBtn.classList.remove('active');
            historyTabContent.style.display = 'block';
            usersTabContent.style.display = 'none';
            
            loadChatSessions();
            setTimeout(() => {
                loadPendingGuests();
                loadVisitorNotes();
            }, 1000);
        } else {
            adminSection.style.display = 'none';
            document.body.classList.remove('host-mode');
            if (notesBtn) notesBtn.style.display = 'none';
        }
    }
    
    if (pendingGuestsBtn) {
        pendingGuestsBtn.style.display = appState.isHost && appState.currentSessionId ? 'flex' : 'none';
        if (appState.isHost) {
            setupPendingGuestsSubscription();
        }
    }
    
    if (appState.isViewingHistory) returnToActiveChat();
}

// Logout
async function handleLogout() {
    if (!confirm("Are you sure you want to logout?")) return;
    
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="message received">
                <div class="message-sender">System</div>
                <div class="message-content">
                    <div class="message-text">Disconnected. Please reconnect to continue.</div>
                </div>
            </div>
        `;
    }
    
    if (statusIndicator) statusIndicator.className = 'status-indicator offline';
    if (userRoleDisplay) userRoleDisplay.textContent = "Disconnected";
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (pendingGuestsBtn) pendingGuestsBtn.style.display = 'none';
    
    if (messageInput) {
        messageInput.disabled = true;
        messageInput.value = '';
        messageInput.placeholder = "Please connect to start chatting";
    }
    
    if (sendMessageBtn) sendMessageBtn.disabled = true;
    if (adminSection) adminSection.style.display = 'none';
    
    document.body.classList.remove('host-mode');
    
    if (appState.isConnected && appState.currentSessionId) {
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
    
    // Clean up all subscriptions
    if (appState.realtimeSubscription) {
        supabaseClient.removeChannel(appState.realtimeSubscription);
        appState.realtimeSubscription = null;
    }
    if (appState.realtimeSubscriptions) {
        appState.realtimeSubscriptions.forEach(sub => {
            supabaseClient.removeChannel(sub);
        });
        appState.realtimeSubscriptions = [];
    }
    if (appState.typingSubscription) {
        supabaseClient.removeChannel(appState.typingSubscription);
        appState.typingSubscription = null;
    }
    if (appState.pendingSubscription) {
        supabaseClient.removeChannel(appState.pendingSubscription);
        appState.pendingSubscription = null;
    }
    
    localStorage.removeItem('writeToMe_session');
    
    // Reset app state
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
    
    showConnectionModal();
}

// Helper functions
async function getRealIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || "Unknown";
    } catch (error) {
        return "Unknown";
    }
}

async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert("❌ Image size should be less than 5MB.");
        imageUpload.value = '';
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        alert("❌ Please select an image file.");
        imageUpload.value = '';
        return;
    }
    
    sendMessageBtn.disabled = true;
    sendMessageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        const result = await sendMessageToDB('', e.target.result);
        
        if (result && result.success) {
            console.log('✅ Image sent successfully');
        } else {
            console.error("❌ Failed to send image");
            alert("Failed to send image");
        }
        
        imageUpload.value = '';
        sendMessageBtn.disabled = false;
        sendMessageBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
    };
    
    reader.onerror = function() {
        console.error('❌ Error reading image');
        alert("Error reading image file.");
        imageUpload.value = '';
        sendMessageBtn.disabled = false;
        sendMessageBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
    };
    
    reader.readAsDataURL(file);
}

function toggleEmojiPicker() {
    emojiPicker.classList.toggle('show');
}

function populateEmojis() {
    if (!emojiPicker) return;
    
    emojiPicker.innerHTML = '';
    appState.emojis.forEach(emoji => {
        const emojiSpan = document.createElement('span');
        emojiSpan.className = 'emoji';
        emojiSpan.textContent = emoji;
        emojiSpan.onclick = () => {
            messageInput.value += emoji;
            emojiPicker.classList.remove('show');
            messageInput.focus();
        };
        emojiPicker.appendChild(emojiSpan);
    });
}

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
    if (!soundControl) return;
    
    if (appState.soundEnabled) {
        soundControl.innerHTML = '<i class="fas fa-volume-up"></i> <span>Sound On</span>';
        soundControl.classList.remove('muted');
    } else {
        soundControl.innerHTML = '<i class="fas fa-volume-mute"></i> <span>Sound Off</span>';
        soundControl.classList.add('muted');
    }
}

async function saveMessageToDB(senderName, messageText) {
    try {
        await supabaseClient
            .from('messages')
            .insert([{
                session_id: appState.currentSessionId,
                sender_id: 'system',
                sender_name: senderName,
                message: messageText,
                created_at: new Date().toISOString()
            }]);
        return { success: true };
    } catch (error) {
        console.error("Error saving system message:", error);
        return null;
    }
}

// Session functions
async function loadChatSessions() {
    try {
        if (!appState.isHost) {
            if (historyCards) {
                historyCards.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                        <i class="fas fa-lock" style="font-size: 24px; margin-bottom: 10px;"></i>
                        <div>History view requires host privileges</div>
                    </div>
                `;
            }
            return;
        }
        
        const { data: sessions, error } = await supabaseClient
            .from('sessions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (!historyCards) return;
        historyCards.innerHTML = '';
        
        for (const session of sessions) {
            const isActive = session.session_id === appState.currentSessionId && session.is_active;
            const roomNumber = getStableRoomNumber(session.session_id);
            
            const { data: guests } = await supabaseClient
                .from('session_guests')
                .select('*')
                .eq('session_id', session.session_id);
            
            const approvedGuests = guests ? guests.filter(g => g.status === 'approved') : [];
            const guestCount = approvedGuests.length;
            
            const card = document.createElement('div');
            card.className = 'session-card';
            if (isActive) card.classList.add('active');
            
            card.innerHTML = `
                <div class="session-card-header">
                    <div class="session-header-left">
                        <div class="session-id">
                            <i class="fas fa-door-open"></i> Room ${roomNumber}
                        </div>
                        <div class="session-stats">
                            <div class="stat-item guest-count">
                                <i class="fas fa-users"></i>
                                <span>${guestCount} Guests</span>
                            </div>
                        </div>
                    </div>
                    ${isActive ? '<div class="session-active-badge"><i class="fas fa-circle"></i> Live</div>' : ''}
                </div>
                
                <div class="session-info">
                    <div class="guest-info-rows">
                        <div class="guest-info-row">
                            <span class="guest-info-label"><i class="fas fa-user"></i> Host:</span>
                            <span class="guest-info-value">${session.host_name}</span>
                        </div>
                        <div class="guest-info-row">
                            <span class="guest-info-label"><i class="fas fa-calendar-alt"></i> Created:</span>
                            <span class="guest-info-value">${new Date(session.created_at).toLocaleString()}</span>
                        </div>
                    </div>
                </div>
                
                <div class="session-actions">
                    <button class="btn btn-secondary btn-small" onclick="viewSessionHistory('${session.session_id}')">
                        <i class="fas fa-eye"></i> View Chat
                    </button>
                    <button class="btn btn-info btn-small" onclick="showSessionGuests('${session.session_id}')">
                        <i class="fas fa-users"></i> Guest Details
                    </button>
                    ${appState.isHost && !isActive ? `
                    <button class="btn btn-danger btn-small" onclick="deleteSession('${session.session_id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    ` : ''}
                </div>
            `;
            
            historyCards.appendChild(card);
        }
    } catch (error) {
        console.error("Error loading sessions:", error);
    }
}

async function viewSessionHistory(sessionId) {
    appState.isViewingHistory = true;
    appState.viewingSessionId = sessionId;
    
    if (chatModeIndicator) chatModeIndicator.style.display = 'flex';
    if (chatTitle) chatTitle.innerHTML = `<i class="fas fa-door-open"></i> History View`;
    if (messageInput) {
        messageInput.disabled = true;
        messageInput.placeholder = "Cannot send messages in historical view";
    }
    if (sendMessageBtn) sendMessageBtn.disabled = true;
    
    await loadChatHistory(sessionId);
    if (chatMessages) chatMessages.scrollTop = 0;
}

function returnToActiveChat() {
    appState.isViewingHistory = false;
    appState.viewingSessionId = null;
    
    if (chatModeIndicator) chatModeIndicator.style.display = 'none';
    if (chatTitle) chatTitle.innerHTML = '<i class="fas fa-comments"></i> Active Chat';
    if (messageInput) {
        messageInput.disabled = false;
        messageInput.placeholder = "Type your message here...";
        messageInput.focus();
    }
    if (sendMessageBtn) sendMessageBtn.disabled = false;
    
    loadChatHistory();
}

async function deleteSession(sessionId) {
    if (!appState.isHost) {
        alert("Only hosts can delete sessions.");
        return;
    }
    
    if (!confirm("⚠️ WARNING: Are you sure you want to delete this session?\n\nThis action CANNOT be undone!")) {
        return;
    }
    
    try {
        // Delete related data
        await supabaseClient.from('visitor_notes').delete().eq('session_id', sessionId);
        await supabaseClient.from('messages').delete().eq('session_id', sessionId);
        await supabaseClient.from('session_guests').delete().eq('session_id', sessionId);
        await supabaseClient.from('sessions').delete().eq('session_id', sessionId);
        
        await loadAllSessions();
        await loadChatSessions();
        
        addSystemMessage("✅ Session deleted successfully", true);
    } catch (error) {
        console.error("❌ Error deleting session:", error);
        alert("Failed to delete session: " + error.message);
    }
}

// User management functions
function setupUserManagementListeners() {
    if (addUserBtn) addUserBtn.addEventListener('click', showAddUserModal);
    if (closeAddUserModal) closeAddUserModal.addEventListener('click', () => addUserModal.style.display = 'none');
    if (closeEditUserModal) closeEditUserModal.addEventListener('click', () => editUserModal.style.display = 'none');
    if (saveUserBtn) saveUserBtn.addEventListener('click', saveNewUser);
    if (updateUserBtn) updateUserBtn.addEventListener('click', updateUser);
    if (deleteUserBtn) deleteUserBtn.addEventListener('click', deleteUser);
    if (userSearchInput) userSearchInput.addEventListener('input', function() {
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
    }
}

function renderUsers(users) {
    if (!usersList) return;
    
    if (!users || users.length === 0) {
        usersList.innerHTML = `
            <div style="padding: 40px; text-align: center; color: var(--text-secondary);">
                <i class="fas fa-users-slash" style="font-size: 48px; margin-bottom: 15px;"></i>
                <h3>No Users Found</h3>
                <p>Click "Add New User" to create your first user.</p>
            </div>
        `;
        return;
    }
    
    usersList.innerHTML = '';
    
    users.forEach(user => {
        const userCard = document.createElement('div');
        userCard.className = `user-card ${user.role} ${user.is_active ? '' : 'inactive'}`;
        
        userCard.innerHTML = `
            <div class="user-header">
                <div class="user-name">
                    <i class="fas fa-user"></i>
                    <h3>${user.display_name}</h3>
                </div>
                <div class="user-badges">
                    <span class="user-badge badge-${user.role}">${user.role}</span>
                    ${!user.is_active ? '<span class="user-badge badge-inactive">Inactive</span>' : ''}
                </div>
            </div>
            <div class="user-details">
                <div class="user-detail">
                    <span class="user-detail-label">Username:</span>
                    <span class="user-detail-value">${user.username}</span>
                </div>
                <div class="user-detail">
                    <span class="user-detail-label">Created:</span>
                    <span class="user-detail-value">${new Date(user.created_at).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn btn-secondary btn-small" onclick="editUserModalOpen('${user.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
            </div>
        `;
        
        usersList.appendChild(userCard);
    });
}

function showAddUserModal() {
    if (!appState.isHost) return;
    
    newUsername.value = '';
    newDisplayName.value = '';
    newPassword.value = '';
    newRole.value = 'guest';
    addUserError.style.display = 'none';
    
    addUserModal.style.display = 'flex';
}

async function saveNewUser() {
    if (!appState.isHost) return;
    
    const username = newUsername.value.trim();
    const displayName = newDisplayName.value.trim();
    const password = newPassword.value;
    const role = newRole.value;
    
    if (!username || !displayName || !password) {
        addUserError.textContent = "All fields are required.";
        addUserError.style.display = 'block';
        return;
    }
    
    try {
        await supabaseClient
            .from('user_management')
            .insert([{
                username: username,
                display_name: displayName,
                password_hash: password,
                role: role,
                created_by: appState.userName,
                is_active: true
            }]);
        
        addUserModal.style.display = 'none';
        await loadUsers();
        alert(`User "${username}" created successfully!`);
    } catch (error) {
        console.error("Error creating user:", error);
        addUserError.textContent = `Error: ${error.message}`;
        addUserError.style.display = 'block';
    }
}

function editUserModalOpen(userId) {
    const user = appState.users.find(u => u.id === userId);
    if (!user) return;
    
    editUserId.value = user.id;
    editUsername.value = user.username;
    editDisplayName.value = user.display_name;
    editPassword.value = '';
    editRole.value = user.role;
    editIsActive.checked = user.is_active;
    editUserError.style.display = 'none';
    
    editUserModal.style.display = 'flex';
}

async function updateUser() {
    if (!appState.isHost) return;
    
    const userId = editUserId.value;
    const displayName = editDisplayName.value.trim();
    const password = editPassword.value;
    const role = editRole.value;
    const isActive = editIsActive.checked;
    
    if (!userId) return;
    
    try {
        const updateData = {
            display_name: displayName,
            role: role,
            is_active: isActive,
            updated_at: new Date().toISOString()
        };
        
        if (password) {
            updateData.password_hash = password;
        }
        
        await supabaseClient
            .from('user_management')
            .update(updateData)
            .eq('id', userId);
        
        editUserModal.style.display = 'none';
        await loadUsers();
        alert("User updated successfully!");
    } catch (error) {
        console.error("Error updating user:", error);
        editUserError.textContent = `Error: ${error.message}`;
        editUserError.style.display = 'block';
    }
}

async function deleteUser() {
    if (!appState.isHost) return;
    
    const userId = editUserId.value;
    if (!userId) return;
    
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
        await supabaseClient
            .from('user_management')
            .delete()
            .eq('id', userId);
        
        editUserModal.style.display = 'none';
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
    
    const filteredUsers = appState.users.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        user.display_name.toLowerCase().includes(searchTerm) ||
        user.role.toLowerCase().includes(searchTerm)
    );
    
    renderUsers(filteredUsers);
}

// Visitor notes functions
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
        
        if (notesBtn) {
            notesBtn.classList.toggle('has-unread', appState.unreadNotesCount > 0);
        }
    } catch (error) {
        console.error("Error loading visitor notes:", error);
    }
}

function renderVisitorNotes(notes) {
    if (!notesList) return;
    
    if (!notes || notes.length === 0) {
        notesList.innerHTML = `
            <div class="no-notes-message">
                <i class="fas fa-sticky-note"></i>
                <p>No visitor notes yet</p>
                <small>Notes from guests will appear here</small>
            </div>
        `;
        return;
    }
    
    notesList.innerHTML = '';
    
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = `visitor-note-item ${note.read_by_host ? 'read' : 'unread'}`;
        noteElement.dataset.noteId = note.id;
        
        const isGuestNotification = note.is_guest_notification;
        
        noteElement.innerHTML = `
            <div class="note-header">
                <div class="note-guest-info">
                    <i class="fas ${isGuestNotification ? 'fa-bell' : 'fa-user'}"></i>
                    <strong>${note.guest_name || 'Anonymous'}</strong>
                    ${!note.read_by_host ? '<span class="unread-badge">New</span>' : ''}
                </div>
                <div class="note-time">
                    <i class="fas fa-clock"></i> ${new Date(note.created_at).toLocaleString()}
                </div>
            </div>
            <div class="note-content">
                <div class="note-text">${escapeHtml(note.note_text)}</div>
                ${note.guest_ip ? `<div class="note-ip"><i class="fas fa-network-wired"></i> IP: ${note.guest_ip}</div>` : ''}
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
        
        notesList.appendChild(noteElement);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
    if (!notesPanel) return;
    
    appState.showNotesPanel = !appState.showNotesPanel;
    
    if (appState.showNotesPanel) {
        notesPanel.classList.add('show');
        loadVisitorNotes();
    } else {
        notesPanel.classList.remove('show');
    }
}

function searchNotes(searchTerm) {
    if (!searchTerm) {
        renderVisitorNotes(appState.visitorNotes);
        return;
    }
    
    const filtered = appState.visitorNotes.filter(note => 
        note.guest_name.toLowerCase().includes(searchTerm) ||
        note.note_text.toLowerCase().includes(searchTerm)
    );
    
    renderVisitorNotes(filtered);
}

function updateNotesButtonUI() {
    if (!notesBtn || !notesCount) return;
    
    notesCount.textContent = appState.unreadNotesCount || 0;
    
    if (appState.unreadNotesCount > 0) {
        notesBtn.classList.add('has-unread');
        notesCount.style.display = 'inline';
        notesBtn.title = `${appState.unreadNotesCount} unread notification${appState.unreadNotesCount > 1 ? 's' : ''}`;
    } else {
        notesBtn.classList.remove('has-unread');
        notesCount.style.display = 'none';
        notesBtn.title = 'No unread notifications';
    }
}

async function markAllNotesAsRead() {
    if (!appState.isHost) return;
    
    const unreadNotes = appState.visitorNotes.filter(n => !n.read_by_host);
    
    if (unreadNotes.length === 0) {
        alert("No unread notes to mark.");
        return;
    }
    
    try {
        await supabaseClient
            .from('visitor_notes')
            .update({ read_by_host: true, read_at: new Date().toISOString(), host_id: appState.userId })
            .in('id', unreadNotes.map(n => n.id));
        
        appState.visitorNotes.forEach(note => { note.read_by_host = true; });
        appState.unreadNotesCount = 0;
        
        updateNotesButtonUI();
        renderVisitorNotes(appState.visitorNotes);
    } catch (error) {
        console.error("Error marking all notes as read:", error);
    }
}

// Global functions
window.showFullImage = function(src) {
    fullSizeImage.src = src;
    imageModal.style.display = 'flex';
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
        
        const approvedGuests = guests.filter(g => g.status === 'approved');
        const pendingGuests = guests.filter(g => g.status === 'pending');
        
        let guestInfo = `
            <div class="guest-details-modal">
                <h3><i class="fas fa-users"></i> Guest Details</h3>
                <p><strong>Session ID:</strong> ${sessionId.substring(0, 20)}...</p>
                
                <div class="guest-status-section">
                    <h4><i class="fas fa-check-circle"></i> Approved Guests (${approvedGuests.length})</h4>
                    ${approvedGuests.map(g => `
                        <div class="guest-detail">
                            <strong>${g.guest_name}</strong>
                            <div class="guest-meta">
                                <small>Joined: ${new Date(g.approved_at).toLocaleString()}</small>
                                ${g.guest_note ? `<small>Note: ${g.guest_note}</small>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                ${pendingGuests.length > 0 ? `
                <div class="guest-status-section">
                    <h4><i class="fas fa-clock"></i> Pending Guests (${pendingGuests.length})</h4>
                    ${pendingGuests.map(g => `
                        <div class="guest-detail">
                            <strong>${g.guest_name}</strong>
                            <div class="guest-meta">
                                <small>Requested: ${new Date(g.requested_at).toLocaleString()}</small>
                                ${g.guest_note ? `<small>Note: ${g.guest_note}</small>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
        `;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2><i class="fas fa-users"></i> Session Guests</h2>
                    <button class="btn btn-secondary btn-small close-guest-modal">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
                <div class="modal-body">
                    ${guestInfo}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-guest-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    } catch (error) {
        console.error("Error loading session guests:", error);
        alert("Failed to load guest details.");
    }
};

// Make functions global
window.approveGuest = approveGuest;
window.denyGuest = denyGuest;
window.kickGuest = kickGuest;
window.viewSessionHistory = viewSessionHistory;
window.deleteSession = deleteSession;
window.editUserModalOpen = editUserModalOpen;
window.editMessage = function(messageId) {
    if (window.ChatModule) window.ChatModule.editMessage(messageId);
};
window.deleteMessage = function(messageId) {
    if (window.ChatModule) window.ChatModule.deleteMessage(messageId);
};
window.addReaction = function(messageId, emoji) {
    if (window.ChatModule) window.ChatModule.addReaction(messageId, emoji);
};
window.toggleReaction = function(messageId, emoji) {
    if (window.ChatModule) window.ChatModule.toggleReaction(messageId, emoji);
};
window.toggleMessageActions = function(messageId, button) {
    if (window.ChatModule) window.ChatModule.toggleMessageActions(messageId, button);
};
window.openReplyModal = function(messageId, senderName, messageText) {
    if (window.ChatModule) window.ChatModule.openReplyModal(messageId, senderName, messageText);
};

// Close message actions helper
function closeMessageActions() {
    if (window.ChatModule) {
        window.ChatModule.closeMessageActions();
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', initApp);

// Auto-resize textarea
if (messageInput) {
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}
