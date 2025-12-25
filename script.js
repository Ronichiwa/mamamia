// Firebase configuration - Replace with your actual config
// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global variables
let currentUser = 'me'; // Default to 'me'
let unsubscribe = null;
let lastUpdateTime = new Date();

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const connectionStatus = document.getElementById('connectionStatus');
const currentUserSpan = document.getElementById('currentUser');
const switchToUserSpan = document.getElementById('switchToUser');
const userBadge = document.getElementById('userBadge');
const lastUpdateTimeSpan = document.getElementById('lastUpdateTime');

// Initialize the app
async function initApp() {
    showLoading(true);
    
    // Check Firebase connection
    try {
        await db.enableNetwork();
        updateConnectionStatus(true);
    } catch (error) {
        console.error('Firebase connection error:', error);
        updateConnectionStatus(false);
    }
    
    // Set up real-time listener
    setupRealtimeListener();
    
    // Initialize UI
    updateUserUI();
    
    // Check for existing data or create initial data
    await checkOrCreateData();
    
    showLoading(false);
    
    // Update last update time periodically
    setInterval(updateLastUpdateTime, 60000);
}

// Show/hide loading screen
function showLoading(show) {
    loadingScreen.style.display = show ? 'flex' : 'none';
}

// Update connection status
function updateConnectionStatus(connected) {
    if (connected) {
        connectionStatus.innerHTML = '<i class="fas fa-wifi"></i> <span>Connected</span>';
        connectionStatus.classList.remove('disconnected');
    } else {
        connectionStatus.innerHTML = '<i class="fas fa-wifi-slash"></i> <span>Offline</span>';
        connectionStatus.classList.add('disconnected');
    }
}

// Set up real-time listener for database changes
function setupRealtimeListener() {
    if (unsubscribe) unsubscribe(); // Unsubscribe from previous listener
    
    unsubscribe = db.collection('preferences').doc('coupleData')
        .onSnapshot((doc) => {
            if (doc.exists) {
                const data = doc.data();
                updateUIFromFirebase(data);
                lastUpdateTime = new Date();
                updateLastUpdateTime();
                showSyncNotification('Data updated in real-time!');
            }
        }, (error) => {
            console.error('Firebase error:', error);
            updateConnectionStatus(false);
        });
}

// Update UI from Firebase data
function updateUIFromFirebase(data) {
    // Update 'me' data
    updatePersonPanel('me', data.me || { likes: [], hates: [] });
    
    // Update 'her' data
    updatePersonPanel('her', data.her || { likes: [], hates: [] });
    
    // Update stats
    updateStats(data);
    
    // Update avatars
    updateAvatars(data.avatars || { me: null, her: null });
}

// Update a person's panel
function updatePersonPanel(person, data) {
    const likesList = document.getElementById(`${person}-likes-list`);
    const hatesList = document.getElementById(`${person}-hates-list`);
    
    // Clear current lists
    likesList.innerHTML = '';
    hatesList.innerHTML = '';
    
    // Add likes
    (data.likes || []).forEach((item, index) => {
        const itemElement = createItemElement(item, 'like', index, person);
        likesList.appendChild(itemElement);
    });
    
    // Add hates
    (data.hates || []).forEach((item, index) => {
        const itemElement = createItemElement(item, 'hate', index, person);
        hatesList.appendChild(itemElement);
    });
}

// Create item element
function createItemElement(text, type, index, person) {
    const itemElement = document.createElement('div');
    itemElement.className = `item ${type}-item`;
    itemElement.innerHTML = `
        <span><i class="fas ${type === 'like' ? 'fa-heart' : 'fa-times-circle'}"></i> ${text}</span>
        <div>
            <button class="edit-btn" onclick="editItem('${person}', '${type}', ${index}, '${text.replace(/'/g, "\\'")}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="delete-btn" onclick="deleteItem('${person}', '${type}', ${index})">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return itemElement;
}

// Edit an item
function editItem(person, type, index, currentText) {
    const newText = prompt(`Edit ${type}:`, currentText);
    if (newText && newText.trim() !== '' && newText !== currentText) {
        updateFirebaseItem(person, type, index, newText.trim());
    }
}

// Update item in Firebase
async function updateFirebaseItem(person, type, index, newText) {
    try {
        const docRef = db.collection('preferences').doc('coupleData');
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            const items = data[person][type];
            
            if (index >= 0 && index < items.length) {
                items[index] = newText;
                
                await docRef.update({
                    [`${person}.${type}`]: items,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                showSyncNotification(`${person === 'me' ? 'Your' : 'Her'} ${type} updated`);
            }
        }
    } catch (error) {
        console.error('Error updating item:', error);
        alert('Error updating item. Please try again.');
    }
}

// Delete an item
async function deleteItem(person, type, index) {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    
    try {
        const docRef = db.collection('preferences').doc('coupleData');
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            const items = data[person][type];
            
            if (index >= 0 && index < items.length) {
                items.splice(index, 1);
                
                await docRef.update({
                    [`${person}.${type}`]: items,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                showSyncNotification(`${person === 'me' ? 'Your' : 'Her'} ${type} deleted`);
            }
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please try again.');
    }
}

// Add item for current user
async function addMyItem() {
    const textInput = document.getElementById('my-item-text');
    const typeSelect = document.getElementById('my-item-type');
    
    await addItem('me', textInput, typeSelect);
}

// Add item for her
async function addHerItem() {
    const textInput = document.getElementById('her-item-text');
    const typeSelect = document.getElementById('her-item-type');
    
    await addItem('her', textInput, typeSelect);
}

// Add item to Firebase
async function addItem(person, textInput, typeSelect) {
    const text = textInput.value.trim();
    const type = typeSelect.value;
    
    if (!text) {
        alert('Please enter something!');
        return;
    }
    
    try {
        const docRef = db.collection('preferences').doc('coupleData');
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            const items = data[person][type] || [];
            items.push(text);
            
            await docRef.update({
                [`${person}.${type}`]: items,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            showSyncNotification(`${person === 'me' ? 'Your' : 'Her'} ${type} added`);
        }
        
        // Clear input
        textInput.value = '';
        textInput.focus();
        
    } catch (error) {
        console.error('Error adding item:', error);
        alert('Error adding item. Please try again.');
    }
}

// Check or create initial data
async function checkOrCreateData() {
    const docRef = db.collection('preferences').doc('coupleData');
    const doc = await docRef.get();
    
    if (!doc.exists) {
        // Create initial data
        const initialData = {
            me: {
                likes: [
                    "Watching movies together",
                    "Her smile in the morning",
                    "Cooking dinner for us",
                    "Long walks on the beach",
                    "Surprising her with gifts"
                ],
                hates: [
                    "When she's upset with me",
                    "Being away from her",
                    "Forgetting important dates",
                    "Traffic when going to see her",
                    "Bad weather on our date days"
                ]
            },
            her: {
                likes: [
                    "Romantic dinners",
                    "Flowers for no reason",
                    "Cuddling during movies",
                    "His sense of humor",
                    "Planning future together"
                ],
                hates: [
                    "When he's late",
                    "Messy places",
                    "Too much video games",
                    "Forgetting to call",
                    "Being too quiet sometimes"
                ]
            },
            avatars: {
                me: null,
                her: null
            },
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await docRef.set(initialData);
        console.log('Initial data created in Firebase');
    }
}

// Update statistics
function updateStats(data) {
    const me = data.me || { likes: [], hates: [] };
    const her = data.her || { likes: [], hates: [] };
    
    // Calculate stats
    const myTotal = me.likes.length + me.hates.length;
    const herTotal = her.likes.length + her.hates.length;
    
    // Find shared likes
    const myLikesLower = me.likes.map(item => item.toLowerCase());
    const herLikesLower = her.likes.map(item => item.toLowerCase());
    const sharedLikes = myLikesLower.filter(item => 
        herLikesLower.some(herItem => 
            herItem.includes(item) || item.includes(herItem)
        )
    ).length;
    
    // Find opposite opinions
    let oppositeCount = 0;
    
    me.likes.forEach(myLike => {
        const myLikeLower = myLike.toLowerCase();
        her.hates.forEach(herHate => {
            if (herHate.toLowerCase().includes(myLikeLower) || 
                myLikeLower.includes(herHate.toLowerCase())) {
                oppositeCount++;
            }
        });
    });
    
    me.hates.forEach(myHate => {
        const myHateLower = myHate.toLowerCase();
        her.likes.forEach(herLike => {
            if (herLike.toLowerCase().includes(myHateLower) || 
                myHateLower.includes(herLike.toLowerCase())) {
                oppositeCount++;
            }
        });
    });
    
    // Update display
    document.getElementById('my-total-count').textContent = myTotal;
    document.getElementById('her-total-count').textContent = herTotal;
    document.getElementById('shared-likes-count').textContent = sharedLikes;
    document.getElementById('opposite-count').textContent = oppositeCount;
}

// Update avatars
function updateAvatars(avatars) {
    // Update my avatar
    if (avatars.me) {
        document.getElementById('my-avatar-placeholder').style.display = 'none';
        document.getElementById('my-avatar-img').style.display = 'block';
        document.getElementById('my-avatar-img').src = avatars.me;
    }
    
    // Update her avatar
    if (avatars.her) {
        document.getElementById('her-avatar-placeholder').style.display = 'none';
        document.getElementById('her-avatar-img').style.display = 'block';
        document.getElementById('her-avatar-img').src = avatars.her;
    }
}

// Upload avatar
function uploadAvatar(person) {
    const inputId = `${person}-avatar-input`;
    const input = document.getElementById(inputId);
    
    input.onchange = async function(event) {
        const file = event.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Image size should be less than 5MB');
                return;
            }
            
            showLoading(true);
            
            try {
                // Convert to base64 for preview
                const reader = new FileReader();
                reader.onload = async function(e) {
                    // Update Firebase with base64 image
                    const docRef = db.collection('preferences').doc('coupleData');
                    await docRef.update({
                        [`avatars.${person}`]: e.target.result,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    // Update UI immediately
                    if (person === 'me') {
                        document.getElementById('my-avatar-placeholder').style.display = 'none';
                        document.getElementById('my-avatar-img').style.display = 'block';
                        document.getElementById('my-avatar-img').src = e.target.result;
                    } else {
                        document.getElementById('her-avatar-placeholder').style.display = 'none';
                        document.getElementById('her-avatar-img').style.display = 'block';
                        document.getElementById('her-avatar-img').src = e.target.result;
                    }
                    
                    showSyncNotification(`${person === 'me' ? 'Your' : 'Her'} avatar updated`);
                    showLoading(false);
                };
                reader.readAsDataURL(file);
                
            } catch (error) {
                console.error('Error uploading avatar:', error);
                alert('Error uploading avatar. Please try again.');
                showLoading(false);
            }
        }
    };
    
    input.click();
}

// Switch user
function switchUser() {
    currentUser = currentUser === 'me' ? 'her' : 'me';
    updateUserUI();
    showSyncNotification(`Now editing as ${currentUser === 'me' ? 'You' : 'Her'}`);
}

// Update user UI
function updateUserUI() {
    currentUserSpan.textContent = currentUser === 'me' ? 'You' : 'Her';
    switchToUserSpan.textContent = currentUser === 'me' ? 'Her' : 'You';
    
    // Update badge color
    userBadge.style.borderColor = currentUser === 'me' ? '#4b6cb7' : '#ff6b8b';
    userBadge.style.color = currentUser === 'me' ? '#4b6cb7' : '#ff6b8b';
    
    // Update edit mode checkboxes
    document.getElementById('editMyMode').checked = currentUser === 'me';
    document.getElementById('editHerMode').checked = currentUser === 'her';
    
    // Enable/disable panels
    document.getElementById('myPanel').style.opacity = currentUser === 'me' ? '1' : '0.7';
    document.getElementById('herPanel').style.opacity = currentUser === 'her' ? '1' : '0.7';
}

// Toggle edit mode
function toggleEditMode(person, enabled) {
    if (enabled) {
        currentUser = person;
        updateUserUI();
    }
}

// Update last update time
function updateLastUpdateTime() {
    const now = new Date();
    const diff = Math.floor((now - lastUpdateTime) / 1000); // in seconds
    
    if (diff < 60) {
        lastUpdateTimeSpan.textContent = 'Just now';
    } else if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        lastUpdateTimeSpan.textContent = `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else {
        const hours = Math.floor(diff / 3600);
        lastUpdateTimeSpan.textContent = `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }
}

// Show sync notification
function showSyncNotification(message) {
    // Remove existing notification
    const existing = document.querySelector('.sync-notification');
    if (existing) existing.remove();
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = 'sync-notification';
    notification.innerHTML = `
        <i class="fas fa-sync-alt"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Export data
async function exportData() {
    try {
        const docRef = db.collection('preferences').doc('coupleData');
        const doc = await docRef.get();
        
        if (doc.exists) {
            const data = doc.data();
            const exportData = {
                preferences: data,
                exportDate: new Date().toISOString(),
                version: "1.0"
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const fileName = `our-likes-hates-${new Date().toISOString().split('T')[0]}.json`;
            
            const link = document.createElement('a');
            link.setAttribute('href', dataUri);
            link.setAttribute('download', fileName);
            link.click();
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        alert('Error exporting data. Please try again.');
    }
}

// Import data
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (importedData.preferences) {
                    const docRef = db.collection('preferences').doc('coupleData');
                    await docRef.set({
                        ...importedData.preferences,
                        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    showSyncNotification('Data imported successfully!');
                }
            } catch (error) {
                console.error('Error importing data:', error);
                alert('Error importing data. Please check the file format.');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Admin functions
function showAdminPanel() {
    const panel = document.getElementById('adminPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

async function resetAllData() {
    if (confirm('Are you sure you want to reset ALL data? This cannot be undone!')) {
        await checkOrCreateData(); // This will reset to initial data
        showSyncNotification('All data has been reset');
    }
}

async function loadSampleData() {
    await checkOrCreateData();
    showSyncNotification('Sample data loaded');
}

function clearLocalData() {
    localStorage.clear();
    showSyncNotification('Local cache cleared');
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    
    // Allow Enter key to submit forms
    document.getElementById('my-item-text').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addMyItem();
    });
    
    document.getElementById('her-item-text').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addHerItem();
    });
    
    // Listen for offline/online events
    window.addEventListener('online', () => {
        updateConnectionStatus(true);
        db.enableNetwork();
    });
    
    window.addEventListener('offline', () => {
        updateConnectionStatus(false);
        db.disableNetwork();
    });
});
