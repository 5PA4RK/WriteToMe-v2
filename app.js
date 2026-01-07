// Supabase Configuration
const SUPABASE_URL = 'https://plqvqenoroacvzwtgoxq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_91IHQ5--y4tDIo8L9X2ZJQ_YeThfdu_';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Optimized App State with better structure
const appState = {
    user: {
        isHost: false,
        isConnected: false,
        name: "Guest",
        id: null,
        role: null
    },
    session: {
        id: null,
        currentId: null,
        viewingId: null,
        isViewingHistory: false
    },
    data: {
        messages: [],
        pendingGuests: [],
        users: [],
        chatSessions: []
    },
    settings: {
        soundEnabled: true,
        typingTimeout: null,
        connectionTime: null
    },
    subscriptions: {
        realtime: null,
        typing: null,
        pending: null
    },
    cache: {
        emojis: ["😀", "😂", "😍", "😎", "😭", "😡", "👍", "👎", "❤️", "🔥", "👏", "🙏", "🤔", "😴", "🥳"],
        lastMessageId: null
    }
};

// DOM Elements Cache
const DOM = {
    modals: {
        connection: document.getElementById('connectionModal'),
        pending: document.getElementById('pendingGuestsModal'),
        image: document.getElementById('imageModal'),
        addUser: document.getElementById('addUserModal'),
        editUser: document.getElementById('editUserModal')
    },
    inputs: {
        username: document.getElementById('usernameInput'),
        password: document.getElementById('passwordInput'),
        message: document.getElementById('messageInput')
    },
    buttons: {
        connect: document.getElementById('connectBtn'),
        logout: document.getElementById('logoutBtn'),
        sendMessage: document.getElementById('sendMessageBtn'),
        clearChat: document.getElementById('clearChatBtn'),
        pendingGuests: document.getElementById('pendingGuestsBtn')
    },
    displays: {
        status: document.getElementById('statusIndicator'),
        userRole: document.getElementById('userRoleDisplay'),
        pendingCount: document.getElementById('pendingCount'),
        chatMessages: document.getElementById('chatMessages'),
        typingIndicator: document.getElementById('typingIndicator'),
        typingUser: document.getElementById('typingUser')
    },
    sections: {
        admin: document.getElementById('adminSection'),
        historyCards: document.getElementById('historyCards'),
        usersList: document.getElementById('usersList')
    }
};

// Utility Functions
const Utils = {
    // Debounce function for performance
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

    // Format time
    formatTime(date) {
        return new Date(date).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    },

    // Format date
    formatDate(date) {
        return new Date(date).toLocaleDateString();
    },

    // Generate ID
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // Check if element exists
    exists(element) {
        return element && element.nodeType === 1;
    }
};

// Modal Management
const ModalManager = {
    show(modalElement) {
        if (!Utils.exists(modalElement)) return;
        modalElement.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },

    hide(modalElement) {
        if (!Utils.exists(modalElement)) return;
        modalElement.style.display = 'none';
        document.body.style.overflow = 'auto';
    },

    toggle(modalElement) {
        if (!Utils.exists(modalElement)) return;
        const isVisible = modalElement.style.display === 'flex';
        this[isVisible ? 'hide' : 'show'](modalElement);
    }
};

// Chat Manager
const ChatManager = {
    async sendMessage(text, imageUrl = null) {
        if (!appState.user.isConnected || appState.session.isViewingHistory) {
            alert("You cannot send messages right now.");
            return;
        }

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

        try {
            const { error } = await supabaseClient
                .from('messages')
                .insert([messageData]);

            if (error) throw error;

            // Clear input
            if (DOM.inputs.message) {
                DOM.inputs.message.value = '';
                DOM.inputs.message.style.height = 'auto';
            }

            return { success: true };
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message: " + error.message);
            return null;
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

        let contentHTML = '';
        if (message.text) {
            contentHTML += `<div class="message-text">${message.text}</div>`;
        }
        if (message.image) {
            contentHTML += `<img src="${message.image}" class="message-image" onclick="showFullImage('${message.image}')">`;
        }

        messageDiv.innerHTML = `
            <div class="message-sender">${message.sender}</div>
            <div class="message-content">
                ${contentHTML}
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

// Session Manager
const SessionManager = {
    async createHostSession(userIP) {
        try {
            const sessionId = Utils.generateId('session');
            
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

            this.saveSessionToStorage();
            await this.setupSubscriptions();
            await ChatManager.loadHistory();

            return { success: true, sessionId };
        } catch (error) {
            console.error("Error creating session:", error);
            throw error;
        }
    },

    async joinAsGuest(userIP) {
        try {
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
            
            // Check guest limit
            const { data: approvedGuests } = await supabaseClient
                .from('session_guests')
                .select('id')
                .eq('session_id', session.session_id)
                .eq('status', 'approved');

            if (approvedGuests && approvedGuests.length >= (session.max_guests || 10)) {
                throw new Error("Session has reached maximum guest limit");
            }

            // Add to pending guests
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

            appState.session.id = session.session_id;
            return { success: true, sessionId: session.session_id };
        } catch (error) {
            console.error("Error joining as guest:", error);
            throw error;
        }
    },

    async setupSubscriptions() {
        // Clean up existing subscriptions
        Object.values(appState.subscriptions).forEach(sub => {
            if (sub) supabaseClient.removeChannel(sub);
        });

        // Messages subscription
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

                    if (appState.settings.soundEnabled) {
                        this.playMessageSound();
                    }
                }
            })
            .subscribe();

        // Pending guests subscription for host
        if (appState.user.isHost) {
            appState.subscriptions.pending = supabaseClient
                .channel('pending-guests-channel')
                .on('postgres_changes', {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'session_guests',
                    filter: `session_id=eq.${appState.session.currentId}`
                }, async (payload) => {
                    if (payload.new.status === 'pending') {
                        await this.loadPendingGuests();
                        this.showGuestNotification(payload.new);
                    }
                })
                .subscribe();
        }
    },

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
            this.updatePendingUI();
        } catch (error) {
            console.error("Error loading pending guests:", error);
            appState.data.pendingGuests = [];
        }
    },

    updatePendingUI() {
        if (!appState.user.isHost || !DOM.buttons.pendingGuests) return;

        const count = appState.data.pendingGuests.length;
        
        if (DOM.displays.pendingCount) {
            DOM.displays.pendingCount.textContent = count;
        }

        if (count > 0) {
            DOM.buttons.pendingGuests.style.display = 'flex';
            DOM.buttons.pendingGuests.classList.add('has-pending');
        } else {
            DOM.buttons.pendingGuests.style.display = 'none';
            DOM.buttons.pendingGuests.classList.remove('has-pending');
        }
    },

    saveSessionToStorage() {
        const sessionData = {
            user: {
                isHost: appState.user.isHost,
                name: appState.user.name,
                id: appState.user.id,
                role: appState.user.role
            },
            session: {
                id: appState.session.id,
                currentId: appState.session.currentId
            },
            settings: {
                soundEnabled: appState.settings.soundEnabled,
                connectionTime: appState.settings.connectionTime
            }
        };

        localStorage.setItem('writeToMe_session', JSON.stringify(sessionData));
    },

    clearSessionStorage() {
        localStorage.removeItem('writeToMe_session');
    }
};

// User Manager
const UserManager = {
    async authenticate(username, password) {
        try {
            const { data, error } = await supabaseClient
                .rpc('authenticate_user', {
                    p_username: username,
                    p_password: password
                });

            if (error) throw error;

            if (!data || data.length === 0 || !data[0].is_authenticated) {
                return { authenticated: false, error: "Invalid credentials" };
            }

            const authResult = data[0];
            return {
                authenticated: true,
                user: {
                    isHost: authResult.user_role === 'host',
                    name: authResult.user_role === 'host' ? "Host" : "Guest",
                    id: Utils.generateId('user'),
                    role: authResult.user_role
                }
            };
        } catch (error) {
            console.error("Authentication error:", error);
            return { authenticated: false, error: error.message };
        }
    },

    async loadUsers() {
        if (!appState.user.isHost) return;

        try {
            const { data: users, error } = await supabaseClient
                .from('user_management')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            appState.data.users = users || [];
            this.renderUsers(users);
        } catch (error) {
            console.error("Error loading users:", error);
        }
    },

    renderUsers(users) {
        if (!DOM.sections.usersList) return;

        if (!users || users.length === 0) {
            DOM.sections.usersList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <h3>No Users Found</h3>
                    <p>Add new users to get started</p>
                </div>
            `;
            return;
        }

        DOM.sections.usersList.innerHTML = users.map(user => `
            <div class="user-card ${user.role} ${user.is_active ? '' : 'inactive'}">
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
                        <span class="user-detail-value">${Utils.formatDate(user.created_at)}</span>
                    </div>
                    <div class="user-detail">
                        <span class="user-detail-label">Last Login:</span>
                        <span class="user-detail-value">
                            ${user.last_login ? Utils.formatDate(user.last_login) : 'Never'}
                        </span>
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn btn-secondary btn-small" onclick="openEditUser('${user.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-small" onclick="confirmDeleteUser('${user.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }
};

// UI Manager
const UIManager = {
    updateConnectionStatus() {
        if (!Utils.exists(DOM.displays.status) || !Utils.exists(DOM.displays.userRole)) return;

        if (appState.user.isConnected) {
            DOM.displays.status.className = 'status-indicator online';
            DOM.displays.userRole.textContent = `${appState.user.name} (Connected)`;
            
            if (DOM.buttons.logout) {
                DOM.buttons.logout.style.display = 'flex';
            }
        } else {
            DOM.displays.status.className = 'status-indicator offline';
            DOM.displays.userRole.textContent = 'Disconnected';
            
            if (DOM.buttons.logout) {
                DOM.buttons.logout.style.display = 'none';
            }
        }

        this.updateChatInputState();
    },

    updateChatInputState() {
        const isEnabled = appState.user.isConnected && !appState.session.isViewingHistory;
        
        if (DOM.inputs.message) {
            DOM.inputs.message.disabled = !isEnabled;
            DOM.inputs.message.placeholder = isEnabled 
                ? "Type your message here... (Press Enter to send, Shift+Enter for new line)"
                : "Please connect to start chatting";
        }

        if (DOM.buttons.sendMessage) {
            DOM.buttons.sendMessage.disabled = !isEnabled;
        }
    },

    showGuestNotification(guest) {
        const notification = document.createElement('div');
        notification.className = 'guest-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-user-plus"></i>
                <div class="notification-text">
                    <strong>New guest request!</strong>
                    <small>${guest.guest_name} wants to join</small>
                </div>
                <button class="btn btn-small btn-success" onclick="showPendingGuests()">
                    <i class="fas fa-eye"></i> View
                </button>
            </div>
        `;

        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 10000);
    }
};

// Event Handlers
const EventHandlers = {
    async handleConnect() {
        const username = DOM.inputs.username?.value.trim();
        const password = DOM.inputs.password?.value;

        if (!username || !password) {
            this.showError("Please enter both username and password");
            return;
        }

        this.setLoadingState(true);

        try {
            const authResult = await UserManager.authenticate(username, password);
            
            if (!authResult.authenticated) {
                this.showError(authResult.error || "Authentication failed");
                return;
            }

            // Update app state
            Object.assign(appState.user, authResult.user);
            appState.settings.connectionTime = new Date();

            // Get user IP
            const userIP = await this.getUserIP();

            if (appState.user.isHost) {
                await SessionManager.createHostSession(userIP);
            } else {
                await SessionManager.joinAsGuest(userIP);
            }

            ModalManager.hide(DOM.modals.connection);
            UIManager.updateConnectionStatus();

        } catch (error) {
            this.showError(error.message);
        } finally {
            this.setLoadingState(false);
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
        Object.values(appState.subscriptions).forEach(sub => {
            if (sub) supabaseClient.removeChannel(sub);
        });

        SessionManager.clearSessionStorage();
        this.resetAppState();
        ModalManager.show(DOM.modals.connection);
    },

    async handleImageUpload(e) {
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
        reader.onload = async (e) => {
            const imageUrl = e.target.result;
            await ChatManager.sendMessage(`[Image: ${file.name}]`, imageUrl);
        };
        reader.readAsDataURL(file);
    },

    setLoadingState(isLoading) {
        if (DOM.buttons.connect) {
            DOM.buttons.connect.disabled = isLoading;
            DOM.buttons.connect.innerHTML = isLoading
                ? '<i class="fas fa-spinner fa-spin"></i> Connecting...'
                : '<i class="fas fa-plug"></i> Connect';
        }
    },

    showError(message) {
        const errorElement = document.getElementById('passwordError');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    },

    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip || "Unknown";
        } catch {
            return "Unknown";
        }
    },

    resetAppState() {
        appState.user = {
            isHost: false,
            isConnected: false,
            name: "Guest",
            id: null,
            role: null
        };
        appState.session = {
            id: null,
            currentId: null,
            viewingId: null,
            isViewingHistory: false
        };
        appState.data = {
            messages: [],
            pendingGuests: [],
            users: [],
            chatSessions: []
        };
        appState.subscriptions = {
            realtime: null,
            typing: null,
            pending: null
        };
    }
};

// Initialize App
async function initApp() {
    try {
        // Check for saved session
        const savedSession = localStorage.getItem('writeToMe_session');
        if (savedSession) {
            const sessionData = JSON.parse(savedSession);
            Object.assign(appState.user, sessionData.user);
            Object.assign(appState.session, sessionData.session);
            Object.assign(appState.settings, sessionData.settings);

            // Attempt reconnection
            if (await reconnectToSession()) {
                appState.user.isConnected = true;
                await SessionManager.setupSubscriptions();
                await ChatManager.loadHistory();
                if (appState.user.isHost) {
                    await SessionManager.loadPendingGuests();
                }
                ModalManager.hide(DOM.modals.connection);
                UIManager.updateConnectionStatus();
            }
        } else {
            ModalManager.show(DOM.modals.connection);
        }

        this.setupEventListeners();
        this.updateSoundControl();
    } catch (error) {
        console.error("Error initializing app:", error);
        ModalManager.show(DOM.modals.connection);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Connection
    if (DOM.inputs.username) {
        DOM.inputs.username.addEventListener('input', () => {
            const passwordHint = document.getElementById('passwordHint');
            if (passwordHint) {
                const username = DOM.inputs.username.value.toLowerCase();
                if (username === 'guest') {
                    passwordHint.textContent = "Test password: guest123";
                    passwordHint.style.display = 'block';
                } else if (username === 'host') {
                    passwordHint.textContent = "Test password: host123";
                    passwordHint.style.display = 'block';
                } else {
                    passwordHint.style.display = 'none';
                }
            }
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

    // Logout
    if (DOM.buttons.logout) {
        DOM.buttons.logout.addEventListener('click', EventHandlers.handleLogout);
    }

    // Chat
    if (DOM.inputs.message) {
        DOM.inputs.message.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                ChatManager.sendMessage(DOM.inputs.message.value.trim());
            }
        });

        // Auto-resize textarea
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

    // Image upload
    const imageUpload = document.getElementById('imageUpload');
    if (imageUpload) {
        imageUpload.addEventListener('change', EventHandlers.handleImageUpload);
    }
}

// Update sound control
function updateSoundControl() {
    const soundControl = document.getElementById('soundControl');
    if (soundControl) {
        appState.settings.soundEnabled = !appState.settings.soundEnabled;
        soundControl.innerHTML = appState.settings.soundEnabled
            ? '<i class="fas fa-volume-up"></i> <span>Sound On</span>'
            : '<i class="fas fa-volume-mute"></i> <span>Sound Off</span>';
        soundControl.classList.toggle('muted', !appState.settings.soundEnabled);
    }
}

// Global functions
window.showFullImage = (src) => {
    const fullSizeImage = document.getElementById('fullSizeImage');
    const imageModal = document.getElementById('imageModal');
    if (fullSizeImage && imageModal) {
        fullSizeImage.src = src;
        ModalManager.show(imageModal);
    }
};

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

window.showPendingGuests = () => {
    ModalManager.show(DOM.modals.pending);
};

// Initialize on load
document.addEventListener('DOMContentLoaded', initApp);
