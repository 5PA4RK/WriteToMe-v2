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
    currentImage: null,
    typingTimeout: null,
    connectionTime: null,
    realtimeSubscription: null,
    typingSubscription: null,
    pendingSubscription: null,
    soundEnabled: true,
    isViewingHistory: false,
    viewingSessionId: null,
    pendingGuests: [],
    emojis: ["😀", "😂", "😍", "😎", "😭", "😡", "👍", "👎", "❤️", "🔥", "👏", "🙏", "🤔", "😴", "🥳"],
    users: [],
    isViewingUsers: false,
    availableRooms: [],
    guestNote: "",
    visitorNotes: [],
    unreadNotesCount: 0,
    showNotesPanel: false
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

// Room selection elements - REMOVED but keeping reference to avoid errors
const roomSelection = document.getElementById('roomSelection');
const availableRoomsList = document.getElementById('availableRoomsList');
const refreshRoomsBtn = document.getElementById('refreshRoomsBtn');
const guestNoteInput = document.getElementById('guestNoteInput');

// User Management DOM Elements
const userManagementSection = document.getElementById('userManagementSection');
const backToHistoryBtn = document.getElementById('backToHistoryBtn');
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

// ============================================
// INITIALIZATION
// ============================================

async function initApp() {
    console.log("🚀 Initializing WriteToMira App...");
    
    const mainContainer = document.querySelector('.main-container') || document.querySelector('.app-container');
    if (mainContainer) {
        mainContainer.style.display = 'none';
    }
    
    // Hide room selection section since guests don't need it anymore
    if (roomSelection) {
        roomSelection.style.display = 'none';
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
            
            console.log("🔄 Attempting to reconnect to saved session...");
            
            if (await reconnectToSession()) {
                appState.isConnected = true;
                if (appState.isHost) {
                    document.body.classList.add('host-mode');
                }
                hideConnectionModal();
                updateUIAfterConnection();
                console.log("✅ Successfully reconnected!");
            } else {
                console.log("❌ Failed to reconnect, clearing session");
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
        loadChatSessions();
    }
    
    // Start subscription health check
    setInterval(checkAndReconnectSubscriptions, 15000);
}

// ============================================
// MODAL FUNCTIONS
// ============================================

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
    
    const passwordHint = document.getElementById('passwordHint');
    if (passwordHint) passwordHint.style.display = 'none';
    
    if (connectBtn) {
        connectBtn.disabled = false;
        connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect';
    }
    
    clearSensitiveData();
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

function clearSensitiveData() {
    const ipElements = document.querySelectorAll('[class*="ip"], [class*="IP"]');
    ipElements.forEach(el => {
        if (el.textContent.includes('IP:') || el.textContent.includes('ip:')) {
            el.textContent = 'IP: ***';
        }
    });
}

// Update password hint based on username
function updatePasswordHint(username) {
    const passwordHint = document.getElementById('passwordHint');
    if (!passwordHint) return;
    
    const lowerUsername = username.toLowerCase();
    if (lowerUsername === 'guest') {
        passwordHint.textContent = "Test password: guest123";
        passwordHint.style.display = 'block';
    } else if (lowerUsername === 'host') {
        passwordHint.textContent = "Test password: host123";
        passwordHint.style.display = 'block';
    } else if (lowerUsername === 'admin') {
        passwordHint.textContent = "Administrator account";
        passwordHint.style.display = 'block';
    } else {
        passwordHint.style.display = 'none';
    }
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
        
        if (error || !session) {
            console.log("Session not found or error:", error);
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

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {
    // Connection modal
    if (usernameInput) {
        usernameInput.addEventListener('input', function() {
            if (passwordError) passwordError.style.display = 'none';
            updatePasswordHint(this.value);
        });
    }
    
    if (usersTabBtn) {
        usersTabBtn.addEventListener('click', () => {
            console.log("User management tab clicked");
            switchAdminTab('users');
            loadUsers();
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
    
    // Hide refresh rooms button since we don't need it anymore
    if (refreshRoomsBtn) {
        refreshRoomsBtn.style.display = 'none';
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
    
    // Chat functionality
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
    
    // Image upload
    if (imageUpload) {
        imageUpload.addEventListener('change', handleImageUpload);
    }
    
    // Emoji picker
    if (emojiBtn) {
        emojiBtn.addEventListener('click', toggleEmojiPicker);
    }
    
    // Return to active chat
    if (returnToActiveBtn) {
        returnToActiveBtn.addEventListener('click', returnToActiveChat);
    }
    
    // History
    if (refreshHistoryBtn) {
        refreshHistoryBtn.addEventListener('click', loadChatSessions);
    }
    
    // Sound control
    if (soundControl) {
        soundControl.addEventListener('click', toggleSound);
    }
    
    // Image modal
    if (imageModal) {
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal || e.target.classList.contains('image-modal-overlay')) {
                imageModal.style.display = 'none';
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && imageModal.style.display === 'flex') {
                imageModal.style.display = 'none';
            }
        });
    }
    
    // Click outside emoji picker to close
    document.addEventListener('click', (e) => {
        if (emojiPicker && !emojiPicker.contains(e.target) && emojiBtn && !emojiBtn.contains(e.target)) {
            emojiPicker.classList.remove('show');
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
    
    // Click outside to close notes panel
    document.addEventListener('click', (e) => {
        if (notesPanel && notesPanel.classList.contains('show') && 
            !notesPanel.contains(e.target) && 
            notesBtn && !notesBtn.contains(e.target)) {
            notesPanel.classList.remove('show');
            appState.showNotesPanel = false;
        }
    });
}

// ============================================
// TAB SWITCHING
// ============================================

function switchAdminTab(tabName) {
    console.log("Switching to tab:", tabName);
    
    if (!historyTabBtn || !usersTabBtn || !historyTabContent || !usersTabContent) {
        console.error("Tab elements not found!");
        return;
    }
    
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

// ============================================
// CLEAR CHAT
// ============================================

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
                if (msg.querySelector('.message-sender').textContent === appState.userName) {
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

// ============================================
// HANDLE CONNECTION
// ============================================

async function handleConnect() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const guestNote = guestNoteInput ? guestNoteInput.value.trim() : "";
    
    passwordError.style.display = 'none';
    connectBtn.disabled = true;
    connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    
    if (!username) {
        passwordError.style.display = 'block';
        passwordError.textContent = "Please enter a username.";
        resetConnectButton();
        return;
    }
    
    if (!password) {
        passwordError.style.display = 'block';
        passwordError.textContent = "Please enter a password.";
        resetConnectButton();
        return;
    }
    
    try {
        console.log("🔐 Attempting authentication for:", username);
        
        const { data: userData, error: userError } = await supabaseClient
            .from('user_management')
            .select('id, username, display_name, password_hash, role, is_active')
            .ilike('username', username)
            .eq('is_active', true)
            .single();
        
        if (userError || !userData) {
            console.log("User not found:", userError);
            showAuthError("Invalid username or password.");
            return;
        }
        
        console.log("👤 User found:", userData.username, "Role:", userData.role);
        
        // Authenticate
        let isAuthenticated = false;
        
        try {
            const { data: authResult } = await supabaseClient
                .rpc('verify_password', {
                    stored_hash: userData.password_hash,
                    password: password
                });
            
            if (authResult === true) {
                isAuthenticated = true;
            }
        } catch (rpcError) {
            console.log("RPC failed, trying test passwords:", rpcError);
        }
        
        if (!isAuthenticated) {
            const testPasswords = {
                'admin': 'admin123',
                'host': 'host123',
                'guest': 'guest123'
            };
            
            if (testPasswords[username.toLowerCase()] && password === testPasswords[username.toLowerCase()]) {
                isAuthenticated = true;
            }
        }
        
        if (!isAuthenticated) {
            showAuthError("Invalid username or password.");
            return;
        }
        
        appState.isHost = userData.role === 'host';
        appState.userName = userData.display_name || userData.username;
        appState.userId = userData.id;
        appState.connectionTime = new Date();
        appState.guestNote = guestNote;
        
        console.log("✅ Authentication successful:", {
            name: appState.userName,
            id: appState.userId,
            isHost: appState.isHost
        });
        
        try {
            await supabaseClient
                .from('user_management')
                .update({ 
                    last_login: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', userData.id);
        } catch (updateError) {
            console.log("Could not update last login:", updateError);
        }
        
        const userIP = await getRealIP();
        
        if (appState.isHost) {
            await connectAsHost(userIP);
        } else {
            await connectAsGuest(userIP);
        }
        
    } catch (error) {
        console.error("Error in authentication process:", error);
        showAuthError(error.message.includes('NetworkError') ? 
            "Network error. Check connection." : 
            "Authentication error. Please try again.");
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

// ============================================
// CONNECT AS HOST
// ============================================

async function connectAsHost(userIP) {
    try {
        console.log("👑 Connecting as host...");
        
        const sessionId = 'room_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
        
        const { data, error } = await supabaseClient
            .from('sessions')
            .insert([
                {
                    session_id: sessionId,
                    host_id: appState.userId,
                    host_name: appState.userName,
                    host_ip: userIP,
                    is_active: true,
                    requires_approval: true,
                    created_at: new Date().toISOString(),
                    max_guests: 50
                }
            ])
            .select()
            .single();
        
        if (error) {
            console.error("Error creating session:", error);
            alert("Failed to create session: " + error.message);
            resetConnectButton();
            return;
        }
        
        appState.sessionId = sessionId;
        appState.currentSessionId = sessionId;
        appState.isConnected = true;
        
        document.body.classList.add('host-mode');
        
        saveSessionToStorage();
        
        connectionModal.style.display = 'none';
        resetConnectButton();
        updateUIAfterConnection();
        
        setupRealtimeSubscriptions();
        setupPendingGuestsSubscription();
        
        await loadPendingGuests();
        await loadChatHistory();
        await loadChatSessions();
        
        await saveMessageToDB('System', `${appState.userName} has created a new chat room.`);
        
        console.log("✅ Host connection completed successfully!");
        
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

// ============================================
// CONNECT AS GUEST - SIMPLIFIED - AUTO-JOIN LATEST ROOM
// ============================================

async function connectAsGuest(userIP) {
    try {
        console.log("👤 Connecting as guest - auto-joining latest room...");
        
        // Find the most recently created active session
        const { data: activeSessions, error: sessionError } = await supabaseClient
            .from('sessions')
            .select('session_id, host_name, host_id')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (sessionError || !activeSessions || activeSessions.length === 0) {
            alert("No active rooms available. Please try again later or contact a host.");
            resetConnectButton();
            return;
        }
        
        const targetSession = activeSessions[0];
        console.log("✅ Found active session:", targetSession.session_id, "Host:", targetSession.host_name);
        
        // Check if guest already has a request for this session
        const { data: existingRequest } = await supabaseClient
            .from('session_guests')
            .select('status, id')
            .eq('session_id', targetSession.session_id)
            .eq('guest_id', appState.userId)
            .maybeSingle();
        
        if (existingRequest) {
            console.log("Existing request found with status:", existingRequest.status);
            
            if (existingRequest.status === 'pending') {
                console.log("Guest already pending");
                appState.sessionId = targetSession.session_id;
                connectionModal.style.display = 'none';
                resetConnectButton();
                updateUIForPendingGuest();
                setupPendingApprovalSubscription(targetSession.session_id);
                return;
            } else if (existingRequest.status === 'approved') {
                console.log("Guest already approved");
                completeGuestConnection(targetSession.session_id);
                return;
            } else if (existingRequest.status === 'rejected' || existingRequest.status === 'kicked') {
                // Create a new request if previously rejected
                console.log("Previous request was rejected/kicked, creating new request");
                await createNewGuestRequest(targetSession, userIP);
            }
        } else {
            // No existing request, create a new one
            await createNewGuestRequest(targetSession, userIP);
        }
        
    } catch (error) {
        console.error("Error in guest connection:", error);
        alert("An error occurred: " + error.message);
        resetConnectButton();
    }
}

// Helper function to create new guest request
async function createNewGuestRequest(session, userIP) {
    try {
        console.log("Creating new guest request for session:", session.session_id);
        
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
            
            // Check for specific error
            if (insertError.message.includes('duplicate key')) {
                alert("You already have a pending request for this room.");
            } else {
                alert("Failed to request access: " + insertError.message);
            }
            resetConnectButton();
            return;
        }
        
        console.log("✅ Guest added to pending list successfully:", newGuest);
        
        // Save visitor note if provided
        if (appState.guestNote && appState.guestNote.trim() !== '') {
            await saveVisitorNote(session.session_id, appState.guestNote, userIP);
        }
        
        // Force update the session to trigger notification
        try {
            await supabaseClient
                .from('sessions')
                .update({
                    created_at: new Date().toISOString() // Using created_at since updated_at might not exist
                })
                .eq('session_id', session.session_id);
        } catch (updateError) {
            console.log("Could not update session timestamp:", updateError);
        }
        
        // Also send a system message to the chat
        try {
            await supabaseClient
                .from('messages')
                .insert([{
                    session_id: session.session_id,
                    sender_id: 'system',
                    sender_name: 'System',
                    message: `🔔 New guest request from ${appState.userName}${appState.guestNote ? ': ' + appState.guestNote : ''}`,
                    created_at: new Date().toISOString()
                }]);
        } catch (msgError) {
            console.log("Could not send system message:", msgError);
        }
        
        appState.sessionId = session.session_id;
        connectionModal.style.display = 'none';
        resetConnectButton();
        updateUIForPendingGuest();
        setupPendingApprovalSubscription(session.session_id);
        
    } catch (error) {
        console.error("Error in createNewGuestRequest:", error);
        alert("An error occurred: " + error.message);
        resetConnectButton();
    }
}

// Save visitor note
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
        
        if (error) {
            console.error("Error saving visitor note:", error);
        } else {
            console.log("✅ Visitor note saved successfully");
        }
    } catch (error) {
        console.error("Error in saveVisitorNote:", error);
    }
}

// Complete guest connection after approval
function completeGuestConnection(sessionId) {
    appState.sessionId = sessionId;
    appState.currentSessionId = sessionId;
    appState.isConnected = true;
    
    saveSessionToStorage();
    connectionModal.style.display = 'none';
    resetConnectButton();
    updateUIAfterConnection();
    setupRealtimeSubscriptions();
    loadChatHistory();
    loadChatSessions();
    saveMessageToDB('System', `${appState.userName} has joined the chat.`);
}

// Save session to localStorage
function saveSessionToStorage() {
    localStorage.setItem('writeToMe_session', JSON.stringify({
        isHost: appState.isHost,
        userName: appState.userName,
        userId: appState.userId,
        sessionId: appState.sessionId,
        connectionTime: appState.connectionTime,
        soundEnabled: appState.soundEnabled
    }));
}

// ============================================
// PENDING GUESTS SYSTEM
// ============================================

// Setup pending guests subscription
function setupPendingGuestsSubscription() {
    console.log("🔄 Setting up pending guests subscription...");
    
    if (!appState.isHost || !appState.currentSessionId) {
        console.log("⚠️ Cannot setup pending subscription: Not host or no session ID");
        if (pendingGuestsBtn) pendingGuestsBtn.style.display = 'none';
        return;
    }
    
    console.log("✅ Host detected, setting up pending guests for session:", appState.currentSessionId);
    
    // Clear any existing subscriptions
    if (appState.pendingSubscription) {
        supabaseClient.removeChannel(appState.pendingSubscription);
    }
    
    // Create channel for this host's session
    appState.pendingSubscription = supabaseClient
        .channel(`pending-${appState.currentSessionId}-${Date.now()}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'session_guests',
                filter: `session_id=eq.${appState.currentSessionId}`
            },
            (payload) => {
                console.log('🎯 NEW PENDING GUEST DETECTED:', payload.new);
                console.log('Guest name:', payload.new.guest_name);
                console.log('Guest note:', payload.new.guest_note);
                
                if (payload.new && payload.new.status === 'pending') {
                    // Add to pending list
                    const exists = appState.pendingGuests.some(g => g.id === payload.new.id);
                    if (!exists) {
                        appState.pendingGuests.push(payload.new);
                    }
                    
                    // Update UI
                    updatePendingButtonUI();
                    
                    // Show notification
                    showGuestNotification(payload.new);
                    
                    // Play sound
                    if (appState.soundEnabled) {
                        try {
                            messageSound.currentTime = 0;
                            messageSound.play().catch(e => console.log("Sound play failed:", e));
                        } catch (e) {
                            console.log("Sound error:", e);
                        }
                    }
                    
                    // Add system message to chat
                    addSystemMessage(`🔔 New guest request from ${payload.new.guest_name}${payload.new.guest_note ? ': ' + payload.new.guest_note : ''}`);
                    
                    // Update modal if open
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
            (payload) => {
                console.log('🔄 PENDING GUEST UPDATED:', payload.new);
                // Refresh the list
                loadPendingGuests();
            }
        )
        .subscribe((status, err) => {
            console.log('📡 Pending guests subscription status:', status);
            if (status === 'SUBSCRIBED') {
                console.log('✅ Successfully subscribed to pending guests!');
                // Load existing pending guests
                loadPendingGuests();
            }
            if (err) {
                console.error('❌ Subscription error:', err);
            }
        });
}

// Load pending guests
async function loadPendingGuests() {
    if (!appState.isHost) {
        console.log("Cannot load pending guests: Not host");
        return;
    }
    
    try {
        console.log("🔄 Loading pending guests for session:", appState.currentSessionId);
        
        if (!appState.currentSessionId) {
            console.log("No active session ID");
            appState.pendingGuests = [];
            updatePendingButtonUI();
            return;
        }
        
        const { data: guests, error } = await supabaseClient
            .from('session_guests')
            .select('*')
            .eq('session_id', appState.currentSessionId)
            .eq('status', 'pending')
            .order('requested_at', { ascending: false });
        
        if (error) {
            console.error("Error loading pending guests:", error);
            return;
        }
        
        console.log(`✅ Loaded ${guests?.length || 0} pending guests`);
        appState.pendingGuests = guests || [];
        
        updatePendingButtonUI();
        
        // If modal is open, refresh the list
        if (pendingGuestsModal.style.display === 'flex') {
            renderPendingGuestsList();
        }
        
    } catch (error) {
        console.error("Error in loadPendingGuests:", error);
    }
}

// Show guest notification
function showGuestNotification(guest) {
    console.log("🔔 Showing notification for:", guest.guest_name);
    
    // Remove any existing notifications
    document.querySelectorAll('.guest-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'guest-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">
                <i class="fas fa-user-plus"></i>
            </div>
            <div class="notification-text">
                <strong>New Guest Request!</strong>
                <span>${guest.guest_name} wants to join</span>
                ${guest.guest_note ? `<small>📝 ${guest.guest_note}</small>` : ''}
            </div>
            <div class="notification-actions">
                <button onclick="viewPendingGuestsNow()" class="btn btn-small btn-success">
                    <i class="fas fa-eye"></i> View
                </button>
                <button onclick="this.closest('.guest-notification').remove()" class="btn btn-small btn-secondary">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 15 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 15000);
}

// Update pending button UI
function updatePendingButtonUI() {
    if (!pendingGuestsBtn || !pendingCount) return;
    
    const count = appState.pendingGuests.length;
    console.log(`Updating pending button UI. Count: ${count}`);
    
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

// Show pending guests modal
function showPendingGuests() {
    console.log("Showing pending guests modal...");
    renderPendingGuestsList();
    pendingGuestsModal.style.display = 'flex';
}

// Render pending guests list
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
                    <small><i class="fas fa-network-wired"></i> IP: ${guest.guest_ip || 'Unknown'}</small>
                    ${guest.guest_note ? `
                        <div class="guest-note">
                            <i class="fas fa-sticky-note"></i> ${guest.guest_note}
                        </div>
                    ` : ''}
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

// Approve guest
async function approveGuest(guestRecordId) {
    try {
        console.log("Approving guest:", guestRecordId);
        
        const { data: guest, error: fetchError } = await supabaseClient
            .from('session_guests')
            .select('*')
            .eq('id', guestRecordId)
            .single();
        
        if (fetchError || !guest) {
            throw new Error("Guest not found");
        }
        
        const { error } = await supabaseClient
            .from('session_guests')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString()
            })
            .eq('id', guestRecordId);
        
        if (error) throw error;
        
        // Remove from pending list
        appState.pendingGuests = appState.pendingGuests.filter(g => g.id !== guestRecordId);
        updatePendingButtonUI();
        
        // Close modal if open
        if (pendingGuestsModal.style.display === 'flex') {
            renderPendingGuestsList();
        }
        
        // Add system message
        await saveMessageToDB('System', `${guest.guest_name} has been approved and joined the chat.`);
        
        console.log(`✅ Approved guest: ${guest.guest_name}`);
        
    } catch (error) {
        console.error("Error approving guest:", error);
        alert("Failed to approve guest: " + error.message);
    }
}

// Deny guest
async function denyGuest(guestRecordId) {
    try {
        console.log("Denying guest:", guestRecordId);
        
        const { data: guest, error: fetchError } = await supabaseClient
            .from('session_guests')
            .select('*')
            .eq('id', guestRecordId)
            .single();
        
        if (fetchError || !guest) {
            throw new Error("Guest not found");
        }
        
        const { error } = await supabaseClient
            .from('session_guests')
            .update({
                status: 'rejected',
                left_at: new Date().toISOString()
            })
            .eq('id', guestRecordId);
        
        if (error) throw error;
        
        // Remove from pending list
        appState.pendingGuests = appState.pendingGuests.filter(g => g.id !== guestRecordId);
        updatePendingButtonUI();
        
        // Close modal if open
        if (pendingGuestsModal.style.display === 'flex') {
            renderPendingGuestsList();
        }
        
        console.log(`❌ Denied guest: ${guest.guest_name}`);
        
    } catch (error) {
        console.error("Error denying guest:", error);
        alert("Failed to deny guest: " + error.message);
    }
}

// Kick guest
window.kickGuest = async function(guestId, guestName) {
    if (!appState.isHost || !appState.currentSessionId) {
        alert("Only hosts can kick guests.");
        return;
    }
    
    if (!confirm(`Are you sure you want to kick ${guestName} from the chat?`)) return;
    
    try {
        const { error } = await supabaseClient
            .from('session_guests')
            .update({
                status: 'kicked',
                left_at: new Date().toISOString()
            })
            .eq('id', guestId)
            .eq('session_id', appState.currentSessionId);
        
        if (error) throw error;
        
        await saveMessageToDB('System', `${guestName} has been kicked from the chat by host.`);
        
        // Refresh pending list and session view
        loadPendingGuests();
        loadChatSessions();
        
        alert(`${guestName} has been kicked.`);
        
    } catch (error) {
        console.error("Error kicking guest:", error);
        alert("Failed to kick guest: " + error.message);
    }
};

// Setup pending approval subscription for guest
function setupPendingApprovalSubscription(sessionId) {
    console.log("⏳ Setting up pending approval subscription for guest...");
    
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
                console.log('👤 Guest approval update:', payload.new?.status);
                
                if (payload.new && payload.new.session_id === sessionId) {
                    if (payload.new.status === 'approved') {
                        console.log("🎉 Guest has been APPROVED!");
                        
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
                        console.log("❌ Guest has been REJECTED");
                        alert("Your access request was rejected by the host.");
                        location.reload();
                    } else if (payload.new.status === 'kicked') {
                        console.log("👢 Guest has been KICKED");
                        alert("You have been kicked from the chat by the host.");
                        handleLogout();
                    }
                }
            }
        )
        .subscribe((status, err) => {
            console.log('Guest approval subscription status:', status);
            if (status === 'SUBSCRIBED') {
                console.log('✅ Guest approval subscription active');
            }
            if (err) {
                console.error('Guest approval subscription error:', err);
            }
        });
}

// ============================================
// REALTIME SUBSCRIPTIONS
// ============================================

function setupRealtimeSubscriptions() {
    if (!appState.currentSessionId) {
        console.log("⚠️ No session ID for subscriptions");
        return;
    }
    
    console.log("📡 Setting up real-time subscriptions for session:", appState.currentSessionId);
    
    if (appState.realtimeSubscription) {
        console.log("Removing old subscription");
        supabaseClient.removeChannel(appState.realtimeSubscription);
        appState.realtimeSubscription = null;
    }
    
    if (appState.typingSubscription) {
        supabaseClient.removeChannel(appState.typingSubscription);
        appState.typingSubscription = null;
    }
    
    appState.realtimeSubscription = supabaseClient
        .channel('messages_' + appState.currentSessionId)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages'
            },
            (payload) => {
                console.log('📦 Realtime message received:', payload.new?.sender_name, payload.new?.message?.substring(0, 30));
                
                if (payload.new && payload.new.session_id === appState.currentSessionId) {
                    if (payload.new.sender_id !== appState.userId && !appState.isViewingHistory) {
                        console.log('✅ Displaying new message from:', payload.new.sender_name);
                        displayMessage({
                            id: payload.new.id,
                            sender: payload.new.sender_name,
                            text: payload.new.message,
                            image: payload.new.image_url,
                            time: new Date(payload.new.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                            type: 'received',
                            is_historical: false
                        });
                        
                        if (appState.soundEnabled && !payload.new.is_notification) {
                            try {
                                messageSound.currentTime = 0;
                                messageSound.play().catch(e => console.log("Audio play failed:", e));
                            } catch (e) {
                                console.log("Audio error:", e);
                            }
                        }
                    }
                }
            }
        )
        .subscribe((status, err) => {
            console.log('📡 MESSAGES Subscription status:', status);
            if (status === 'SUBSCRIBED') {
                console.log('✅ SUCCESS: Subscribed to realtime messages!');
            }
            if (err) {
                console.error('❌ Messages subscription error:', err);
            }
        });
    
    // Typing subscription (simplified)
    appState.typingSubscription = supabaseClient
        .channel('typing_' + appState.currentSessionId)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'sessions',
                filter: `session_id=eq.${appState.currentSessionId}`
            },
            (payload) => {
                if (payload.new && payload.new.typing_user && payload.new.typing_user !== appState.userName) {
                    typingUser.textContent = payload.new.typing_user;
                    typingIndicator.classList.add('show');
                    
                    setTimeout(() => {
                        if (typingUser.textContent === payload.new.typing_user) {
                            typingIndicator.classList.remove('show');
                        }
                    }, 3000);
                }
            }
        )
        .subscribe();
    
    if (appState.isHost) {
        console.log("👑 Setting up pending guests subscription for host");
        setupPendingGuestsSubscription();
    }
}

// Check and reconnect subscriptions
function checkAndReconnectSubscriptions() {
    if (!appState.isConnected || !appState.currentSessionId) return;
    
    console.log("🔍 Checking subscription health...");
    
    if (!appState.realtimeSubscription) {
        console.log("🔄 Reconnecting messages subscription...");
        setupRealtimeSubscriptions();
    }
    
    if (appState.isHost && !appState.pendingSubscription) {
        console.log("🔄 Reconnecting pending guests subscription...");
        setupPendingGuestsSubscription();
    }
}

// ============================================
// CHAT FUNCTIONS
// ============================================

// Handle typing
async function handleTyping() {
    if (!appState.currentSessionId || appState.isViewingHistory || !appState.isConnected) return;
    
    try {
        await supabaseClient
            .from('sessions')
            .update({ 
                typing_user: appState.userName,
                created_at: new Date().toISOString() // Using created_at as updated_at might not exist
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
                    created_at: new Date().toISOString()
                })
                .eq('session_id', appState.currentSessionId)
                .catch(e => console.log("Error clearing typing:", e));
        }, 1000);
    } catch (error) {
        console.log("Typing indicator error:", error);
    }
}

// Send message
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
}

// Send message to database
async function sendMessageToDB(text, imageUrl) {
    try {
        console.log('💾 Saving message to DB. Text:', text?.substring(0, 50), 'Has image:', !!imageUrl);
        
        const messageData = {
            session_id: appState.currentSessionId,
            sender_id: appState.userId,
            sender_name: appState.userName,
            message: text || '',
            created_at: new Date().toISOString()
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
        
        console.log('✅ Message saved to DB:', data.id);
        
        displayMessage({
            id: data.id,
            sender: appState.userName,
            text: text,
            image: imageUrl,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'sent',
            is_historical: false
        });
        
        return { success: true, data };
        
    } catch (error) {
        console.error("❌ Error in sendMessageToDB:", error);
        alert("Failed to send message: " + error.message);
        return null;
    }
}

// Display message
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
    
    let messageContent = message.text || '';
    if (message.image) {
        messageContent += `<img src="${message.image}" class="message-image" onclick="showFullImage('${message.image}')">`;
    }
    
    messageDiv.innerHTML = `
        <div class="message-sender">${message.sender}</div>
        <div class="message-content">
            <div class="message-text">${messageContent}</div>
            <div class="message-time">${message.time}</div>
        </div>
        ${message.type === 'sent' && !message.is_historical ? `
        <div class="message-actions">
            <button class="message-action-btn" onclick="editMessage('${message.id}')">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="message-action-btn" onclick="deleteMessage('${message.id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
            <button class="message-action-btn" onclick="replyToMessage('${message.id}')">
                <i class="fas fa-reply"></i> Reply
            </button>
        </div>
        ` : ''}
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Load chat history
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
        
        chatMessages.innerHTML = '';
        appState.messages = [];
        
        if (sessionId) {
            const { data: session } = await supabaseClient
                .from('sessions')
                .select('created_at, host_name')
                .eq('session_id', sessionId)
                .single();
            
            const historyHeader = document.createElement('div');
            historyHeader.className = 'message received historical';
            historyHeader.innerHTML = `
                <div class="message-sender">System</div>
                <div class="message-content">
                    <div class="message-text">
                        <i class="fas fa-door-open"></i> Chat History
                        <br><small>Host: ${session.host_name} | Date: ${new Date(session.created_at).toLocaleDateString()}</small>
                    </div>
                    <div class="message-time"></div>
                </div>
            `;
            chatMessages.appendChild(historyHeader);
        }
        
        messages.forEach(msg => {
            const messageType = msg.sender_id === appState.userId ? 'sent' : 'received';
            displayMessage({
                id: msg.id,
                sender: msg.sender_name,
                text: msg.message,
                image: msg.image_url,
                time: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                type: messageType,
                is_historical: !!sessionId
            });
        });
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error("Error loading chat history:", error);
    }
}

// ============================================
// UI FUNCTIONS
// ============================================

// Update UI for pending guest
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
                    <div class="message-time">Just now</div>
                </div>
            </div>
        `;
    }
}

// Update UI after connection
function updateUIAfterConnection() {
    if (!statusIndicator || !userRoleDisplay || !logoutBtn) return;
    
    statusIndicator.className = 'status-indicator';
    statusIndicator.classList.add('online');
    userRoleDisplay.textContent = `${appState.userName} (Connected)`;
    logoutBtn.style.display = 'flex';
    
    if (messageInput) {
        messageInput.disabled = false;
        messageInput.placeholder = "Type your message here... (Press Enter to send, Shift+Enter for new line)";
        messageInput.focus();
    }
    
    if (sendMessageBtn) sendMessageBtn.disabled = false;
    
    // Show admin panel and notes button ONLY for hosts
    if (adminSection) {
        if (appState.isHost) {
            adminSection.style.display = 'block';
            document.body.classList.add('host-mode');
            
            if (notesBtn) notesBtn.style.display = 'flex';
            
            if (historyTabBtn && usersTabBtn && historyTabContent && usersTabContent) {
                historyTabBtn.classList.add('active');
                usersTabBtn.classList.remove('active');
                historyTabContent.style.display = 'block';
                historyTabContent.classList.add('active');
                usersTabContent.style.display = 'none';
                usersTabContent.classList.remove('active');
            }
            
            loadChatSessions();
            
            // Load pending guests immediately
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

// ============================================
// LOGOUT
// ============================================

async function handleLogout() {
    if (!confirm("Are you sure you want to logout?")) return;
    
    if (chatMessages) {
        chatMessages.innerHTML = `
            <div class="message received">
                <div class="message-sender">System</div>
                <div class="message-content">
                    <div class="message-text">Disconnected. Please reconnect to continue.</div>
                    <div class="message-time">Just now</div>
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
                    .update({ 
                        is_active: false,
                        ended_at: new Date().toISOString()
                    })
                    .eq('session_id', appState.currentSessionId);
            } else {
                await supabaseClient
                    .from('session_guests')
                    .update({ 
                        status: 'left',
                        left_at: new Date().toISOString()
                    })
                    .eq('session_id', appState.currentSessionId)
                    .eq('guest_id', appState.userId);
            }
        } catch (error) {
            console.error("Error updating session on logout:", error);
        }
    }
    
    if (appState.realtimeSubscription) {
        supabaseClient.removeChannel(appState.realtimeSubscription);
        appState.realtimeSubscription = null;
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
    
    appState.isHost = false;
    appState.isConnected = false;
    appState.userName = "Guest";
    appState.userId = null;
    appState.sessionId = null;
    appState.currentSessionId = null;
    appState.messages = [];
    appState.isViewingHistory = false;
    appState.viewingSessionId = null;
    appState.pendingGuests = [];
    appState.isViewingUsers = false;
    appState.users = [];
    appState.guestNote = "";
    
    showConnectionModal();
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get real IP address
async function getRealIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip || "Unknown";
    } catch (error) {
        console.error("Error getting IP:", error);
        return "Unknown";
    }
}

// Handle image upload
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
    
    if (sendMessageBtn) {
        sendMessageBtn.disabled = true;
        sendMessageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    }
    
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            const result = await sendMessageToDB('', e.target.result);
            
            if (result && result.success) {
                console.log('✅ Image sent successfully');
                imageUpload.value = '';
                
                if (sendMessageBtn) {
                    sendMessageBtn.disabled = false;
                    sendMessageBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
                }
            } else {
                throw new Error("Failed to send image");
            }
            
        } catch (error) {
            console.error("❌ Error sending image:", error);
            alert("Failed to send image: " + error.message);
            
            if (sendMessageBtn) {
                sendMessageBtn.disabled = false;
                sendMessageBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
            }
        }
    };
    
    reader.onerror = function(e) {
        console.error('❌ Error reading image:', e);
        alert("Error reading image file.");
        imageUpload.value = '';
        
        if (sendMessageBtn) {
            sendMessageBtn.disabled = false;
            sendMessageBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
        }
    };
    
    reader.readAsDataURL(file);
}

// Toggle emoji picker
function toggleEmojiPicker() {
    emojiPicker.classList.toggle('show');
}

// Populate emojis
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

// Toggle sound
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

// Update sound control UI
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

// Save system message to database
async function saveMessageToDB(senderName, messageText) {
    try {
        const messageData = {
            session_id: appState.currentSessionId,
            sender_id: 'system',
            sender_name: senderName,
            message: messageText,
            created_at: new Date().toISOString()
        };
        
        const { error } = await supabaseClient
            .from('messages')
            .insert([messageData]);
        
        if (error) {
            console.error("Error saving system message:", error);
            return null;
        }
        return { success: true };
    } catch (error) {
        console.error("Error saving system message:", error);
        return null;
    }
}

// ============================================
// HISTORY & SESSION FUNCTIONS
// ============================================

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
        
        for (let i = 0; i < sessions.length; i++) {
            const session = sessions[i];
            const isActive = session.session_id === appState.currentSessionId && session.is_active;
            
            const { data: guests } = await supabaseClient
                .from('session_guests')
                .select('*')
                .eq('session_id', session.session_id);
            
            const approvedGuests = guests ? guests.filter(g => g.status === 'approved') : [];
            const guestCount = approvedGuests.length;
            
            const startDate = new Date(session.created_at);
            const endDate = session.ended_at ? new Date(session.ended_at) : null;
            
            let duration = 'Ongoing';
            if (endDate) {
                const diffMs = endDate - startDate;
                const diffMins = Math.floor(diffMs / 60000);
                const diffHours = Math.floor(diffMins / 60);
                const diffDays = Math.floor(diffHours / 24);
                
                if (diffDays > 0) {
                    duration = `${diffDays}d ${diffHours % 24}h`;
                } else if (diffHours > 0) {
                    duration = `${diffHours}h ${diffMins % 60}m`;
                } else {
                    duration = `${diffMins}m`;
                }
            }
            
            const card = document.createElement('div');
            card.className = 'session-card';
            if (isActive) card.classList.add('active');
            
            card.innerHTML = `
                <div class="session-card-header">
                    <div class="session-header-left">
                        <div class="session-id" title="${session.session_id}">
                            <i class="fas fa-door-open"></i> Room ${i + 1}
                        </div>
                        <div class="session-stats">
                            <div class="stat-item guest-count" title="Approved guests">
                                <i class="fas fa-users"></i>
                                <span>${guestCount} Guests</span>
                            </div>
                            <div class="stat-item duration-badge" title="Session duration">
                                <i class="fas fa-clock"></i>
                                <span>${duration}</span>
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
                        <div class="session-info-section-title">
                            <i class="fas fa-info-circle"></i> Room Information
                        </div>
                        
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
                    
                    ${guests && guests.length > 0 ? `
                    <div class="session-info-section">
                        <div class="session-info-section-title">
                            <i class="fas fa-users"></i> Guests (${guests.length})
                        </div>
                        
                        <div class="guest-list-container">
                            <div class="guest-list">
                                ${guests.slice(0, 3).map(guest => `
                                    <div class="guest-item">
                                        <div class="guest-item-info">
                                            <div class="guest-name">
                                                <i class="fas fa-user"></i>
                                                ${guest.guest_name}
                                            </div>
                                            <div class="guest-meta">
                                                <span title="Status: ${guest.status}">
                                                    <i class="fas fa-${guest.status === 'approved' ? 'check-circle' : guest.status === 'pending' ? 'clock' : 'times-circle'}"></i> 
                                                    ${guest.status}
                                                </span>
                                                <span title="IP: ${guest.guest_ip || 'Unknown'}">
                                                    <i class="fas fa-network-wired"></i> ${guest.guest_ip || 'Unknown'}
                                                </span>
                                            </div>
                                            ${guest.guest_note ? `
                                            <div class="guest-note small">
                                                <i class="fas fa-sticky-note"></i> ${guest.guest_note}
                                            </div>
                                            ` : ''}
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
                                        <div class="guest-name">
                                            <i class="fas fa-ellipsis-h"></i>
                                            ${guests.length - 3} more guests...
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    ` : ''}
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
            
            historyCards.appendChild(card);
        }
        
    } catch (error) {
        console.error("Error loading sessions:", error);
        if (historyCards) {
            historyCards.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">Error loading sessions</div>';
        }
    }
}

// View session history
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

// Return to active chat
function returnToActiveChat() {
    appState.isViewingHistory = false;
    appState.viewingSessionId = null;
    
    if (chatModeIndicator) chatModeIndicator.style.display = 'none';
    if (chatTitle) chatTitle.innerHTML = '<i class="fas fa-comments"></i> Active Chat';
    if (messageInput) {
        messageInput.disabled = false;
        messageInput.placeholder = "Type your message here... (Press Enter to send, Shift+Enter for new line)";
        messageInput.focus();
    }
    if (sendMessageBtn) sendMessageBtn.disabled = false;
    
    loadChatHistory();
}

// Delete session
async function deleteSession(sessionId) {
    if (!appState.isHost) {
        alert("Only hosts can delete sessions.");
        return;
    }
    
    if (!confirm("⚠️ WARNING: Are you sure you want to delete this session?\n\nThis will permanently delete all messages and guest data!\n\nThis action CANNOT be undone!")) {
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('messages')
            .delete()
            .eq('session_id', sessionId);
        
        if (error) throw error;
        
        const { error: guestsError } = await supabaseClient
            .from('session_guests')
            .delete()
            .eq('session_id', sessionId);
        
        if (guestsError) throw guestsError;
        
        const { error: sessionError } = await supabaseClient
            .from('sessions')
            .delete()
            .eq('session_id', sessionId);
        
        if (sessionError) throw sessionError;
        
        if (appState.currentSessionId === sessionId) {
            appState.currentSessionId = null;
            appState.isConnected = false;
            chatMessages.innerHTML = '<div class="message received"><div class="message-sender">System</div><div class="message-content"><div class="message-text">Session was deleted. Please reconnect.</div><div class="message-time">Just now</div></div></div>';
        }
        
        alert("Session deleted successfully!");
        await loadChatSessions();
        
        if (appState.viewingSessionId === sessionId) {
            returnToActiveChat();
        }
        
    } catch (error) {
        console.error("❌ Error deleting session:", error);
        alert("Failed to delete session: " + error.message);
    }
}

// ============================================
// USER MANAGEMENT FUNCTIONS
// ============================================

function setupUserManagementListeners() {
    if (addUserBtn) {
        addUserBtn.addEventListener('click', showAddUserModal);
    }
    
    if (closeAddUserModal) {
        closeAddUserModal.addEventListener('click', () => {
            addUserModal.style.display = 'none';
        });
    }
    
    if (closeEditUserModal) {
        closeEditUserModal.addEventListener('click', () => {
            editUserModal.style.display = 'none';
        });
    }
    
    if (saveUserBtn) {
        saveUserBtn.addEventListener('click', saveNewUser);
    }
    
    if (updateUserBtn) {
        updateUserBtn.addEventListener('click', updateUser);
    }
    
    if (deleteUserBtn) {
        deleteUserBtn.addEventListener('click', deleteUser);
    }
    
    if (userSearchInput) {
        userSearchInput.addEventListener('input', function() {
            searchUsers(this.value.toLowerCase());
        });
    }
}

// Load all users
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
        if (usersList) {
            usersList.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--danger-red);">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>Error loading users</div>
                </div>
            `;
        }
    }
}

// Render users list
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
        
        const lastLogin = user.last_login 
            ? new Date(user.last_login).toLocaleString() 
            : 'Never';
        
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
                <div class="user-detail">
                    <span class="user-detail-label">Last Login:</span>
                    <span class="user-detail-value">${lastLogin}</span>
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

// Show add user modal
function showAddUserModal() {
    if (!appState.isHost) return;
    
    if (newUsername) newUsername.value = '';
    if (newDisplayName) newDisplayName.value = '';
    if (newPassword) newPassword.value = '';
    if (newRole) newRole.value = 'guest';
    if (addUserError) addUserError.style.display = 'none';
    
    addUserModal.style.display = 'flex';
}

// Save new user
async function saveNewUser() {
    if (!appState.isHost) return;
    
    const username = newUsername.value.trim();
    const displayName = newDisplayName.value.trim();
    const password = newPassword.value;
    const role = newRole.value;
    
    if (!username || !displayName || !password) {
        if (addUserError) {
            addUserError.textContent = "All fields are required.";
            addUserError.style.display = 'block';
        }
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('user_management')
            .insert([{
                username: username,
                display_name: displayName,
                password_hash: password,
                role: role,
                created_by: appState.userName,
                is_active: true
            }]);
        
        if (error) throw error;
        
        addUserModal.style.display = 'none';
        await loadUsers();
        alert(`User "${username}" created successfully!`);
        
    } catch (error) {
        console.error("Error creating user:", error);
        if (addUserError) {
            addUserError.textContent = `Error: ${error.message}`;
            addUserError.style.display = 'block';
        }
    }
}

// Edit user modal
function editUserModalOpen(userId) {
    const user = appState.users.find(u => u.id === userId);
    if (!user) return;
    
    if (editUserId) editUserId.value = user.id;
    if (editUsername) editUsername.value = user.username;
    if (editDisplayName) editDisplayName.value = user.display_name;
    if (editPassword) editPassword.value = '';
    if (editRole) editRole.value = user.role;
    if (editIsActive) editIsActive.checked = user.is_active;
    if (editUserError) editUserError.style.display = 'none';
    
    editUserModal.style.display = 'flex';
}

// Update user
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
        
        const { error } = await supabaseClient
            .from('user_management')
            .update(updateData)
            .eq('id', userId);
        
        if (error) throw error;
        
        editUserModal.style.display = 'none';
        await loadUsers();
        alert("User updated successfully!");
        
    } catch (error) {
        console.error("Error updating user:", error);
        if (editUserError) {
            editUserError.textContent = `Error: ${error.message}`;
            editUserError.style.display = 'block';
        }
    }
}

// Delete user
async function deleteUser() {
    if (!appState.isHost) return;
    
    const userId = editUserId.value;
    if (!userId) return;
    
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    
    try {
        const { error } = await supabaseClient
            .from('user_management')
            .delete()
            .eq('id', userId);
        
        if (error) throw error;
        
        editUserModal.style.display = 'none';
        await loadUsers();
        alert("User deleted successfully!");
        
    } catch (error) {
        console.error("Error deleting user:", error);
        alert("Error deleting user: " + error.message);
    }
}

// Search users
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

// ============================================
// VISITOR NOTES FUNCTIONS
// ============================================

// Load visitor notes for host
async function loadVisitorNotes() {
    if (!appState.isHost) return;
    
    try {
        console.log("📝 Loading visitor notes...");
        
        const { data: notes, error } = await supabaseClient
            .from('visitor_notes')
            .select('*')
            .eq('is_archived', false)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        appState.visitorNotes = notes || [];
        appState.unreadNotesCount = appState.visitorNotes.filter(n => !n.read_by_host).length;
        
        updateNotesButtonUI();
        renderVisitorNotes(appState.visitorNotes);
        
        console.log(`✅ Loaded ${appState.visitorNotes.length} visitor notes (${appState.unreadNotesCount} unread)`);
        
    } catch (error) {
        console.error("Error loading visitor notes:", error);
    }
}

// Render visitor notes in panel
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
        
        const createdDate = new Date(note.created_at).toLocaleString();
        
        noteElement.innerHTML = `
            <div class="note-header">
                <div class="note-guest-info">
                    <i class="fas fa-user"></i>
                    <strong>${note.guest_name}</strong>
                    ${!note.read_by_host ? '<span class="unread-badge">New</span>' : ''}
                </div>
                <div class="note-time">
                    <i class="fas fa-clock"></i> ${createdDate}
                </div>
            </div>
            <div class="note-content">
                <div class="note-text">${escapeHtml(note.note_text)}</div>
                ${note.guest_ip ? `<div class="note-ip"><i class="fas fa-network-wired"></i> IP: ${note.guest_ip}</div>` : ''}
            </div>
            <div class="note-actions">
                <button class="btn btn-small btn-success" onclick="markNoteAsRead('${note.id}')" ${note.read_by_host ? 'disabled' : ''}>
                    <i class="fas fa-check"></i> Mark as Read
                </button>
                <button class="btn btn-small btn-info" onclick="archiveNote('${note.id}')">
                    <i class="fas fa-archive"></i> Archive
                </button>
            </div>
        `;
        
        notesList.appendChild(noteElement);
    });
}

// Escape HTML helper
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Mark note as read
window.markNoteAsRead = async function(noteId) {
    if (!appState.isHost) return;
    
    try {
        const { error } = await supabaseClient
            .from('visitor_notes')
            .update({
                read_by_host: true,
                read_at: new Date().toISOString(),
                host_id: appState.userId
            })
            .eq('id', noteId);
        
        if (error) throw error;
        
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

// Archive note
window.archiveNote = async function(noteId) {
    if (!appState.isHost) return;
    
    if (!confirm("Are you sure you want to archive this note?")) return;
    
    try {
        const { error } = await supabaseClient
            .from('visitor_notes')
            .update({
                is_archived: true
            })
            .eq('id', noteId);
        
        if (error) throw error;
        
        appState.visitorNotes = appState.visitorNotes.filter(n => n.id !== noteId);
        appState.unreadNotesCount = appState.visitorNotes.filter(n => !n.read_by_host).length;
        
        updateNotesButtonUI();
        renderVisitorNotes(appState.visitorNotes);
        
    } catch (error) {
        console.error("Error archiving note:", error);
    }
};

// Toggle notes panel
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

// Search notes
function searchNotes(searchTerm) {
    if (!searchTerm) {
        renderVisitorNotes(appState.visitorNotes);
        return;
    }
    
    const filtered = appState.visitorNotes.filter(note => 
        note.guest_name.toLowerCase().includes(searchTerm) ||
        note.note_text.toLowerCase().includes(searchTerm) ||
        (note.guest_ip && note.guest_ip.includes(searchTerm))
    );
    
    renderNotes(filtered);
}

// Update notes button UI
function updateNotesButtonUI() {
    if (!notesBtn || !notesCount) return;
    
    notesCount.textContent = appState.unreadNotesCount;
    
    if (appState.unreadNotesCount > 0) {
        notesBtn.classList.add('has-unread');
        notesCount.style.display = 'inline';
    } else {
        notesBtn.classList.remove('has-unread');
        notesCount.style.display = 'none';
    }
}

// Mark all notes as read
async function markAllNotesAsRead() {
    if (!appState.isHost) return;
    
    const unreadNotes = appState.visitorNotes.filter(n => !n.read_by_host);
    
    if (unreadNotes.length === 0) {
        alert("No unread notes to mark.");
        return;
    }
    
    try {
        const { error } = await supabaseClient
            .from('visitor_notes')
            .update({
                read_by_host: true,
                read_at: new Date().toISOString(),
                host_id: appState.userId
            })
            .in('id', unreadNotes.map(n => n.id));
        
        if (error) throw error;
        
        appState.visitorNotes.forEach(note => {
            note.read_by_host = true;
        });
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
    fullSizeImage.src = src;
    imageModal.style.display = 'flex';
};

window.editMessage = async function(messageId) {
    const newText = prompt("Edit your message:");
    if (newText !== null && newText.trim() !== '') {
        try {
            const { error } = await supabaseClient
                .from('messages')
                .update({
                    message: newText.trim(),
                    edited_at: new Date().toISOString()
                })
                .eq('id', messageId)
                .eq('sender_id', appState.userId);
            
            if (error) throw error;
            
            const messageElement = document.getElementById(`msg-${messageId}`);
            if (messageElement) {
                const textElement = messageElement.querySelector('.message-text');
                if (textElement) {
                    textElement.innerHTML = `${newText.trim()} <small style="opacity:0.7;">(edited)</small>`;
                }
            }
        } catch (error) {
            console.error("Error editing message:", error);
            alert("Failed to edit message.");
        }
    }
};

window.deleteMessage = async function(messageId) {
    if (!confirm("Are you sure you want to delete this message?")) return;
    
    try {
        const { error } = await supabaseClient
            .from('messages')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: appState.userId
            })
            .eq('id', messageId);
        
        if (error) throw error;
        
        const messageElement = document.getElementById(`msg-${messageId}`);
        if (messageElement) {
            messageElement.innerHTML = `
                <div class="message-sender">${appState.userName}</div>
                <div class="message-content">
                    <div class="message-text"><i>Message deleted</i></div>
                    <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            `;
        }
    } catch (error) {
        console.error("Error deleting message:", error);
        alert("Failed to delete message.");
    }
};

window.replyToMessage = function(messageId) {
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (messageElement) {
        const sender = messageElement.querySelector('.message-sender').textContent;
        const text = messageElement.querySelector('.message-text').textContent;
        messageInput.value = `Replying to ${sender}: ${text}\n`;
        messageInput.focus();
    }
};

// Make functions global
window.approveGuest = approveGuest;
window.denyGuest = denyGuest;
window.kickGuest = kickGuest;
window.viewSessionHistory = viewSessionHistory;
window.deleteSession = deleteSession;
window.editUserModalOpen = editUserModalOpen;
window.viewPendingGuestsNow = function() {
    showPendingGuests();
    document.querySelectorAll('.guest-notification').forEach(n => n.remove());
};

// Show session guests
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
        const kickedGuests = guests.filter(g => g.status === 'kicked');
        
        let guestInfo = `
            <div class="guest-details-modal">
                <h3><i class="fas fa-users"></i> Guest Details</h3>
                <p><strong>Session ID:</strong> ${sessionId.substring(0, 20)}...</p>
                
                <div class="guest-status-section">
                    <h4><i class="fas fa-check-circle" style="color: var(--success-green);"></i> Approved Guests (${approvedGuests.length})</h4>
                    ${approvedGuests.length > 0 ? approvedGuests.map(g => `
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
                
                ${pendingGuests.length > 0 ? `
                <div class="guest-status-section">
                    <h4><i class="fas fa-clock" style="color: var(--warning-yellow);"></i> Pending Guests (${pendingGuests.length})</h4>
                    ${pendingGuests.map(g => `
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
                
                ${kickedGuests.length > 0 ? `
                <div class="guest-status-section">
                    <h4><i class="fas fa-user-slash" style="color: var(--danger-red);"></i> Kicked Guests (${kickedGuests.length})</h4>
                    ${kickedGuests.map(g => `
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
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px; max-height: 80vh;">
                <div class="modal-header">
                    <h2><i class="fas fa-users"></i> Session Guests</h2>
                    <button class="btn btn-secondary btn-small close-guest-modal">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
                <div class="modal-body" style="overflow-y: auto;">
                    ${guestInfo}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-guest-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
    } catch (error) {
        console.error("Error loading session guests:", error);
        alert("Failed to load guest details.");
    }
};

// Debug function
window.debugPendingSystem = async function() {
    console.log("🔍 Debugging pending guests system...");
    console.log("Is host:", appState.isHost);
    console.log("Current session ID:", appState.currentSessionId);
    console.log("User ID:", appState.userId);
    
    const { data: guests, error } = await supabaseClient
        .from('session_guests')
        .select('*')
        .eq('session_id', appState.currentSessionId)
        .eq('status', 'pending');
    
    if (error) {
        console.error("Error fetching guests:", error);
    } else {
        console.log("Pending guests in DB:", guests);
        appState.pendingGuests = guests || [];
        updatePendingButtonUI();
    }
    
    return guests;
};

// Initialize the app
document.addEventListener('DOMContentLoaded', initApp);

// Auto-resize textarea
if (messageInput) {
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}
