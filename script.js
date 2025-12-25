// Simulated database using localStorage
const DB_NAME = 'coupleLikesHatesDB';
const AVATAR_DB_NAME = 'coupleAvatarsDB';

// Theme management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    if (theme === 'dark') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark Mode';
    }
}

// Avatar management
function initAvatars() {
    const avatarData = JSON.parse(localStorage.getItem(AVATAR_DB_NAME)) || {
        me: null,
        her: null
    };
    
    if (avatarData.me) {
        document.getElementById('my-avatar-placeholder').style.display = 'none';
        document.getElementById('my-avatar-img').style.display = 'block';
        document.getElementById('my-avatar-img').src = avatarData.me;
    }
    
    if (avatarData.her) {
        document.getElementById('her-avatar-placeholder').style.display = 'none';
        document.getElementById('her-avatar-img').style.display = 'block';
        document.getElementById('her-avatar-img').src = avatarData.her;
    }
}

function uploadMyAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Image size should be less than 5MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarData = JSON.parse(localStorage.getItem(AVATAR_DB_NAME)) || {
                me: null,
                her: null
            };
            
            avatarData.me = e.target.result;
            localStorage.setItem(AVATAR_DB_NAME, JSON.stringify(avatarData));
            
            document.getElementById('my-avatar-placeholder').style.display = 'none';
            document.getElementById('my-avatar-img').style.display = 'block';
            document.getElementById('my-avatar-img').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function uploadHerAvatar(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Image size should be less than 5MB');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarData = JSON.parse(localStorage.getItem(AVATAR_DB_NAME)) || {
                me: null,
                her: null
            };
            
            avatarData.her = e.target.result;
            localStorage.setItem(AVATAR_DB_NAME, JSON.stringify(avatarData));
            
            document.getElementById('her-avatar-placeholder').style.display = 'none';
            document.getElementById('her-avatar-img').style.display = 'block';
            document.getElementById('her-avatar-img').src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

// Initialize database with sample data
function initDatabase() {
    if (!localStorage.getItem(DB_NAME)) {
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
            }
        };
        localStorage.setItem(DB_NAME, JSON.stringify(initialData));
    }
    
    updateDisplay();
    updateStats();
}

// Get database data
function getDatabase() {
    return JSON.parse(localStorage.getItem(DB_NAME));
}

// Save database data
function saveDatabase(data) {
    localStorage.setItem(DB_NAME, JSON.stringify(data));
}

// Create an item element
function createItemElement(text, type, index, person) {
    const itemElement = document.createElement('div');
    itemElement.className = `item ${type}-item`;
    itemElement.innerHTML = `
        <span><i class="fas ${type === 'like' ? 'fa-heart' : 'fa-times-circle'}"></i> ${text}</span>
        <button class="delete-btn" onclick="deleteItem('${person}', '${type}', ${index})">
            <i class="fas fa-trash"></i>
        </button>
    `;
    return itemElement;
}

// Update the display with current data
function updateDisplay() {
    const db = getDatabase();
    
    // Clear current lists
    document.getElementById('my-likes-list').innerHTML = '';
    document.getElementById('my-hates-list').innerHTML = '';
    document.getElementById('her-likes-list').innerHTML = '';
    document.getElementById('her-hates-list').innerHTML = '';
    
    // Display my likes
    db.me.likes.forEach((item, index) => {
        document.getElementById('my-likes-list').appendChild(
            createItemElement(item, 'like', index, 'me')
        );
    });
    
    // Display my hates
    db.me.hates.forEach((item, index) => {
        document.getElementById('my-hates-list').appendChild(
            createItemElement(item, 'hate', index, 'me')
        );
    });
    
    // Display her likes
    db.her.likes.forEach((item, index) => {
        document.getElementById('her-likes-list').appendChild(
            createItemElement(item, 'like', index, 'her')
        );
    });
    
    // Display her hates
    db.her.hates.forEach((item, index) => {
        document.getElementById('her-hates-list').appendChild(
            createItemElement(item, 'hate', index, 'her')
        );
    });
}

// Delete an item
function deleteItem(person, type, index) {
    const db = getDatabase();
    
    if (person === 'me') {
        if (type === 'like') {
            db.me.likes.splice(index, 1);
        } else {
            db.me.hates.splice(index, 1);
        }
    } else {
        if (type === 'like') {
            db.her.likes.splice(index, 1);
        } else {
            db.her.hates.splice(index, 1);
        }
    }
    
    saveDatabase(db);
    updateDisplay();
    updateStats();
}

// Add item for me
function addMyItem() {
    const textInput = document.getElementById('my-item-text');
    const typeSelect = document.getElementById('my-item-type');
    
    const text = textInput.value.trim();
    const type = typeSelect.value;
    
    if (!text) {
        alert('Please enter something!');
        return;
    }
    
    const db = getDatabase();
    
    if (type === 'like') {
        db.me.likes.push(text);
    } else {
        db.me.hates.push(text);
    }
    
    saveDatabase(db);
    updateDisplay();
    updateStats();
    
    // Clear input
    textInput.value = '';
    textInput.focus();
}

// Add item for her
function addHerItem() {
    const textInput = document.getElementById('her-item-text');
    const typeSelect = document.getElementById('her-item-type');
    
    const text = textInput.value.trim();
    const type = typeSelect.value;
    
    if (!text) {
        alert('Please enter something!');
        return;
    }
    
    const db = getDatabase();
    
    if (type === 'like') {
        db.her.likes.push(text);
    } else {
        db.her.hates.push(text);
    }
    
    saveDatabase(db);
    updateDisplay();
    updateStats();
    
    // Clear input
    textInput.value = '';
    textInput.focus();
}

// Update statistics
function updateStats() {
    const db = getDatabase();
    
    // Calculate stats
    const myTotal = db.me.likes.length + db.me.hates.length;
    const herTotal = db.her.likes.length + db.her.hates.length;
    
    // Find shared likes (case-insensitive partial matching for demo)
    const myLikesLower = db.me.likes.map(item => item.toLowerCase());
    const herLikesLower = db.her.likes.map(item => item.toLowerCase());
    const sharedLikes = myLikesLower.filter(item => 
        herLikesLower.some(herItem => herItem.includes(item) || item.includes(herItem))
    ).length;
    
    // Find opposite opinions (I like something she hates and vice versa)
    let oppositeCount = 0;
    
    // Check if I like something she hates
    db.me.likes.forEach(myLike => {
        const myLikeLower = myLike.toLowerCase();
        db.her.hates.forEach(herHate => {
            if (herHate.toLowerCase().includes(myLikeLower) || 
                myLikeLower.includes(herHate.toLowerCase())) {
                oppositeCount++;
            }
        });
    });
    
    // Check if I hate something she likes
    db.me.hates.forEach(myHate => {
        const myHateLower = myHate.toLowerCase();
        db.her.likes.forEach(herLike => {
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

// Export data as JSON
function exportData() {
    const db = getDatabase();
    const avatarData = JSON.parse(localStorage.getItem(AVATAR_DB_NAME)) || { me: null, her: null };
    
    const exportData = {
        preferences: db,
        avatars: avatarData,
        exportDate: new Date().toISOString(),
        version: "1.0"
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `our-likes-hates-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
}

// Import data from JSON file
function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                
                if (importedData.preferences) {
                    localStorage.setItem(DB_NAME, JSON.stringify(importedData.preferences));
                }
                
                if (importedData.avatars) {
                    localStorage.setItem(AVATAR_DB_NAME, JSON.stringify(importedData.avatars));
                    initAvatars();
                }
                
                updateDisplay();
                updateStats();
                alert('Data imported successfully!');
            } catch (error) {
                alert('Error importing data. Please check the file format.');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Reset to sample data
function resetData() {
    if (confirm('Are you sure you want to reset to sample data? This will replace all current data.')) {
        localStorage.removeItem(DB_NAME);
        initDatabase();
        alert('Data reset to sample data!');
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initTheme();
    initAvatars();
    initDatabase();
    
    // Theme toggle event
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Allow Enter key to submit forms
    document.getElementById('my-item-text').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addMyItem();
    });
    
    document.getElementById('her-item-text').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addHerItem();
    });
});