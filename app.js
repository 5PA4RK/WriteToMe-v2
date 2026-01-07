
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
    isViewingUsers: false
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

// ============================================
// CORE FUNCTIONS - FIXED VERSION
// ============================================

// Modal control functions
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

// Initialize the app
async function initApp() {
    console.log("🚀 Initializing WriteToMira App...");
    
    const mainContainer = document.querySelector('.main-container') || document.querySelector('.app-container');
    if (mainContainer) {
        mainContainer.style.display = 'none';
    }
    
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

// Reconnect to existing session
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

// Setup all event listeners
function setupEventListeners() {
    // Connection modal
    if (usernameInput) {
        usernameInput.addEventListener('input', function() {
            if (passwordError) passwordError.style.display = 'none';
            updatePasswordHint(this.value);
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
        imageModal.addEventListener('click', () => {
            imageModal.style.display = 'none';
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
}

// Tab switching function
function switchAdminTab(tabName) {
    if (!appState.isHost) return;
    
    if (historyTabBtn && usersTabBtn) {
        historyTabBtn.classList.remove('active');
        usersTabBtn.classList.remove('active');
    }
    
    if (historyTabContent && usersTabContent) {
        historyTabContent.classList.remove('active');
        usersTabContent.classList.remove('active');
    }
    
    if (tabName === 'history') {
        if (historyTabBtn) historyTabBtn.classList.add('active');
        if (historyTabContent) historyTabContent.classList.add('active');
        loadChatSessions();
    } else if (tabName === 'users') {
        if (usersTabBtn) usersTabBtn.classList.add('active');
        if (usersTabContent) usersTabContent.classList.add('active');
        loadUsers();
    }
}

// Handle connection
async function handleConnect() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
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
        
        // First check if user exists
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
            // Try RPC function first
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
        
        // Fallback for test accounts (development only)
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
        
        // Authentication successful
        appState.isHost = userData.role === 'host';
        appState.userName = userData.display_name || userData.username;
        appState.userId = userData.id;
        appState.connectionTime = new Date();
        
        console.log("✅ Authentication successful:", {
            name: appState.userName,
            id: appState.userId,
            isHost: appState.isHost
        });
        
        // Update last login
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
        
        // Get user IP
        const userIP = await getRealIP();
        
        // Connect based on role
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

// Connect as host
async function connectAsHost(userIP) {
    try {
        console.log("👑 Connecting as host...");
        
        const sessionId = 'session_' + Date.now().toString(36);
        
        // Create session
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
        
        // Update app state
        appState.sessionId = sessionId;
        appState.currentSessionId = sessionId;
        appState.isConnected = true;
        
        // Save to localStorage
        saveSessionToStorage();
        
        // Close modal and update UI
        connectionModal.style.display = 'none';
        resetConnectButton();
        updateUIAfterConnection();
        
        // Set up subscriptions
        setupRealtimeSubscriptions();
        setupPendingGuestsSubscription();
        
        // Load data
        await loadPendingGuests();
        await loadChatHistory();
        await loadChatSessions();
        
        // Send welcome message
        await saveMessageToDB('System', `${appState.userName} has created a new chat session.`);
        
        console.log("✅ Host connection completed successfully!");
        
    } catch (error) {
        console.error("Error in host connection:", error);
        alert("An error occurred: " + error.message);
        resetConnectButton();
        appState.isConnected = false;
        appState.currentSessionId = null;
        localStorage.removeItem('writeToMe_session');
    }
}

// Connect as guest
async function connectAsGuest(userIP) {
    try {
        console.log("👤 Connecting as guest...");
        
        // Find active session
        const { data: activeSessions, error: sessionsError } = await supabaseClient
            .from('sessions')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (sessionsError || !activeSessions || activeSessions.length === 0) {
            alert("No active session found. Ask the host to create a session.");
            resetConnectButton();
            return;
        }
        
        const session = activeSessions[0];
        console.log("Found active session:", session.session_id);
        
        // Check if already approved
        const { data: existingGuest } = await supabaseClient
            .from('session_guests')
            .select('*')
            .eq('session_id', session.session_id)
            .eq('guest_id', appState.userId)
            .eq('status', 'approved')
            .single();
        
        if (existingGuest) {
            console.log("Guest already approved, connecting directly");
            completeGuestConnection(session.session_id);
            return;
        }
        
        // Check if already pending
        const { data: pendingGuest } = await supabaseClient
            .from('session_guests')
            .select('*')
            .eq('session_id', session.session_id)
            .eq('guest_id', appState.userId)
            .eq('status', 'pending')
            .single();
        
        if (pendingGuest) {
            console.log("Guest already pending");
            appState.sessionId = session.session_id;
            connectionModal.style.display = 'none';
            resetConnectButton();
            updateUIForPendingGuest();
            setupPendingApprovalSubscription(session.session_id);
            return;
        }
        
        // Add to pending guests
        const { error: insertError } = await supabaseClient
            .from('session_guests')
            .insert([{
                session_id: session.session_id,
                guest_id: appState.userId,
                guest_name: appState.userName,
                guest_ip: userIP,
                status: 'pending',
                requested_at: new Date().toISOString()
            }]);
        
        if (insertError) {
            console.error("Error adding to pending:", insertError);
            alert("Failed to request access: " + insertError.message);
            resetConnectButton();
            return;
        }
        
        console.log("✅ Guest added to pending list");
        appState.sessionId = session.session_id;
        connectionModal.style.display = 'none';
        resetConnectButton();
        updateUIForPendingGuest();
        setupPendingApprovalSubscription(session.session_id);
        
    } catch (error) {
        console.error("Error in guest connection:", error);
        alert("An error occurred: " + error.message);
        resetConnectButton();
    }
}

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
// PENDING GUESTS SYSTEM - FIXED VERSION
// ============================================

// Setup pending guests subscription - COMPLETELY REWRITTEN
function setupPendingGuestsSubscription() {
    console.log("🔄 Setting up pending guests subscription...");
    
    // Remove existing subscription
    if (appState.pendingSubscription) {
        supabaseClient.removeChannel(appState.pendingSubscription);
        appState.pendingSubscription = null;
    }
    
    if (!appState.isHost || !appState.currentSessionId) {
        console.log("⚠️ Cannot setup pending subscription: Not host or no session ID");
        return;
    }
    
    // Create a new channel with a unique name
    const channelName = `pending-guests-${appState.currentSessionId}-${Date.now()}`;
    
    appState.pendingSubscription = supabaseClient
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: '*', // Listen to ALL events (INSERT, UPDATE, DELETE)
                schema: 'public',
                table: 'session_guests',
                filter: `session_id=eq.${appState.currentSessionId} AND status=eq.pending`
            },
            async (payload) => {
                console.log('📡 Pending guest change detected:', payload.eventType, payload.new || payload.old);
                
                // Force refresh the pending guests list
                await loadPendingGuests();
                
                // Show notification for new guests
                if (payload.eventType === 'INSERT' && payload.new) {
                    showNewGuestNotification(payload.new);
                }
                
                // Update modal if open
                if (pendingGuestsModal.style.display === 'flex') {
                    showPendingGuests();
                }
            }
        )
        .subscribe((status, err) => {
            console.log('📡 Pending subscription status:', status);
            if (status === 'SUBSCRIBED') {
                console.log('✅ SUCCESS: Pending guests subscription active');
            } else if (err) {
                console.error('❌ Pending subscription error:', err);
                // Try to reconnect after 3 seconds
                setTimeout(setupPendingGuestsSubscription, 3000);
            }
        });
}

// Load pending guests - IMPROVED
async function loadPendingGuests() {
    if (!appState.isHost || !appState.currentSessionId) {
        console.log("Cannot load pending guests: Not host or no session ID");
        if (pendingGuestsBtn) pendingGuestsBtn.style.display = 'none';
        return;
    }
    
    try {
        console.log("🔄 Loading pending guests...");
        
        const { data: guests, error } = await supabaseClient
            .from('session_guests')
            .select('*')
            .eq('session_id', appState.currentSessionId)
            .eq('status', 'pending')
            .order('requested_at', { ascending: true });
        
        if (error) {
            console.error("Error loading pending guests:", error);
            appState.pendingGuests = [];
            updatePendingButtonUI();
            return;
        }
        
        appState.pendingGuests = guests || [];
        console.log(`✅ Loaded ${appState.pendingGuests.length} pending guests`);
        
        updatePendingButtonUI();
        
    } catch (error) {
        console.error("Error in loadPendingGuests:", error);
        appState.pendingGuests = [];
        updatePendingButtonUI();
    }
}

// Show pending guests modal - IMPROVED
async function showPendingGuests() {
    if (!pendingGuestsList) return;
    
    console.log("Showing pending guests modal...");
    
    try {
        // Refresh data first
        await loadPendingGuests();
        
        pendingGuestsList.innerHTML = '';
        
        if (appState.pendingGuests.length === 0) {
            if (noPendingGuests) {
                noPendingGuests.style.display = 'block';
                noPendingGuests.innerHTML = '<i class="fas fa-check-circle"></i> No pending guest requests';
            }
        } else {
            if (noPendingGuests) noPendingGuests.style.display = 'none';
            
            appState.pendingGuests.forEach((guest) => {
                const guestDiv = document.createElement('div');
                guestDiv.className = 'pending-guest';
                guestDiv.innerHTML = `
                    <div class="guest-info">
                        <div class="guest-name">
                            <i class="fas fa-user"></i>
                            <strong>${guest.guest_name}</strong>
                        </div>
                        <div class="guest-details">
                            <small>Requested: ${new Date(guest.requested_at).toLocaleString()}</small>
                            <small>IP: ${guest.guest_ip || 'Unknown'}</small>
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
        
        pendingGuestsModal.style.display = 'flex';
        
    } catch (error) {
        console.error("Error showing pending guests:", error);
        if (noPendingGuests) {
            noPendingGuests.style.display = 'block';
            noPendingGuests.innerHTML = '<i class="fas fa-exclamation-circle"></i> Error loading pending guests';
        }
    }
}

// Show notification for new pending guest
function showNewGuestNotification(guest) {
    if (!appState.isHost) return;
    
    console.log("🔔 New guest notification:", guest.guest_name);
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'guest-notification';
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-user-plus" style="color: var(--accent-light); font-size: 20px;"></i>
            <div class="notification-text">
                <strong>New Guest Request!</strong>
                <small>${guest.guest_name} wants to join</small>
            </div>
            <button class="btn btn-small btn-success" onclick="viewPendingGuestsNow()">
                <i class="fas fa-eye"></i> View
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Play sound if enabled
    if (appState.soundEnabled) {
        try {
            messageSound.currentTime = 0;
            messageSound.play().catch(e => console.log("Sound play failed:", e));
        } catch (e) {
            console.log("Sound error:", e);
        }
    }
    
    // Auto remove after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) notification.remove();
    }, 10000);
}

// Helper to view pending guests immediately
function viewPendingGuestsNow() {
    showPendingGuests();
    // Remove all notifications
    document.querySelectorAll('.guest-notification').forEach(n => n.remove());
}

// Update pending button UI
function updatePendingButtonUI() {
    if (!pendingGuestsBtn || !pendingCount) return;
    
    const count = appState.pendingGuests.length;
    pendingCount.textContent = count;
    
    if (count > 0) {
        pendingGuestsBtn.style.display = 'flex';
        pendingGuestsBtn.classList.add('has-pending');
        pendingGuestsBtn.style.animation = 'pulsePending 2s infinite';
    } else {
        pendingGuestsBtn.style.display = 'flex';
        pendingGuestsBtn.classList.remove('has-pending');
        pendingGuestsBtn.style.animation = 'none';
    }
}

// Approve a guest
async function approveGuest(guestRecordId) {
    try {
        // Get guest details
        const { data: guest } = await supabaseClient
            .from('session_guests')
            .select('*')
            .eq('id', guestRecordId)
            .single();
        
        if (!guest) throw new Error("Guest not found");
        
        // Update status
        const { error } = await supabaseClient
            .from('session_guests')
            .update({
                status: 'approved',
                approved_at: new Date().toISOString()
            })
            .eq('id', guestRecordId);
        
        if (error) throw error;
        
        // Update local state
        appState.pendingGuests = appState.pendingGuests.filter(g => g.id !== guestRecordId);
        updatePendingButtonUI();
        
        // Refresh modal if open
        if (pendingGuestsModal.style.display === 'flex') {
            showPendingGuests();
        }
        
        // Send system message
        await saveMessageToDB('System', `${guest.guest_name} has been approved and joined the chat.`);
        
        console.log(`✅ Approved guest: ${guest.guest_name}`);
        
    } catch (error) {
        console.error("Error approving guest:", error);
        alert("Failed to approve guest: " + error.message);
    }
}

// Deny a guest
async function denyGuest(guestRecordId) {
    try {
        const { data: guest } = await supabaseClient
            .from('session_guests')
            .select('*')
            .eq('id', guestRecordId)
            .single();
        
        if (!guest) throw new Error("Guest not found");
        
        const { error } = await supabaseClient
            .from('session_guests')
            .update({
                status: 'rejected',
                left_at: new Date().toISOString()
            })
            .eq('id', guestRecordId);
        
        if (error) throw error;
        
        appState.pendingGuests = appState.pendingGuests.filter(g => g.id !== guestRecordId);
        updatePendingButtonUI();
        
        if (pendingGuestsModal.style.display === 'flex') {
            showPendingGuests();
        }
        
        console.log(`❌ Denied guest: ${guest.guest_name}`);
        
    } catch (error) {
        console.error("Error denying guest:", error);
        alert("Failed to deny guest: " + error.message);
    }
}

// Setup pending approval subscription for guest
function setupPendingApprovalSubscription(sessionId) {
    console.log("⏳ Setting up pending approval subscription for guest...");
    
    if (appState.pendingSubscription) {
        supabaseClient.removeChannel(appState.pendingSubscription);
        appState.pendingSubscription = null;
    }
    
    const channelName = `guest-approval-${sessionId}-${appState.userId}`;
    
    appState.pendingSubscription = supabaseClient
        .channel(channelName)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'session_guests',
                filter: `session_id=eq.${sessionId} AND guest_id=eq.${appState.userId}`
            },
            async (payload) => {
                console.log('Guest approval update:', payload.new);
                
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
                    
                } else if (payload.new.status === 'rejected') {
                    console.log("❌ Guest has been REJECTED");
                    alert("Your access request was rejected by the host.");
                    location.reload();
                }
            }
        )
        .subscribe((status) => {
            console.log('Guest approval subscription status:', status);
            if (status === 'SUBSCRIBED') {
                console.log('✅ Guest approval subscription active');
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
    
    console.log("📡 Setting up real-time subscriptions...");
    
    // Remove existing subscriptions
    if (appState.realtimeSubscription) {
        supabaseClient.removeChannel(appState.realtimeSubscription);
        appState.realtimeSubscription = null;
    }
    
    if (appState.typingSubscription) {
        supabaseClient.removeChannel(appState.typingSubscription);
        appState.typingSubscription = null;
    }
    
    // Messages subscription
    appState.realtimeSubscription = supabaseClient
        .channel(`messages-${appState.currentSessionId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `session_id=eq.${appState.currentSessionId}`
            },
            (payload) => {
                if (payload.new.sender_id !== appState.userId && !appState.isViewingHistory) {
                    displayMessage({
                        id: payload.new.id,
                        sender: payload.new.sender_name,
                        text: payload.new.message,
                        image: payload.new.image_url,
                        time: new Date(payload.new.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                        type: 'received',
                        is_historical: false
                    });
                    
                    if (appState.soundEnabled) {
                        try {
                            messageSound.currentTime = 0;
                            messageSound.play().catch(e => console.log("Audio play failed:", e));
                        } catch (e) {
                            console.log("Audio error:", e);
                        }
                    }
                }
            }
        )
        .subscribe((status, err) => {
            console.log('Messages subscription:', status);
            if (err) console.error('Messages subscription error:', err);
        });
    
    // Typing subscription
    appState.typingSubscription = supabaseClient
        .channel(`typing-${appState.currentSessionId}`)
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
                        typingIndicator.classList.remove('show');
                    }, 3000);
                }
            }
        )
        .subscribe((status, err) => {
            console.log('Typing subscription:', status);
            if (err) console.error('Typing subscription error:', err);
        });
}

// Check and reconnect subscriptions
function checkAndReconnectSubscriptions() {
    if (!appState.isConnected || !appState.currentSessionId) return;
    
    console.log("🔍 Checking subscription health...");
    
    // Reconnect messages if needed
    if (!appState.realtimeSubscription || appState.realtimeSubscription.state !== 'joined') {
        console.log("🔄 Reconnecting messages subscription...");
        setupRealtimeSubscriptions();
    }
    
    // Reconnect pending guests if host
    if (appState.isHost && (!appState.pendingSubscription || appState.pendingSubscription.state !== 'joined')) {
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
        
        const { error } = await supabaseClient
            .from('messages')
            .insert([messageData]);
        
        if (error) throw error;
        
        displayMessage({
            id: 'temp_' + Date.now(),
            sender: appState.userName,
            text: text,
            image: imageUrl,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'sent',
            is_historical: false
        });
        
        return { success: true };
        
    } catch (error) {
        console.error("Error sending message:", error);
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
                .select('created_at')
                .eq('session_id', sessionId)
                .single();
            
            const historyHeader = document.createElement('div');
            historyHeader.className = 'message received historical';
            historyHeader.innerHTML = `
                <div class="message-sender">System</div>
                <div class="message-content">
                    <div class="message-text">Historical Chat - ${new Date(session.created_at).toLocaleDateString()}</div>
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
    
    if (adminSection) {
        adminSection.style.display = appState.isHost ? 'block' : 'none';
        if (appState.isHost) switchAdminTab('history');
    }
    
    if (pendingGuestsBtn) {
        pendingGuestsBtn.style.display = appState.isHost && appState.currentSessionId ? 'flex' : 'none';
        if (appState.isHost) setupPendingGuestsSubscription();
    }
    
    if (appState.isViewingHistory) returnToActiveChat();
}

// Handle logout
async function handleLogout() {
    if (!confirm("Are you sure you want to logout?")) return;
    
    // Clear UI
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
    
    // Update database
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
    
    // Remove subscriptions
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
    
    // Clear storage and reset state
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
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB.");
        return;
    }
    
    if (!file.type.startsWith('image/')) {
        alert("Please select an image file.");
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        messageInput.value = `[Image: ${file.name}]`;
        sendMessage();
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
        
        for (const session of sessions) {
            const isActive = session.session_id === appState.currentSessionId && session.is_active;
            
            // Get guests
            const { data: guests } = await supabaseClient
                .from('session_guests')
                .select('guest_name, approved_at, status')
                .eq('session_id', session.session_id)
                .eq('status', 'approved');
            
            const guestCount = guests ? guests.length : 0;
            let guestNames = 'None';
            
            if (guests && guests.length > 0) {
                if (guests.length <= 3) {
                    guestNames = guests.map(g => g.guest_name).join(', ');
                } else {
                    const firstTwo = guests.slice(0, 2).map(g => g.guest_name).join(', ');
                    guestNames = `${firstTwo} + ${guests.length - 2} more`;
                }
            }
            
            // Format dates
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
            
            const hostIP = appState.isHost ? (session.host_ip || 'N/A') : '***';
            
            const card = document.createElement('div');
            card.className = 'session-card';
            if (isActive) card.classList.add('active');
            
            card.innerHTML = `
                <div class="session-card-header">
                    <div class="session-header-left">
                        <div class="session-id">${session.session_id.substring(0, 12)}...</div>
                        <div class="session-stats">
                            <span class="guest-count">
                                <i class="fas fa-users"></i> ${guestCount}
                            </span>
                        </div>
                    </div>
                    ${isActive ? '<div class="session-active-badge">Active Now</div>' : ''}
                </div>
                
                <div class="session-info">
                    <div class="session-info-section">
                        <div class="session-info-row">
                            <span class="session-info-label">Host:</span>
                            <span class="session-info-value">${session.host_name || 'Unknown'}</span>
                        </div>
                        <div class="session-info-row">
                            <span class="session-info-label">Host IP:</span>
                            <span class="session-info-value">${hostIP}</span>
                        </div>
                    </div>
                    
                    <div class="session-info-section">
                        <div class="session-info-row">
                            <span class="session-info-label">Guests:</span>
                            <span class="session-info-value" title="${guests ? guests.map(g => g.guest_name).join(', ') : 'None'}">
                                ${guestNames}
                            </span>
                        </div>
                        <div class="session-info-row">
                            <span class="session-info-label">Max Guests:</span>
                            <span class="session-info-value">${session.max_guests || 10}</span>
                        </div>
                    </div>
                    
                    <div class="session-info-section">
                        <div class="session-info-row">
                            <span class="session-info-label">Started:</span>
                            <span class="session-info-value">${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div class="session-info-row">
                            <span class="session-info-label">${endDate ? 'Ended:' : 'Status:'}</span>
                            <span class="session-info-value">
                                ${endDate ? 
                                    `${endDate.toLocaleDateString()} ${endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 
                                    'Active'
                                }
                            </span>
                        </div>
                    </div>
                    
                    <div class="session-info-section">
                        <div class="session-info-row">
                            <span class="session-info-label">Duration:</span>
                            <span class="session-info-value">${duration}</span>
                        </div>
                        <div class="session-info-row">
                            <span class="session-info-label">Requires Approval:</span>
                            <span class="session-info-value">${session.requires_approval ? 'Yes' : 'No'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="session-actions">
                    <button class="btn btn-secondary btn-small" onclick="viewSessionHistory('${session.session_id}')">
                        <i class="fas fa-eye"></i> View Chat
                    </button>
                    <button class="btn btn-info btn-small" onclick="showSessionGuests('${session.session_id}')">
                        <i class="fas fa-users"></i> Guests
                    </button>
                    ${appState.isHost ? `
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
    if (chatTitle) chatTitle.innerHTML = '<i class="fas fa-history"></i> Historical Chat';
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
    if (!confirm("Are you sure you want to delete this session? This action cannot be undone.")) return;
    
    try {
        await supabaseClient
            .from('messages')
            .delete()
            .eq('session_id', sessionId);
        
        await supabaseClient
            .from('sessions')
            .delete()
            .eq('session_id', sessionId);
        
        loadChatSessions();
        
        if (appState.viewingSessionId === sessionId) {
            returnToActiveChat();
        }
        
    } catch (error) {
        console.error("Error deleting session:", error);
        alert("Failed to delete session.");
    }
}

// ============================================
// USER MANAGEMENT FUNCTIONS
// ============================================

function setupUserManagementListeners() {
    // Add user button
    if (addUserBtn) {
        addUserBtn.addEventListener('click', showAddUserModal);
    }
    
    // Close modals
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
    
    // Save new user
    if (saveUserBtn) {
        saveUserBtn.addEventListener('click', saveNewUser);
    }
    
    // Update user
    if (updateUserBtn) {
        updateUserBtn.addEventListener('click', updateUser);
    }
    
    // Delete user
    if (deleteUserBtn) {
        deleteUserBtn.addEventListener('click', deleteUser);
    }
    
    // Search users
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

window.approveGuest = approveGuest;
window.denyGuest = denyGuest;
window.viewSessionHistory = viewSessionHistory;
window.deleteSession = deleteSession;
window.editUserModalOpen = editUserModalOpen;
window.viewPendingGuestsNow = viewPendingGuestsNow;

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
                                <small>IP: ${g.guest_ip || 'Unknown'}</small>
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
                                <small>IP: ${g.guest_ip || 'Unknown'}</small>
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

// Initialize the app
document.addEventListener('DOMContentLoaded', initApp);

// Auto-resize textarea
if (messageInput) {
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });
}
