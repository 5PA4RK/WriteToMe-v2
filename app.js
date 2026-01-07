// Supabase Configuration
const SUPABASE_URL = 'https://plqvqenoroacvzwtgoxq.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_91IHQ5--y4tDIo8L9X2ZJQ_YeThfdu_';

// Constants
const DEFAULT_MAX_GUESTS = 50;
const TEST_PASSWORDS = {
    'admin': 'admin123',
    'host': 'host123',
    'guest': 'guest123'
};
const EMOJIS = ["😀", "😂", "😍", "😎", "😭", "😡", "👍", "👎", "❤️", "🔥", "👏", "🙏", "🤔", "😴", "🥳"];

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// App State
const state = {
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
    soundEnabled: true,
    isViewingHistory: false,
    viewingSessionId: null,
    pendingGuests: [],
    users: [],
    isViewingUsers: false,
    subscriptions: {
        realtime: null,
        typing: null,
        pending: null
    }
};

// DOM Elements Cache
const elements = {};

// Initialize DOM Elements
function initializeElements() {
    const elementIds = [
        'connectionModal', 'connectBtn', 'passwordError', 'logoutBtn',
        'pendingGuestsBtn', 'pendingGuestsModal', 'closePendingModal',
        'pendingGuestsList', 'noPendingGuests', 'statusIndicator',
        'userRoleDisplay', 'pendingCount', 'chatMessages', 'messageInput',
        'sendMessageBtn', 'clearChatBtn', 'imageUpload', 'emojiBtn',
        'emojiPicker', 'chatTitle', 'chatModeIndicator', 'returnToActiveBtn',
        'historyCards', 'refreshHistoryBtn', 'soundControl', 'messageSound',
        'typingIndicator', 'typingUser', 'imageModal', 'fullSizeImage',
        'adminSection', 'historyTabBtn', 'usersTabBtn', 'historyTabContent',
        'usersTabContent', 'userManagementSection', 'backToHistoryBtn',
        'addUserBtn', 'userSearchInput', 'usersList', 'addUserModal',
        'closeAddUserModal', 'editUserModal', 'closeEditUserModal',
        'newUsername', 'newDisplayName', 'newPassword', 'newRole',
        'addUserError', 'saveUserBtn', 'editUserId', 'editUsername',
        'editDisplayName', 'editPassword', 'editRole', 'editIsActive',
        'editUserError', 'updateUserBtn', 'deleteUserBtn', 'usernameInput',
        'passwordInput'
    ];

    elementIds.forEach(id => {
        elements[id] = document.getElementById(id);
    });
}

// Modal Management
const ModalManager = {
    show(modal) {
        if (!modal) return;
        modal.style.display = 'flex';
        modal.classList.add('show');
        document.body.classList.add('modal-open');
    },

    hide(modal) {
        if (!modal) return;
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
    },

    showConnectionModal() {
        this.show(elements.connectionModal);
        document.querySelector('.main-container, .app-container').style.display = 'none';
        
        // Reset form
        if (elements.usernameInput) elements.usernameInput.value = '';
        if (elements.passwordInput) elements.passwordInput.value = '';
        if (elements.passwordError) elements.passwordError.style.display = 'none';
        
        this.updatePasswordHint('');
        this.clearSensitiveData();
    },

    hideConnectionModal() {
        this.hide(elements.connectionModal);
        document.querySelector('.main-container, .app-container').style.display = 'block';
    },

    updatePasswordHint(username) {
        const passwordHint = document.getElementById('passwordHint');
        if (!passwordHint) return;
        
        const hints = {
            'guest': "Test password: guest123",
            'host': "Test password: host123",
            'admin': "Administrator account"
        };
        
        passwordHint.textContent = hints[username] || '';
        passwordHint.style.display = hints[username] ? 'block' : 'none';
    },

    clearSensitiveData() {
        document.querySelectorAll('[class*="ip"], [class*="IP"]').forEach(el => {
            if (el.textContent.includes('IP:') || el.textContent.includes('ip:')) {
                el.textContent = 'IP: ***';
            }
        });
        
        if (!state.isHost && elements.historyCards) {
            elements.historyCards.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-lock" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <div>History view requires host privileges</div>
                </div>
            `;
        }
    }
};

// Authentication Service
const AuthService = {
    async authenticate(username, password) {
        try {
            // Check user exists and is active
            const { data: user, error } = await supabase
                .from('user_management')
                .select('id, username, display_name, password_hash, role, is_active')
                .ilike('username', username)
                .eq('is_active', true)
                .single();

            if (error || !user) {
                return { authenticated: false, error: "User not found or inactive" };
            }

            // Try RPC password verification
            const isAuthenticated = await this.verifyPasswordRPC(user.password_hash, password) ||
                                   await this.verifyPasswordFallback(username, password);

            if (!isAuthenticated) {
                return { authenticated: false, error: "Invalid password" };
            }

            // Update last login
            await this.updateLastLogin(user.id);

            return {
                authenticated: true,
                user: {
                    id: user.id,
                    username: user.username,
                    displayName: user.display_name || user.username,
                    role: user.role,
                    isActive: user.is_active
                }
            };

        } catch (error) {
            console.error("Authentication error:", error);
            return { authenticated: false, error: error.message };
        }
    },

    async verifyPasswordRPC(storedHash, password) {
        try {
            const { data, error } = await supabase
                .rpc('verify_password', {
                    stored_hash: storedHash,
                    password: password
                });
            
            return !error && data === true;
        } catch {
            return false;
        }
    },

    async verifyPasswordFallback(username, password) {
        try {
            const { data } = await supabase
                .rpc('authenticate_user', {
                    p_username: username,
                    p_password: password
                });
            
            return data && data.length > 0 && data[0].is_authenticated;
        } catch {
            // Fallback to test passwords for development
            return TEST_PASSWORDS[username] === password;
        }
    },

    async updateLastLogin(userId) {
        try {
            await supabase
                .from('user_management')
                .update({ 
                    last_login: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId);
        } catch (error) {
            console.warn("Could not update last login:", error);
        }
    }
};

// Session Management
const SessionManager = {
    async connectAsHost(userIP) {
        try {
            const sessionId = `session_${Date.now().toString(36)}`;
            
            const { data, error } = await supabase
                .from('sessions')
                .insert([{
                    session_id: sessionId,
                    host_id: state.userId,
                    host_name: state.userName,
                    host_ip: userIP,
                    is_active: true,
                    requires_approval: true,
                    created_at: new Date().toISOString(),
                    max_guests: DEFAULT_MAX_GUESTS
                }])
                .select()
                .single();

            if (error) throw error;

            state.sessionId = sessionId;
            state.currentSessionId = sessionId;
            state.isConnected = true;

            this.saveSessionToStorage();
            ModalManager.hideConnectionModal();
            this.updateUIAfterConnection();

            await MessageService.saveSystemMessage(`${state.userName} created a new chat session.`);
            this.setupSubscriptions();
            this.loadPendingGuests();
            
            await Promise.all([
                this.loadChatHistory(),
                this.loadChatSessions()
            ]);

        } catch (error) {
            console.error("Host connection error:", error);
            throw error;
        }
    },

    async connectAsGuest(userIP) {
        try {
            // Find active session
            const { data: activeSessions, error: sessionsError } = await supabase
                .from('sessions')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1);

            if (sessionsError || !activeSessions?.[0]) {
                throw new Error("No active session found");
            }

            const session = activeSessions[0];

            // Check guest limits
            const guestCount = await this.getApprovedGuestCount(session.session_id);
            if (guestCount >= (session.max_guests || 10)) {
                throw new Error("Session has reached maximum guest limit");
            }

            // Check existing guest status
            const existingStatus = await this.checkGuestStatus(session.session_id);
            if (existingStatus === 'approved') {
                await this.connectApprovedGuest(session);
                return;
            }

            if (existingStatus === 'pending') {
                this.showPendingApprovalUI(session.session_id);
                return;
            }

            // Add to pending list
            await this.addGuestToPending(session, userIP);
            this.showPendingApprovalUI(session.session_id);

        } catch (error) {
            console.error("Guest connection error:", error);
            throw error;
        }
    },

    async getApprovedGuestCount(sessionId) {
        const { data, error } = await supabase
            .from('session_guests')
            .select('id', { count: 'exact' })
            .eq('session_id', sessionId)
            .eq('status', 'approved');
        
        return error ? 0 : (data?.length || 0);
    },

    async checkGuestStatus(sessionId) {
        const { data, error } = await supabase
            .from('session_guests')
            .select('status')
            .eq('session_id', sessionId)
            .eq('guest_id', state.userId)
            .single();
        
        return error ? null : data?.status;
    },

    async connectApprovedGuest(session) {
        state.sessionId = session.session_id;
        state.currentSessionId = session.session_id;
        state.isConnected = true;

        this.saveSessionToStorage();
        ModalManager.hideConnectionModal();
        this.updateUIAfterConnection();
        this.setupSubscriptions();
        await this.loadChatHistory();

        await MessageService.saveSystemMessage(`${state.userName} joined the chat.`);
    },

    showPendingApprovalUI(sessionId) {
        state.sessionId = sessionId;
        ModalManager.hideConnectionModal();
        
        // Update UI for pending status
        elements.statusIndicator.className = 'status-indicator offline';
        elements.userRoleDisplay.textContent = `${state.userName} (Pending Approval)`;
        elements.messageInput.disabled = true;
        elements.messageInput.placeholder = "Waiting for host approval...";
        
        elements.chatMessages.innerHTML = `
            <div class="message received">
                <div class="message-sender">System</div>
                <div class="message-content">
                    <div class="message-text">Your access request has been sent to the host. Please wait for approval.</div>
                    <div class="message-time">Just now</div>
                </div>
            </div>
        `;

        this.setupPendingApprovalSubscription(sessionId);
    },

    async addGuestToPending(session, userIP) {
        const { error } = await supabase
            .from('session_guests')
            .insert([{
                session_id: session.session_id,
                guest_id: state.userId,
                guest_name: state.userName,
                guest_ip: userIP,
                status: 'pending',
                requested_at: new Date().toISOString()
            }]);

        if (error) throw error;
    },

    saveSessionToStorage() {
        localStorage.setItem('writeToMe_session', JSON.stringify({
            isHost: state.isHost,
            userName: state.userName,
            userId: state.userId,
            sessionId: state.sessionId,
            connectionTime: state.connectionTime,
            soundEnabled: state.soundEnabled
        }));
    },

    updateUIAfterConnection() {
        // Status indicator
        elements.statusIndicator.className = 'status-indicator online';
        elements.userRoleDisplay.textContent = `${state.userName} (Connected)`;
        elements.logoutBtn.style.display = 'flex';

        // Enable chat
        elements.messageInput.disabled = false;
        elements.messageInput.placeholder = "Type your message here... (Press Enter to send, Shift+Enter for new line)";
        elements.messageInput.focus();
        elements.sendMessageBtn.disabled = false;

        // Admin panel
        if (elements.adminSection) {
            elements.adminSection.style.display = state.isHost ? 'block' : 'none';
            if (state.isHost) TabManager.switchTab('history');
        }

        // Pending guests button
        if (elements.pendingGuestsBtn) {
            const hasPendingGuests = state.pendingGuests?.length > 0;
            elements.pendingGuestsBtn.style.display = state.isHost && hasPendingGuests ? 'flex' : 'none';
            elements.pendingCount.textContent = hasPendingGuests ? state.pendingGuests.length : '0';
        }

        // Clear any pending messages
        const pendingMessages = elements.chatMessages.querySelectorAll('.message-sender');
        pendingMessages.forEach(msg => {
            if (msg.textContent === 'System' && msg.closest('.message').textContent.includes('waiting for host approval')) {
                msg.closest('.message').remove();
            }
        });
    },

    setupSubscriptions() {
        this.cleanupSubscriptions();

        // Messages subscription
        state.subscriptions.realtime = supabase
            .channel(`messages-${state.currentSessionId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `session_id=eq.${state.currentSessionId}`
            }, (payload) => {
                if (payload.new.sender_id !== state.userId) {
                    MessageService.display({
                        id: payload.new.id,
                        sender: payload.new.sender_name,
                        text: payload.new.message,
                        image: payload.new.image_url,
                        time: new Date(payload.new.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        type: 'received',
                        isHistorical: false
                    });

                    if (state.soundEnabled && !state.isViewingHistory) {
                        elements.messageSound.currentTime = 0;
                        elements.messageSound.play().catch(e => console.log("Audio error:", e));
                    }
                }
            })
            .subscribe();

        // Typing subscription
        state.subscriptions.typing = supabase
            .channel(`typing-${state.currentSessionId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'sessions',
                filter: `session_id=eq.${state.currentSessionId}`
            }, (payload) => {
                if (payload.new.typing_user && payload.new.typing_user !== state.userName) {
                    elements.typingUser.textContent = payload.new.typing_user;
                    elements.typingIndicator.classList.add('show');
                    
                    setTimeout(() => {
                        elements.typingIndicator.classList.remove('show');
                    }, 3000);
                }
            })
            .subscribe();
    },

    setupPendingApprovalSubscription(sessionId) {
        state.subscriptions.pending = supabase
            .channel(`pending-${sessionId}-${state.userId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'session_guests',
                filter: `session_id=eq.${sessionId}AND guest_id=eq.${state.userId}`
            }, async (payload) => {
                if (payload.new?.status === 'approved') {
                    await this.connectApprovedGuest({ session_id: sessionId });
                    this.cleanupSubscription('pending');
                } else if (payload.new?.status === 'rejected') {
                    alert("Your access request was rejected.");
                    location.reload();
                }
            })
            .subscribe();
    },

    cleanupSubscriptions() {
        Object.values(state.subscriptions).forEach(sub => {
            if (sub) supabase.removeChannel(sub);
        });
        state.subscriptions = { realtime: null, typing: null, pending: null };
    },

    cleanupSubscription(type) {
        if (state.subscriptions[type]) {
            supabase.removeChannel(state.subscriptions[type]);
            state.subscriptions[type] = null;
        }
    }
};

// Message Service
const MessageService = {
    async send(text, imageFile = null) {
        if (!state.isConnected || state.isViewingHistory) {
            alert("Cannot send messages now.");
            return;
        }

        let imageUrl = null;
        
        if (imageFile) {
            imageUrl = await this.processImage(imageFile);
        }

        const messageData = {
            session_id: state.currentSessionId,
            sender_id: state.userId,
            sender_name: state.userName,
            message: text || '',
            created_at: new Date().toISOString(),
            ...(imageUrl && { image_url: imageUrl })
        };

        try {
            const { error } = await supabase
                .from('messages')
                .insert([messageData]);

            if (error) throw error;

            this.display({
                id: `temp_${Date.now()}`,
                sender: state.userName,
                text,
                image: imageUrl,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'sent',
                isHistorical: false
            });

            return { success: true };

        } catch (error) {
            console.error("Send error:", error);
            alert(`Failed to send: ${error.message}`);
            return null;
        }
    },

    async processImage(file) {
        return new Promise((resolve, reject) => {
            if (file.size > 5 * 1024 * 1024) {
                reject(new Error("Image must be < 5MB"));
                return;
            }

            if (!file.type.startsWith('image/')) {
                reject(new Error("File must be an image"));
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    display(message) {
        if (state.isViewingHistory && !message.isHistorical) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type} ${message.isHistorical ? 'historical' : ''}`;
        messageDiv.id = `msg-${message.id}`;

        let content = message.text || '';
        if (message.image) {
            content += `<img src="${message.image}" class="message-image" onclick="showFullImage('${message.image}')">`;
        }

        messageDiv.innerHTML = `
            <div class="message-sender">${message.sender}</div>
            <div class="message-content">
                <div class="message-text">${content}</div>
                <div class="message-time">${message.time}</div>
            </div>
            ${message.type === 'sent' && !message.isHistorical ? `
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

        elements.chatMessages.appendChild(messageDiv);
        elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
    },

    async saveSystemMessage(text) {
        try {
            await supabase
                .from('messages')
                .insert([{
                    session_id: state.currentSessionId,
                    sender_id: 'system',
                    sender_name: 'System',
                    message: text,
                    created_at: new Date().toISOString()
                }]);
        } catch (error) {
            console.error("System message error:", error);
        }
    },

    async loadHistory(sessionId = null) {
        const targetId = sessionId || state.currentSessionId;
        if (!targetId) return;

        try {
            const { data: messages, error } = await supabase
                .from('messages')
                .select('*')
                .eq('session_id', targetId)
                .eq('is_deleted', false)
                .order('created_at', { ascending: true });

            if (error) throw error;

            elements.chatMessages.innerHTML = '';

            if (sessionId) {
                const { data: session } = await supabase
                    .from('sessions')
                    .select('created_at')
                    .eq('session_id', sessionId)
                    .single();

                this.display({
                    id: 'history_header',
                    sender: 'System',
                    text: `Historical Chat - ${new Date(session.created_at).toLocaleDateString()}`,
                    time: '',
                    type: 'received',
                    isHistorical: true
                });
            }

            messages.forEach(msg => {
                this.display({
                    id: msg.id,
                    sender: msg.sender_name,
                    text: msg.message,
                    image: msg.image_url,
                    time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    type: msg.sender_id === state.userId ? 'sent' : 'received',
                    isHistorical: !!sessionId
                });
            });

            elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;

        } catch (error) {
            console.error("Load history error:", error);
        }
    }
};

// Pending Guests Manager
const PendingGuestsManager = {
    async load() {
        if (!state.isHost || !state.currentSessionId) return;

        try {
            const { data: guests, error } = await supabase
                .from('session_guests')
                .select('*')
                .eq('session_id', state.currentSessionId)
                .eq('status', 'pending')
                .order('requested_at', { ascending: true });

            if (error) throw error;

            state.pendingGuests = guests || [];
            this.updateUI();

        } catch (error) {
            console.error("Load pending guests error:", error);
            state.pendingGuests = [];
            this.updateUI();
        }
    },

    updateUI() {
        if (!elements.pendingCount || !elements.pendingGuestsBtn) return;

        elements.pendingCount.textContent = state.pendingGuests.length;
        elements.pendingGuestsBtn.style.display = 
            state.isHost && state.pendingGuests.length > 0 ? 'flex' : 'none';
    },

    async showModal() {
        if (!elements.pendingGuestsList) return;

        await this.load();

        elements.pendingGuestsList.innerHTML = '';
        
        if (state.pendingGuests.length === 0) {
            elements.noPendingGuests.style.display = 'block';
            return;
        }

        elements.noPendingGuests.style.display = 'none';

        state.pendingGuests.forEach(guest => {
            const guestDiv = document.createElement('div');
            guestDiv.className = 'pending-guest';
            guestDiv.innerHTML = `
                <div class="guest-info">
                    <div class="guest-name">
                        <i class="fas fa-user"></i>
                        <strong>${guest.guest_name}</strong>
                    </div>
                    <div class="guest-details">
                        <small>User ID: ${guest.guest_id?.substring(0, 8)}...</small>
                        <small>IP: ${guest.guest_ip || 'Unknown'}</small>
                        <small>Requested: ${new Date(guest.requested_at).toLocaleString()}</small>
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
            elements.pendingGuestsList.appendChild(guestDiv);
        });

        elements.pendingGuestsModal.style.display = 'flex';
    },

    async approve(guestRecordId) {
        try {
            // Update status
            const { error } = await supabase
                .from('session_guests')
                .update({
                    status: 'approved',
                    approved_at: new Date().toISOString()
                })
                .eq('id', guestRecordId);

            if (error) throw error;

            // Refresh list
            await this.load();
            this.updateUI();

        } catch (error) {
            console.error("Approve error:", error);
            alert(`Approve failed: ${error.message}`);
        }
    },

    async deny(guestRecordId) {
        try {
            const { error } = await supabase
                .from('session_guests')
                .update({
                    status: 'rejected',
                    left_at: new Date().toISOString()
                })
                .eq('id', guestRecordId);

            if (error) throw error;

            await this.load();
            this.updateUI();

        } catch (error) {
            console.error("Deny error:", error);
            alert(`Deny failed: ${error.message}`);
        }
    }
};

// History Manager
const HistoryManager = {
    async loadSessions() {
        if (!state.isHost || !elements.historyCards) return;

        try {
            const { data: sessions, error } = await supabase
                .from('sessions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            elements.historyCards.innerHTML = '';

            for (const session of sessions) {
                const card = await this.createSessionCard(session);
                elements.historyCards.appendChild(card);
            }

        } catch (error) {
            console.error("Load sessions error:", error);
            elements.historyCards.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                    Error loading sessions
                </div>
            `;
        }
    },

    async createSessionCard(session) {
        const [guests, pendingGuests] = await Promise.all([
            this.getGuests(session.session_id, 'approved'),
            this.getGuests(session.session_id, 'pending')
        ]);

        const isActive = session.session_id === state.currentSessionId && session.is_active;
        const duration = this.calculateDuration(session.created_at, session.ended_at);
        const hostIP = state.isHost ? (session.host_ip || 'N/A') : '***';

        const card = document.createElement('div');
        card.className = `session-card ${isActive ? 'active' : ''}`;
        
        card.innerHTML = this.getSessionCardHTML(session, guests, pendingGuests, duration, hostIP);
        
        // Add click handler for viewing history
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.session-actions')) {
                this.viewHistory(session.session_id);
            }
        });

        return card;
    },

    async getGuests(sessionId, status) {
        const { data, error } = await supabase
            .from('session_guests')
            .select('guest_name')
            .eq('session_id', sessionId)
            .eq('status', status);
        
        return error ? [] : data;
    },

    calculateDuration(start, end) {
        if (!end) return 'Ongoing';
        
        const diffMs = new Date(end) - new Date(start);
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
        if (diffHours > 0) return `${diffHours}h ${diffMins % 60}m`;
        return `${diffMins}m`;
    },

    getSessionCardHTML(session, guests, pendingGuests, duration, hostIP) {
        const guestNames = guests.length <= 3 
            ? guests.map(g => g.guest_name).join(', ')
            : `${guests.slice(0, 2).map(g => g.guest_name).join(', ')} + ${guests.length - 2} more`;

        return `
            <div class="session-card-header">
                <div class="session-header-left">
                    <div class="session-id">${session.session_id.substring(0, 12)}...</div>
                    <div class="session-stats">
                        <span class="guest-count">
                            <i class="fas fa-users"></i> ${guests.length}
                        </span>
                        ${pendingGuests.length > 0 ? `
                        <span class="pending-count">
                            <i class="fas fa-user-clock"></i> ${pendingGuests.length}
                        </span>
                        ` : ''}
                    </div>
                </div>
                ${session.is_active ? '<div class="session-active-badge">Active Now</div>' : ''}
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
                        <span class="session-info-value" title="${guests.map(g => g.guest_name).join(', ')}">
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
                        <span class="session-info-value">
                            ${new Date(session.created_at).toLocaleDateString()} 
                            ${new Date(session.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                    <div class="session-info-row">
                        <span class="session-info-label">${session.ended_at ? 'Ended:' : 'Status:'}</span>
                        <span class="session-info-value">
                            ${session.ended_at ? 
                                `${new Date(session.ended_at).toLocaleDateString()} 
                                 ${new Date(session.ended_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : 
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
                <button class="btn btn-success btn-small" onclick="downloadSession('${session.session_id}')">
                    <i class="fas fa-download"></i> Export
                </button>
                ${state.isHost ? `
                <button class="btn btn-danger btn-small" onclick="deleteSession('${session.session_id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
                ` : ''}
            </div>
        `;
    },

    viewHistory(sessionId) {
        state.isViewingHistory = true;
        state.viewingSessionId = sessionId;
        
        elements.chatModeIndicator.style.display = 'flex';
        elements.chatTitle.innerHTML = '<i class="fas fa-history"></i> Historical Chat';
        elements.messageInput.disabled = true;
        elements.messageInput.placeholder = "Cannot send messages in historical view";
        
        MessageService.loadHistory(sessionId);
    },

    returnToActive() {
        state.isViewingHistory = false;
        state.viewingSessionId = null;
        
        elements.chatModeIndicator.style.display = 'none';
        elements.chatTitle.innerHTML = '<i class="fas fa-comments"></i> Active Chat';
        elements.messageInput.disabled = false;
        elements.messageInput.placeholder = "Type your message here... (Press Enter to send, Shift+Enter for new line)";
        elements.messageInput.focus();
        
        MessageService.loadHistory();
    }
};

// Tab Manager
const TabManager = {
    switchTab(tabName) {
        if (!state.isHost) return;

        // Update tab buttons
        if (elements.historyTabBtn && elements.usersTabBtn) {
            elements.historyTabBtn.classList.toggle('active', tabName === 'history');
            elements.usersTabBtn.classList.toggle('active', tabName === 'users');
        }

        // Update content
        if (elements.historyTabContent && elements.usersTabContent) {
            elements.historyTabContent.classList.toggle('active', tabName === 'history');
            elements.usersTabContent.classList.toggle('active', tabName === 'users');
        }

        // Load appropriate content
        if (tabName === 'history') {
            HistoryManager.loadSessions();
        } else if (tabName === 'users') {
            UserManager.loadUsers();
        }
    }
};

// User Manager
const UserManager = {
    async loadUsers() {
        if (!state.isHost || !elements.usersList) return;

        try {
            const { data: users, error } = await supabase
                .from('user_management')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            state.users = users || [];
            this.renderUsers(users);

        } catch (error) {
            console.error("Load users error:", error);
            elements.usersList.innerHTML = `
                <div style="padding: 20px; text-align: center; color: var(--danger-red);">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>Error loading users: ${error.message}</div>
                </div>
            `;
        }
    },

    renderUsers(users) {
        if (!users || users.length === 0) {
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
            userCard.dataset.userId = user.id;
            userCard.innerHTML = this.getUserCardHTML(user);
            elements.usersList.appendChild(userCard);
        });
    },

    getUserCardHTML(user) {
        const lastLogin = user.last_login 
            ? new Date(user.last_login).toLocaleString() 
            : 'Never';

        return `
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
                <div class="user-detail">
                    <span class="user-detail-label">Created By:</span>
                    <span class="user-detail-value">${user.created_by || 'System'}</span>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn btn-secondary btn-small" onclick="editUserModalOpen('${user.id}')">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger btn-small" onclick="confirmDeleteUser('${user.id}', '${user.username}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
    }
};

// Event Handlers
const EventHandlers = {
    async handleConnect() {
        const username = elements.usernameInput.value.trim();
        const password = elements.passwordInput.value;

        // Validation
        if (!username || !password) {
            this.showError("Please enter both username and password.");
            return;
        }

        // Disable button and show loading
        elements.connectBtn.disabled = true;
        elements.connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';

        try {
            // Authenticate user
            const authResult = await AuthService.authenticate(username, password);
            
            if (!authResult.authenticated) {
                this.showError(authResult.error || "Invalid credentials.");
                return;
            }

            // Set user state
            state.isHost = authResult.user.role === 'host';
            state.userName = authResult.user.displayName;
            state.userId = authResult.user.id;
            state.connectionTime = new Date();

            // Get IP and connect
            const userIP = await this.getUserIP();
            
            if (state.isHost) {
                await SessionManager.connectAsHost(userIP);
            } else {
                await SessionManager.connectAsGuest(userIP);
            }

        } catch (error) {
            console.error("Connection error:", error);
            this.showError(error.message || "Connection failed.");
        } finally {
            this.resetConnectButton();
        }
    },

    async handleLogout() {
        if (!confirm("Are you sure you want to logout?")) return;

        try {
            // Update session status
            if (state.currentSessionId) {
                if (state.isHost) {
                    await supabase
                        .from('sessions')
                        .update({ 
                            is_active: false,
                            ended_at: new Date().toISOString()
                        })
                        .eq('session_id', state.currentSessionId);
                } else {
                    await supabase
                        .from('session_guests')
                        .update({ 
                            status: 'left',
                            left_at: new Date().toISOString()
                        })
                        .eq('session_id', state.currentSessionId)
                        .eq('guest_id', state.userId);
                }
            }

            // Cleanup
            SessionManager.cleanupSubscriptions();
            localStorage.removeItem('writeToMe_session');

            // Reset state
            Object.assign(state, {
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
                isViewingUsers: false,
                users: []
            });

            // Reset UI
            this.resetUI();

            // Show login modal
            ModalManager.showConnectionModal();

        } catch (error) {
            console.error("Logout error:", error);
            alert("Logout failed. Please refresh the page.");
        }
    },

    async handleSendMessage() {
        const text = elements.messageInput.value.trim();
        const imageFile = elements.imageUpload.files[0];

        if (!text && !imageFile) return;

        await MessageService.send(text, imageFile);
        elements.messageInput.value = '';
        elements.imageUpload.value = '';
    },

    handleTyping() {
        if (!state.currentSessionId || state.isViewingHistory || !state.isConnected) return;

        clearTimeout(state.typingTimeout);

        supabase
            .from('sessions')
            .update({ typing_user: state.userName })
            .eq('session_id', state.currentSessionId)
            .catch(console.error);

        state.typingTimeout = setTimeout(() => {
            supabase
                .from('sessions')
                .update({ typing_user: null })
                .eq('session_id', state.currentSessionId)
                .catch(console.error);
        }, 1000);
    },

    toggleSound() {
        state.soundEnabled = !state.soundEnabled;
        
        elements.soundControl.innerHTML = state.soundEnabled 
            ? '<i class="fas fa-volume-up"></i> <span>Sound On</span>'
            : '<i class="fas fa-volume-mute"></i> <span>Sound Off</span>';
        elements.soundControl.classList.toggle('muted', !state.soundEnabled);

        // Save preference
        const savedSession = localStorage.getItem('writeToMe_session');
        if (savedSession) {
            const sessionData = JSON.parse(savedSession);
            sessionData.soundEnabled = state.soundEnabled;
            localStorage.setItem('writeToMe_session', JSON.stringify(sessionData));
        }
    },

    showError(message) {
        if (elements.passwordError) {
            elements.passwordError.textContent = message;
            elements.passwordError.style.display = 'block';
        }
    },

    resetConnectButton() {
        if (elements.connectBtn) {
            elements.connectBtn.disabled = false;
            elements.connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect';
        }
    },

    resetUI() {
        // Status
        elements.statusIndicator.className = 'status-indicator offline';
        elements.userRoleDisplay.textContent = "Disconnected";
        elements.logoutBtn.style.display = 'none';
        elements.pendingGuestsBtn.style.display = 'none';

        // Chat
        elements.chatMessages.innerHTML = `
            <div class="message received">
                <div class="message-sender">System</div>
                <div class="message-content">
                    <div class="message-text">Disconnected. Please reconnect to continue.</div>
                    <div class="message-time">Just now</div>
                </div>
            </div>
        `;
        elements.messageInput.disabled = true;
        elements.messageInput.placeholder = "Please connect to start chatting";
        elements.messageInput.value = '';

        // Admin
        if (elements.adminSection) {
            elements.adminSection.style.display = 'none';
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
    }
};

// Initialize App
async function initApp() {
    // Initialize DOM elements
    initializeElements();
    
    // Hide main content initially
    document.querySelector('.main-container, .app-container').style.display = 'none';

    // Check for saved session
    const savedSession = localStorage.getItem('writeToMe_session');
    if (savedSession) {
        try {
            const sessionData = JSON.parse(savedSession);
            Object.assign(state, sessionData);
            
            if (await SessionManager.reconnectToSession()) {
                state.isConnected = true;
                ModalManager.hideConnectionModal();
                SessionManager.updateUIAfterConnection();
                await Promise.all([
                    MessageService.loadHistory(),
                    PendingGuestsManager.load()
                ]);
            } else {
                localStorage.removeItem('writeToMe_session');
                ModalManager.showConnectionModal();
            }
        } catch {
            localStorage.removeItem('writeToMe_session');
            ModalManager.showConnectionModal();
        }
    } else {
        ModalManager.showConnectionModal();
    }

    // Setup event listeners
    this.setupEventListeners();
    this.setupUserManagementListeners();
    this.populateEmojis();
    
    // Load initial data if connected
    if (state.isHost) {
        await HistoryManager.loadSessions();
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Connection
    if (elements.usernameInput) {
        elements.usernameInput.addEventListener('input', function() {
            ModalManager.updatePasswordHint(this.value.toLowerCase());
            if (elements.passwordError) elements.passwordError.style.display = 'none';
        });
    }

    if (elements.passwordInput) {
        elements.passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') EventHandlers.handleConnect();
        });
    }

    if (elements.connectBtn) {
        elements.connectBtn.addEventListener('click', EventHandlers.handleConnect);
    }

    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener('click', EventHandlers.handleLogout);
    }

    // Pending Guests
    if (elements.pendingGuestsBtn) {
        elements.pendingGuestsBtn.addEventListener('click', () => PendingGuestsManager.showModal());
    }

    if (elements.closePendingModal) {
        elements.closePendingModal.addEventListener('click', () => {
            elements.pendingGuestsModal.style.display = 'none';
        });
    }

    // Chat
    if (elements.messageInput) {
        elements.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                EventHandlers.handleSendMessage();
            }
        });
        elements.messageInput.addEventListener('input', EventHandlers.handleTyping);
        elements.messageInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }

    if (elements.sendMessageBtn) {
        elements.sendMessageBtn.addEventListener('click', EventHandlers.handleSendMessage);
    }

    if (elements.clearChatBtn) {
        elements.clearChatBtn.addEventListener('click', async () => {
            if (!state.isConnected) return;
            
            const message = state.isHost 
                ? "Clear chat for everyone?"
                : "Clear your chat view?";
            
            if (!confirm(message)) return;
            
            if (state.isHost) {
                await supabase
                    .from('messages')
                    .delete()
                    .eq('session_id', state.currentSessionId);
                elements.chatMessages.innerHTML = '';
            } else {
                elements.chatMessages.innerHTML = '';
            }
        });
    }

    // Image upload
    if (elements.imageUpload) {
        elements.imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                elements.messageInput.value = `[Image: ${file.name}]`;
                EventHandlers.handleSendMessage();
            }
        });
    }

    // Emoji picker
    if (elements.emojiBtn) {
        elements.emojiBtn.addEventListener('click', () => {
            elements.emojiPicker.classList.toggle('show');
        });
    }

    // History
    if (elements.returnToActiveBtn) {
        elements.returnToActiveBtn.addEventListener('click', () => HistoryManager.returnToActive());
    }

    if (elements.refreshHistoryBtn) {
        elements.refreshHistoryBtn.addEventListener('click', () => HistoryManager.loadSessions());
    }

    // Sound control
    if (elements.soundControl) {
        elements.soundControl.addEventListener('click', EventHandlers.toggleSound);
    }

    // Image modal
    if (elements.imageModal) {
        elements.imageModal.addEventListener('click', () => {
            elements.imageModal.style.display = 'none';
        });
    }

    // Tabs
    if (elements.historyTabBtn) {
        elements.historyTabBtn.addEventListener('click', () => TabManager.switchTab('history'));
    }

    if (elements.usersTabBtn) {
        elements.usersTabBtn.addEventListener('click', () => TabManager.switchTab('users'));
    }

    // Close emoji picker on outside click
    document.addEventListener('click', (e) => {
        if (elements.emojiPicker && !elements.emojiPicker.contains(e.target) && 
            elements.emojiBtn && !elements.emojiBtn.contains(e.target)) {
            elements.emojiPicker.classList.remove('show');
        }
    });
}

// Setup User Management Listeners
function setupUserManagementListeners() {
    // Add user
    if (elements.addUserBtn) {
        elements.addUserBtn.addEventListener('click', () => {
            if (!state.isHost) return;
            elements.addUserModal.style.display = 'flex';
        });
    }

    // Close modals
    if (elements.closeAddUserModal) {
        elements.closeAddUserModal.addEventListener('click', () => {
            elements.addUserModal.style.display = 'none';
        });
    }

    if (elements.closeEditUserModal) {
        elements.closeEditUserModal.addEventListener('click', () => {
            elements.editUserModal.style.display = 'none';
        });
    }

    // Back to history
    if (elements.backToHistoryBtn) {
        elements.backToHistoryBtn.addEventListener('click', () => {
            state.isViewingUsers = false;
            elements.historyCards.style.display = 'block';
            elements.userManagementSection.style.display = 'none';
            HistoryManager.loadSessions();
        });
    }
}

// Populate Emojis
function populateEmojis() {
    if (!elements.emojiPicker) return;
    
    elements.emojiPicker.innerHTML = '';
    EMOJIS.forEach(emoji => {
        const span = document.createElement('span');
        span.className = 'emoji';
        span.textContent = emoji;
        span.onclick = () => {
            elements.messageInput.value += emoji;
            elements.emojiPicker.classList.remove('show');
            elements.messageInput.focus();
        };
        elements.emojiPicker.appendChild(span);
    });
}

// Global functions
window.showFullImage = (src) => {
    elements.fullSizeImage.src = src;
    elements.imageModal.style.display = 'flex';
};

window.editMessage = async (messageId) => {
    const newText = prompt("Edit your message:");
    if (!newText?.trim()) return;

    try {
        await supabase
            .from('messages')
            .update({
                message: newText.trim(),
                edited_at: new Date().toISOString()
            })
            .eq('id', messageId)
            .eq('sender_id', state.userId);

        const messageElement = document.getElementById(`msg-${messageId}`);
        if (messageElement) {
            const textElement = messageElement.querySelector('.message-text');
            if (textElement) {
                textElement.innerHTML = `${newText.trim()} <small style="opacity:0.7;">(edited)</small>`;
            }
        }
    } catch (error) {
        console.error("Edit error:", error);
        alert("Edit failed.");
    }
};

window.deleteMessage = async (messageId) => {
    if (!confirm("Delete this message?")) return;

    try {
        await supabase
            .from('messages')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: state.userId
            })
            .eq('id', messageId);

        const messageElement = document.getElementById(`msg-${messageId}`);
        if (messageElement) {
            messageElement.innerHTML = `
                <div class="message-sender">${state.userName}</div>
                <div class="message-content">
                    <div class="message-text"><i>Message deleted</i></div>
                    <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                </div>
            `;
        }
    } catch (error) {
        console.error("Delete error:", error);
        alert("Delete failed.");
    }
};

window.replyToMessage = (messageId) => {
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (messageElement) {
        const sender = messageElement.querySelector('.message-sender').textContent;
        const text = messageElement.querySelector('.message-text').textContent;
        elements.messageInput.value = `Replying to ${sender}: ${text}\n`;
        elements.messageInput.focus();
    }
};

window.approveGuest = (guestRecordId) => PendingGuestsManager.approve(guestRecordId);
window.denyGuest = (guestRecordId) => PendingGuestsManager.deny(guestRecordId);
window.viewSessionHistory = (sessionId) => HistoryManager.viewHistory(sessionId);

window.downloadSession = async (sessionId) => {
    try {
        const [session, messages] = await Promise.all([
            supabase.from('sessions').select('*').eq('session_id', sessionId).single(),
            supabase.from('messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true })
        ]);

        const data = {
            session: session.data,
            messages: messages.data,
            exported_at: new Date().toISOString(),
            exported_by: state.userName
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `WriteToMe_Session_${sessionId}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error("Download error:", error);
        alert("Download failed.");
    }
};

window.deleteSession = async (sessionId) => {
    if (!confirm("Delete this session permanently?")) return;

    try {
        await Promise.all([
            supabase.from('messages').delete().eq('session_id', sessionId),
            supabase.from('sessions').delete().eq('session_id', sessionId)
        ]);

        await HistoryManager.loadSessions();
        
        if (state.viewingSessionId === sessionId) {
            HistoryManager.returnToActive();
        }
    } catch (error) {
        console.error("Delete session error:", error);
        alert("Delete failed.");
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
