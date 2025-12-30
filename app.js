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
    imageSubscription: null,
    typingSubscription: null,
    pendingSubscription: null, // NEW: Subscription for pending guests
    soundEnabled: true,
    isViewingHistory: false,
    viewingSessionId: null,
    pendingGuests: [],
    emojis: ["😀", "😂", "😍", "😎", "😭", "😡", "👍", "👎", "❤️", "🔥", "👏", "🙏", "🤔", "😴", "🥳"]
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

// Initialize the app
async function initApp() {
    // Check if user was previously connected
    const savedSession = localStorage.getItem('writeToMe_session');
    if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        appState.isHost = sessionData.isHost;
        appState.userName = sessionData.userName;
        appState.userId = sessionData.userId;
        appState.sessionId = sessionData.sessionId;
        appState.isConnected = true;
        appState.soundEnabled = sessionData.soundEnabled !== false;
        
        // Try to reconnect to the session
        if (await reconnectToSession()) {
            connectionModal.style.display = 'none';
            updateUIAfterConnection();
            loadChatHistory();
            loadPendingGuests();
        } else {
            // Session expired or invalid
            localStorage.removeItem('writeToMe_session');
            connectionModal.style.display = 'flex';
        }
    } else {
        connectionModal.style.display = 'flex';
    }

    // Set up sound control
    updateSoundControl();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load emojis
    populateEmojis();
    
    // Load chat sessions
    loadChatSessions();
}

// Set up all event listeners
function setupEventListeners() {
    // Connection modal
    const userSelect = document.getElementById('userSelect');
    const passwordInput = document.getElementById('passwordInput');
    
    userSelect.addEventListener('change', function() {
        document.getElementById('passwordError').style.display = 'none';
    });
    
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleConnect();
    });
    
    connectBtn.addEventListener('click', handleConnect);
    
    // Logout
    logoutBtn.addEventListener('click', handleLogout);
    
    // Pending guests
    pendingGuestsBtn.addEventListener('click', showPendingGuests);
    closePendingModal.addEventListener('click', () => {
        pendingGuestsModal.style.display = 'none';
    });
    
    // Chat functionality
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    messageInput.addEventListener('input', handleTyping);
    sendMessageBtn.addEventListener('click', sendMessage);
    clearChatBtn.addEventListener('click', clearChat);
    
    // Image upload
    imageUpload.addEventListener('change', handleImageUpload);
    
    // Emoji picker
    emojiBtn.addEventListener('click', toggleEmojiPicker);
    
    // Return to active chat
    returnToActiveBtn.addEventListener('click', returnToActiveChat);
    
    // History
    refreshHistoryBtn.addEventListener('click', loadChatSessions);
    
    // Sound control
    soundControl.addEventListener('click', toggleSound);
    
    // Image modal
    imageModal.addEventListener('click', () => {
        imageModal.style.display = 'none';
    });
    
    // Click outside emoji picker to close
    document.addEventListener('click', (e) => {
        if (!emojiPicker.contains(e.target) && !emojiBtn.contains(e.target)) {
            emojiPicker.classList.remove('show');
        }
    });
}

// Handle connection
async function handleConnect() {
    const userSelect = document.getElementById('userSelect');
    const passwordInput = document.getElementById('passwordInput');
    
    const selectedRole = userSelect.value;
    const password = passwordInput.value;
    
    // Reset error
    passwordError.style.display = 'none';
    
    // Authenticate user using Supabase function (server-side verification)
    try {
        const { data, error } = await supabaseClient
            .rpc('authenticate_user', {
                p_username: selectedRole,
                p_password: password
            });
        
        if (error) throw error;
        
        if (!data || data.length === 0 || !data[0].is_authenticated) {
            passwordError.style.display = 'block';
            passwordInput.focus();
            return;
        }
        
        const authResult = data[0];
        appState.isHost = authResult.user_role === 'host';
        appState.userName = authResult.user_role === 'host' ? "Host" : "Guest";
        appState.userId = authResult.user_id.toString();
        
    } catch (error) {
        console.error("Authentication error:", error);
        passwordError.style.display = 'block';
        return;
    }
    
    // Generate unique user ID if needed
    if (!appState.userId) {
        appState.userId = generateUserId();
    }
    
    appState.connectionTime = new Date();
    
    // Get real user IP
    const userIP = await getRealIP();
    
    if (appState.isHost) {
        // Host creates a new session
        const sessionId = 'session_' + Date.now().toString(36);
        const { data, error } = await supabaseClient
            .from('sessions')
            .insert([
                {
                    session_id: sessionId,
                    host_id: appState.userId,
                    host_name: appState.userName,
                    host_ip: userIP,
                    is_active: true,
                    requires_approval: true, // Always require approval for guests
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();
        
        if (error) {
            console.error("Error creating session:", error);
            alert("Failed to create session. Please try again.");
            return;
        }
        
        appState.sessionId = sessionId;
        appState.currentSessionId = sessionId;
    } else {
        // Guest requests to join
        // First check if there's an active session
        const { data: activeSessions, error: sessionsError } = await supabaseClient
            .from('sessions')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (sessionsError || !activeSessions || activeSessions.length === 0) {
            alert("No active session found. Please ask the host to create a session first.");
            return;
        }
        
        const session = activeSessions[0];
        
        // IMPORTANT: Always require approval - remove auto-approval logic
        // Add to pending guests
        const pendingGuest = {
            guest_id: appState.userId,
            guest_name: appState.userName,
            guest_ip: userIP,
            requested_at: new Date().toISOString(),
            status: 'pending'
        };
        
        // Update pending_guests array
        const currentPending = session.pending_guests || [];
        currentPending.push(pendingGuest);
        
        const { error: updateError } = await supabaseClient
            .from('sessions')
            .update({ 
                pending_guests: currentPending,
                guest_id: null, // Ensure guest_id is null until approved
                guest_name: null,
                guest_ip: null,
                guest_connected_at: null
            })
            .eq('session_id', session.session_id);
        
        if (updateError) {
            console.error("Error adding to pending:", updateError);
            alert("Failed to request access. Please try again.");
            return;
        }
        
        appState.sessionId = session.session_id;
        alert("Your access request has been sent to the host. Please wait for approval.");
        connectionModal.style.display = 'none';
        updateUIForPendingGuest();
        
        // Set up subscription to wait for approval
        setupPendingApprovalSubscription(session.session_id);
        return;
    }
    
    // If we get here, user is connected
    appState.isConnected = true;
    
    // Save session to localStorage
    localStorage.setItem('writeToMe_session', JSON.stringify({
        isHost: appState.isHost,
        userName: appState.userName,
        userId: appState.userId,
        sessionId: appState.sessionId,
        connectionTime: appState.connectionTime,
        soundEnabled: appState.soundEnabled
    }));
    
    connectionModal.style.display = 'none';
    updateUIAfterConnection();
    
    // Add connection message to chat
    await saveMessageToDB('System', `${appState.userName} has connected to the chat.`);
    
    // Setup real-time subscriptions
    setupRealtimeSubscriptions();
    
    // If host, show pending guests button and load pending guests
    if (appState.isHost) {
        pendingGuestsBtn.style.display = 'flex';
        loadPendingGuests();
        setupPendingGuestsSubscription(); // Set up subscription for pending guests updates
    }
    
    // Load chat history
    loadChatHistory();
    
    // Load chat sessions
    loadChatSessions();
}

// Set up subscription for pending guests (for host)
function setupPendingGuestsSubscription() {
    if (appState.pendingSubscription) {
        supabaseClient.removeChannel(appState.pendingSubscription);
    }
    
    appState.pendingSubscription = supabaseClient
        .channel('pending-guests-channel-' + appState.currentSessionId)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'sessions',
                filter: 'session_id=eq.' + appState.currentSessionId
            },
            (payload) => {
                // Update pending guests list
                appState.pendingGuests = payload.new.pending_guests || [];
                pendingCount.textContent = appState.pendingGuests.length;
                
                if (appState.pendingGuests.length === 0) {
                    pendingGuestsBtn.style.display = 'none';
                } else {
                    pendingGuestsBtn.style.display = 'flex';
                }
            }
        )
        .subscribe();
}

// Set up subscription for pending approval (for guest)
function setupPendingApprovalSubscription(sessionId) {
    if (appState.pendingSubscription) {
        supabaseClient.removeChannel(appState.pendingSubscription);
    }
    
    appState.pendingSubscription = supabaseClient
        .channel('pending-approval-channel-' + sessionId)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'sessions',
                filter: 'session_id=eq.' + sessionId
            },
            async (payload) => {
                // Check if this guest has been approved
                const session = payload.new;
                
                if (session.guest_id === appState.userId) {
                    // Guest has been approved!
                    appState.currentSessionId = sessionId;
                    appState.isConnected = true;
                    
                    // Update local storage
                    localStorage.setItem('writeToMe_session', JSON.stringify({
                        isHost: appState.isHost,
                        userName: appState.userName,
                        userId: appState.userId,
                        sessionId: appState.sessionId,
                        connectionTime: appState.connectionTime,
                        soundEnabled: appState.soundEnabled
                    }));
                    
                    // Update UI
                    updateUIAfterConnection();
                    
                    // Setup real-time subscriptions
                    setupRealtimeSubscriptions();
                    
                    // Load chat history
                    await loadChatHistory();
                    
                    // Add welcome message
                    await saveMessageToDB('System', `${appState.userName} has joined the chat.`);
                    
                    // Remove pending subscription
                    if (appState.pendingSubscription) {
                        supabaseClient.removeChannel(appState.pendingSubscription);
                        appState.pendingSubscription = null;
                    }
                    
                    alert("You have been approved by the host! You can now chat.");
                }
            }
        )
        .subscribe();
}

// Generate a unique user ID
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get real IP address (improved method)
async function getRealIP() {
    try {
        // Try multiple services in case one fails
        const services = [
            'https://api.ipify.org?format=json',
            'https://ipinfo.io/json',
            'https://api.my-ip.io/ip.json'
        ];
        
        for (const service of services) {
            try {
                const response = await fetch(service, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                    timeout: 5000
                });
                
                if (response.ok) {
                    const data = await response.json();
                    return data.ip || data.query || "Unknown";
                }
            } catch (e) {
                console.log(`IP service ${service} failed:`, e);
                continue;
            }
        }
        
        // Fallback: Try to get IP from WebRTC (with user permission)
        try {
            const rtcPeerConnection = window.RTCPeerConnection || 
                window.mozRTCPeerConnection || 
                window.webkitRTCPeerConnection;
            
            if (rtcPeerConnection) {
                const pc = new rtcPeerConnection({ iceServers: [] });
                const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/;
                
                pc.createDataChannel('');
                pc.createOffer().then(pc.setLocalDescription.bind(pc)).catch(() => {});
                
                pc.onicecandidate = (ice) => {
                    if (ice && ice.candidate && ice.candidate.candidate) {
                        const ipMatch = ipRegex.exec(ice.candidate.candidate);
                        if (ipMatch) {
                            pc.onicecandidate = () => {};
                            pc.close();
                            return ipMatch[1];
                        }
                    }
                };
            }
        } catch (e) {
            console.log("WebRTC IP detection failed:", e);
        }
        
        return "Unknown";
    } catch (error) {
        console.error("Error getting IP:", error);
        return "Unknown";
    }
}

// Reconnect to existing session
async function reconnectToSession() {
    try {
        // Check if session still exists
        const { data: session, error } = await supabaseClient
            .from('sessions')
            .select('*')
            .eq('session_id', appState.sessionId)
            .single();
        
        if (error || !session) return false;
        
        // Check user's role and status
        if (appState.isHost) {
            if (session.host_id !== appState.userId) return false;
        } else {
            // For guests, check if they're still approved
            if (!session.guest_id || session.guest_id !== appState.userId) {
                // If not approved, check if in pending
                const isPending = session.pending_guests?.some(g => g.guest_id === appState.userId);
                if (isPending) {
                    updateUIForPendingGuest();
                    setupPendingApprovalSubscription(session.session_id);
                    return false; // Not fully connected yet
                }
                return false;
            }
        }
        
        appState.currentSessionId = session.session_id;
        
        // Setup real-time subscriptions
        setupRealtimeSubscriptions();
        
        return true;
    } catch (error) {
        console.error("Error reconnecting:", error);
        return false;
    }
}

// Update UI for pending guest (not yet approved)
function updateUIForPendingGuest() {
    statusIndicator.classList.add('offline');
    userRoleDisplay.textContent = `${appState.userName} (Pending Approval)`;
    logoutBtn.style.display = 'flex';
    
    // Disable chat controls
    messageInput.disabled = true;
    sendMessageBtn.disabled = true;
    messageInput.placeholder = "Waiting for host approval...";
    
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

// Update UI after connection
function updateUIAfterConnection() {
    statusIndicator.classList.remove('offline');
    userRoleDisplay.textContent = `${appState.userName} (Connected)`;
    
    // Show logout button
    logoutBtn.style.display = 'flex';
    
    // Enable chat controls
    messageInput.disabled = false;
    sendMessageBtn.disabled = false;
    messageInput.focus();
}

// Handle logout
async function handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
        // Remove session from localStorage
        localStorage.removeItem('writeToMe_session');
        
        // Update session in database if connected
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
                        .from('sessions')
                        .update({ 
                            guest_id: null,
                            guest_name: null,
                            guest_connected_at: null,
                            guest_ip: null
                        })
                        .eq('session_id', appState.currentSessionId);
                }
            } catch (error) {
                console.error("Error updating session on logout:", error);
            }
        }
        
        // Reset app state
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
        
        // Remove subscriptions
        if (appState.realtimeSubscription) {
            supabaseClient.removeChannel(appState.realtimeSubscription);
        }
        if (appState.imageSubscription) {
            supabaseClient.removeChannel(appState.imageSubscription);
        }
        if (appState.typingSubscription) {
            supabaseClient.removeChannel(appState.typingSubscription);
        }
        if (appState.pendingSubscription) {
            supabaseClient.removeChannel(appState.pendingSubscription);
        }
        
        // Reset UI
        statusIndicator.classList.add('offline');
        userRoleDisplay.textContent = "Disconnected";
        logoutBtn.style.display = 'none';
        pendingGuestsBtn.style.display = 'none';
        messageInput.disabled = true;
        sendMessageBtn.disabled = true;
        messageInput.value = '';
        messageInput.placeholder = "Type your message here...";
        chatModeIndicator.style.display = 'none';
        chatTitle.innerHTML = '<i class="fas fa-comments"></i> Active Chat';
        
        // Clear chat
        chatMessages.innerHTML = `
            <div class="message received">
                <div class="message-sender">System</div>
                <div class="message-content">
                    <div class="message-text">Welcome to WriteToMe! Connect to start chatting.</div>
                    <div class="message-time">Just now</div>
                </div>
            </div>
        `;
        
        // Show connection modal
        connectionModal.style.display = 'flex';
        
        // Reset login form
        document.getElementById('userSelect').value = 'guest';
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordError').style.display = 'none';
    }
}

// Setup real-time subscriptions
function setupRealtimeSubscriptions() {
    // Remove existing subscriptions
    if (appState.realtimeSubscription) {
        supabaseClient.removeChannel(appState.realtimeSubscription);
    }
    if (appState.typingSubscription) {
        supabaseClient.removeChannel(appState.typingSubscription);
    }
    
    // Messages subscription
    appState.realtimeSubscription = supabaseClient
        .channel('messages-channel-' + appState.currentSessionId)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: 'session_id=eq.' + appState.currentSessionId
            },
            (payload) => {
                if (payload.new.sender_id !== appState.userId) {
                    displayMessage({
                        id: payload.new.id,
                        sender: payload.new.sender_name,
                        text: payload.new.message,
                        image: payload.new.image_url,
                        time: new Date(payload.new.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                        type: 'received',
                        is_historical: false
                    });
                    
                    // Play sound if enabled
                    if (appState.soundEnabled && !appState.isViewingHistory) {
                        messageSound.currentTime = 0;
                        messageSound.play().catch(e => console.log("Audio play failed:", e));
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
                filter: 'session_id=eq.' + appState.currentSessionId
            },
            (payload) => {
                // Handle message updates (edits/deletes)
                const messageElement = document.getElementById(`msg-${payload.new.id}`);
                if (messageElement) {
                    if (payload.new.is_deleted) {
                        messageElement.innerHTML = `
                            <div class="message-sender">${payload.new.sender_name}</div>
                            <div class="message-content">
                                <div class="message-text"><i>Message deleted</i></div>
                                <div class="message-time">${new Date(payload.new.updated_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                        `;
                    } else if (payload.new.edited_at) {
                        const textElement = messageElement.querySelector('.message-text');
                        if (textElement) {
                            textElement.innerHTML = `${payload.new.message} <small style="opacity:0.7;">(edited)</small>`;
                        }
                    }
                }
            }
        )
        .subscribe();
    
    // Typing indicator subscription
    appState.typingSubscription = supabaseClient
        .channel('typing-channel-' + appState.currentSessionId)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'sessions',
                filter: 'session_id=eq.' + appState.currentSessionId
            },
            (payload) => {
                if (payload.new.typing_user && payload.new.typing_user !== appState.userName) {
                    typingUser.textContent = payload.new.typing_user;
                    typingIndicator.classList.add('show');
                    
                    // Clear typing indicator after 3 seconds
                    setTimeout(() => {
                        typingIndicator.classList.remove('show');
                    }, 3000);
                }
            }
        )
        .subscribe();
}

// Handle typing
function handleTyping() {
    // Send typing indicator to database
    if (appState.currentSessionId && !appState.isViewingHistory) {
        supabaseClient
            .from('sessions')
            .update({ typing_user: appState.userName })
            .eq('session_id', appState.currentSessionId)
            .then(() => {
                // Clear typing indicator after 1 second
                if (appState.typingTimeout) {
                    clearTimeout(appState.typingTimeout);
                }
                appState.typingTimeout = setTimeout(() => {
                    supabaseClient
                        .from('sessions')
                        .update({ typing_user: null })
                        .eq('session_id', appState.currentSessionId);
                }, 1000);
            });
    }
}

// Send a chat message
async function sendMessage() {
    const messageText = messageInput.value.trim();
    const imageFile = imageUpload.files[0];
    
    if (!messageText && !imageFile) return;
    
    let imageUrl = null;
    
    // Handle image upload if present
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
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
}

// Send message to database
async function sendMessageToDB(text, imageUrl) {
    try {
        const { data, error } = await supabaseClient
            .from('messages')
            .insert([
                {
                    session_id: appState.currentSessionId,
                    sender_id: appState.userId,
                    sender_name: appState.userName,
                    message: text || '',
                    image_url: imageUrl,
                    created_at: new Date().toISOString()
                }
            ])
            .select()
            .single();
        
        if (error) throw error;
        
        // Display message immediately
        displayMessage({
            id: data.id,
            sender: appState.userName,
            text: text,
            image: imageUrl,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'sent',
            is_historical: false
        });
        
        return data;
    } catch (error) {
        console.error("Error sending message:", error);
        alert("Failed to send message. Please try again.");
        return null;
    }
}

// Display a message in the chat
function displayMessage(message) {
    // Don't display if viewing history and message is not from that session
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
            <button class="message-action-btn" onclick="editMessage(${message.id})">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="message-action-btn" onclick="deleteMessage(${message.id})">
                <i class="fas fa-trash"></i> Delete
            </button>
            <button class="message-action-btn" onclick="replyToMessage(${message.id})">
                <i class="fas fa-reply"></i> Reply
            </button>
        </div>
        ` : ''}
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Edit a message
async function editMessage(messageId) {
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
            
            // Update UI
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
}

// Delete a message
async function deleteMessage(messageId) {
    if (confirm("Are you sure you want to delete this message?")) {
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
            
            // Update UI
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
    }
}

// Reply to a message
function replyToMessage(messageId) {
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (messageElement) {
        const sender = messageElement.querySelector('.message-sender').textContent;
        const text = messageElement.querySelector('.message-text').textContent;
        messageInput.value = `Replying to ${sender}: ${text}\n`;
        messageInput.focus();
    }
}

// Show full size image
function showFullImage(src) {
    fullSizeImage.src = src;
    imageModal.style.display = 'flex';
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
        
        // Clear current messages
        chatMessages.innerHTML = '';
        appState.messages = [];
        
        // Add historical indicator if viewing history
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
        
        // Display each message
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
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error("Error loading chat history:", error);
    }
}

// Clear chat history (only for current user if guest)
async function clearChat() {
    if (confirm("Are you sure you want to clear the chat? " + 
        (appState.isHost ? "This will clear for everyone." : "This will only clear your view."))) {
        
        if (appState.isHost) {
            // Host clears for everyone - delete messages from database
            try {
                const { error } = await supabaseClient
                    .from('messages')
                    .delete()
                    .eq('session_id', appState.currentSessionId);
                
                if (error) throw error;
                
                // Clear local chat
                chatMessages.innerHTML = '';
                addSystemMessage("Chat history has been cleared by the host.");
            } catch (error) {
                console.error("Error clearing chat:", error);
                alert("Error clearing chat. Please try again.");
            }
        } else {
            // Guest only clears local view
            chatMessages.innerHTML = '';
            addSystemMessage("Your chat view has been cleared.");
        }
    }
}

// Add a system message
function addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message received';
    
    messageDiv.innerHTML = `
        <div class="message-sender">System</div>
        <div class="message-content">
            <div class="message-text">${text}</div>
            <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Load pending guests
async function loadPendingGuests() {
    if (!appState.isHost || !appState.currentSessionId) return;
    
    try {
        const { data: session, error } = await supabaseClient
            .from('sessions')
            .select('pending_guests')
            .eq('session_id', appState.currentSessionId)
            .single();
        
        if (error) throw error;
        
        appState.pendingGuests = session.pending_guests || [];
        pendingCount.textContent = appState.pendingGuests.length;
        
        if (appState.pendingGuests.length === 0) {
            pendingGuestsBtn.style.display = 'none';
        } else {
            pendingGuestsBtn.style.display = 'flex';
        }
    } catch (error) {
        console.error("Error loading pending guests:", error);
    }
}

// Show pending guests modal
async function showPendingGuests() {
    pendingGuestsList.innerHTML = '';
    
    if (appState.pendingGuests.length === 0) {
        noPendingGuests.style.display = 'block';
    } else {
        noPendingGuests.style.display = 'none';
        
        appState.pendingGuests.forEach((guest, index) => {
            const guestDiv = document.createElement('div');
            guestDiv.className = 'pending-guest';
            guestDiv.innerHTML = `
                <div class="guest-info">
                    <strong>${guest.guest_name}</strong>
                    <small>IP: ${guest.guest_ip || 'Unknown'}</small>
                    <small>Requested: ${new Date(guest.requested_at).toLocaleTimeString()}</small>
                </div>
                <div class="guest-actions">
                    <button class="btn btn-success btn-small" onclick="approveGuest(${index})">
                        <i class="fas fa-check"></i> Approve
                    </button>
                    <button class="btn btn-danger btn-small" onclick="denyGuest(${index})">
                        <i class="fas fa-times"></i> Deny
                    </button>
                </div>
            `;
            pendingGuestsList.appendChild(guestDiv);
        });
    }
    
    pendingGuestsModal.style.display = 'flex';
}

// Approve a guest
async function approveGuest(index) {
    const guest = appState.pendingGuests[index];
    
    try {
        // Update session with guest info
        const { error } = await supabaseClient
            .from('sessions')
            .update({
                guest_id: guest.guest_id,
                guest_name: guest.guest_name,
                guest_ip: guest.guest_ip,
                guest_connected_at: new Date().toISOString(),
                pending_guests: appState.pendingGuests.filter((_, i) => i !== index)
            })
            .eq('session_id', appState.currentSessionId);
        
        if (error) throw error;
        
        // Update local state
        appState.pendingGuests = appState.pendingGuests.filter((_, i) => i !== index);
        pendingCount.textContent = appState.pendingGuests.length;
        
        // Refresh the list
        showPendingGuests();
        
        // Add system message
        await saveMessageToDB('System', `${guest.guest_name} has been approved and joined the chat.`);
        
    } catch (error) {
        console.error("Error approving guest:", error);
        alert("Failed to approve guest. Please try again.");
    }
}

// Deny a guest
async function denyGuest(index) {
    const guest = appState.pendingGuests[index];
    
    try {
        // Remove from pending
        const { error } = await supabaseClient
            .from('sessions')
            .update({
                pending_guests: appState.pendingGuests.filter((_, i) => i !== index)
            })
            .eq('session_id', appState.currentSessionId);
        
        if (error) throw error;
        
        // Update local state
        appState.pendingGuests = appState.pendingGuests.filter((_, i) => i !== index);
        pendingCount.textContent = appState.pendingGuests.length;
        
        // Refresh the list
        showPendingGuests();
        
    } catch (error) {
        console.error("Error denying guest:", error);
        alert("Failed to deny guest. Please try again.");
    }
}

// Load chat sessions for history panel
async function loadChatSessions() {
    try {
        const { data: sessions, error } = await supabaseClient
            .from('sessions')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        historyCards.innerHTML = '';
        
        sessions.forEach(session => {
            const isActive = session.session_id === appState.currentSessionId && session.is_active;
            const card = document.createElement('div');
            card.className = 'session-card';
            if (isActive) {
                card.classList.add('active');
            }
            
            card.innerHTML = `
                <div class="session-card-header">
                    <div class="session-id">${session.session_id.substring(0, 10)}...</div>
                    ${isActive ? '<div class="session-active-badge">Active Now</div>' : ''}
                </div>
                <div class="session-info">
                    <div class="session-info-item">
                        <span class="session-info-label">Host:</span>
                        <span class="session-info-value">${session.host_name}</span>
                        <span class="session-info-label">IP: ${session.host_ip || 'N/A'}</span>
                    </div>
                    <div class="session-info-item">
                        <span class="session-info-label">Guest:</span>
                        <span class="session-info-value">${session.guest_name || 'None'}</span>
                        <span class="session-info-label">IP: ${session.guest_ip || 'N/A'}</span>
                    </div>
                    <div class="session-info-item">
                        <span class="session-info-label">Started:</span>
                        <span class="session-info-value">${new Date(session.created_at).toLocaleDateString()}</span>
                    </div>
                    <div class="session-info-item">
                        <span class="session-info-label">Messages:</span>
                        <span class="session-info-value">${session.message_count || 0}</span>
                    </div>
                </div>
                <div class="session-actions">
                    <button class="btn btn-secondary btn-small" onclick="viewSessionHistory('${session.session_id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-success btn-small" onclick="downloadSession('${session.session_id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    ${appState.isHost ? `
                    <button class="btn btn-danger btn-small" onclick="deleteSession('${session.session_id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    ` : ''}
                </div>
            `;
            
            // Add click event to the entire card (excluding buttons)
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.session-actions')) {
                    viewSessionHistory(session.session_id);
                }
            });
            
            historyCards.appendChild(card);
        });
    } catch (error) {
        console.error("Error loading sessions:", error);
    }
}

// View session history
async function viewSessionHistory(sessionId) {
    appState.isViewingHistory = true;
    appState.viewingSessionId = sessionId;
    
    // Update UI
    chatModeIndicator.style.display = 'flex';
    chatTitle.innerHTML = '<i class="fas fa-history"></i> Historical Chat';
    messageInput.disabled = true;
    sendMessageBtn.disabled = true;
    messageInput.placeholder = "Cannot send messages in historical view";
    
    // Load messages
    await loadChatHistory(sessionId);
    
    // Scroll to top
    chatMessages.scrollTop = 0;
}

// Return to active chat
function returnToActiveChat() {
    appState.isViewingHistory = false;
    appState.viewingSessionId = null;
    
    // Update UI
    chatModeIndicator.style.display = 'none';
    chatTitle.innerHTML = '<i class="fas fa-comments"></i> Active Chat';
    messageInput.disabled = false;
    sendMessageBtn.disabled = false;
    messageInput.placeholder = "Type your message here... (Press Enter to send, Shift+Enter for new line)";
    messageInput.focus();
    
    // Load active chat
    loadChatHistory();
}

// Download session data
async function downloadSession(sessionId) {
    try {
        // Get session data
        const { data: session, error: sessionError } = await supabaseClient
            .from('sessions')
            .select('*')
            .eq('session_id', sessionId)
            .single();
        
        if (sessionError) throw sessionError;
        
        // Get messages
        const { data: messages, error: messagesError } = await supabaseClient
            .from('messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });
        
        if (messagesError) throw messagesError;
        
        // Create download data
        const downloadData = {
            session: session,
            messages: messages,
            exported_at: new Date().toISOString(),
            exported_by: appState.userName
        };
        
        // Create and trigger download
        const dataStr = JSON.stringify(downloadData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `WriteToMe_Session_${sessionId}_${new Date().getTime()}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
    } catch (error) {
        console.error("Error downloading session:", error);
        alert("Failed to download session data.");
    }
}

// Delete session
async function deleteSession(sessionId) {
    if (confirm("Are you sure you want to delete this session? This action cannot be undone.")) {
        try {
            // Delete messages first
            const { error: messagesError } = await supabaseClient
                .from('messages')
                .delete()
                .eq('session_id', sessionId);
            
            if (messagesError) throw messagesError;
            
            // Delete session
            const { error: sessionError } = await supabaseClient
                .from('sessions')
                .delete()
                .eq('session_id', sessionId);
            
            if (sessionError) throw sessionError;
            
            // Reload sessions
            loadChatSessions();
            
            // If we're viewing this session, return to active
            if (appState.viewingSessionId === sessionId) {
                returnToActiveChat();
            }
            
        } catch (error) {
            console.error("Error deleting session:", error);
            alert("Failed to delete session.");
        }
    }
}

// Handle image upload
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB.");
        return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
        alert("Please select an image file.");
        return;
    }
    
    // Add image to message input
    const reader = new FileReader();
    reader.onload = function(e) {
        // For now, we'll send the image immediately
        // In a production app, you might want to upload to storage first
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
    
    // Save to localStorage
    const savedSession = localStorage.getItem('writeToMe_session');
    if (savedSession) {
        const sessionData = JSON.parse(savedSession);
        sessionData.soundEnabled = appState.soundEnabled;
        localStorage.setItem('writeToMe_session', JSON.stringify(sessionData));
    }
}

// Update sound control UI
function updateSoundControl() {
    if (appState.soundEnabled) {
        soundControl.innerHTML = '<i class="fas fa-volume-up"></i> <span>Sound On</span>';
        soundControl.classList.remove('muted');
    } else {
        soundControl.innerHTML = '<i class="fas fa-volume-mute"></i> <span>Sound Off</span>';
        soundControl.classList.add('muted');
    }
}

// Save message to database (system messages)
async function saveMessageToDB(senderName, messageText) {
    try {
        const { data, error } = await supabaseClient
            .from('messages')
            .insert([
                {
                    session_id: appState.currentSessionId,
                    sender_id: 'system',
                    sender_name: senderName,
                    message: messageText,
                    created_at: new Date().toISOString()
                }
            ]);
        
        if (error) throw error;
        return data;
    } catch (error) {
        console.error("Error saving system message:", error);
        return null;
    }
}

// Auto-resize textarea
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Make functions available globally for onclick handlers
window.showFullImage = showFullImage;
window.editMessage = editMessage;
window.deleteMessage = deleteMessage;
window.replyToMessage = replyToMessage;
window.approveGuest = approveGuest;
window.denyGuest = denyGuest;
window.viewSessionHistory = viewSessionHistory;
window.downloadSession = downloadSession;
window.deleteSession = deleteSession;

// Initialize the app when page loads
document.addEventListener('DOMContentLoaded', initApp);
