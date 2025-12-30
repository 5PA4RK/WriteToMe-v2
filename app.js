connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';

try {
        // Authenticate user using Supabase function
        // Authenticate user
const { data, error } = await supabaseClient
.rpc('authenticate_user', {
p_username: selectedRole,
@@ -218,7 +218,7 @@ async function handleConnect() {
const authResult = data[0];
appState.isHost = authResult.user_role === 'host';
appState.userName = authResult.user_role === 'host' ? "Host" : "Guest";
        appState.userId = authResult.user_id + "_" + Date.now(); // Add timestamp for uniqueness
        appState.userId = authResult.user_id + "_" + Date.now();

} catch (error) {
console.error("Authentication error:", error);
@@ -238,34 +238,52 @@ async function handleConnect() {
// Host creates a new session
try {
const sessionId = 'session_' + Date.now().toString(36);
            const { data, error } = await supabaseClient
            
            // First, check if session already exists
            const { data: existingSession, error: checkError } = await supabaseClient
.from('sessions')
                .insert([
                    {
                        session_id: sessionId,
                        host_id: appState.userId,
                        host_name: appState.userName,
                        host_ip: userIP,
                        is_active: true,
                        requires_approval: true,
                        created_at: new Date().toISOString()
                    }
                ])
                .select()
                .select('session_id')
                .eq('session_id', sessionId)
.single();

            if (error) {
                console.error("Error creating session:", error);
                alert("Failed to create session. Please try again.");
                connectBtn.disabled = false;
                connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect';
                return;
            // If it doesn't exist (which it shouldn't), create it
            if (checkError && checkError.code === 'PGRST116') {
                // Session doesn't exist, create it
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
                            created_at: new Date().toISOString()
                        }
                    ])
                    .select()
                    .single();
                
                if (error) {
                    console.error("Error creating session:", error);
                    alert("Failed to create session. Please try again.");
                    connectBtn.disabled = false;
                    connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect';
                    return;
                }
                
                appState.sessionId = sessionId;
                appState.currentSessionId = sessionId;
                appState.isConnected = true;
                
            } else if (existingSession) {
                // Session already exists (unlikely but handle it)
                appState.sessionId = sessionId;
                appState.currentSessionId = sessionId;
                appState.isConnected = true;
}

            appState.sessionId = sessionId;
            appState.currentSessionId = sessionId;
            appState.isConnected = true;
            
// Save session to localStorage
localStorage.setItem('writeToMe_session', JSON.stringify({
isHost: appState.isHost,
@@ -484,11 +502,6 @@ function setupPendingApprovalSubscription(sessionId) {
.subscribe();
}

// Generate a unique user ID
function generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get real IP address
async function getRealIP() {
try {
@@ -568,6 +581,7 @@ function updateUIForPendingGuest() {
// Update UI after connection
function updateUIAfterConnection() {
statusIndicator.className = 'status-indicator';
    statusIndicator.classList.add('online');
userRoleDisplay.textContent = `${appState.userName} (Connected)`;
logoutBtn.style.display = 'flex';

@@ -795,8 +809,20 @@ async function sendMessage() {
// Send message to database
async function sendMessageToDB(text, imageUrl) {
try {
        // First, let's test if we can insert a simple message
        console.log("Attempting to send message to session:", appState.currentSessionId);
        console.log("Sending message to session:", appState.currentSessionId);
        
        // First, verify the session exists
        const { data: session, error: sessionError } = await supabaseClient
            .from('sessions')
            .select('session_id')
            .eq('session_id', appState.currentSessionId)
            .single();
        
        if (sessionError) {
            console.error("Session not found:", sessionError);
            alert("Session not found. Please reconnect.");
            return null;
        }

const { data, error } = await supabaseClient
.from('messages')
@@ -816,40 +842,34 @@ async function sendMessageToDB(text, imageUrl) {
if (error) {
console.error("Error sending message:", error);

            // Try a different approach if permission error
            if (error.message.includes('permission') || error.message.includes('auth')) {
                console.log("Trying alternative insert method...");
                
                // Try without .select() .single()
                const { error: simpleError } = await supabaseClient
                    .from('messages')
                    .insert({
                        session_id: appState.currentSessionId,
                        sender_id: appState.userId,
                        sender_name: appState.userName,
                        message: text || '',
                        image_url: imageUrl,
                        created_at: new Date().toISOString()
                    });
                
                if (simpleError) {
                    throw simpleError;
                }
                
                // If we get here, insert succeeded
                displayMessage({
                    id: 'temp_' + Date.now(),
                    sender: appState.userName,
                    text: text,
                    image: imageUrl,
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    type: 'sent',
                    is_historical: false
            // Try without .select() .single() if that's the issue
            const { error: simpleError } = await supabaseClient
                .from('messages')
                .insert({
                    session_id: appState.currentSessionId,
                    sender_id: appState.userId,
                    sender_name: appState.userName,
                    message: text || '',
                    image_url: imageUrl,
                    created_at: new Date().toISOString()
});
                
                return { id: 'temp_' + Date.now() };
            
            if (simpleError) {
                throw simpleError;
}
            throw error;
            
            // If we get here, insert succeeded without returning data
            displayMessage({
                id: 'temp_' + Date.now(),
                sender: appState.userName,
                text: text,
                image: imageUrl,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                type: 'sent',
                is_historical: false
            });
            
            return { id: 'temp_' + Date.now() };
}

// Display message immediately
@@ -866,7 +886,7 @@ async function sendMessageToDB(text, imageUrl) {
return data;
} catch (error) {
console.error("Error sending message:", error);
        alert("Failed to send message. Please check your connection and try again.");
        alert("Failed to send message: " + error.message);
return null;
}
}
