// Add this at the top of app.js with other global variables
let isSendingMessage = false;
let pendingImageUpload = null;
let imageUploadTimeout = null;


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
    reactionEmojis: ["👍", "❤️", "😂", "😮", "😢", "😡"],
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

window.replyToMessage = function(messageId) {
    const messageElement = document.getElementById(`msg-${messageId}`);
    if (messageElement) {
        const sender = messageElement.querySelector('.message-sender').textContent;
        const text = messageElement.querySelector('.message-text').textContent;
        messageInput.value = `Replying to ${sender}: ${text}\n`;
        messageInput.focus();
    }
};

// Make getMessageReactions available globally for loadChatHistory
window.getMessageReactions = async function(messageId) {
    if (window.ChatModule) {
        return await window.ChatModule.getMessageReactions(messageId);
    }
    return [];
};
// Make sendMessage globally available
window.sendMessage = sendMessage;


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

// Initialize ChatModule with appState and supabaseClient
document.addEventListener('DOMContentLoaded', () => {
    // After DOM is loaded, initialize ChatModule
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
            console.log('ChatModule initialized with appState and supabaseClient');
        }
    }, 100); // Small delay to ensure DOM is ready
});



// ============================================
// INITIALIZATION
// ============================================

async function initApp() {
    console.log("🚀 Initializing Enhanced WriteToMira App...");
    
    const mainContainer = document.querySelector('.main-container') || document.querySelector('.app-container');
    if (mainContainer) {
        mainContainer.style.display = 'none';
    }

    // Initialize audio on first user interaction
function initAudio() {
    if (!window.audioContext) {
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('✅ Audio context initialized');
    }
    if (window.audioContext.state === 'suspended') {
        window.audioContext.resume();
    }
}

    // Setup mobile header scroll behavior
    setupMobileHeaderScroll();

// Set up audio initialization listeners
document.addEventListener('click', initAudio, { once: true });
document.addEventListener('keydown', initAudio, { once: true });
document.addEventListener('touchstart', initAudio, { once: true });
    
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
        await loadAllSessions();
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
                // REMOVE THIS LINE: loadChatHistory();
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
                // REMOVE THIS LINE: loadChatHistory();
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
// LOAD ALL SESSIONS FOR STABLE NUMBERING
// ============================================

async function loadAllSessions() {
    try {
        const { data: sessions, error } = await supabaseClient
            .from('sessions')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (error) throw error;
        
        appState.allSessions = sessions || [];
        console.log(`📊 Loaded ${appState.allSessions.length} total sessions`);
        return appState.allSessions;
    } catch (error) {
        console.error("Error loading all sessions:", error);
        appState.allSessions = [];
        return [];
    }
}

function getStableRoomNumber(sessionId) {
    const index = appState.allSessions.findIndex(s => s.session_id === sessionId);
    if (index === -1) return '?';
    return (index + 1).toString();
}

// ============================================
// EVENT LISTENERS SETUP
// ============================================

function setupEventListeners() {

// Improve emoji picker for mobile
if (emojiBtn) {
    emojiBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        toggleEmojiPicker();
    });
}

// Close emoji picker when scrolling on mobile
if (emojiPicker) {
    document.addEventListener('touchmove', () => {
        if (emojiPicker.classList.contains('show')) {
            emojiPicker.classList.remove('show');
        }
    }, { passive: true });
}
    // Connection modal
    if (usernameInput) {
        usernameInput.addEventListener('input', function() {
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
    
    // Guest notification button
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
    
    // Chat functionality
// In the setupEventListeners function, update the messageInput keydown handler:
if (messageInput) {
    messageInput.addEventListener('keydown', (e) => {
        // Enter + Ctrl/Cmd sends message
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isSendingMessage) {
            e.preventDefault();
            e.stopPropagation();
            sendMessage();
            
            // Force scroll after sending on mobile
            setTimeout(() => {
                if (chatMessages) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }, 200);
        }
    });
    
    // Handle focus to ensure proper scrolling
    messageInput.addEventListener('focus', function() {
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                scrollChatToBottom(300);
            }, 300);
        }
    });
    
    messageInput.addEventListener('input', handleTyping);
}

function fixMobileViewport() {
    if (window.innerWidth <= 768) {
        // Fix for iOS viewport issues
        const setViewportHeight = () => {
            let vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
            
            const chatSection = document.querySelector('.chat-section');
            if (chatSection) {
                chatSection.style.height = `calc(var(--vh, 1vh) * 100 - 130px)`;
            }
        };
        
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('orientationchange', () => {
            setTimeout(setViewportHeight, 100);
        });
    }
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
        refreshHistoryBtn.addEventListener('click', async () => {
            await loadAllSessions();
            loadChatSessions();
        });
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
    // Add this function to handle playing sounds reliably
// Alternative: Simple "pop" sound
function playPopSound() {
    if (!appState.soundEnabled) return;
    
    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        
        console.log('🔔 Pop sound played');
    } catch (error) {
        console.log('Could not play pop sound:', error);
    }
}
    
    // Click outside emoji picker to close
// Click outside emoji picker to close
document.addEventListener('click', (e) => {
    // Close emoji picker when clicking outside
    if (emojiPicker && emojiPicker.classList.contains('show')) {
        if (!emojiPicker.contains(e.target) && emojiBtn && !emojiBtn.contains(e.target)) {
            emojiPicker.classList.remove('show');
        }
    }
    
// Close message actions when clicking outside
if (appState.activeMessageActions) {
    const actionsMenu = document.getElementById(`actions-${appState.activeMessageActions}`);
    if (actionsMenu && !actionsMenu.contains(e.target) && 
        !e.target.closest('.message-action-dots')) {
        // Call the ChatModule version
        if (window.ChatModule) {
            window.ChatModule.closeMessageActions();
        }
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
    
// Fix for mobile keyboard scrolling
if (messageInput) {
    messageInput.addEventListener('focus', function() {
        if (window.innerWidth <= 768) {
            document.body.classList.add('keyboard-open');
            // Small delay to ensure keyboard is open
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    });
    
    messageInput.addEventListener('blur', function() {
        if (window.innerWidth <= 768) {
            document.body.classList.remove('keyboard-open');
        }
    });
}

// Also handle when user taps on any input field
const allInputs = document.querySelectorAll('input, textarea');
allInputs.forEach(input => {
    input.addEventListener('focus', function() {
        if (window.innerWidth <= 768) {
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    });
});

    // Click outside to close notes panel
    document.addEventListener('click', (e) => {
        if (notesPanel && notesPanel.classList.contains('show') && 
            !notesPanel.contains(e.target) && 
            notesBtn && !notesBtn.contains(e.target)) {
            notesPanel.classList.remove('show');
            appState.showNotesPanel = false;
        }
    });
    
    // Reply modal
// Add this to your setupEventListeners in app.js for the reply modal close button
if (closeReplyModal) {
    const handleCloseModal = () => {
        replyModal.style.display = 'none';
        if (appState) appState.replyingTo = null;
        document.body.classList.remove('modal-open');
    };
    
    closeReplyModal.addEventListener('click', handleCloseModal);
    closeReplyModal.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleCloseModal();
    }, { passive: false });
}

if (sendReplyBtn) {
    // Remove any existing listeners first
    sendReplyBtn.replaceWith(sendReplyBtn.cloneNode(true));
    const newSendReplyBtn = document.getElementById('sendReplyBtn');
    if (newSendReplyBtn) {
        newSendReplyBtn.addEventListener('click', sendReply);
    }
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
    // Add this function to properly close the reply modal
window.closeReplyModal = function() {
    const replyModal = document.getElementById('replyModal');
    if (replyModal) {
        replyModal.style.display = 'none';
    }
    appState.replyingTo = null;
};
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
            // HOST: Permanently delete all messages for everyone
            const { error } = await supabaseClient
                .from('messages')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString(),
                    deleted_by: appState.userId
                })
                .eq('session_id', appState.currentSessionId);
            
            if (error) throw error;
            
            // Clear local messages
            chatMessages.innerHTML = '';
            appState.messages = [];
            
            // Add system message for host
            addSystemMessage(`[${appState.userName}] deleted chat messages`);
            
            // Also save system message to DB so guests see it
            await saveMessageToDB('System', `[${appState.userName}] deleted chat messages`);
            
        } else {
            // GUEST: Mark all current messages as cleared for this user
            // Get all message IDs from the current session that are not already cleared
            const { data: messages, error: fetchError } = await supabaseClient
                .from('messages')
                .select('id')
                .eq('session_id', appState.currentSessionId)
                .eq('is_deleted', false);
            
            if (fetchError) throw fetchError;
            
            let clearedCount = 0;
            
            if (messages && messages.length > 0) {
                // Insert cleared messages records
                const clearedRecords = messages.map(msg => ({
                    user_id: appState.userId,
                    message_id: msg.id,
                    session_id: appState.currentSessionId,
                    cleared_at: new Date().toISOString()
                }));
                
                // Insert in batches to avoid payload size issues
                const batchSize = 100;
                for (let i = 0; i < clearedRecords.length; i += batchSize) {
                    const batch = clearedRecords.slice(i, i + batchSize);
                    const { error } = await supabaseClient
                        .from('cleared_messages')
                        .insert(batch);
                    
                    if (error) {
                        console.error("Error inserting cleared messages batch:", error);
                        throw error;
                    }
                }
                
                clearedCount = messages.length;
            }
            
            // Clear local messages from UI
            const messageElements = document.querySelectorAll('.message');
            messageElements.forEach(msg => msg.remove());
            
            // Add local system message for this guest only
            addSystemMessage(`Chat messages cleared`, true);
            
            // Notify host that guest cleared their chat
            await saveMessageToDB('System', `🔔 [${appState.userName}] cleared chat`);
            
            console.log(`✅ Cleared ${clearedCount} messages for user ${appState.userName}`);
        }
    } catch (error) {
        console.error("Error clearing chat:", error);
        alert("Failed to clear chat: " + error.message);
    }
}

// New function to save host notification
async function saveHostNotification(messageText) {
    try {
        // Save to visitor_notes table (host-only)
        const { error } = await supabaseClient
            .from('visitor_notes')
            .insert([{
                guest_id: appState.userId,
                guest_name: appState.userName,
                session_id: appState.currentSessionId,
                note_text: `🔔 CHAT CLEAR: ${messageText}`,
                created_at: new Date().toISOString(),
                read_by_host: false,
                is_host_notification: true
            }]);
        
        if (error) {
            console.error("Error saving host notification:", error);
        }
    } catch (error) {
        console.error("Error in saveHostNotification:", error);
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
        
        await loadAllSessions();
        
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
// CONNECT AS GUEST - FIXED VERSION
// ============================================

async function connectAsGuest(userIP) {
    try {
        console.log("👤 Connecting as guest - checking for existing sessions...");
        
        // First, check if the user has any previous approved session that's still active
        const { data: activeSessions, error: sessionError } = await supabaseClient
            .from('sessions')
            .select('session_id, host_name, host_id')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        
        if (sessionError || !activeSessions || activeSessions.length === 0) {
            alert("No active rooms available. Please try again later or contact a host.");
            resetConnectButton();
            return;
        }
        
        // Check for each active session if the user has an approved status
        for (const targetSession of activeSessions) {
            console.log("Checking session:", targetSession.session_id);
            
            const { data: existingRequest } = await supabaseClient
                .from('session_guests')
                .select('status, id')
                .eq('session_id', targetSession.session_id)
                .eq('guest_id', appState.userId)
                .maybeSingle();
            
            if (existingRequest) {
                console.log(`Found existing request for session ${targetSession.session_id} with status: ${existingRequest.status}`);
                
                if (existingRequest.status === 'approved') {
                    console.log("✅ Guest already approved for this session, reconnecting...");
                    completeGuestConnection(targetSession.session_id);
                    return;
                } else if (existingRequest.status === 'pending') {
                    console.log("⏳ Guest already pending for this session");
                    appState.sessionId = targetSession.session_id;
                    connectionModal.style.display = 'none';
                    resetConnectButton();
                    updateUIForPendingGuest();
                    setupPendingApprovalSubscription(targetSession.session_id);
                    return;
                } else if (existingRequest.status === 'left' || existingRequest.status === 'rejected' || existingRequest.status === 'kicked') {
                    console.log(`Previous request was ${existingRequest.status}, can try to request again`);
                    // Continue to next session or create new request for this one
                }
            }
        }
        
        // If no existing approved/pending session found, try to join the latest active session
        const targetSession = activeSessions[0];
        console.log("✅ Found active session, creating new request for:", targetSession.session_id);
        await createNewGuestRequest(targetSession, userIP);
        
    } catch (error) {
        console.error("Error in guest connection:", error);
        alert("An error occurred: " + error.message);
        resetConnectButton();
    }
}

async function createNewGuestRequest(session, userIP) {
    try {
        console.log("Creating new guest request for session:", session.session_id);
        
        // Check if there's an existing left/rejected request we should update instead of insert
        const { data: existingRequest } = await supabaseClient
            .from('session_guests')
            .select('id, status')
            .eq('session_id', session.session_id)
            .eq('guest_id', appState.userId)
            .maybeSingle();
        
        if (existingRequest) {
            console.log(`Updating existing ${existingRequest.status} request to pending`);
            
            // Update the existing request
            const { error: updateError } = await supabaseClient
                .from('session_guests')
                .update({
                    status: 'pending',
                    guest_ip: userIP,
                    guest_note: appState.guestNote || "",
                    requested_at: new Date().toISOString(),
                    left_at: null,
                    approved_at: null
                })
                .eq('id', existingRequest.id);
            
            if (updateError) {
                console.error("Error updating guest request:", updateError);
                alert("Failed to update access request: " + updateError.message);
                resetConnectButton();
                return;
            }
            
            console.log("✅ Guest request updated successfully");
            
            // IMPORTANT: Send a system message to notify the host
            try {
                await supabaseClient
                    .from('messages')
                    .insert([{
                        session_id: session.session_id,
                        sender_id: 'system',
                        sender_name: 'System',
                        message: `🔔 Guest ${appState.userName} is requesting to rejoin the room.`,
                        created_at: new Date().toISOString()
                    }]);
            } catch (msgError) {
                console.log("Could not send system message:", msgError);
            }
            
        } else {
            // Insert new request
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
                
                if (insertError.message.includes('duplicate key')) {
                    alert("You already have a pending request for this room.");
                } else {
                    alert("Failed to request access: " + insertError.message);
                }
                resetConnectButton();
                return;
            }
            
            console.log("✅ Guest added to pending list successfully:", newGuest);
            
            // Send system message for new request
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
        }
        
        if (appState.guestNote && appState.guestNote.trim() !== '') {
            await saveVisitorNote(session.session_id, appState.guestNote, userIP);
        }
        
        appState.sessionId = session.session_id;
        connectionModal.style.display = 'none';
        resetConnectButton();
        updateUIForPendingGuest();
        setupPendingApprovalSubscription(session.session_id);
        
        // Force the host to refresh their pending list
        if (appState.isHost) {
            loadPendingGuests();
        }
        
    } catch (error) {
        console.error("Error in createNewGuestRequest:", error);
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
    saveMessageToDB('System', `${appState.userName} has rejoined the chat.`);
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
        
        if (error) {
            console.error("Error saving visitor note:", error);
        } else {
            console.log("✅ Visitor note saved successfully");
        }
    } catch (error) {
        console.error("Error in saveVisitorNote:", error);
    }
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
    console.log("🔄 Setting up pending guests subscription...");
    
    if (!appState.isHost || !appState.currentSessionId) {
        console.log("⚠️ Cannot setup pending subscription: Not host or no session ID");
        if (pendingGuestsBtn) pendingGuestsBtn.style.display = 'none';
        return;
    }
    
    console.log("✅ Host detected, setting up pending guests for session:", appState.currentSessionId);
    
    if (appState.pendingSubscription) {
        supabaseClient.removeChannel(appState.pendingSubscription);
    }
    
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
                
                if (payload.new && payload.new.status === 'pending') {
                    handleNewPendingGuest(payload.new);
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
                
                // If a guest's status changes to pending, treat it as a new pending request
                if (payload.new && payload.new.status === 'pending') {
                    // Check if this guest was previously in a different state
                    const wasPending = appState.pendingGuests.some(g => g.id === payload.new.id);
                    if (!wasPending) {
                        console.log('Guest changed to pending status, adding to list');
                        handleNewPendingGuest(payload.new);
                    } else {
                        // Just update the existing record
                        const index = appState.pendingGuests.findIndex(g => g.id === payload.new.id);
                        if (index !== -1) {
                            appState.pendingGuests[index] = payload.new;
                        }
                        updatePendingButtonUI();
                        if (pendingGuestsModal.style.display === 'flex') {
                            renderPendingGuestsList();
                        }
                    }
                } else if (payload.new && payload.new.status !== 'pending') {
                    // Remove from pending list if status changed to something else
                    appState.pendingGuests = appState.pendingGuests.filter(g => g.id !== payload.new.id);
                    updatePendingButtonUI();
                    if (pendingGuestsModal.style.display === 'flex') {
                        renderPendingGuestsList();
                    }
                }
            }
        )
        .subscribe((status, err) => {
            console.log('📡 Pending guests subscription status:', status);
            if (status === 'SUBSCRIBED') {
                console.log('✅ Successfully subscribed to pending guests!');
                loadPendingGuests();
            }
            if (err) {
                console.error('❌ Subscription error:', err);
            }
        });
}

// Helper function to handle new pending guests
function handleNewPendingGuest(guest) {
    const exists = appState.pendingGuests.some(g => g.id === guest.id);
    if (!exists) {
        appState.pendingGuests.push(guest);
    }
    
    updatePendingButtonUI();
    showGuestNotification(guest);
    
    if (appState.soundEnabled && window.playNotificationSound) {
        window.playNotificationSound();
    }
    
    addSystemMessage(`🔔 New guest request from ${guest.guest_name}${guest.guest_note ? ': ' + guest.guest_note : ''}`);
    
    if (pendingGuestsModal.style.display === 'flex') {
        showPendingGuests();
    }
}

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
        
        if (pendingGuestsModal.style.display === 'flex') {
            renderPendingGuestsList();
        }
    } catch (error) {
        console.error("Error in loadPendingGuests:", error);
    }
}

function showGuestNotification(guest) {
    console.log("🔔 Showing notification for:", guest.guest_name);
    
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
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 15000);
}

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

function showPendingGuests() {
    console.log("Showing pending guests modal...");
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
        
        appState.pendingGuests = appState.pendingGuests.filter(g => g.id !== guestRecordId);
        updatePendingButtonUI();
        
        if (pendingGuestsModal.style.display === 'flex') {
            renderPendingGuestsList();
        }
        
        await saveMessageToDB('System', `${guest.guest_name} has been approved and joined the chat.`);
        
        console.log(`✅ Approved guest: ${guest.guest_name}`);
    } catch (error) {
        console.error("Error approving guest:", error);
        alert("Failed to approve guest: " + error.message);
    }
}

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
        
        appState.pendingGuests = appState.pendingGuests.filter(g => g.id !== guestRecordId);
        updatePendingButtonUI();
        
        if (pendingGuestsModal.style.display === 'flex') {
            renderPendingGuestsList();
        }
        
        console.log(`❌ Denied guest: ${guest.guest_name}`);
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
            .update({
                status: 'kicked',
                left_at: new Date().toISOString()
            })
            .eq('id', guestId)
            .eq('session_id', appState.currentSessionId);
        
        if (error) throw error;
        
        await saveMessageToDB('System', `${guestName} has been kicked from the chat by host.`);
        
        loadPendingGuests();
        loadChatSessions();
        
        alert(`${guestName} has been kicked.`);
    } catch (error) {
        console.error("Error kicking guest:", error);
        alert("Failed to kick guest: " + error.message);
    }
};

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
// GUEST NOTIFICATION TO ADMIN
// ============================================

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
    
    if (!name) {
        guestNotifyError.textContent = "Please enter your name.";
        guestNotifyError.style.display = 'block';
        return;
    }
    
    if (!message) {
        guestNotifyError.textContent = "Please enter a message.";
        guestNotifyError.style.display = 'block';
        return;
    }
    
    if (email && (!email.includes('@') || !email.includes('.'))) {
        guestNotifyError.textContent = "Please enter a valid email address or leave it blank.";
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
            console.log("Could not get IP, using Unknown");
        }
        
        console.log("Sending guest notification from:", name, email || "no email");
        
        let notificationSent = false;
        const notificationId = 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        const notification = {
            id: notificationId,
            guest_name: name,
            guest_email: email || null,
            message: message,
            guest_ip: userIP,
            created_at: new Date().toISOString(),
            is_read: false,
            source: 'guest_notification'
        };
        
        try {
            const noteText = `📬 GUEST NOTIFICATION\nFrom: ${name}\n${email ? 'Email: ' + email + '\n' : ''}Message: ${message}`;
            
            const { data, error } = await supabaseClient
                .from('visitor_notes')
                .insert([{
                    guest_name: name,
                    guest_email: email || null,
                    note_text: noteText,
                    guest_ip: userIP,
                    created_at: new Date().toISOString(),
                    read_by_host: false,
                    is_guest_notification: true
                }])
                .select();
            
            if (!error) {
                console.log("✅ Saved to visitor_notes:", data);
                notificationSent = true;
            } else {
                console.log("visitor_notes error:", error);
            }
        } catch (e) {
            console.log("visitor_notes exception:", e.message);
        }
        
        try {
            const { data, error } = await supabaseClient
                .from('guest_notifications')
                .insert([{
                    guest_name: name,
                    guest_email: email || null,
                    message: message,
                    guest_ip: userIP,
                    created_at: new Date().toISOString(),
                    is_read: false
                }])
                .select();
            
            if (!error) {
                console.log("✅ Saved to guest_notifications:", data);
                notificationSent = true;
            } else {
                console.log("guest_notifications error:", error);
            }
        } catch (e) {
            console.log("guest_notifications exception:", e.message);
        }
        
        if (!notificationSent) {
            try {
                const stored = localStorage.getItem('guest_notifications_backup');
                let notifications = stored ? JSON.parse(stored) : [];
                
                notifications.push(notification);
                
                if (notifications.length > 50) {
                    notifications = notifications.slice(-50);
                }
                
                localStorage.setItem('guest_notifications_backup', JSON.stringify(notifications));
                console.log("✅ Saved to localStorage backup");
                notificationSent = true;
            } catch (e) {
                console.log("localStorage backup error:", e.message);
            }
        }
        
        if (!notificationSent) {
            if (appState.isHost) {
                if (!appState.visitorNotes) appState.visitorNotes = [];
                
                appState.visitorNotes.unshift({
                    id: notificationId,
                    guest_name: name,
                    guest_email: email,
                    note_text: `📬 GUEST NOTIFICATION (Offline)\nFrom: ${name}\n${email ? 'Email: ' + email + '\n' : ''}Message: ${message}`,
                    guest_ip: userIP,
                    created_at: new Date().toISOString(),
                    read_by_host: false,
                    is_guest_notification: true
                });
                
                appState.unreadNotesCount = (appState.unreadNotesCount || 0) + 1;
                updateNotesButtonUI();
                
                if (appState.showNotesPanel) {
                    renderVisitorNotes(appState.visitorNotes);
                }
                
                notificationSent = true;
                console.log("✅ Added to appState (in-memory)");
            }
        }
        
        if (notificationSent) {
            guestNotifySuccess.style.display = 'block';
            guestNotifySuccess.innerHTML = '<i class="fas fa-check-circle"></i> ✅ Your message has been sent to the administrator!';
            
            guestNotifyName.value = '';
            guestNotifyEmail.value = '';
            guestNotifyMessage.value = '';
            
            setTimeout(() => {
                guestNotificationModal.style.display = 'none';
            }, 3000);
        } else {
            throw new Error("Could not deliver notification through any method");
        }
    } catch (error) {
        console.error("Error sending guest notification:", error);
        guestNotifyError.innerHTML = `
            <i class="fas fa-exclamation-circle"></i> 
            Failed to send message.<br>
            <small>${error.message}</small><br>
            <small>Please try again or contact the administrator directly.</small>
        `;
        guestNotifyError.style.display = 'block';
    } finally {
        sendGuestNotification.disabled = false;
        sendGuestNotification.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
    }
}

function loadBackupNotifications() {
    try {
        const stored = localStorage.getItem('guest_notifications_backup');
        if (stored) {
            const backups = JSON.parse(stored);
            console.log(`📦 Found ${backups.length} backup notifications in localStorage`);
            
            if (appState.isHost && backups.length > 0) {
                if (!appState.visitorNotes) appState.visitorNotes = [];
                
                backups.forEach(backup => {
                    const exists = appState.visitorNotes.some(n => n.id === backup.id);
                    if (!exists) {
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
                
                if (appState.showNotesPanel) {
                    renderVisitorNotes(appState.visitorNotes);
                }
            }
        }
    } catch (e) {
        console.log("Error loading backup notifications:", e);
    }
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
    
// In setupRealtimeSubscriptions function, update the INSERT handler:
appState.realtimeSubscription = supabaseClient
    .channel('messages_' + appState.currentSessionId)
    .on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
        },
        async (payload) => {
            console.log('📦 Realtime message received:', payload.new);
            
            if (payload.new && payload.new.session_id === appState.currentSessionId) {
                // Check if this message is from someone else and we're not viewing history
                if (payload.new.sender_id !== appState.userId && !appState.isViewingHistory) {
                    
                    // For guests, check if this message is cleared
                    if (!appState.isHost) {
                        const { data: cleared } = await supabaseClient
                            .from('cleared_messages')
                            .select('id')
                            .eq('user_id', appState.userId)
                            .eq('message_id', payload.new.id)
                            .maybeSingle();
                        
                        if (cleared) {
                            console.log('Message is cleared for this user, not displaying');
                            return; // Don't show cleared messages
                        }
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
                    
                    // Play notification sound for new messages
                    if (appState.soundEnabled && !payload.new.is_notification) {
                        if (window.playNotificationSound) {
                            window.playNotificationSound();
                        }
                    }
                } else if (payload.new.sender_id === appState.userId) {
                    // Always show user's own messages, even if they cleared before
                    getMessageReactions(payload.new.id).then(reactions => {
                        displayMessage({
                            id: payload.new.id,
                            sender: payload.new.sender_name,
                            text: payload.new.message,
                            image: payload.new.image_url,
                            time: new Date(payload.new.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                            type: 'sent',
                            is_historical: false,
                            reactions: reactions,
                            reply_to: payload.new.reply_to
                        });
                    });
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
            console.log('📝 Message updated:', payload.new?.id);
            
            const messageElement = document.getElementById(`msg-${payload.new.id}`);
            if (messageElement) {
                if (payload.new.is_deleted) {
                    // Handle deleted message
                    messageElement.innerHTML = `
                        <div class="message-sender">${escapeHtml(payload.new.sender_name)}</div>
                        <div class="message-content">
                            <div class="message-text"><i>Message deleted</i></div>
                            <div class="message-footer">
                                <div class="message-time">${new Date(payload.new.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </div>
                        </div>
                    `;
                    // Remove actions menu
                    const actionsMenu = document.getElementById(`actions-${payload.new.id}`);
                    if (actionsMenu) actionsMenu.remove();
                } else {
                    // Handle edited message
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
        }
    )
    .subscribe((status, err) => {
        console.log('📡 MESSAGES Subscription status:', status);
        if (err) {
            console.error('❌ Messages subscription error:', err);
        }
    });

    // Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
    
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
            console.log('📨 Typing update received:', payload.new?.typing_user);
            
            if (payload.new && payload.new.typing_user) {
                // Don't show if it's our own typing
                if (payload.new.typing_user !== appState.userName) {
                    console.log('👀 Showing typing indicator for:', payload.new.typing_user);
                    typingUser.textContent = payload.new.typing_user;
                    typingIndicator.classList.add('show');
                    
                    // Clear any existing timeout
                    if (window.typingHideTimeout) {
                        clearTimeout(window.typingHideTimeout);
                    }
                    
                    // Hide after 3 seconds of no updates
                    window.typingHideTimeout = setTimeout(() => {
                        if (typingUser.textContent === payload.new.typing_user) {
                            console.log('⏹️ Hiding typing indicator');
                            typingIndicator.classList.remove('show');
                        }
                    }, 3000);
                }
            } else {
                // No one is typing
                console.log('⏹️ No one typing');
                typingIndicator.classList.remove('show');
            }
        }
    )
    .subscribe((status) => {
        console.log('📡 Typing subscription status:', status);
    });
}

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
// ENHANCED CHAT FUNCTIONS
// ============================================

async function handleTyping() {
    if (!appState.currentSessionId || appState.isViewingHistory || !appState.isConnected) {
        console.log('Typing ignored - not in active session');
        return;
    }
    
    console.log('👆 User typing detected:', appState.userName);
    
    try {
        const { error } = await supabaseClient
            .from('sessions')
            .update({ 
                typing_user: appState.userName,
                updated_at: new Date().toISOString()
            })
            .eq('session_id', appState.currentSessionId);
        
        if (error) {
            console.error('Error updating typing status:', error);
            return;
        }
        
        console.log('✅ Typing status updated');
        
        if (appState.typingTimeout) {
            clearTimeout(appState.typingTimeout);
        }
        
        appState.typingTimeout = setTimeout(() => {
            console.log('⏱️ Clearing typing status');
            supabaseClient
                .from('sessions')
                .update({ 
                    typing_user: null,
                    updated_at: new Date().toISOString()
                })
                .eq('session_id', appState.currentSessionId)
                .catch(e => console.log("Error clearing typing:", e));
        }, 2000); // Increased to 2 seconds for better UX
    } catch (error) {
        console.log("Typing indicator error:", error);
    }
}

// Update the sendMessage function
// Replace the entire sendMessage function with this improved version
async function sendMessage() {
    console.log('🔵 sendMessage called at:', new Date().toISOString());
    
    if (isSendingMessage) {
        console.log('Message already sending, skipping...');
        return;
    }
    
    if (!appState.isConnected || appState.isViewingHistory) {
        alert("You cannot send messages right now.");
        return;
    }
    
    const messageText = messageInput.value.trim();
    const imageFile = imageUpload.files[0];
    
    if (!messageText && !imageFile) return;
    
    isSendingMessage = true;
    
    // Disable send button immediately to prevent double clicks
    if (sendMessageBtn) {
        sendMessageBtn.disabled = true;
        sendMessageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
    }
    
    // Store the reply information
    const replyToId = window.__tempReplyTo || appState.replyingTo;
    
    // Clear reply state immediately
    appState.replyingTo = null;
    window.__tempReplyTo = null;
    
    let imageUrl = null;
    
    if (imageFile) {
        // Read the image file
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            imageUrl = e.target.result;
            
            console.log('📸 Image loaded, displaying optimistic message with image');
            
            // Create a unique temporary ID
            const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            
            // Show optimistic message with image preview
            const optimisticMessage = {
                id: tempId,
                sender: appState.userName,
                text: messageText,
                image: imageUrl,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                type: 'sent',
                is_historical: false,
                reactions: [],
                reply_to: replyToId,
                is_optimistic: true
            };
            
            // Display optimistic message immediately
            if (window.ChatModule) {
                window.ChatModule.displayMessage(optimisticMessage);
            }
            
            // Clear the file input and message input
            imageUpload.value = '';
            messageInput.value = '';
            messageInput.style.height = 'auto';
            
            // Send to database
            const result = await sendMessageToDB(messageText, imageUrl, replyToId);
            
            // Remove optimistic message
            const tempElement = document.getElementById(`msg-${tempId}`);
            if (tempElement) {
                tempElement.remove();
            }
            
            // If successful, display the real message
            if (result && result.success && result.data) {
                console.log('✅ Image message saved to DB, ID:', result.data.id);
                
                // Display the real message with the same content
                if (window.ChatModule) {
                    window.ChatModule.displayMessage({
                        id: result.data.id,
                        sender: appState.userName,
                        text: messageText,
                        image: imageUrl,
                        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                        type: 'sent',
                        is_historical: false,
                        reactions: [],
                        reply_to: replyToId
                    });
                }
            } else {
                // Show error message if failed
                console.error('Failed to send image message');
                const errorMsg = document.createElement('div');
                errorMsg.className = 'message received';
                errorMsg.innerHTML = `
                    <div class="message-sender">System</div>
                    <div class="message-content">
                        <div class="message-text" style="color: var(--danger);">
                            <i class="fas fa-exclamation-triangle"></i> Failed to send image. Please try again.
                        </div>
                    </div>
                `;
                chatMessages.appendChild(errorMsg);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                
                // Also restore the message text to input
                if (messageText) {
                    messageInput.value = messageText;
                }
            }
            
            isSendingMessage = false;
            if (sendMessageBtn) {
                sendMessageBtn.disabled = false;
                sendMessageBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
            }
            
            // Scroll to bottom
            setTimeout(() => {
                if (chatMessages) {
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
            }, 100);
        };
        
        reader.onerror = function(e) {
            console.error('❌ Error reading image:', e);
            alert("Error reading image file.");
            imageUpload.value = '';
            isSendingMessage = false;
            if (sendMessageBtn) {
                sendMessageBtn.disabled = false;
                sendMessageBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
            }
        };
        
        reader.readAsDataURL(imageFile);
    } else {
        // Text-only message - send immediately
        const result = await sendMessageToDB(messageText, null, replyToId);
        
        isSendingMessage = false;
        if (sendMessageBtn) {
            sendMessageBtn.disabled = false;
            sendMessageBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
        }
        
        // Clear message input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Scroll to bottom after sending
        setTimeout(() => {
            if (chatMessages) {
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        }, 100);
    }
}

// Add this function to handle scroll after keyboard closes
function scrollChatToBottom(delay = 300) {
    setTimeout(() => {
        if (chatMessages && !appState.isViewingHistory) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }, delay);
}

async function sendMessageToDB(text, imageUrl, replyToId = null) {
    console.log('💾 sendMessageToDB called at:', new Date().toISOString());
    console.log('replyToId parameter:', replyToId);
    console.log('appState.replyingTo:', appState.replyingTo);
    console.log('window.__tempReplyTo:', window.__tempReplyTo);
    
    try {
        // Use the passed replyToId, or check temp variable, or fall back to appState.replyingTo
        const finalReplyToId = replyToId || window.__tempReplyTo || appState.replyingTo;
        console.log('FINAL reply_to:', finalReplyToId);
        
        // Clear all sources
        appState.replyingTo = null;
        window.__tempReplyTo = null;
        
        const messageData = {
            session_id: appState.currentSessionId,
            sender_id: appState.userId,
            sender_name: appState.userName,
            message: text || '',
            created_at: new Date().toISOString(),
            reply_to: finalReplyToId
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
        
        console.log('✅ Message saved to DB. ID:', data.id);
        console.log('Reply_to in DB:', data.reply_to);
        
        displayMessage({
            id: data.id,
            sender: appState.userName,
            text: text,
            image: imageUrl,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: 'sent',
            is_historical: false,
            reactions: [],
            reply_to: finalReplyToId
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
        console.warn('ChatModule not available, message not displayed');
    }
}
// Add this function to handle header hide/show on scroll for mobile
// Enhanced mobile header scroll behavior - collapse on scroll up, show on scroll down
function setupMobileHeaderScroll() {
    // Only apply on mobile devices
    if (window.innerWidth <= 768) {
        let lastScrollTop = 0;
        let scrollDirection = 'down';
        let ticking = false;
        const header = document.querySelector('header');
        
        if (!header) return;
        
        // Get the chat messages container
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        // Track scroll direction for better UX
        let scrollDelta = 0;
        let lastScrollY = 0;
        let headerHidden = false;
        
        // Function to hide header
        function hideHeader() {
            if (!headerHidden && header) {
                header.classList.add('header-hidden');
                headerHidden = true;
                // Add a class to body to adjust chat section height
                document.body.classList.add('header-collapsed');
            }
        }
        
        // Function to show header
        function showHeader() {
            if (headerHidden && header) {
                header.classList.remove('header-hidden');
                headerHidden = false;
                document.body.classList.remove('header-collapsed');
            }
        }
        
        // Listen for scroll on the chat messages container
        chatMessages.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollTop = chatMessages.scrollTop;
                    const scrollHeight = chatMessages.scrollHeight;
                    const clientHeight = chatMessages.clientHeight;
                    
                    // Calculate scroll direction and speed
                    if (scrollTop > lastScrollTop) {
                        // Scrolling down (finger moving up) - hide header
                        scrollDirection = 'down';
                        scrollDelta = scrollTop - lastScrollY;
                        
                        // Only hide if we've scrolled down enough (minimum 30px) and not at top
                        if (scrollTop > 30 && scrollDelta > 5) {
                            hideHeader();
                        }
                    } else if (scrollTop < lastScrollTop) {
                        // Scrolling up (finger moving down) - show header
                        scrollDirection = 'up';
                        scrollDelta = lastScrollY - scrollTop;
                        
                        // Show header when scrolling up
                        if (scrollDelta > 5) {
                            showHeader();
                        }
                    }
                    
                    // Special case: at very top of chat, always show header
                    if (scrollTop <= 10) {
                        showHeader();
                    }
                    
                    // Special case: at bottom of chat and user tries to scroll up from bottom
                    if (scrollTop + clientHeight >= scrollHeight - 10 && scrollDirection === 'up') {
                        showHeader();
                    }
                    
                    lastScrollTop = scrollTop;
                    lastScrollY = scrollTop;
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
        
        // Touch start - track initial position for swipe detection
        let touchStartY = 0;
        let touchStartScrollTop = 0;
        
        chatMessages.addEventListener('touchstart', function(e) {
            touchStartY = e.touches[0].clientY;
            touchStartScrollTop = chatMessages.scrollTop;
        }, { passive: true });
        
        // Touch move - detect swipe direction for immediate response
        chatMessages.addEventListener('touchmove', function(e) {
            const touchCurrentY = e.touches[0].clientY;
            const deltaY = touchCurrentY - touchStartY;
            const currentScrollTop = chatMessages.scrollTop;
            
            // Detect swipe up (finger moving up, deltaY negative) - hide header
            if (deltaY < -20 && currentScrollTop > 30 && !headerHidden) {
                hideHeader();
            }
            // Detect swipe down (finger moving down, deltaY positive) - show header
            else if (deltaY > 20 && headerHidden) {
                showHeader();
            }
        }, { passive: true });
        
        // Show header when user taps on the top area of chat
        chatMessages.addEventListener('touchstart', function(e) {
            const touchY = e.touches[0].clientY;
            // If tapping near the top (within 80px) and header is hidden, show it
            if (touchY < 100 && headerHidden) {
                showHeader();
                // Auto-hide after 3 seconds if user doesn't interact
                setTimeout(() => {
                    if (headerHidden === false && chatMessages.scrollTop > 50) {
                        hideHeader();
                    }
                }, 3000);
            }
        });
        
        // Also handle when user scrolls to top by tapping status bar (iOS)
        // This is a hack that works on iOS when user taps status bar
        let scrollTimeout;
        chatMessages.addEventListener('scroll', function() {
            if (scrollTimeout) clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                if (chatMessages.scrollTop <= 10) {
                    showHeader();
                }
            }, 100);
        });
        
        // Listen for orientation change
        window.addEventListener('orientationchange', function() {
            setTimeout(() => {
                // Reset header state on orientation change
                if (chatMessages.scrollTop <= 10) {
                    showHeader();
                } else if (chatMessages.scrollTop > 30 && headerHidden === false) {
                    hideHeader();
                }
            }, 100);
        });
        
        // Add CSS for header transition and body adjustments
        const style = document.createElement('style');
        style.textContent = `
            header {
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                will-change: transform;
            }
            
            header.header-hidden {
                transform: translateY(-100%);
            }
            
            body.header-collapsed .chat-section {
                transition: height 0.3s ease;
            }
            
            @media (max-width: 768px) {
                body.header-collapsed .chat-section {
                    height: calc(var(--vh, 1vh) * 100 - 50px) !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Also handle window resize (if user rotates device)
window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
        setupMobileHeaderScroll();
    } else {
        // On desktop, make sure header is visible and remove any hidden classes
        const header = document.querySelector('header');
        if (header) {
            header.classList.remove('header-hidden');
        }
        document.body.classList.remove('header-collapsed');
    }
});

// ============================================
// LOAD CHAT HISTORY
// ============================================
async function loadChatHistory(sessionId = null) {
    const targetSessionId = sessionId || appState.currentSessionId;
    if (!targetSessionId) {
        console.log('No target session ID for loading chat history');
        return;
    }
    
    console.log('Loading chat history for session:', targetSessionId);
    
    try {
        // Base query for messages
        let query = supabaseClient
            .from('messages')
            .select('*')
            .eq('session_id', targetSessionId)
            .eq('is_deleted', false);
        
        // If not host and not viewing history, filter out cleared messages
        if (!appState.isHost && !sessionId) {
            // First, get all messages the user has cleared
            const { data: clearedMessages } = await supabaseClient
                .from('cleared_messages')
                .select('message_id')
                .eq('user_id', appState.userId)
                .eq('session_id', targetSessionId);
            
            if (clearedMessages && clearedMessages.length > 0) {
                const clearedIds = clearedMessages.map(cm => cm.message_id);
                // Filter out cleared messages
                query = query.not('id', 'in', `(${clearedIds.join(',')})`);
            }
        }
        
        const { data: messages, error } = await query.order('created_at', { ascending: true });
        
        if (error) {
            console.error('Error loading messages:', error);
            throw error;
        }
        
        console.log(`Loaded ${messages?.length || 0} messages from database`);
        
        // Clear chat messages container
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        appState.messages = [];
        
        // Add history header if viewing a past session
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
        
        // If no messages, show a system message
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
        
        // Load all reactions first (more efficient)
        const reactionPromises = messages.map(msg => 
            window.ChatModule?.getMessageReactions(msg.id) || []
        );
        const allReactions = await Promise.all(reactionPromises);
        
        // Display all messages
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
        
        console.log('Chat history loaded successfully');
    } catch (error) {
        console.error("Error loading chat history:", error);
        
        // Show error message in chat
        if (chatMessages) {
            const errorMsg = document.createElement('div');
            errorMsg.className = 'message received';
            errorMsg.innerHTML = `
                <div class="message-sender">System</div>
                <div class="message-content">
                    <div class="message-text">Error loading messages: ${error.message}</div>
                </div>
            `;
            chatMessages.appendChild(errorMsg);
        }
    }
}

// ============================================
// UI FUNCTIONS
// ============================================

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
    
    statusIndicator.className = 'status-indicator';
    statusIndicator.classList.add('online');
    userRoleDisplay.textContent = `${appState.userName} (Connected)`;
    logoutBtn.style.display = 'flex';
    
    if (messageInput) {
        messageInput.disabled = false;
        messageInput.placeholder = "Type your message...";
        messageInput.focus();
    }
    
    if (sendMessageBtn) sendMessageBtn.disabled = false;
    
    // Re-initialize ChatModule with updated appState
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
        console.log('ChatModule re-initialized after connection');

                
        // Load chat history after a short delay to ensure ChatModule is ready
        setTimeout(() => {
            loadChatHistory();
        }, 500);
    }
    
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
    // Enable audio after user interaction
document.addEventListener('click', function enableAudio() {
    // Create and play a silent sound to unlock audio
    const silentSound = new Audio();
    silentSound.play().catch(() => {});
    document.removeEventListener('click', enableAudio);
}, { once: true });

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
    appState.guestNote = "";
    appState.replyingTo = null;
    
    showConnectionModal();
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
        console.error("Error getting IP:", error);
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
    
    if (sendMessageBtn) {
        sendMessageBtn.disabled = true;
        sendMessageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    }
    
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            // Pass the current replyingTo value
            const result = await sendMessageToDB('', e.target.result, appState.replyingTo);
            
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
    
    // Resume audio context if it was suspended
    if (appState.soundEnabled && audioContext && audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
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

// Update the saveMessageToDB function to handle silent notifications
async function saveMessageToDB(senderName, messageText, isSilent = false) {
    try {
        const messageData = {
            session_id: appState.currentSessionId,
            sender_id: 'system',
            sender_name: senderName,
            message: messageText,
            created_at: new Date().toISOString()
        };
        
        // If isSilent, we might want to mark it differently but still save
        // This ensures the host sees guest's clear action
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
            const roomNumber = getStableRoomNumber(session.session_id);
            
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
                            <i class="fas fa-door-open"></i> Room ${roomNumber}
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
    
    if (!confirm("⚠️ WARNING: Are you sure you want to delete this session?\n\nThis will permanently delete all messages, guest data, and visitor notes!\n\nThis action CANNOT be undone!")) {
        return;
    }
    
    try {
        console.log("🗑️ Deleting session:", sessionId);
        
        const deleteButtons = document.querySelectorAll(`[onclick*="deleteSession('${sessionId}')"]`);
        deleteButtons.forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
            }
        });

        if (appState.currentSessionId === sessionId) {
            console.log("⚠️ This is the current active session");
            
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
        }

        // IMPORTANT: Delete in the correct order to avoid foreign key violations
        
        // 1. First delete message_reactions (they reference messages)
        try {
            await supabaseClient
                .from('message_reactions')
                .delete()
                .in('message_id', supabaseClient
                    .from('messages')
                    .select('id')
                    .eq('session_id', sessionId)
                );
            console.log("✅ Message reactions deleted");
        } catch (e) {
            console.log("Message reactions deletion error:", e.message);
        }

        // 2. Delete cleared_messages (they reference messages)
        try {
            await supabaseClient
                .from('cleared_messages')
                .delete()
                .eq('session_id', sessionId);
            console.log("✅ Cleared messages deleted");
        } catch (e) {
            console.log("Cleared messages deletion error:", e.message);
        }

        // 3. Delete visitor notes
        try {
            await supabaseClient
                .from('visitor_notes')
                .delete()
                .eq('session_id', sessionId);
            console.log("✅ Visitor notes deleted");
        } catch (e) {
            console.log("Visitor notes deletion skipped:", e.message);
        }

        // 4. Delete messages
        try {
            const { error: messagesError } = await supabaseClient
                .from('messages')
                .delete()
                .eq('session_id', sessionId);
            
            if (messagesError) throw messagesError;
            console.log("✅ Messages deleted");
        } catch (e) {
            console.log("Messages deletion error:", e.message);
        }

        // 5. Delete session guests
        try {
            const { error: guestsError } = await supabaseClient
                .from('session_guests')
                .delete()
                .eq('session_id', sessionId);
            
            if (guestsError) throw guestsError;
            console.log("✅ Session guests deleted");
        } catch (e) {
            console.log("Session guests deletion error:", e.message);
        }

        // 6. Finally delete the session
        try {
            const { error: sessionError } = await supabaseClient
                .from('sessions')
                .delete()
                .eq('session_id', sessionId);
            
            if (sessionError) {
                console.error("Session deletion error:", sessionError);
                
                if (sessionError.message.includes('permission denied') || 
                    sessionError.message.includes('violates row-level security')) {
                    
                    console.log("🔄 RLS blocking, trying admin bypass...");
                    
                    const { error: adminError } = await supabaseClient
                        .from('sessions')
                        .delete()
                        .eq('session_id', sessionId)
                        .select();
                    
                    if (adminError) throw adminError;
                } else {
                    throw sessionError;
                }
            }
        } catch (e) {
            console.log("Session deletion error:", e.message);
        }
        
        console.log("✅ Session deleted successfully!");

        await loadAllSessions();
        
        if (appState.currentSessionId === sessionId) {
            appState.currentSessionId = null;
            appState.isConnected = false;
            
            if (chatMessages) {
                chatMessages.innerHTML = `
                    <div class="message received">
                        <div class="message-sender">System</div>
                        <div class="message-content">
                            <div class="message-text">Your current room was deleted. Please reconnect.</div>
                        </div>
                    </div>
                `;
            }
        }

        if (appState.viewingSessionId === sessionId) {
            returnToActiveChat();
        }

        await loadChatSessions();

        addSystemMessage("✅ Session deleted successfully", true);
    } catch (error) {
        console.error("❌ Error deleting session:", error);
        alert("Failed to delete session: " + error.message);
        
        await loadAllSessions();
        await loadChatSessions();
    } finally {
        const deleteButtons = document.querySelectorAll(`[onclick*="deleteSession('${sessionId}')"]`);
        deleteButtons.forEach(btn => {
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

function showAddUserModal() {
    if (!appState.isHost) return;
    
    if (newUsername) newUsername.value = '';
    if (newDisplayName) newDisplayName.value = '';
    if (newPassword) newPassword.value = '';
    if (newRole) newRole.value = 'guest';
    if (addUserError) addUserError.style.display = 'none';
    
    addUserModal.style.display = 'flex';
}

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

async function loadVisitorNotes() {
    if (!appState.isHost) {
        console.log("Not host, skipping notes load");
        return;
    }
    
    try {
        console.log("📝 Loading visitor notes...");
        
        const { data: notes, error } = await supabaseClient
            .from('visitor_notes')
            .select('*')
            .eq('is_archived', false)
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error("Error loading visitor notes:", error);
            return;
        }
        
        console.log(`✅ Loaded ${notes?.length || 0} visitor notes:`, notes);
        
        appState.visitorNotes = notes || [];
        appState.unreadNotesCount = appState.visitorNotes.filter(n => !n.read_by_host).length;
        
        console.log(`📊 Unread count: ${appState.unreadNotesCount}`);
        
        updateNotesButtonUI();
        
        if (appState.showNotesPanel) {
            renderVisitorNotes(appState.visitorNotes);
        }
        
        if (notesBtn) {
            notesBtn.classList.toggle('has-unread', appState.unreadNotesCount > 0);
        }
    } catch (error) {
        console.error("Error in loadVisitorNotes:", error);
    }
}

function renderVisitorNotes(notes) {
    if (!notesList) {
        console.error("notesList element not found!");
        return;
    }
    
    console.log("Rendering notes:", notes?.length || 0);
    
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
        try {
            const noteElement = document.createElement('div');
            noteElement.className = `visitor-note-item ${note.read_by_host ? 'read' : 'unread'}`;
            noteElement.dataset.noteId = note.id;
            
            const createdDate = note.created_at ? new Date(note.created_at).toLocaleString() : 'Unknown date';
            const isGuestNotification = note.is_guest_notification || 
                                        (note.note_text && note.note_text.includes('GUEST NOTIFICATION'));
            
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
            
            noteElement.innerHTML = `
                <div class="note-header">
                    <div class="note-guest-info">
                        <i class="fas ${isGuestNotification ? 'fa-bell' : 'fa-user'}"></i>
                        <strong>${isGuestNotification ? '📬 Guest Message' : (displayName || 'Anonymous')}</strong>
                        ${!note.read_by_host ? '<span class="unread-badge">New</span>' : ''}
                    </div>
                    <div class="note-time">
                        <i class="fas fa-clock"></i> ${createdDate}
                    </div>
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
            
            notesList.appendChild(noteElement);
        } catch (e) {
            console.error("Error rendering note:", e, note);
        }
    });
    
    console.log("Notes rendered successfully");
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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
        note.note_text.toLowerCase().includes(searchTerm) ||
        (note.guest_ip && note.guest_ip.includes(searchTerm))
    );
    
    renderVisitorNotes(filtered);
}

function updateNotesButtonUI() {
    if (!notesBtn || !notesCount) {
        console.log("Notes button elements not found");
        return;
    }
    
    console.log(`Updating notes button UI. Unread: ${appState.unreadNotesCount}`);
    
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


// Make playNotificationSound globally available for testing
window.playNotificationSound = function() {
    if (!appState.soundEnabled) return;
    
    try {
        // Create audio context if needed
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const audioContext = window.audioContext;
        
        // First beep
        const osc1 = audioContext.createOscillator();
        const gain1 = audioContext.createGain();
        osc1.connect(gain1);
        gain1.connect(audioContext.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(660, audioContext.currentTime);
        gain1.gain.setValueAtTime(0, audioContext.currentTime);
        gain1.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
        gain1.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.1);
        osc1.start(audioContext.currentTime);
        osc1.stop(audioContext.currentTime + 0.1);
        
        // Second beep (slightly higher)
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880, audioContext.currentTime + 0.15);
        gain2.gain.setValueAtTime(0, audioContext.currentTime + 0.15);
        gain2.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.16);
        gain2.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.25);
        osc2.start(audioContext.currentTime + 0.15);
        osc2.stop(audioContext.currentTime + 0.25);
        
        console.log('🔔 Notification sound played');
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
};

// Also add a simpler test function
window.testSound = function() {
    window.playNotificationSound();
    console.log('Test sound triggered');
};

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

// Make functions global (these will call ChatModule)
window.approveGuest = approveGuest;
window.denyGuest = denyGuest;
window.kickGuest = kickGuest;
window.viewSessionHistory = viewSessionHistory;
window.deleteSession = deleteSession;
window.editUserModalOpen = editUserModalOpen;

// These are now handled by ChatModule, but keep them as references
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
window.sendReply = function() {
    if (window.ChatModule) window.ChatModule.sendReply();
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
