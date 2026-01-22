// Import Firebase SDKs (using ES Modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- FIREBASE CONFIGURATION ---
// TODO: 1. Go to https://console.firebase.google.com/
// TODO: 2. Create a new project
// TODO: 3. Add a Web App and copy the config object below
const firebaseConfig = {
  apiKey: "AIzaSyDN5wETSKrkk0F9_o1GjC8QfbW9sBKubsI",
  authDomain: "designhub-a6a2e.firebaseapp.com",
  projectId: "designhub-a6a2e",
  storageBucket: "designhub-a6a2e.firebasestorage.app",
  messagingSenderId: "149196974349",
  appId: "1:149196974349:web:e0c4f8348919717c122844",
  measurementId: "G-7RSX04VG4D"
};

// Initialize Firebase
let db;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase not initialized. Make sure to update firebaseConfig.", e);
}

document.addEventListener('DOMContentLoaded', () => {
    // Check if config is set
    if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
        alert("Firebase is not configured! Please open js/app.js and set your firebaseConfig.");
    }

    const feedContainer = document.getElementById('feed-container');
    const submitBtn = document.getElementById('submit-btn');
    const urlInput = document.getElementById('resource-url');
    const noteInput = document.getElementById('resource-note');
    
    // Category Management Elements
    const categorySelect = document.getElementById('resource-category');
    const filterContainer = document.getElementById('filter-container');
    const manageCatsBtn = document.getElementById('manage-cats-btn');
    const categoryManager = document.getElementById('category-manager');
    const catManagerList = document.getElementById('cat-manager-list');
    const newCatInput = document.getElementById('new-cat-input');
    const addCatBtn = document.getElementById('add-cat-btn');

    // User Management Elements
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    const userListContainer = document.getElementById('user-list');
    const addUserBtn = document.getElementById('add-user-btn');
    const newUserNameInput = document.getElementById('new-username-input');
    const currentUserAvatar = document.getElementById('current-user-avatar');
    const currentUserNameDisplay = document.getElementById('current-user-name');

    // --- State ---
    let categories = []; // Array of objects { id, name }
    let users = [];      // Array of objects { id, name }
    let posts = [];      // Array of objects { id, ...data }
    
    let activeFilter = 'All Posts';
    // Current user is still stored locally as it's a "session" preference
    let currentUser = localStorage.getItem('designHubCurrentUser') || 'Me';

    // --- Real-time Listeners ---

    // 1. Listen for Categories
    if (db) {
        const qCat = query(collection(db, "categories"), orderBy("name"));
        onSnapshot(qCat, (snapshot) => {
            categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // If empty (fresh DB), add defaults
            if (categories.length === 0 && !localStorage.getItem('catsInitialized')) {
                initializeDefaults();
            } else {
                renderCategories();
            }
        });

        // 2. Listen for Users
        const qUser = query(collection(db, "users"), orderBy("name"));
        onSnapshot(qUser, (snapshot) => {
            users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
             if (users.length === 0 && !localStorage.getItem('usersInitialized')) {
                 // Defaults handled in initializeDefaults
            } else {
                updateUserUI(); // Update UI in case current user was deleted
                renderUserDropdownList();
            }
        });

        // 3. Listen for Posts
        const qPosts = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        onSnapshot(qPosts, (snapshot) => {
            posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderFeed(activeFilter);
        });
    }

    // Helper: Initialize Defaults for fresh DB
    const initializeDefaults = async () => {
        localStorage.setItem('catsInitialized', 'true');
        localStorage.setItem('usersInitialized', 'true');
        
        const defaultCats = ['Frontend', 'UI Design', 'UX Research', 'AI Tools'];
        for (const cat of defaultCats) {
            await addDoc(collection(db, "categories"), { name: cat });
        }
        
        const defaultUsers = ['Me', 'Sarah', 'Tom H.', 'Mike R.'];
        for (const user of defaultUsers) {
            await addDoc(collection(db, "users"), { name: user });
        }
    };


    // Helper: Badge Color Mapping
    const getBadgeClass = (categoryName) => {
        const styles = ['badge-ui', 'badge-ux', 'badge-fe', 'badge-ai'];
        let hash = 0;
        for (let i = 0; i < categoryName.length; i++) {
            hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
        }
        return styles[Math.abs(hash) % styles.length];
    };

    // Render Categories
    const renderCategories = () => {
        // 1. Render Select Options
        categorySelect.innerHTML = '';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.name;
            option.textContent = cat.name;
            categorySelect.appendChild(option);
        });

        // 2. Render Filter Buttons
        filterContainer.innerHTML = '';
        const allBtn = document.createElement('button');
        allBtn.className = `clay-btn-secondary filter-btn text-xs whitespace-nowrap ${activeFilter === 'All Posts' ? 'active' : ''}`;
        allBtn.textContent = 'All Posts';
        allBtn.addEventListener('click', () => {
             activeFilter = 'All Posts';
             renderCategories(); // Update active state
             renderFeed('All Posts');
        });
        filterContainer.appendChild(allBtn);

        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `clay-btn-secondary filter-btn text-xs whitespace-nowrap ${activeFilter === cat.name ? 'active' : ''}`;
            btn.textContent = cat.name;
            btn.addEventListener('click', () => {
                activeFilter = cat.name;
                renderCategories();
                renderFeed(cat.name);
            });
            filterContainer.appendChild(btn);
        });

        // 3. Render Manager List
        catManagerList.innerHTML = '';
        categories.forEach(cat => {
            const tag = document.createElement('div');
            tag.className = `inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 shadow-sm text-slate-600`;
            tag.innerHTML = `
                ${cat.name}
                <button class="delete-cat-btn text-slate-400 hover:text-red-500 transition-colors" data-id="${cat.id}" data-name="${cat.name}">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>
            `;
            catManagerList.appendChild(tag);
        });

        // Attach listeners
        document.querySelectorAll('.delete-cat-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const catId = e.currentTarget.dataset.id;
                const catName = e.currentTarget.dataset.name;
                if(confirm(`Delete category "${catName}"?`)) {
                    await deleteDoc(doc(db, "categories", catId));
                    if (activeFilter === catName) {
                        activeFilter = 'All Posts';
                        renderFeed('All Posts');
                    }
                }
            });
        });
        
        lucide.createIcons();
    };

    // Event: Toggle Category Manager
    manageCatsBtn.addEventListener('click', () => {
        categoryManager.classList.toggle('hidden');
    });

    // Event: Add Category
    const handleAddCategory = async () => {
        const newCatName = newCatInput.value.trim();
        if (newCatName) {
            const exists = categories.some(c => c.name.toLowerCase() === newCatName.toLowerCase());
            if (!exists) {
                await addDoc(collection(db, "categories"), { name: newCatName });
                newCatInput.value = '';
            } else {
                alert('Category already exists!');
            }
        }
    };
    addCatBtn.addEventListener('click', handleAddCategory);
    
    // --- User State Management ---
    
    // Helper: Update User UI (Navbar)
    const updateUserUI = () => {
        // Validate if current user still exists in DB
        const userExists = users.some(u => u.name === currentUser);
        if (!userExists && users.length > 0) {
            currentUser = users[0].name; // Fallback
            localStorage.setItem('designHubCurrentUser', currentUser);
        }
        
        currentUserNameDisplay.textContent = currentUser;
        currentUserAvatar.textContent = currentUser.charAt(0).toUpperCase();
    };

    // Helper: Render Dropdown
    const renderUserDropdownList = () => {
        userListContainer.innerHTML = '';
        users.forEach(user => {
            const isCurrent = user.name === currentUser;
            const div = document.createElement('div');
            div.className = `flex justify-between items-center p-2 rounded-lg cursor-pointer transition-colors ${isCurrent ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-slate-100 text-slate-600'}`;
            div.innerHTML = `
                <div class="flex items-center gap-2 flex-1 user-select-item" data-user="${user.name}">
                    <div class="w-6 h-6 rounded-full ${isCurrent ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'} flex items-center justify-center text-xs font-bold">
                        ${user.name.charAt(0).toUpperCase()}
                    </div>
                    <span>${user.name}</span>
                </div>
                ${!isCurrent && users.length > 1 ? `
                <button class="text-slate-300 hover:text-red-500 transition-colors delete-user-btn p-1" data-id="${user.id}" data-name="${user.name}">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>` : ''}
            `;
            userListContainer.appendChild(div);
        });

        // Attach Listeners
        document.querySelectorAll('.user-select-item').forEach(item => {
            item.addEventListener('click', (e) => {
                currentUser = e.currentTarget.dataset.user;
                localStorage.setItem('designHubCurrentUser', currentUser);
                updateUserUI();
                renderUserDropdownList();
                userDropdown.classList.add('hidden');
            });
        });

        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const userId = e.currentTarget.dataset.id;
                const userName = e.currentTarget.dataset.name;
                if(confirm(`Remove user "${userName}"?`)) {
                    await deleteDoc(doc(db, "users", userId));
                }
            });
        });
        
        lucide.createIcons();
    };

    // User Menu Toggle
    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.add('hidden');
        }
    });

    // Event: Add User
    const handleAddUser = async () => {
        const newName = newUserNameInput.value.trim();
        if (newName) {
            const exists = users.some(u => u.name.toLowerCase() === newName.toLowerCase());
            if (!exists) {
                await addDoc(collection(db, "users"), { name: newName });
                currentUser = newName;
                localStorage.setItem('designHubCurrentUser', currentUser);
                newUserNameInput.value = '';
            } else {
                alert('User already exists!');
            }
        }
    };
    addUserBtn.addEventListener('click', handleAddUser);
    newUserNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddUser();
    });

    // --- Feed Management ---

    // Helper: Format URL to Title
    const formatUrlTitle = (url) => {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            return `Resource from ${domain}`;
        } catch (e) {
            return 'External Resource';
        }
    };

    // Render Feed
    const renderFeed = (filter = activeFilter) => {
        feedContainer.innerHTML = '';
        
        const filteredPosts = filter === 'All Posts' 
            ? posts 
            : posts.filter(post => post.category === filter);

        if (filteredPosts.length === 0) {
            feedContainer.innerHTML = `
                <div class="col-span-1 md:col-span-2 text-center py-10 text-slate-400">
                    <p>No posts found in this category.</p>
                </div>`;
            return;
        }

        filteredPosts.forEach(post => {
            const article = document.createElement('article');
            article.className = 'clay-card p-5 hover:z-10 relative group animate-fade-in';
            article.innerHTML = `
                <div class="flex justify-between items-start mb-3">
                    <span class="badge ${getBadgeClass(post.category)}">${post.category}</span>
                    <button class="text-slate-300 hover:text-red-500 transition-colors delete-btn" data-id="${post.id}">
                        <i data-lucide="trash-2" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <h4 class="font-display font-bold text-lg text-slate-800 leading-tight mb-2">
                    ${post.title}
                </h4>
                
                <p class="text-slate-600 text-sm mb-4 leading-relaxed bg-white/50 p-3 rounded-lg border border-white/50">
                    <span class="font-semibold text-indigo-500 block mb-1">Note:</span>
                    ${post.note}
                </p>

                <div class="flex items-center justify-between mt-2">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold border border-white">
                            ${post.author.charAt(0)}
                        </div>
                        <span class="text-xs text-slate-500">${post.author} • ${post.time}</span>
                    </div>
                    
                    <a href="${post.url}" target="_blank" class="inline-flex items-center gap-1 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                        Visit
                        <i data-lucide="external-link" class="w-4 h-4"></i>
                    </a>
                </div>
            `;
            feedContainer.appendChild(article); // Prepending is handled by ordering in Firestore
        });

        lucide.createIcons();

        // Attach Delete Listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if(confirm('Are you sure you want to delete this resource?')) {
                    await deleteDoc(doc(db, "posts", id));
                }
            });
        });
    };

    // Add New Post
    const addNewPost = async () => {
        const url = urlInput.value.trim();
        const category = categorySelect.value;
        const note = noteInput.value.trim();

        if (!url || !note) {
            alert('Please enter both a URL and a note.');
            return;
        }

        try {
            await addDoc(collection(db, "posts"), {
                url: url,
                category: category,
                title: formatUrlTitle(url),
                note: note,
                author: currentUser, 
                time: new Date().toLocaleDateString(), // Use current date for display
                createdAt: serverTimestamp() // Use server timestamp for sorting
            });
            
            // Reset Form (Feed updates automatically via listener)
            urlInput.value = '';
            noteInput.value = '';
        } catch (e) {
            console.error("Error adding post: ", e);
            alert("Failed to save post online.");
        }
    };

    submitBtn.addEventListener('click', addNewPost);
    
    // Initial calls
    updateUserUI();
});
