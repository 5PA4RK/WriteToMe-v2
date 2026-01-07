// ============================================
// CONFIGURATION & INITIALIZATION
// ============================================

const CONFIG = {
    SUPABASE_URL: 'https://plqvqenoroacvzwtgoxq.supabase.co',
    SUPABASE_ANON_KEY: 'sb_publishable_91IHQ5--y4tDIo8L9X2ZJQ_YeThfdu_',
    TEST_PASSWORDS: {
        'guest': 'guest123',
        'host': 'host123',
        'admin': 'admin123'
    },
    MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
    TYPING_TIMEOUT: 1000,
    NOTIFICATION_DURATION: 10000
};

const supabaseClient = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);

// ============================================
// STATE MANAGEMENT
// ============================================

const appState = {
    // User state
    user: {
        isHost: false,
        isConnected: false,
        name: "Guest",
        id: null
    },
    
    // Session state
    session: {
        id: null,
        currentId: null,
        viewingId: null,
        isViewingHistory: false
    },
    
    // Data state
    data: {
        messages: [],
        pendingGuests: [],
        users: [],
        emojis: ["😀", "😂", "😍", "😎", "😭", "😡", "👍", "👎", "❤️", "🔥", "👏", "🙏", "🤔", "😴", "🥳"]
    },
    
    // UI state
    ui: {
        isViewingUsers: false,
        soundEnabled: true,
        typingTimeout: null
    },
    
    // Subscriptions
    subscriptions: {
        realtime: null,
        typing: null,
        pending: null
    },
    
    // Timestamps
    timestamps: {
        connectionTime: null
    }
};

// ============================================
// DOM CACHE - Single point of reference
// ============================================

const DOM = {
    // Modals
    modals: {
        connection: document.getElementById('connectionModal'),
        pending: document.getElementById('pendingGuestsModal'),
        image: document.getElementById('imageModal'),
        addUser: document.getElementById('addUserModal'),
        editUser: document.getElementById('editUserModal')
    },
    
    // Inputs
    inputs: {
        username: document.getElementById('usernameInput'),
        password: document.getElementById('passwordInput'),
        message: document.getElementById('messageInput'),
        image: document.getElementById('imageUpload')
    },
    
    // Buttons
    buttons: {
        connect: document.getElementById('connectBtn'),
        logout: document.getElementById('logoutBtn'),
        sendMessage: document.getElementById('sendMessageBtn'),
        clearChat: document.getElementById('clearChatBtn'),
        pendingGuests: document.getElementById('pendingGuestsBtn'),
        returnToActive: document.getElementById('returnToActiveBtn'),
        refreshHistory: document.getElementById('refreshHistoryBtn'),
        soundControl: document.getElementById('soundControl'),
        emojiBtn: document.getElementById('emojiBtn')
    },
    
    // Displays
    displays: {
        status: document.getElementById('statusIndicator'),
        userRole: document.getElementById('userRoleDisplay'),
        pendingCount: document.getElementById('pendingCount'),
        chatMessages: document.getElementById('chatMessages'),
        typingIndicator: document.getElementById('typingIndicator'),
        typingUser: document.getElementById('typingUser'),
        chatTitle: document.getElementById('chatTitle'),
        chatModeIndicator: document.getElementById('chatModeIndicator'),
        fullSizeImage: document.getElementById('fullSizeImage'),
        emojiPicker: document.getElementById('emojiPicker')
    },
    
    // Sections
    sections: {
        admin: document.getElementById('adminSection'),
        historyCards: document.getElementById('historyCards'),
        usersList: document.getElementById('usersList'),
        userManagement: document.getElementById('userManagementSection')
    },
    
    // Error displays
    errors: {
        password: document.getElementById('passwordError'),
        addUser: document.getElementById('addUserError'),
        editUser: document.getElementById('editUserError')
    },
    
    // Lists
    lists: {
        pendingGuests: document.getElementById('pendingGuestsList'),
        noPendingGuests: document.getElementById('noPendingGuests')
    }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

const Utils = {
    // DOM Helper
    showElement(el) {
        if (el) el.style.display = 'flex';
    },
    
    hideElement(el) {
        if (el) el.style.display = 'none';
    },
    
    disableElement(el) {
        if (el) el.disabled = true;
    },
    
    enableElement(el) {
        if (el) el.disabled = false;
    },
    
    // Formatting
    formatTime(date) {
        return new Date(date).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    },
    
    formatDate(date) {
        return new Date(date).toLocaleDateString();
    },
    
    formatDateTime(date) {
        return new Date(date).toLocaleString();
    },
    
    // Validation
    isValidImage(file) {
        if (!file) return false;
        if (file.size > CONFIG.MAX_IMAGE_SIZE) return false;
        if (!file.type.startsWith('image/')) return false;
        return true;
    },
    
    // Debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Storage
    saveSession() {
        const sessionData = {
            user: {
                isHost: appState.user.isHost,
                name: appState.user.name,
                id: appState.user.id
            },
            session: {
                id: appState.session.id,
                currentId: appState.session.currentId
            },
            ui: {
                soundEnabled: appState.ui.soundEnabled
            },
            timestamps: {
                connectionTime: appState.timestamps.connectionTime
            }
        };
        localStorage.setItem('writeToMe_session', JSON.stringify(sessionData));
    },
    
    clearSession() {
        localStorage.removeItem('writeToMe_session');
    },
    
    loadSession() {
        const saved = localStorage.getItem('writeToMe_session');
        return saved ? JSON.parse(saved) : null;
    },
    
    // Network
    async getIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip || "Unknown";
        } catch {
            return "Unknown";
        }
    },
    
    // String helpers
    truncate(str, length) {
        return str.length > length ? str.substring(0, length) + '...' : str;
    }
};

// ============================================
// MODAL MANAGEMENT
// ============================================

const ModalManager = {
    showConnectionModal() {
        Utils.showElement(DOM.modals.connection);
        document.body.classList.add('modal-open');
        
        // Reset inputs
        if (DOM.inputs.username) DOM.inputs.username.value = '';
        if (DOM.inputs.password) DOM.inputs.password.value = '';
        
        // Reset error
        if (DOM.errors.password) {
            DOM.errors.password.style.display = 'none';
        }
        
        // Reset button
        if (DOM.buttons.connect) {
            DOM.buttons.connect.disabled = false;
            DOM.buttons.connect.innerHTML = '<i class="fas fa-plug"></i> Connect';
        }
        
        // Clear password hint
        const passwordHint = document.getElementById('passwordHint');
        if (passwordHint) passwordHint.style.display = 'none';
    },
    
    hideConnectionModal() {
        Utils.hideElement(DOM.modals.connection);
        document.body.classList.remove('modal-open');
    },
    
    showPendingModal() {
        Utils.showElement(DOM.modals.pending);
    },
    
    hidePendingModal() {
        Utils.hideElement(DOM.modals.pending);
    },
    
    showImageModal(src) {
        if (DOM.displays.fullSizeImage && DOM.modals.image) {
            DOM.displays.fullSizeImage.src = src;
            Utils.showElement(DOM.modals.image);
        }
    },
    
    hideImageModal() {
        Utils.hideElement(DOM.modals.image);
    }
};

// ============================================
// AUTHENTICATION MANAGER
// ============================================

const AuthManager = {
    async authenticate(username, password) {
        // Input validation
        if (!username || !password) {
            throw new Error("Please enter both username and password");
        }
        
        try {
            // Check user in database
            const { data: user, error } = await supabaseClient
                .from('user_management')
                .select('id, username, display_name, password_hash, role, is_active')
                .eq('username', username)
                .eq('is_active', true)
                .single();
            
            if (error || !user) {
                // Fallback to test accounts for development
                if (CONFIG.TEST_PASSWORDS[username] && password === CONFIG.TEST_PASSWORDS[username]) {
                    return {
                        id: `temp_${username}_${Date.now()}`,
                        username: username,
                        display_name: username.charAt(0).toUpperCase() + username.slice(1),
                        role: username === 'host' ? 'host' : 'guest',
                        is_active: true
                    };
                }
                throw new Error("Invalid username or password");
            }
            
            // Verify password using RPC
            try {
                const { data: authResult } = await supabaseClient
                    .rpc('verify_password', {
                        stored_hash: user.password_hash,
                        password: password
                    });
                
                if (authResult !== true) {
                    throw new Error("Invalid password");
                }
            } catch (rpcError) {
                // Fallback to authenticate_user RPC
                const { data: authUserResult } = await supabaseClient
                    .rpc('authenticate_user', {
                        p_username: username,
                        p_password: password
                    });
                
                if (!authUserResult || authUserResult.length === 0 || !authUserResult[0].is_authenticated) {
                    throw new Error("Invalid password");
                }
            }
            
            return user;
            
        } catch (error) {
            console.error("Authentication error:", error);
            throw error;
        }
    },
    
    updatePasswordHint(username) {
        const passwordHint = document.getElementById('passwordHint');
        if (!passwordHint) return;
        
        if (CONFIG.TEST_PASSWORDS[username]) {
            passwordHint.textContent = `Test password: ${CONFIG.TEST_PASSWORDS[username]}`;
            passwordHint.style.display = 'block';
        } else if (username === 'admin') {
            passwordHint.textContent = "Administrator account";
            passwordHint.style.display = 'block';
        } else {
            passwordHint.style.display = 'none';
        }
    }
};

// ============================================
// SESSION MANAGER
// ============================================

const SessionManager = {
    async createHostSession(userIP) {
        try {
            const sessionId = 'session_' + Date.now().toString(36);
            
            const { data, error } = await supabaseClient
                .from('sessions')
                .insert([{
                    session_id: sessionId,
                    host_id: appState.user.id,
                    host_name: appState.user.name,
                    host_ip: userIP,
                    is_active: true,
                    requires_approval: true,
                    created_at: new Date().toISOString(),
                    max_guests: 50
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            appState.session.id = sessionId;
            appState.session.currentId = sessionId;
            appState.user.isConnected = true;
            appState.timestamps.connectionTime = new Date();
            
            Utils.saveSession();
            return sessionId;
            
        } catch (error) {
            console.error("Error creating session:", error);
            throw error;
        }
    },
    
    async joinAsGuest(userIP) {
        try {
            // Find active session
            const { data: activeSessions, error } = await supabaseClient
                .from('sessions')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (error) throw error;
            
            if (!activeSessions || activeSessions.length === 0) {
                throw new Error("No active session found");
            }
            
            const session = activeSessions[0];
            
            // Check guest count
            const { data: approvedGuests } = await supabaseClient
                .from('session_guests')
                .select('id')
                .eq('session_id', session.session_id)
                .eq('status', 'approved');
            
            const maxGuests = session.max_guests || 10;
            if (approvedGuests && approvedGuests.length >= maxGuests) {
                throw new Error("Session has reached maximum guest limit");
            }
            
            // Check if already approved
            const { data: existingGuest } = await supabaseClient
                .from('session_guests')
                .select('*')
                .eq('session_id', session.session_id)
                .eq('guest_id', appState.user.id)
                .eq('status', 'approved')
                .single();
            
            if (existingGuest) {
                return { sessionId: session.session_id, isApproved: true };
            }
            
            // Add as pending guest
            const { error: insertError } = await supabaseClient
                .from('session_guests')
                .insert([{
                    session_id: session.session_id,
                    guest_id: appState.user.id,
                    guest_name: appState.user.name,
                    guest_ip: userIP,
                    status: 'pending',
                    requested_at: new Date().toISOString()
                }]);
            
            if (insertError) throw insertError;
            
            return { sessionId: session.session_id, isApproved: false };
            
        } catch (error) {
            console.error("Error joining session:", error);
            throw error;
        }
    },
    
    async reconnect() {
        try {
            const { data: session, error } = await supabaseClient
                .from('sessions')
                .select('*')
                .eq('session_id', appState.session.id)
                .single();
            
            if (error || !session) return false;
            
            if (appState.user.isHost) {
                if (session.host_id === appState.user.id) {
                    appState.session.currentId = session.session_id;
                    return true;
                }
            } else {
                if (session.guest_id === appState.user.id) {
                    appState.session.currentId = session.session_id;
                    return true;
                }
            }
            
            return false;
            
        } catch (error) {
            console.error("Error reconnecting:", error);
            return false;
        }
    }
};

// ============================================
// CHAT MANAGER
// ============================================

const ChatManager = {
    async sendMessage(text, imageUrl = null) {
        if (!appState.user.isConnected || appState.session.isViewingHistory) {
            alert("You cannot send messages right now.");
            return;
        }
        
        if (!text && !imageUrl) return;
        
        try {
            const messageData = {
                session_id: appState.session.currentId,
                sender_id: appState.user.id,
                sender_name: appState.user.name,
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
            
            // Display locally
            this.displayMessage({
                id: 'temp_' + Date.now(),
                sender: appState.user.name,
                text: text,
                image: imageUrl,
                time: Utils.formatTime(new Date()),
                type: 'sent',
                is_historical: false
            });
            
            // Clear input
            if (DOM.inputs.message) {
                DOM.inputs.message.value = '';
                DOM.inputs.message.style.height = 'auto';
            }
            
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message: " + error.message);
        }
    },
    
    async loadHistory(sessionId = null) {
        const targetSessionId = sessionId || appState.session.currentId;
        if (!targetSessionId) return;
        
        try {
            const { data: messages, error } = await supabaseClient
                .from('messages')
                .select('*')
                .eq('session_id', targetSessionId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            
            this.clearMessages();
            
            if (sessionId) {
                this.addHistoricalHeader(sessionId);
            }
            
            messages.forEach(msg => {
                this.displayMessage({
                    id: msg.id,
                    sender: msg.sender_name,
                    text: msg.message,
                    image: msg.image_url,
                    time: Utils.formatTime(msg.created_at),
                    type: msg.sender_id === appState.user.id ? 'sent' : 'received',
                    is_historical: !!sessionId
                });
            });
            
            this.scrollToBottom();
            
        } catch (error) {
            console.error("Error loading chat history:", error);
        }
    },
    
    displayMessage(message) {
        if (appState.session.isViewingHistory && !message.is_historical) {
            return;
        }
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type} ${message.is_historical ? 'historical' : ''}`;
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
                    <i class="fas fa-edit"></i>
                </button>
                <button class="message-action-btn" onclick="deleteMessage('${message.id}')">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="message-action-btn" onclick="replyToMessage('${message.id}')">
                    <i class="fas fa-reply"></i>
                </button>
            </div>
            ` : ''}
        `;
        
        if (DOM.displays.chatMessages) {
            DOM.displays.chatMessages.appendChild(messageDiv);
        }
    },
    
    clearMessages() {
        if (DOM.displays.chatMessages) {
            DOM.displays.chatMessages.innerHTML = '';
        }
        appState.data.messages = [];
    },
    
    addSystemMessage(text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message received';
        
        messageDiv.innerHTML = `
            <div class="message-sender">System</div>
            <div class="message-content">
                <div class="message-text">${text}</div>
                <div class="message-time">${Utils.formatTime(new Date())}</div>
            </div>
        `;
        
        if (DOM.displays.chatMessages) {
            DOM.displays.chatMessages.appendChild(messageDiv);
        }
        
        this.scrollToBottom();
    },
    
    scrollToBottom() {
        if (DOM.displays.chatMessages) {
            DOM.displays.chatMessages.scrollTop = DOM.displays.chatMessages.scrollHeight;
        }
    },
    
    addHistoricalHeader(sessionId) {
        const header = document.createElement('div');
        header.className = 'message received historical';
        header.innerHTML = `
            <div class="message-sender">System</div>
            <div class="message-content">
                <div class="message-text">Historical Chat</div>
                <div class="message-time"></div>
            </div>
        `;
        if (DOM.displays.chatMessages) {
            DOM.displays.chatMessages.appendChild(header);
        }
    }
};

// ============================================
// SUBSCRIPTION MANAGER
// ============================================

const SubscriptionManager = {
    setupAllSubscriptions() {
        this.cleanupSubscriptions();
        this.setupMessageSubscription();
        this.setupTypingSubscription();
        
        if (appState.user.isHost) {
            this.setupPendingGuestsSubscription();
        }
    },
    
    cleanupSubscriptions() {
        Object.values(appState.subscriptions).forEach(sub => {
            if (sub) supabaseClient.removeChannel(sub);
        });
    },
    
    setupMessageSubscription() {
        appState.subscriptions.realtime = supabaseClient
            .channel('messages-channel')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `session_id=eq.${appState.session.currentId}`
            }, (payload) => {
                if (payload.new.sender_id !== appState.user.id) {
                    ChatManager.displayMessage({
                        id: payload.new.id,
                        sender: payload.new.sender_name,
                        text: payload.new.message,
                        image: payload.new.image_url,
                        time: Utils.formatTime(payload.new.created_at),
                        type: 'received',
                        is_historical: false
                    });
                    
                    if (appState.ui.soundEnabled) {
                        this.playMessageSound();
                    }
                }
            })
            .subscribe();
    },
    
    setupTypingSubscription() {
        appState.subscriptions.typing = supabaseClient
            .channel('typing-channel')
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'sessions',
                filter: `session_id=eq.${appState.session.currentId}`
            }, (payload) => {
                if (payload.new.typing_user && payload.new.typing_user !== appState.user.name) {
                    if (DOM.displays.typingUser) {
                        DOM.displays.typingUser.textContent = payload.new.typing_user;
                    }
                    if (DOM.displays.typingIndicator) {
                        DOM.displays.typingIndicator.classList.add('show');
                        setTimeout(() => {
                            DOM.displays.typingIndicator.classList.remove('show');
                        }, 3000);
                    }
                }
            })
            .subscribe();
    },
    
    setupPendingGuestsSubscription() {
        appState.subscriptions.pending = supabaseClient
            .channel('pending-guests-channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'session_guests',
                filter: `session_id=eq.${appState.session.currentId}`
            }, async (payload) => {
                await PendingGuestManager.loadPendingGuests();
                
                if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
                    PendingGuestManager.showNotification(payload.new);
                }
                
                if (DOM.modals.pending.style.display === 'flex') {
                    PendingGuestManager.showModal();
                }
            })
            .subscribe();
    },
    
    setupPendingApprovalSubscription(sessionId) {
        appState.subscriptions.pending = supabaseClient
            .channel('pending-approval-channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'session_guests',
                filter: `session_id=eq.${sessionId} AND guest_id=eq.${appState.user.id}`
            }, async (payload) => {
                if (payload.new && payload.new.status === 'approved') {
                    appState.session.currentId = sessionId;
                    appState.user.isConnected = true;
                    
                    Utils.saveSession();
                    UI.updateUIAfterConnection();
                    this.setupAllSubscriptions();
                    await ChatManager.loadHistory();
                    
                    ChatManager.addSystemMessage(`${appState.user.name} has joined the chat.`);
                } else if (payload.new && payload.new.status === 'rejected') {
                    alert("Your access request was rejected by the host.");
                    location.reload();
                }
            })
            .subscribe();
    },
    
    playMessageSound() {
        const sound = document.getElementById('messageSound');
        if (sound) {
            sound.currentTime = 0;
            sound.play().catch(e => console.log("Audio play failed:", e));
        }
    }
};

// ============================================
// PENDING GUEST MANAGER
// ============================================

const PendingGuestManager = {
    async loadPendingGuests() {
        if (!appState.user.isHost || !appState.session.currentId) return;
        
        try {
            const { data: guests, error } = await supabaseClient
                .from('session_guests')
                .select('*')
                .eq('session_id', appState.session.currentId)
                .eq('status', 'pending')
                .order('requested_at', { ascending: true });
            
            if (error) throw error;
            
            appState.data.pendingGuests = guests || [];
            this.updateUI();
            
        } catch (error) {
            console.error("Error loading pending guests:", error);
            appState.data.pendingGuests = [];
            this.updateUI();
        }
    },
    
    async showModal() {
        if (!DOM.lists.pendingGuests) return;
        
        DOM.lists.pendingGuests.innerHTML = '';
        
        if (appState.data.pendingGuests.length === 0) {
            if (DOM.lists.noPendingGuests) {
                DOM.lists.noPendingGuests.style.display = 'block';
            }
        } else {
            if (DOM.lists.noPendingGuests) {
                DOM.lists.noPendingGuests.style.display = 'none';
            }
            
            appState.data.pendingGuests.forEach(guest => {
                const guestDiv = document.createElement('div');
                guestDiv.className = 'pending-guest';
                guestDiv.innerHTML = `
                    <div class="guest-info">
                        <div class="guest-name">
                            <i class="fas fa-user"></i>
                            <strong>${guest.guest_name}</strong>
                        </div>
                        <div class="guest-details">
                            <small>ID: ${Utils.truncate(guest.guest_id, 8)}</small>
                            <small>IP: ${guest.guest_ip || 'Unknown'}</small>
                            <small>${Utils.formatDateTime(guest.requested_at)}</small>
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
                DOM.lists.pendingGuests.appendChild(guestDiv);
            });
        }
        
        ModalManager.showPendingModal();
    },
    
    async approveGuest(guestId) {
        try {
            // Get guest details first
            const { data: guest } = await supabaseClient
                .from('session_guests')
                .select('*')
                .eq('id', guestId)
                .single();
            
            if (!guest) throw new Error("Guest not found");
            
            // Update status
            const { error } = await supabaseClient
                .from('session_guests')
                .update({
                    status: 'approved',
                    approved_at: new Date().toISOString()
                })
                .eq('id', guestId);
            
            if (error) throw error;
            
            // Update local state
            appState.data.pendingGuests = appState.data.pendingGuests.filter(g => g.id !== guestId);
            this.updateUI();
            
            // Send system message
            ChatManager.addSystemMessage(`${guest.guest_name} has been approved and joined the chat.`);
            
            // Refresh modal if open
            if (DOM.modals.pending.style.display === 'flex') {
                this.showModal();
            }
            
        } catch (error) {
            console.error("Error approving guest:", error);
            alert("Failed to approve guest: " + error.message);
        }
    },
    
    async denyGuest(guestId) {
        try {
            const { error } = await supabaseClient
                .from('session_guests')
                .update({
                    status: 'rejected',
                    left_at: new Date().toISOString()
                })
                .eq('id', guestId);
            
            if (error) throw error;
            
            appState.data.pendingGuests = appState.data.pendingGuests.filter(g => g.id !== guestId);
            this.updateUI();
            
            if (DOM.modals.pending.style.display === 'flex') {
                this.showModal();
            }
            
        } catch (error) {
            console.error("Error denying guest:", error);
            alert("Failed to deny guest: " + error.message);
        }
    },
    
    updateUI() {
        if (!DOM.buttons.pendingGuests || !DOM.displays.pendingCount) return;
        
        const count = appState.data.pendingGuests.length;
        DOM.displays.pendingCount.textContent = count;
        
        if (count > 0) {
            DOM.buttons.pendingGuests.style.display = 'flex';
            DOM.buttons.pendingGuests.classList.add('has-pending');
        } else {
            DOM.buttons.pendingGuests.style.display = 'none';
            DOM.buttons.pendingGuests.classList.remove('has-pending');
        }
    },
    
    showNotification(guest) {
        if (!appState.user.isHost) return;
        
        const notification = document.createElement('div');
        notification.className = 'guest-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-user-plus"></i>
                <div class="notification-text">
                    <strong>New guest request!</strong>
                    <small>${guest.guest_name} wants to join</small>
                </div>
                <button class="btn btn-small btn-success" onclick="viewPendingGuests()">
                    <i class="fas fa-eye"></i> View
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, CONFIG.NOTIFICATION_DURATION);
    }
};

// ============================================
// UI MANAGER
// ============================================

const UI = {
    updateUIAfterConnection() {
        // Update status indicator
        if (DOM.displays.status) {
            DOM.displays.status.className = 'status-indicator online';
        }
        
        // Update user display
        if (DOM.displays.userRole) {
            DOM.displays.userRole.textContent = `${appState.user.name} (Connected)`;
        }
        
        // Show logout button
        if (DOM.buttons.logout) {
            DOM.buttons.logout.style.display = 'flex';
        }
        
        // Enable chat input
        if (DOM.inputs.message) {
            DOM.inputs.message.disabled = false;
            DOM.inputs.message.placeholder = "Type your message here... (Press Enter to send, Shift+Enter for new line)";
            DOM.inputs.message.focus();
        }
        
        if (DOM.buttons.sendMessage) {
            DOM.buttons.sendMessage.disabled = false;
        }
        
        // Update admin panel
        if (DOM.sections.admin) {
            DOM.sections.admin.style.display = appState.user.isHost ? 'block' : 'none';
        }
        
        // Update pending guests button
        if (DOM.buttons.pendingGuests) {
            DOM.buttons.pendingGuests.style.display = appState.user.isHost ? 'flex' : 'none';
        }
        
        // Reset chat view if in historical mode
        if (appState.session.isViewingHistory) {
            this.returnToActiveChat();
        }
    },
    
    updateUIForPendingGuest() {
        if (DOM.displays.status) {
            DOM.displays.status.className = 'status-indicator offline';
        }
        
        if (DOM.displays.userRole) {
            DOM.displays.userRole.textContent = `${appState.user.name} (Pending Approval)`;
        }
        
        if (DOM.buttons.logout) {
            DOM.buttons.logout.style.display = 'flex';
        }
        
        if (DOM.buttons.pendingGuests) {
            DOM.buttons.pendingGuests.style.display = 'none';
        }
        
        if (DOM.inputs.message) {
            DOM.inputs.message.disabled = true;
            DOM.inputs.message.placeholder = "Waiting for host approval...";
        }
        
        if (DOM.buttons.sendMessage) {
            DOM.buttons.sendMessage.disabled = true;
        }
        
        ChatManager.clearMessages();
        ChatManager.addSystemMessage("Your access request has been sent to the host. Please wait for approval.");
    },
    
    returnToActiveChat() {
        appState.session.isViewingHistory = false;
        appState.session.viewingId = null;
        
        if (DOM.displays.chatModeIndicator) {
            DOM.displays.chatModeIndicator.style.display = 'none';
        }
        
        if (DOM.displays.chatTitle) {
            DOM.displays.chatTitle.innerHTML = '<i class="fas fa-comments"></i> Active Chat';
        }
        
        if (DOM.inputs.message) {
            DOM.inputs.message.disabled = false;
            DOM.inputs.message.placeholder = "Type your message here... (Press Enter to send, Shift+Enter for new line)";
            DOM.inputs.message.focus();
        }
        
        if (DOM.buttons.sendMessage) {
            DOM.buttons.sendMessage.disabled = false;
        }
        
        ChatManager.loadHistory();
    },
    
    toggleSound() {
        appState.ui.soundEnabled = !appState.ui.soundEnabled;
        this.updateSoundControl();
        Utils.saveSession();
    },
    
    updateSoundControl() {
        if (DOM.buttons.soundControl) {
            DOM.buttons.soundControl.innerHTML = appState.ui.soundEnabled
                ? '<i class="fas fa-volume-up"></i> <span>Sound On</span>'
                : '<i class="fas fa-volume-mute"></i> <span>Sound Off</span>';
            DOM.buttons.soundControl.classList.toggle('muted', !appState.ui.soundEnabled);
        }
    },
    
    populateEmojis() {
        if (!DOM.displays.emojiPicker) return;
        
        DOM.displays.emojiPicker.innerHTML = '';
        appState.data.emojis.forEach(emoji => {
            const emojiSpan = document.createElement('span');
            emojiSpan.className = 'emoji';
            emojiSpan.textContent = emoji;
            emojiSpan.onclick = () => {
                if (DOM.inputs.message) {
                    DOM.inputs.message.value += emoji;
                    DOM.inputs.message.focus();
                }
                DOM.displays.emojiPicker.classList.remove('show');
            };
            DOM.displays.emojiPicker.appendChild(emojiSpan);
        });
    },
    
    toggleEmojiPicker() {
        if (DOM.displays.emojiPicker) {
            DOM.displays.emojiPicker.classList.toggle('show');
        }
    }
};

// ============================================
// EVENT HANDLERS
// ============================================

const EventHandlers = {
    async handleConnect() {
        const username = DOM.inputs.username?.value.trim();
        const password = DOM.inputs.password?.value;
        
        if (DOM.errors.password) {
            DOM.errors.password.style.display = 'none';
        }
        
        if (DOM.buttons.connect) {
            DOM.buttons.connect.disabled = true;
            DOM.buttons.connect.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        }
        
        try {
            const user = await AuthManager.authenticate(username, password);
            
            // Update app state
            appState.user.id = user.id;
            appState.user.name = user.display_name || user.username;
            appState.user.isHost = user.role === 'host';
            
            // Get IP
            const userIP = await Utils.getIP();
            
            if (appState.user.isHost) {
                const sessionId = await SessionManager.createHostSession(userIP);
                appState.session.id = sessionId;
                
                ModalManager.hideConnectionModal();
                UI.updateUIAfterConnection();
                SubscriptionManager.setupAllSubscriptions();
                await ChatManager.loadHistory();
                await PendingGuestManager.loadPendingGuests();
                
                ChatManager.addSystemMessage(`${appState.user.name} has created a new chat session.`);
                
            } else {
                const { sessionId, isApproved } = await SessionManager.joinAsGuest(userIP);
                appState.session.id = sessionId;
                
                if (isApproved) {
                    appState.session.currentId = sessionId;
                    appState.user.isConnected = true;
                    Utils.saveSession();
                    
                    ModalManager.hideConnectionModal();
                    UI.updateUIAfterConnection();
                    SubscriptionManager.setupAllSubscriptions();
                    await ChatManager.loadHistory();
                    
                    ChatManager.addSystemMessage(`${appState.user.name} has joined the chat.`);
                } else {
                    ModalManager.hideConnectionModal();
                    UI.updateUIForPendingGuest();
                    SubscriptionManager.setupPendingApprovalSubscription(sessionId);
                }
            }
            
        } catch (error) {
            console.error("Connection error:", error);
            
            if (DOM.errors.password) {
                DOM.errors.password.textContent = error.message;
                DOM.errors.password.style.display = 'block';
            }
            
        } finally {
            if (DOM.buttons.connect) {
                DOM.buttons.connect.disabled = false;
                DOM.buttons.connect.innerHTML = '<i class="fas fa-plug"></i> Connect';
            }
        }
    },
    
    async handleLogout() {
        if (!confirm("Are you sure you want to logout?")) return;
        
        // Clear UI
        ChatManager.clearMessages();
        if (DOM.sections.historyCards) {
            DOM.sections.historyCards.innerHTML = '';
        }
        
        // Update database
        if (appState.user.isConnected && appState.session.currentId) {
            try {
                if (appState.user.isHost) {
                    await supabaseClient
                        .from('sessions')
                        .update({ 
                            is_active: false,
                            ended_at: new Date().toISOString()
                        })
                        .eq('session_id', appState.session.currentId);
                } else {
                    await supabaseClient
                        .from('session_guests')
                        .update({ 
                            status: 'left',
                            left_at: new Date().toISOString()
                        })
                        .eq('session_id', appState.session.currentId)
                        .eq('guest_id', appState.user.id);
                }
            } catch (error) {
                console.error("Error updating logout status:", error);
            }
        }
        
        // Clean up
        SubscriptionManager.cleanupSubscriptions();
        Utils.clearSession();
        this.resetAppState();
        ModalManager.showConnectionModal();
    },
    
    handleTyping: Utils.debounce(async () => {
        if (appState.session.currentId && !appState.session.isViewingHistory && appState.user.isConnected) {
            try {
                await supabaseClient
                    .from('sessions')
                    .update({ typing_user: appState.user.name })
                    .eq('session_id', appState.session.currentId);
                
                if (appState.ui.typingTimeout) {
                    clearTimeout(appState.ui.typingTimeout);
                }
                
                appState.ui.typingTimeout = setTimeout(() => {
                    supabaseClient
                        .from('sessions')
                        .update({ typing_user: null })
                        .eq('session_id', appState.session.currentId)
                        .catch(e => console.log("Error clearing typing:", e));
                }, CONFIG.TYPING_TIMEOUT);
                
            } catch (error) {
                console.log("Typing indicator error:", error);
            }
        }
    }, 300),
    
    async handleImageUpload(e) {
        const file = e.target.files[0];
        if (!Utils.isValidImage(file)) {
            alert("Please select a valid image file (max 5MB).");
            return;
        }
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const imageUrl = e.target.result;
            await ChatManager.sendMessage(`[Image: ${file.name}]`, imageUrl);
            e.target.value = '';
        };
        reader.readAsDataURL(file);
    },
    
    resetAppState() {
        appState.user = {
            isHost: false,
            isConnected: false,
            name: "Guest",
            id: null
        };
        appState.session = {
            id: null,
            currentId: null,
            viewingId: null,
            isViewingHistory: false
        };
        appState.data.messages = [];
        appState.data.pendingGuests = [];
        appState.data.users = [];
        appState.ui.isViewingUsers = false;
        appState.ui.typingTimeout = null;
        appState.subscriptions = {
            realtime: null,
            typing: null,
            pending: null
        };
        appState.timestamps.connectionTime = null;
    }
};

// ============================================
// INITIALIZATION
// ============================================

async function initApp() {
    try {
        // Setup event listeners
        setupEventListeners();
        
        // Check for saved session
        const savedSession = Utils.loadSession();
        if (savedSession) {
            Object.assign(appState, savedSession);
            
            if (await SessionManager.reconnect()) {
                appState.user.isConnected = true;
                SubscriptionManager.setupAllSubscriptions();
                await ChatManager.loadHistory();
                
                if (appState.user.isHost) {
                    await PendingGuestManager.loadPendingGuests();
                }
                
                ModalManager.hideConnectionModal();
                UI.updateUIAfterConnection();
            } else {
                Utils.clearSession();
                ModalManager.showConnectionModal();
            }
        } else {
            ModalManager.showConnectionModal();
        }
        
        // Initialize UI
        UI.updateSoundControl();
        UI.populateEmojis();
        
    } catch (error) {
        console.error("Error initializing app:", error);
        ModalManager.showConnectionModal();
    }
}

function setupEventListeners() {
    // Connection modal
    if (DOM.inputs.username) {
        DOM.inputs.username.addEventListener('input', function() {
            if (DOM.errors.password) DOM.errors.password.style.display = 'none';
            AuthManager.updatePasswordHint(this.value.toLowerCase());
        });
    }
    
    if (DOM.inputs.password) {
        DOM.inputs.password.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') EventHandlers.handleConnect();
        });
    }
    
    if (DOM.buttons.connect) {
        DOM.buttons.connect.addEventListener('click', EventHandlers.handleConnect);
    }
    
    // Chat functionality
    if (DOM.inputs.message) {
        DOM.inputs.message.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                ChatManager.sendMessage(DOM.inputs.message.value.trim());
            }
        });
        
        DOM.inputs.message.addEventListener('input', EventHandlers.handleTyping);
        
        // Auto-resize
        DOM.inputs.message.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }
    
    if (DOM.buttons.sendMessage) {
        DOM.buttons.sendMessage.addEventListener('click', () => {
            ChatManager.sendMessage(DOM.inputs.message?.value.trim());
        });
    }
    
    // Logout
    if (DOM.buttons.logout) {
        DOM.buttons.logout.addEventListener('click', EventHandlers.handleLogout);
    }
    
    // Pending guests
    if (DOM.buttons.pendingGuests) {
        DOM.buttons.pendingGuests.addEventListener('click', () => PendingGuestManager.showModal());
    }
    
    // Image upload
    if (DOM.inputs.image) {
        DOM.inputs.image.addEventListener('change', EventHandlers.handleImageUpload);
    }
    
    // Emoji picker
    if (DOM.buttons.emojiBtn) {
        DOM.buttons.emojiBtn.addEventListener('click', UI.toggleEmojiPicker);
    }
    
    // Sound control
    if (DOM.buttons.soundControl) {
        DOM.buttons.soundControl.addEventListener('click', () => UI.toggleSound());
    }
    
    // Image modal
    if (DOM.modals.image) {
        DOM.modals.image.addEventListener('click', () => ModalManager.hideImageModal());
    }
    
    // Close emoji picker when clicking outside
    document.addEventListener('click', (e) => {
        if (DOM.displays.emojiPicker && 
            !DOM.displays.emojiPicker.contains(e.target) && 
            DOM.buttons.emojiBtn && 
            !DOM.buttons.emojiBtn.contains(e.target)) {
            DOM.displays.emojiPicker.classList.remove('show');
        }
    });
}

// ============================================
// GLOBAL FUNCTIONS (for inline event handlers)
// ============================================

window.showFullImage = (src) => ModalManager.showImageModal(src);
window.editMessage = async (messageId) => {
    const newText = prompt("Edit your message:");
    if (newText) {
        // Implementation
    }
};
window.deleteMessage = async (messageId) => {
    if (confirm("Delete this message?")) {
        // Implementation
    }
};
window.approveGuest = (guestId) => PendingGuestManager.approveGuest(guestId);
window.denyGuest = (guestId) => PendingGuestManager.denyGuest(guestId);
window.viewPendingGuests = () => PendingGuestManager.showModal();

// ============================================
// INITIALIZE APP
// ============================================

document.addEventListener('DOMContentLoaded', initApp);
