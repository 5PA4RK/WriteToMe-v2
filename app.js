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
    reactionsSubscription: null,  // ADD THIS LINE
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

// DOM Elements
const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡"];
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
    }, 100);
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

    function initAudio() {
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('✅ Audio context initialized');
        }
        if (window.audioContext.state === 'suspended') {
            window.audioContext.resume();
        }
    }

    setupMobileHeaderScroll();

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
                
                // CRITICAL: Wait for connection to fully establish before loading admin content
                setTimeout(async () => {
                    if (appState.isHost) {
                        await loadAllSessions();
                        await loadChatSessions();
                        await loadPendingGuests();
                        await loadVisitorNotes();
                    }
                }, 500);
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
    
    // Don't load admin content here - wait for connection
    // if (appState.isHost || savedSession) {
    //     await loadAllSessions();
    //     loadChatSessions();
    // }
    
    setInterval(checkAndReconnectSubscriptions, 15000);
}

// ============================================
// SCROLL TO BOTTOM HELPER
// ============================================

function scrollToBottom(behavior = 'smooth', delay = 50) {
    setTimeout(() => {
        if (chatMessages && !appState.isViewingHistory) {
            const isNearBottom = chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < 200;
            if (isNearBottom) {
                chatMessages.scrollTo({
                    top: chatMessages.scrollHeight,
                    behavior: behavior
                });
            }
        }
    }, delay);
}

function forceScrollToBottom(behavior = 'smooth', delay = 50) {
    setTimeout(() => {
        if (chatMessages && !appState.isViewingHistory) {
            chatMessages.scrollTo({
                top: chatMessages.scrollHeight,
                behavior: behavior
            });
        }
    }, delay);
}

// Make scroll functions global
window.forceScrollToBottom = forceScrollToBottom;
window.scrollToBottom = scrollToBottom;

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
            .from('chat_sessions')  // Changed from 'sessions'
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
                safeLoadAdminContent(); 
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
            .from('chat_sessions')  // Changed from 'sessions'
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
    if (emojiBtn) {
        emojiBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            toggleEmojiPicker();
        });
    }

    if (emojiPicker) {
        document.addEventListener('touchmove', () => {
            if (emojiPicker.classList.contains('show')) {
                emojiPicker.classList.remove('show');
            }
        }, { passive: true });
    }

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
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    if (pendingGuestsBtn) {
        pendingGuestsBtn.addEventListener('click', showPendingGuests);
    }
    
    if (closePendingModal) {
        closePendingModal.addEventListener('click', () => {
            pendingGuestsModal.style.display = 'none';
        });
    }
    
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            // Enter + Ctrl/Cmd sends message (desktop)
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isSendingMessage) {
                e.preventDefault();
                e.stopPropagation();
                sendMessage();
            }
            // For mobile, Enter key alone shouldn't send (prevents accidental sends)
        });
        
        messageInput.addEventListener('focus', function() {
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    this.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            }
        });
        
// Temporarily comment out
// messageInput.addEventListener('input', handleTyping);

}

    function fixMobileViewport() {
        if (window.innerWidth <= 768) {
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
        // REPLACE THE EXISTING CODE HERE with the new code below
        const newSendBtn = sendMessageBtn.cloneNode(true);
        sendMessageBtn.parentNode.replaceChild(newSendBtn, sendMessageBtn);
        
        const freshSendBtn = document.getElementById('sendMessageBtn');
        if (freshSendBtn) {
            freshSendBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                if (window.innerWidth <= 768) {
                    setTimeout(() => {
                        sendMessage();
                    }, 50);
                } else {
                    sendMessage();
                }
            });
            
            window.sendMessageBtn = freshSendBtn;
        }
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
    
    document.addEventListener('click', (e) => {
        if (emojiPicker && emojiPicker.classList.contains('show')) {
            if (!emojiPicker.contains(e.target) && emojiBtn && !emojiBtn.contains(e.target)) {
                emojiPicker.classList.remove('show');
            }
        }
        
        if (appState.activeMessageActions) {
            const actionsMenu = document.getElementById(`actions-${appState.activeMessageActions}`);
            if (actionsMenu && !actionsMenu.contains(e.target) && 
                !e.target.closest('.message-action-dots')) {
                if (window.ChatModule) {
                    window.ChatModule.closeMessageActions();
                }
            }
        }
    });
    
    if (historyTabBtn) {
        historyTabBtn.addEventListener('click', () => switchAdminTab('history'));
    }
    
    if (usersTabBtn) {
        usersTabBtn.addEventListener('click', () => switchAdminTab('users'));
    }
    
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
    
    if (messageInput) {
        messageInput.addEventListener('focus', function() {
            if (window.innerWidth <= 768) {
                document.body.classList.add('keyboard-open');
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

    document.addEventListener('click', (e) => {
        if (notesPanel && notesPanel.classList.contains('show') && 
            !notesPanel.contains(e.target) && 
            notesBtn && !notesBtn.contains(e.target)) {
            notesPanel.classList.remove('show');
            appState.showNotesPanel = false;
        }
    });
    
// In setupEventListeners function
if (closeReplyModal) {
    const handleCloseModal = () => {
        replyModal.style.display = 'none';
        if (appState) appState.replyingTo = null;
        document.body.classList.remove('modal-open');
        // Restore scroll position
        const scrollY = Math.abs(parseInt(document.body.style.top || '0'));
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
    };
    
    closeReplyModal.addEventListener('click', handleCloseModal);
    closeReplyModal.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleCloseModal();
    }, { passive: false });
}
    if (sendReplyBtn) {
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
}

window.closeReplyModal = function() {
    const replyModal = document.getElementById('replyModal');
    if (replyModal) {
        replyModal.style.display = 'none';
    }
    appState.replyingTo = null;
};

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
            
            addSystemMessage(`[${appState.userName}] deleted chat messages`);
            await saveMessageToDB('System', `[${appState.userName}] deleted chat messages`);
        } else {
            const { data: messages, error: fetchError } = await supabaseClient
                .from('messages')
                .select('id')
                .eq('session_id', appState.currentSessionId)
                .eq('is_deleted', false);
            
            if (fetchError) throw fetchError;
            
            let clearedCount = 0;
            
            if (messages && messages.length > 0) {
                const clearedRecords = messages.map(msg => ({
                    user_id: appState.userId,
                    message_id: msg.id,
                    session_id: appState.currentSessionId,
                    cleared_at: new Date().toISOString()
                }));
                
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
            
            const messageElements = document.querySelectorAll('.message');
            messageElements.forEach(msg => msg.remove());
            
            addSystemMessage(`Chat messages cleared`, true);
            await saveMessageToDB('System', `🔔 [${appState.userName}] cleared chat`);
            
            console.log(`✅ Cleared ${clearedCount} messages for user ${appState.userName}`);
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
    forceScrollToBottom('smooth', 100);
}

// Add this after your existing helper functions
async function safeLoadAdminContent() {
    if (!appState.isHost || !appState.isConnected) {
        console.log('Not host or not connected, skipping admin content');
        return;
    }
    
    // Check if critical DOM elements exist
    if (!historyCards || !usersList) {
        console.log('Admin DOM elements not ready, retrying in 100ms');
        setTimeout(safeLoadAdminContent, 100);
        return;
    }
    
    console.log('DOM ready, loading admin content...');
    await loadAllSessions();
    await loadChatSessions();
    await loadUsers();
    await loadPendingGuests();
    await loadVisitorNotes();
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
            .from('chat_sessions')
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
        
// Load chat history first
await loadChatHistory();

// Then load admin content safely
safeLoadAdminContent();

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
// CONNECT AS GUEST
// ============================================

async function connectAsGuest(userIP) {
    try {
        console.log("👤 Connecting as guest - checking for existing sessions...");
        
        // CHANGE THIS - use chat_sessions instead of sessions
        const { data: activeSessions, error: sessionError } = await supabaseClient
            .from('chat_sessions')  // <-- MUST be chat_sessions
            .select('session_id, host_name, host_id')
            .eq('is_active', true)
            .order('created_at', { ascending: false });
        
        // Rest of the function remains the same...
        if (sessionError || !activeSessions || activeSessions.length === 0) {
            alert("No active rooms available. Please try again later or contact a host.");
            resetConnectButton();
            return;
        }
        
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
                }
            }
        }
        
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
        
        const { data: existingRequest } = await supabaseClient
            .from('session_guests')
            .select('id, status')
            .eq('session_id', session.session_id)
            .eq('guest_id', appState.userId)
            .maybeSingle();
        
        if (existingRequest) {
            console.log(`Updating existing ${existingRequest.status} request to pending`);
            
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
                
                if (payload.new && payload.new.status === 'pending') {
                    const wasPending = appState.pendingGuests.some(g => g.id === payload.new.id);
                    if (!wasPending) {
                        console.log('Guest changed to pending status, adding to list');
                        handleNewPendingGuest(payload.new);
                    } else {
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
                    <strong>${escapeHtml(guest.guest_name)}</strong>
                </div>
                <div class="guest-details">
                    <small><i class="fas fa-calendar"></i> ${new Date(guest.requested_at).toLocaleString()}</small>
                    <small><i class="fas fa-network-wired"></i> IP: ${guest.guest_ip || 'Unknown'}</small>
                    ${guest.guest_note ? `
                        <div class="guest-note">
                            <i class="fas fa-sticky-note"></i> ${escapeHtml(guest.guest_note)}
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
    
    // Clean up existing subscriptions
    if (appState.realtimeSubscription) {
        console.log("Removing old messages subscription");
        supabaseClient.removeChannel(appState.realtimeSubscription);
        appState.realtimeSubscription = null;
    }
    
    if (appState.typingSubscription) {
        console.log("Removing old typing subscription");
        supabaseClient.removeChannel(appState.typingSubscription);
        appState.typingSubscription = null;
    }
    
    if (appState.reactionsSubscription) {
        console.log("Removing old reactions subscription");
        supabaseClient.removeChannel(appState.reactionsSubscription);
        appState.reactionsSubscription = null;
    }
    
    // Create a new channel for messages
    const messagesChannel = supabaseClient
        .channel('messages_' + appState.currentSessionId)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `session_id=eq.${appState.currentSessionId}`
            },
            async (payload) => {
                console.log('📦 Realtime message INSERT received:', payload.new?.id, 'from:', payload.new?.sender_name);
                
                if (payload.new && payload.new.session_id === appState.currentSessionId) {
                    // Skip if it's the current user's message (we already displayed it manually)
                    if (payload.new.sender_id === appState.userId) {
                        console.log('Skipping own message (already displayed manually)');
                        return;
                    }
                    
                    // Check if message is cleared for guests
                    let shouldDisplay = true;
                    if (!appState.isHost && payload.new.sender_id !== appState.userId) {
                        const { data: cleared } = await supabaseClient
                            .from('cleared_messages')
                            .select('id')
                            .eq('user_id', appState.userId)
                            .eq('message_id', payload.new.id)
                            .maybeSingle();
                        
                        if (cleared) shouldDisplay = false;
                    }
                    
                    if (shouldDisplay) {
                        const existingMsg = document.getElementById(`msg-${payload.new.id}`);
                        if (!existingMsg) {
                            const reactions = await getMessageReactions(payload.new.id);
                            
                            let imageUrl = null;
                            if (payload.new.image_url && payload.new.image_url.trim() !== '') {
                                imageUrl = payload.new.image_url;
                            }
                            
                            const messageObj = {
                                id: payload.new.id,
                                sender: payload.new.sender_name,
                                text: payload.new.message || '',
                                image: imageUrl,
                                time: new Date(payload.new.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                                type: 'received',
                                is_historical: false,
                                reactions: reactions || [],
                                reply_to: payload.new.reply_to
                            };
                            
                            console.log('Displaying new message from:', messageObj.sender);
                            displayMessage(messageObj);
                            forceScrollToBottom('smooth', 100);
                            
                            if (appState.soundEnabled && window.playNotificationSound) {
                                window.playNotificationSound();
                            }
                        }
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
                console.log('📝 Message UPDATE received:', payload.new?.id);
                
                const messageElement = document.getElementById(`msg-${payload.new.id}`);
                if (messageElement) {
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
                        const actionsMenu = document.getElementById(`actions-${payload.new.id}`);
                        if (actionsMenu) actionsMenu.remove();
                    } else if (payload.new.message) {
                        const textElement = messageElement.querySelector('.message-text');
                        if (textElement && !textElement.innerHTML.includes('Message deleted')) {
                            textElement.innerHTML = `${escapeHtml(payload.new.message)} <small class="edited-indicator">(edited)</small>`;
                        }
                    }
                }
            }
        )
        .subscribe((status, err) => {
            console.log('📡 MESSAGES Subscription status:', status);
            if (err) {
                console.error('❌ Messages subscription error:', err);
            }
            if (status === 'SUBSCRIBED') {
                console.log('✅ Successfully subscribed to messages!');
                appState.realtimeSubscription = messagesChannel;
            }
        });
    
    // Set the subscription
    appState.realtimeSubscription = messagesChannel;
    
    // Typing subscription
    const typingChannel = supabaseClient
        .channel('typing_' + appState.currentSessionId)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'chat_sessions',
                filter: `session_id=eq.${appState.currentSessionId}`
            },
            (payload) => {
                console.log('📨 Typing update received:', payload.new?.typing_user);
                
                if (payload.new && payload.new.typing_user) {
                    if (payload.new.typing_user !== appState.userName) {
                        typingUser.textContent = payload.new.typing_user;
                        typingIndicator.classList.add('show');
                        
                        if (window.typingHideTimeout) {
                            clearTimeout(window.typingHideTimeout);
                        }
                        
                        window.typingHideTimeout = setTimeout(() => {
                            if (typingUser.textContent === payload.new.typing_user) {
                                typingIndicator.classList.remove('show');
                            }
                        }, 3000);
                    }
                } else {
                    typingIndicator.classList.remove('show');
                }
            }
        )
        .subscribe((status) => {
            console.log('📡 Typing subscription status:', status);
        });
    
    appState.typingSubscription = typingChannel;
    
    // Reactions subscription
// Reactions subscription - FIXED VERSION
console.log('🎯 Setting up reactions subscription...');

const reactionsChannel = supabaseClient
    .channel(`reactions_${appState.currentSessionId}_${Date.now()}`)
    .on(
        'postgres_changes',
        {
            event: 'INSERT',
            schema: 'public',
            table: 'message_reactions'
        },
        async (payload) => {
            console.log('🎯 [INSERT] Reaction event received!', payload.new);
            const messageId = payload.new.message_id;
            if (!messageId) return;
            
            // Fetch fresh reactions
            const { data: reactions } = await supabaseClient
                .from('message_reactions')
                .select('*')
                .eq('message_id', messageId);
            
            // Update UI
            const msgElement = document.getElementById(`msg-${messageId}`);
            if (msgElement) {
                const reactionsDiv = msgElement.querySelector('.message-reactions');
                if (reactionsDiv) {
                    if (!reactions || reactions.length === 0) {
                        reactionsDiv.innerHTML = '';
                    } else {
                        const counts = {};
                        reactions.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
                        let html = '';
                        for (const [emoji, count] of Object.entries(counts)) {
                            html += `<span class="reaction-badge" onclick="window.toggleReaction('${messageId}', '${emoji}')">${emoji} ${count}</span>`;
                        }
                        reactionsDiv.innerHTML = html;
                        console.log('✅ UI updated for message', messageId, 'with', reactions.length, 'reactions');
                    }
                }
            }
        }
    )
    .on(
        'postgres_changes',
        {
            event: 'DELETE',
            schema: 'public',
            table: 'message_reactions'
        },
        async (payload) => {
            console.log('🎯 [DELETE] Reaction event received!', payload.old);
            const messageId = payload.old.message_id;
            if (!messageId) return;
            
            // Fetch fresh reactions
            const { data: reactions } = await supabaseClient
                .from('message_reactions')
                .select('*')
                .eq('message_id', messageId);
            
            // Update UI
            const msgElement = document.getElementById(`msg-${messageId}`);
            if (msgElement) {
                const reactionsDiv = msgElement.querySelector('.message-reactions');
                if (reactionsDiv) {
                    if (!reactions || reactions.length === 0) {
                        reactionsDiv.innerHTML = '';
                    } else {
                        const counts = {};
                        reactions.forEach(r => { counts[r.emoji] = (counts[r.emoji] || 0) + 1; });
                        let html = '';
                        for (const [emoji, count] of Object.entries(counts)) {
                            html += `<span class="reaction-badge" onclick="window.toggleReaction('${messageId}', '${emoji}')">${emoji} ${count}</span>`;
                        }
                        reactionsDiv.innerHTML = html;
                    }
                }
            }
        }
    )
    .subscribe((status, err) => {
        console.log('📡 REACTIONS subscription status:', status);
        if (err) console.error('❌ Subscription error:', err);
    });

appState.reactionsSubscription = reactionsChannel;
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
async function sendMessage() {
    console.log('🔵🔵🔵🔵🔵 SEND MESSAGE VERSION 8.0 - FIXED REPLY IMAGE 🔵🔵🔵🔵🔵');
    
    if (isSendingMessage) {
        console.log('Already sending, skipping');
        return;
    }
    
    if (!appState.isConnected || appState.isViewingHistory) {
        alert("You cannot send messages right now.");
        return;
    }
    
    const messageText = messageInput.value.trim();
    const imageFile = window.pendingImageFile || imageUpload.files[0];
    
    if (window.pendingImageFile) {
        window.pendingImageFile = null;
    }
    
    if (!messageText && !imageFile) return;
    
    isSendingMessage = true;
    
    if (sendMessageBtn) {
        sendMessageBtn.disabled = true;
        if (window.innerWidth <= 768) {
            sendMessageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        } else {
            sendMessageBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        }
    }
    
    // Get reply info BEFORE clearing
    const currentReplyToId = window.__tempReplyTo || appState.replyingTo;
    let currentReplyToImage = window.__tempReplyToImage || appState.replyingToImage;
    
    // CRITICAL FIX: If we have a reply ID but no image URL, try to find the original message's image
    if (currentReplyToId && !currentReplyToImage) {
        console.log('No reply image from temp, searching for original message...');
        
        // Try to find in DOM first
        const originalMsgElement = document.getElementById(`msg-${currentReplyToId}`);
        if (originalMsgElement) {
            const imgEl = originalMsgElement.querySelector('.message-image');
            if (imgEl && imgEl.src) {
                currentReplyToImage = imgEl.src;
                console.log('Found reply image in DOM:', currentReplyToImage);
            }
        }
        
        // If not in DOM, try appState messages
        if (!currentReplyToImage && appState.messages) {
            const originalMsg = appState.messages.find(m => m.id === currentReplyToId);
            if (originalMsg) {
                // Use _realImageUrl if available (permanent URL), otherwise use image
                currentReplyToImage = originalMsg._realImageUrl || originalMsg.image;
                console.log('Found reply image in appState:', currentReplyToImage);
            }
        }
        
        // If still no image, try to fetch from database
        if (!currentReplyToImage && supabaseClient) {
            try {
                const { data: msgData } = await supabaseClient
                    .from('messages')
                    .select('image_url')
                    .eq('id', currentReplyToId)
                    .single();
                if (msgData && msgData.image_url) {
                    currentReplyToImage = msgData.image_url;
                    console.log('Found reply image in database:', currentReplyToImage);
                }
            } catch (e) {
                console.log('Could not fetch from DB:', e);
            }
        }
    }
    
    console.log('Reply info for optimistic display:', { currentReplyToId, currentReplyToImage });
    
    // Clear reply data
    appState.replyingTo = null;
    window.__tempReplyTo = null;
    window.__tempReplyToImage = null;
    
    const originalMessageText = messageText;
    const originalImageFile = imageFile;
    
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    if (imageFile) {
        imageUpload.value = '';
    }
    
    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    
    let localPreviewUrl = null;
    if (imageFile) {
        localPreviewUrl = URL.createObjectURL(imageFile);
        console.log('📸 Created local preview URL:', localPreviewUrl);
    }
    
    // ========== OPTIMISTIC DISPLAY ==========
    console.log('📝 Creating optimistic message DIV');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message sent';
    messageDiv.id = `msg-${tempId}`;
    
    let messageContent = '';
    
    // Add reply quote if this is a reply
    if (currentReplyToId) {
        // Get the original message details for the quote
        let quotedSender = '';
        let quotedText = '';
        let quotedImageUrl = currentReplyToImage;
        let isImageOnly = false;
        
        // Try to find the original message in DOM
        const originalMsgElement = document.getElementById(`msg-${currentReplyToId}`);
        if (originalMsgElement) {
            const senderEl = originalMsgElement.querySelector('.message-sender');
            const textEl = originalMsgElement.querySelector('.message-text');
            const imgEl = originalMsgElement.querySelector('.message-image');
            
            if (senderEl) quotedSender = senderEl.textContent;
            if (textEl) {
                const rawText = textEl.textContent.replace(/\s*\(edited\)\s*$/, '');
                if (rawText && rawText !== '[Image]') {
                    quotedText = rawText.substring(0, 100);
                    if (rawText.length > 100) quotedText += '...';
                }
            }
            if (imgEl && !quotedImageUrl) quotedImageUrl = imgEl.src;
        }
        
        // If not found in DOM, try appState
        if (!quotedSender && appState.messages) {
            const originalMsg = appState.messages.find(m => m.id === currentReplyToId);
            if (originalMsg) {
                quotedSender = originalMsg.sender;
                if (originalMsg.text && originalMsg.text.trim() !== '') {
                    quotedText = originalMsg.text.substring(0, 100);
                    if (originalMsg.text.length > 100) quotedText += '...';
                }
                if (!quotedImageUrl) {
                    quotedImageUrl = originalMsg._realImageUrl || originalMsg.image;
                }
            }
        }
        
        // Determine if it's image-only
        const hasImage = quotedImageUrl && quotedImageUrl.trim() !== '';
        const hasText = quotedText && quotedText.trim() !== '';
        isImageOnly = hasImage && !hasText;
        
        // Build display text
        let displayText = quotedText || '';
        if (isImageOnly) {
            displayText = '';
        } else if (hasImage && hasText) {
            displayText = `${quotedText} <i class="fas fa-image"></i>`;
        }
        
        if (!displayText) displayText = '[Message]';
        
        // Ensure we have a valid image URL (not blob)
        let finalImageForPreview = quotedImageUrl;
        if (finalImageForPreview && finalImageForPreview.startsWith('blob:')) {
            // Try to get permanent URL from appState
            const originalMsg = appState.messages.find(m => m.id === currentReplyToId);
            if (originalMsg && originalMsg._realImageUrl) {
                finalImageForPreview = originalMsg._realImageUrl;
            }
        }
        
        const imagePreviewHtml = finalImageForPreview ? `
            <div class="reply-image-preview" style="display: inline-block; margin-left: 8px;">
                <img src="${finalImageForPreview}" style="max-width: 30px; max-height: 30px; border-radius: 4px; object-fit: cover;" 
                     onclick="event.stopPropagation(); window.showFullImage('${finalImageForPreview}')">
            </div>
        ` : '';
        
        messageContent += `
            <div class="message-reply-ref">
                <i class="fas fa-reply"></i> 
                <div class="reply-content">
                    <span>Replying to <strong>${escapeHtml(quotedSender || 'someone')}</strong>: ${displayText}</span>
                    ${imagePreviewHtml}
                </div>
            </div>
        `;
    }
    
    if (originalMessageText && originalMessageText.trim()) {
        const escapedText = escapeHtml(originalMessageText);
        const textWithBreaks = escapedText.replace(/\n/g, '<br>');
        messageContent += `<div class="message-text">${textWithBreaks}</div>`;
    }
    
    if (localPreviewUrl) {
        messageContent += `<img src="${localPreviewUrl}" class="message-image" style="max-width: 100%; max-height: 250px; border-radius: 8px; cursor: pointer;" onclick="window.showFullImage('${localPreviewUrl}')" loading="lazy">`;
    }
    
    messageDiv.innerHTML = `
        <div class="message-sender">${escapeHtml(appState.userName)}</div>
        <div class="message-content">
            ${messageContent}
            <div class="message-reactions"></div>
            <div class="message-footer">
                <div class="message-time">${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                <button class="message-action-dots" onclick="window.toggleMessageActions('${tempId}', this)"><i class="fas fa-ellipsis-v"></i></button>
            </div>
        </div>
        <div class="message-actions-menu" id="actions-${tempId}" style="display: none;">
            <button onclick="window.editMessage('${tempId}')"><i class="fas fa-edit"></i> Edit</button>
            <button onclick="window.deleteMessage('${tempId}')"><i class="fas fa-trash"></i> Delete</button>
            <div class="menu-divider"></div>
            <button class="reply-btn" data-message-id="${tempId}" data-sender="${escapeHtml(appState.userName)}" data-message-text="${escapeHtml(originalMessageText)}">
                <i class="fas fa-reply"></i> Reply
            </button>
            <div class="menu-divider"></div>
            <div class="reaction-section">
                <div class="reaction-section-title"><i class="fas fa-smile"></i> Add Reaction</div>
                <div class="reaction-quick-picker">
                    ${reactionEmojis.map(emoji => 
                        `<button class="reaction-emoji-btn" onclick="window.addReaction('${tempId}', '${emoji}')" title="React with ${emoji}">${emoji}</button>`
                    ).join('')}
                </div>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    console.log('✅ Message displayed with reply quote (image preview should be visible)');
    
    forceScrollToBottom('smooth', 50);
    // ========== END DISPLAY ==========
    
    try {
        let finalImageUrl = null;
        
        if (imageFile) {
            console.log('📸 Uploading image to storage in background...');
            finalImageUrl = await uploadImageToStorage(imageFile);
            console.log('✅ Image uploaded, final URL:', finalImageUrl);
        }
        
        const result = await sendMessageToDB(originalMessageText, finalImageUrl, currentReplyToId);
        
        if (result && result.success) {
            console.log('✅ Message saved to DB, ID:', result.data.id);
            
            if (!window._messageIdMap) window._messageIdMap = {};
            window._messageIdMap[tempId] = result.data.id;
            
            const msgElement = document.getElementById(`msg-${tempId}`);
            if (msgElement) {
                msgElement.id = `msg-${result.data.id}`;
                
                const actionBtn = msgElement.querySelector('.message-action-dots');
                if (actionBtn) {
                    actionBtn.setAttribute('onclick', `window.toggleMessageActions('${result.data.id}', this)`);
                }
                
                const actionsMenu = document.getElementById(`actions-${tempId}`);
                if (actionsMenu) {
                    actionsMenu.id = `actions-${result.data.id}`;
                    
                    const editBtn = actionsMenu.querySelector(`button[onclick*="editMessage('${tempId}')"]`);
                    if (editBtn) {
                        editBtn.setAttribute('onclick', `window.editMessage('${result.data.id}')`);
                    }
                    
                    const deleteBtn = actionsMenu.querySelector(`button[onclick*="deleteMessage('${tempId}')"]`);
                    if (deleteBtn) {
                        deleteBtn.setAttribute('onclick', `window.deleteMessage('${result.data.id}')`);
                    }
                    
                    const replyBtn = actionsMenu.querySelector('.reply-btn');
                    if (replyBtn) {
                        replyBtn.setAttribute('data-message-id', result.data.id);
                    }
                    
                    const reactionBtns = actionsMenu.querySelectorAll('.reaction-emoji-btn');
                    reactionBtns.forEach(btn => {
                        const onclick = btn.getAttribute('onclick');
                        if (onclick && onclick.includes(tempId)) {
                            btn.setAttribute('onclick', onclick.replace(tempId, result.data.id));
                        }
                    });
                }
            }
            
            appState.messages.push({
                id: result.data.id,
                sender: appState.userName,
                text: originalMessageText,
                image: localPreviewUrl,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                type: 'sent',
                reply_to: currentReplyToId,
                reply_to_image: currentReplyToImage,
                _realImageUrl: finalImageUrl
            });
            
            console.log('✅ Message saved with reply_to_image:', currentReplyToImage);
            
        } else {
            console.error('❌ Failed to send message');
            showSendError(originalMessageText);
            
            const failedElement = document.getElementById(`msg-${tempId}`);
            if (failedElement) {
                failedElement.remove();
            }
            
            if (originalMessageText) {
                messageInput.value = originalMessageText;
                messageInput.focus();
            }
        }
    } catch (error) {
        console.error('❌ Error in sendMessage:', error);
        showSendError(originalMessageText);
        
        const failedElement = document.getElementById(`msg-${tempId}`);
        if (failedElement) {
            failedElement.remove();
        }
        
        if (originalMessageText) {
            messageInput.value = originalMessageText;
            messageInput.focus();
        }
    } finally {
        isSendingMessage = false;
        if (sendMessageBtn) {
            sendMessageBtn.disabled = false;
            if (window.innerWidth <= 768) {
                sendMessageBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
            } else {
                sendMessageBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Send';
            }
        }
    }
}

// Helper function to create message element
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.type}`;
    if (message.is_optimistic) {
        messageDiv.classList.add('optimistic');
    }
    messageDiv.id = `msg-${message.id}`;
    
    let messageContent = '';
    
    // Add reply reference if this is a reply
    if (message.reply_to && window.ChatModule) {
        messageContent += window.ChatModule.getReplyQuoteHtml(message.reply_to, message);
    }
    
    // Process message text
    if (message.text && message.text.trim()) {
        const escapedText = escapeHtml(message.text);
        const textWithBreaks = escapedText.replace(/\n/g, '<br>');
        messageContent += `<div class="message-text">${textWithBreaks}</div>`;
    }
    
    // Add image if present
    if (message.image && message.image.trim() !== '') {
        console.log('Rendering image in message:', message.id);
        const safeImageUrl = message.image.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        
        messageContent += `<img src="${safeImageUrl}" 
            class="message-image" 
            onclick="window.showFullImage('${safeImageUrl}')" 
            loading="lazy"
            style="max-width: 100%; max-height: 250px; border-radius: 8px; cursor: pointer;"
            onerror="this.onerror=null; this.style.display='none'; this.insertAdjacentHTML('afterend', '<div class=\\'image-error\\'><i class=\\'fas fa-image-slash\\'></i> Image failed to load</div>');">`;
    }
    
    // Add reactions section
    const reactionsHtml = `<div class="message-reactions"></div>`;
    
    // Add action button (only for non-optimistic messages)
    const actionButton = message.is_optimistic ? '' : `<button class="message-action-dots" onclick="window.toggleMessageActions('${message.id}', this)"><i class="fas fa-ellipsis-v"></i></button>`;
    
    // Actions menu (only for non-optimistic messages)
    const actionsMenu = message.is_optimistic ? '' : getActionsMenuHtml(message);
    
    messageDiv.innerHTML = `
        <div class="message-sender">${escapeHtml(message.sender)}</div>
        <div class="message-content">
            ${messageContent}
            ${reactionsHtml}
            <div class="message-footer">
                <div class="message-time">${message.time || new Date().toLocaleTimeString()}</div>
                ${actionButton}
            </div>
        </div>
        ${actionsMenu}
    `;
    
    return messageDiv;
}

// Add this helper function right after sendMessage
function showSendError(originalText) {
    const errorMsg = document.createElement('div');
    errorMsg.className = 'message received';
    errorMsg.innerHTML = `
        <div class="message-sender">System</div>
        <div class="message-content">
            <div class="message-text" style="color: var(--danger);">
                <i class="fas fa-exclamation-triangle"></i> Failed to send message. Please try again.
            </div>
        </div>
    `;
    chatMessages.appendChild(errorMsg);
    forceScrollToBottom('smooth', 100);
    
    // Restore the message text to input if it was text
    if (originalText && originalText.trim()) {
        messageInput.value = originalText;
        messageInput.focus();
    }
}
// Add this after getRealIP() function, around line 800-900
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

// ADD THIS NEW FUNCTION HERE
// Add this near the top of your helper functions section
async function uploadImageToStorage(file) {
    try {
        // Create a unique filename
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = file.name.split('.').pop().toLowerCase();
        const fileName = `${timestamp}_${random}.${extension}`;
        const filePath = `chat_images/${fileName}`;
        
        console.log('📤 Uploading image to storage:', filePath);
        
        // Upload to Supabase Storage
        const { data, error } = await supabaseClient.storage
            .from('chat-images')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type
            });
        
        if (error) {
            console.error('Storage upload error:', error);
            throw error;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabaseClient.storage
            .from('chat-images')
            .getPublicUrl(filePath);
        
        console.log('✅ Image uploaded successfully:', publicUrl);
        return publicUrl;
    } catch (error) {
        console.error("❌ Error uploading to storage:", error);
        // Fall back to base64 if storage fails
        console.log('Falling back to base64...');
        return await convertImageToBase64(file);
    }
}

// Helper function to convert image to compressed base64 (fallback)
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const maxSize = 800;
                
                // Calculate new dimensions while maintaining aspect ratio
                if (width > height && width > maxSize) {
                    height = (height * maxSize) / width;
                    width = maxSize;
                } else if (height > maxSize) {
                    width = (width * maxSize) / height;
                    height = maxSize;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Compress as JPEG for better size
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(compressedDataUrl);
            };
            img.onerror = () => {
                console.error('Failed to compress image, using original');
                resolve(e.target.result);
            };
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
// Keep your existing compressImage function for base64 strings
async function compressImage(dataUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            
            // Max dimensions for compressed image
            const maxWidth = 800;
            const maxHeight = 800;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = Math.round((width * maxHeight) / height);
                    height = maxHeight;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Compress as JPEG for better compatibility
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(compressedDataUrl);
        };
        img.onerror = () => {
            console.error('Failed to compress image, using original');
            resolve(dataUrl);
        };
        img.src = dataUrl;
    });
}
// REPLACE the existing sendMessageToDB function with this one
async function sendMessageToDB(text, imageInput, replyToId = null) {
    console.log('💾 sendMessageToDB called');
    
    // Get the reply image from the global variable
    let replyToImage = window.__tempReplyToImage;
    console.log('Reply to image URL:', replyToImage);


    console.log('Image input type:', typeof imageInput);
    console.log('Is File?', imageInput instanceof File);
    console.log('Is string?', typeof imageInput === 'string');
    if (typeof imageInput === 'string') {
        console.log('String starts with:', imageInput.substring(0, 50));
    }
    
    try {
        const finalReplyToId = replyToId || window.__tempReplyTo || appState.replyingTo;
        
        appState.replyingTo = null;
        window.__tempReplyTo = null;
        
        let finalImageUrl = null;
        
        // Handle different types of image input
        if (imageInput) {
            if (imageInput instanceof File) {
                // It's a File object - upload to storage
                console.log('📸 Uploading File object to storage...');
                finalImageUrl = await uploadImageToStorage(imageInput);
            } else if (typeof imageInput === 'string') {
                if (imageInput.startsWith('data:image')) {
                    // It's a base64 string
                    console.log('📸 Compressing base64 image...');
                    finalImageUrl = await compressImage(imageInput);
                } else if (imageInput.startsWith('http')) {
                    // It's already a URL
                    console.log('📸 Using existing URL...');
                    finalImageUrl = imageInput;
                } else {
                    console.log('⚠️ Unknown string type:', imageInput.substring(0, 50));
                }
            }
        }
        
        const messageData = {
            session_id: appState.currentSessionId,
            sender_id: appState.userId,
            sender_name: appState.userName,
            message: text || '',
            created_at: new Date().toISOString()
        };
        
        if (finalReplyToId && finalReplyToId !== 'null' && finalReplyToId !== 'undefined') {
            messageData.reply_to = finalReplyToId;
        }
        
        if (finalImageUrl && finalImageUrl.trim() !== '') {
            messageData.image_url = finalImageUrl;
            console.log('📸 Added image URL to message:', finalImageUrl);
        } else {
            console.log('⚠️ No image URL to add');
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
        console.log('✅ Image URL in DB:', data.image_url);
        
        return { success: true, data };
    } catch (error) {
        console.error("❌ Error in sendMessageToDB:", error);
        alert("Failed to send message: " + error.message);
        return null;
    }
}

// Helper function to validate and fix image data URLs
function ensureValidImageUrl(imageUrl) {
    if (!imageUrl) return null;
    
    // Check if it's a valid data URL
    if (imageUrl.startsWith('data:image/')) {
        // Check if it's a PNG or GIF
        if (imageUrl.includes('data:image/png') || imageUrl.includes('data:image/gif')) {
            console.log('PNG/GIF image detected, validating...');
            // Make sure the data URL is complete
            if (imageUrl.length < 100) {
                console.error('Image data URL seems too short, might be corrupted');
                return null;
            }
        }
        return imageUrl;
    }
    
    // If it's a regular URL, return as is
    return imageUrl;
}

function displayMessage(message) {
    if (window.ChatModule) {
        window.ChatModule.displayMessage(message);
    } else {
        console.warn('ChatModule not available, message not displayed');
    }
}

function setupMobileHeaderScroll() {
    if (window.innerWidth <= 768) {
        let lastScrollTop = 0;
        let ticking = false;
        const header = document.querySelector('header');
        
        if (!header) return;
        
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        chatMessages.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(() => {
                    const scrollTop = chatMessages.scrollTop;
                    
                    if (scrollTop > lastScrollTop && scrollTop > 50) {
                        header.classList.add('header-hidden');
                    } else if (scrollTop < lastScrollTop || scrollTop <= 10) {
                        header.classList.remove('header-hidden');
                    }
                    
                    lastScrollTop = scrollTop;
                    ticking = false;
                });
                ticking = true;
            }
        });
        
        chatMessages.addEventListener('scroll', function() {
            if (chatMessages.scrollTop <= 10) {
                header.classList.remove('header-hidden');
            }
        });
        
        chatMessages.addEventListener('touchstart', function(e) {
            if (header.classList.contains('header-hidden') && e.touches[0].clientY < 100) {
                header.classList.remove('header-hidden');
                setTimeout(() => {
                    if (chatMessages.scrollTop > 50) {
                        header.classList.add('header-hidden');
                    }
                }, 2000);
            }
        });
    }
}

window.addEventListener('resize', function() {
    if (window.innerWidth <= 768) {
        setupMobileHeaderScroll();
    } else {
        const header = document.querySelector('header');
        if (header) {
            header.classList.remove('header-hidden');
        }
    }
});

// ============================================
// LOAD CHAT HISTORY
// ============================================

async function loadChatHistory(sessionId = null, limit = 50) {
    const targetSessionId = sessionId || appState.currentSessionId;
    if (!targetSessionId) {
        console.log('No target session ID for loading chat history');
        return;
    }
    
    console.log('Loading chat history for session:', targetSessionId);
    
    // Show loading indicator
    if (chatMessages && !sessionId) {
        chatMessages.innerHTML = `
            <div class="message received">
                <div class="message-sender">System</div>
                <div class="message-content">
                    <div class="message-text">
                        <i class="fas fa-spinner fa-spin"></i> Loading messages...
                    </div>
                </div>
            </div>
        `;
    }    
    try {
        // First, check if we already have messages in memory
        if (!sessionId && appState.messages.length > 0) {
            console.log('Using cached messages');
            return;
        }
        
        // Build the query with pagination
        let query = supabaseClient
            .from('messages')
            .select('*')
            .eq('session_id', targetSessionId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .limit(limit); // Only load last 50 messages initially
        
        // For guests, filter out cleared messages
        if (!appState.isHost && !sessionId) {
            const { data: clearedMessages } = await supabaseClient
                .from('cleared_messages')
                .select('message_id')
                .eq('user_id', appState.userId)
                .eq('session_id', targetSessionId);
            
            if (clearedMessages && clearedMessages.length > 0) {
                const clearedIds = clearedMessages.map(cm => cm.message_id);
                query = query.not('id', 'in', `(${clearedIds.join(',')})`);
            }
        }
        
        const { data: messages, error } = await query;
        
        if (error) {
            console.error('Error loading messages:', error);
            // Retry with smaller limit if timeout occurs
            if (error.message.includes('timeout')) {
                console.log('Retrying with smaller limit...');
                const { data: retryMessages, error: retryError } = await query.limit(30);
                if (!retryError) {
                    messages = retryMessages;
                } else {
                    throw retryError;
                }
            } else {
                throw error;
            }
        }
        
        // Reverse to get chronological order for display
        const orderedMessages = (messages || []).reverse();
        
        console.log(`Loaded ${orderedMessages.length} messages from database`);
        
        // Clear existing messages and display new ones
        if (chatMessages) {
            chatMessages.innerHTML = '';
        }
        
        if (sessionId) {
            const { data: session } = await supabaseClient
                .from('chat_sessions')  // Changed from 'sessions'
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
                            <br><small>Host: ${escapeHtml(session.host_name)} | Date: ${new Date(session.created_at).toLocaleDateString()}</small>
                            ${orderedMessages.length === limit ? '<br><small>Showing last ' + limit + ' messages. <button onclick="loadMoreMessages()">Load more...</button></small>' : ''}
                        </div>
                    </div>
                `;
                chatMessages.appendChild(historyHeader);
            }
        }
        
        if (orderedMessages.length === 0) {
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
        
        // Load reactions in batches to avoid too many requests
        const messageIds = orderedMessages.map(msg => msg.id);
        const { data: allReactions } = await supabaseClient
            .from('message_reactions')
            .select('*')
            .in('message_id', messageIds);
        
        const reactionsMap = new Map();
        (allReactions || []).forEach(reaction => {
            if (!reactionsMap.has(reaction.message_id)) {
                reactionsMap.set(reaction.message_id, []);
            }
            reactionsMap.get(reaction.message_id).push(reaction);
        });
        
// In loadChatHistory function, around line 1600, replace the displayMessage call:
orderedMessages.forEach((msg) => {
    const messageType = msg.sender_id === appState.userId ? 'sent' : 'received';
    
    // Load reply_to image if this message is a reply
    let replyToImage = null;
    if (msg.reply_to) {
        // Find the original message to get its image
        const originalMsg = orderedMessages.find(m => m.id === msg.reply_to);
        if (originalMsg && originalMsg.image_url) {
            replyToImage = originalMsg.image_url;
        }
    }
    
    if (window.ChatModule && typeof window.ChatModule.displayMessage === 'function') {
        window.ChatModule.displayMessage({
            id: msg.id,
            sender: msg.sender_name,
            text: msg.message,
            image: msg.image_url,
            time: new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
            type: messageType,
            is_historical: !!sessionId,
            reactions: reactionsMap.get(msg.id) || [],
            reply_to: msg.reply_to,
            reply_to_image: replyToImage  // ADD THIS LINE
        });
    }
});
        
        // Store loaded messages
        appState.messages = orderedMessages;
        
        if (chatMessages && !sessionId) {
            forceScrollToBottom('auto', 100);
        } else if (chatMessages) {
            chatMessages.scrollTop = 0;
        }
        
        console.log('Chat history loaded successfully');
    } catch (error) {
        console.error("Error loading chat history:", error);
        
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

// Add function to load more messages
window.loadMoreMessages = async function() {
    if (!appState.currentSessionId) return;
    
    const currentCount = appState.messages.length;
    const limit = 50;
    
    try {
        let query = supabaseClient
            .from('messages')
            .select('*')
            .eq('session_id', appState.currentSessionId)
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .range(currentCount, currentCount + limit - 1);
        
        const { data: olderMessages, error } = await query;
        
        if (error) throw error;
        
        if (olderMessages && olderMessages.length > 0) {
            const orderedOlder = olderMessages.reverse();
            
            // Prepend older messages to the top
            const firstMessage = document.querySelector('.message:not(.historical)');
            orderedOlder.forEach(msg => {
                const messageType = msg.sender_id === appState.userId ? 'sent' : 'received';
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${messageType}`;
                messageDiv.id = `msg-${msg.id}`;
                messageDiv.innerHTML = `
                    <div class="message-sender">${escapeHtml(msg.sender_name)}</div>
                    <div class="message-content">
                        <div class="message-text">${escapeHtml(msg.message)}</div>
                        <div class="message-footer">
                            <div class="message-time">${new Date(msg.created_at).toLocaleTimeString()}</div>
                        </div>
                    </div>
                `;
                
                if (firstMessage) {
                    chatMessages.insertBefore(messageDiv, firstMessage);
                } else {
                    chatMessages.appendChild(messageDiv);
                }
            });
            
            appState.messages = [...orderedOlder, ...appState.messages];
        }
    } catch (error) {
        console.error("Error loading more messages:", error);
    }
};

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
        
        // DELAY loading chat history to ensure DOM is ready
        setTimeout(() => {
            loadChatHistory();
        }, 300);
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
            
// Use safeLoadAdminContent instead of setTimeout
safeLoadAdminContent();


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
    
    document.addEventListener('click', function enableAudio() {
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
                    .from('chat_sessions')  // <-- CHANGE from 'sessions'
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

    if (appState.reactionsSubscription) {
        supabaseClient.removeChannel(appState.reactionsSubscription);
        appState.reactionsSubscription = null;
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

// REPLACE the existing handleImageUpload function
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
    
    window.pendingImageFile = file;
    await sendMessage();
    imageUpload.value = '';
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

async function saveMessageToDB(senderName, messageText, isSilent = false) {
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
            .from('chat_sessions')  // Changed from 'sessions'
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
                                <span class="guest-info-value">${escapeHtml(session.host_name)}</span>
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
                                                ${escapeHtml(guest.guest_name)}
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
                                                <i class="fas fa-sticky-note"></i> ${escapeHtml(guest.guest_note)}
                                            </div>
                                            ` : ''}
                                        </div>
                                        ${isActive && guest.status === 'approved' && guest.guest_id !== appState.userId ? `
                                            <button class="btn btn-danger btn-small" onclick="kickGuest('${guest.id}', '${escapeHtml(guest.guest_name)}')">
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
    console.log('🔄 Returning to active chat...');
    
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
    
    // Clear the chat messages container
    if (chatMessages) {
        chatMessages.innerHTML = '';
    }
    
    // Load the active chat history
    loadChatHistory();
    forceScrollToBottom('auto', 200);
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

        try {
            await supabaseClient
                .from('cleared_messages')
                .delete()
                .eq('session_id', sessionId);
            console.log("✅ Cleared messages deleted");
        } catch (e) {
            console.log("Cleared messages deletion error:", e.message);
        }

        try {
            await supabaseClient
                .from('visitor_notes')
                .delete()
                .eq('session_id', sessionId);
            console.log("✅ Visitor notes deleted");
        } catch (e) {
            console.log("Visitor notes deletion skipped:", e.message);
        }

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

        try {
            const { error: sessionError } = await supabaseClient
                .from('chat_sessions')  // Changed from 'sessions'
                .delete()
                .eq('session_id', sessionId);
            
            if (sessionError) {
                console.error("Session deletion error:", sessionError);
                
                if (sessionError.message.includes('permission denied') || 
                    sessionError.message.includes('violates row-level security')) {
                    
                    console.log("🔄 RLS blocking, trying admin bypass...");
                    
                    const { error: adminError } = await supabaseClient
                        .from('chat_sessions')  // Changed from 'sessions'
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
                    <h3>${escapeHtml(user.display_name)}</h3>
                </div>
                <div class="user-badges">
                    <span class="user-badge badge-${user.role}">${user.role}</span>
                    ${!user.is_active ? '<span class="user-badge badge-inactive">Inactive</span>' : ''}
                </div>
            </div>
            <div class="user-details">
                <div class="user-detail">
                    <span class="user-detail-label">Username:</span>
                    <span class="user-detail-value">${escapeHtml(user.username)}</span>
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
                    emailInfo = `<div class="note-email"><i class="fas fa-envelope"></i> ${escapeHtml(emailLine.replace('Email:', '').trim())}</div>`;
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
                        <strong>${isGuestNotification ? '📬 Guest Message' : (escapeHtml(displayName) || 'Anonymous')}</strong>
                        ${!note.read_by_host ? '<span class="unread-badge">New</span>' : ''}
                    </div>
                    <div class="note-time">
                        <i class="fas fa-clock"></i> ${createdDate}
                    </div>
                </div>
                <div class="note-content">
                    <div class="note-from"><i class="fas fa-user"></i> From: ${escapeHtml(displayName)}</div>
                    ${emailInfo}
                    <div class="note-text">${escapeHtml(displayMessage)}</div>
                    ${note.guest_ip ? `<div class="note-ip"><i class="fas fa-network-wired"></i> IP: ${escapeHtml(note.guest_ip)}</div>` : ''}
                    ${note.guest_email ? `<div class="note-email"><i class="fas fa-envelope"></i> Email: ${escapeHtml(note.guest_email)}</div>` : ''}
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
    if (text === undefined || text === null) return '';
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

window.playNotificationSound = function() {
    if (!appState.soundEnabled) return;
    
    try {
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const audioContext = window.audioContext;
        
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
                            <strong>${escapeHtml(g.guest_name)}</strong>
                            <div class="guest-meta">
                                <small>Joined: ${new Date(g.approved_at).toLocaleString()}</small>
                                <small>IP: ${g.guest_ip || 'Not recorded'}</small>
                                ${g.guest_note ? `<small>Note: ${escapeHtml(g.guest_note)}</small>` : ''}
                            </div>
                        </div>
                    `).join('') : '<p>No approved guests</p>'}
                </div>
                
                ${pendingGuests.length > 0 ? `
                <div class="guest-status-section">
                    <h4><i class="fas fa-clock" style="color: var(--warning-yellow);"></i> Pending Guests (${pendingGuests.length})</h4>
                    ${pendingGuests.map(g => `
                        <div class="guest-detail">
                            <strong>${escapeHtml(g.guest_name)}</strong>
                            <div class="guest-meta">
                                <small>Requested: ${new Date(g.requested_at).toLocaleString()}</small>
                                <small>IP: ${g.guest_ip || 'Not recorded'}</small>
                                ${g.guest_note ? `<small>Note: ${escapeHtml(g.guest_note)}</small>` : ''}
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
                            <strong>${escapeHtml(g.guest_name)}</strong>
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

// Make functions global
window.approveGuest = approveGuest;
window.denyGuest = denyGuest;
window.kickGuest = kickGuest;
window.viewSessionHistory = viewSessionHistory;
window.deleteSession = deleteSession;
window.editUserModalOpen = editUserModalOpen;
window.sendMessage = sendMessage;
window.getMessageReactions = async function(messageId) {
    if (window.ChatModule) {
        return await window.ChatModule.getMessageReactions(messageId);
    }
    return [];
};

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
