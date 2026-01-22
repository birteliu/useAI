document.addEventListener('DOMContentLoaded', () => {
    const feedContainer = document.getElementById('feed-container');
    const submitBtn = document.getElementById('submit-btn');
    const urlInput = document.getElementById('resource-url');
    // const categoryInput = document.getElementById('resource-category'); // Handled dynamically now
    const noteInput = document.getElementById('resource-note');
    // const filterButtons = document.querySelectorAll('.filter-btn'); // Handled dynamically now
    
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

    // --- Category Management ---
    const initialCategories = ['Frontend', 'UI Design', 'UX Research', 'AI Tools'];
    let categories = JSON.parse(localStorage.getItem('designHubCategories')) || initialCategories;
    let activeFilter = 'All Posts';

    const saveCategories = () => {
        localStorage.setItem('designHubCategories', JSON.stringify(categories));
        renderCategories();
    };

    // Helper: Badge Color Mapping (Dynamic now)
    const getBadgeClass = (category) => {
        // Deterministic color assignment based on string length/char codes
        // Returns one of the predefined badge classes
        const styles = ['badge-ui', 'badge-ux', 'badge-fe', 'badge-ai'];
        let hash = 0;
        for (let i = 0; i < category.length; i++) {
            hash = category.charCodeAt(i) + ((hash << 5) - hash);
        }
        return styles[Math.abs(hash) % styles.length];
    };

    // Render Categories in Select, Filters, and Manager
    const renderCategories = () => {
        // 1. Render Select Options
        categorySelect.innerHTML = '';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            categorySelect.appendChild(option);
        });

        // 2. Render Filter Buttons
        filterContainer.innerHTML = '';
        const allBtn = document.createElement('button');
        allBtn.className = `clay-btn-secondary filter-btn text-xs whitespace-nowrap ${activeFilter === 'All Posts' ? 'active' : ''}`;
        allBtn.textContent = 'All Posts';
        allBtn.addEventListener('click', () => {
             activeFilter = 'All Posts';
             renderCategories(); // Re-render to update active state
             renderFeed('All Posts');
        });
        filterContainer.appendChild(allBtn);

        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `clay-btn-secondary filter-btn text-xs whitespace-nowrap ${activeFilter === cat ? 'active' : ''}`;
            btn.textContent = cat;
            btn.addEventListener('click', () => {
                activeFilter = cat;
                renderCategories();
                renderFeed(cat);
            });
            filterContainer.appendChild(btn);
        });

        // 3. Render Manager List
        catManagerList.innerHTML = '';
        categories.forEach(cat => {
            const tag = document.createElement('div');
            // Use getBadgeClass for consistent look, but add padding for button
            tag.className = `inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-200 shadow-sm text-slate-600`;
            tag.innerHTML = `
                ${cat}
                <button class="delete-cat-btn text-slate-400 hover:text-red-500 transition-colors" data-cat="${cat}">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>
            `;
            catManagerList.appendChild(tag);
        });

        // Attach listeners for delete buttons in manager
        document.querySelectorAll('.delete-cat-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const catToDelete = e.currentTarget.dataset.cat;
                if(confirm(`Delete category "${catToDelete}"?`)) {
                    categories = categories.filter(c => c !== catToDelete);
                    if (activeFilter === catToDelete) {
                        activeFilter = 'All Posts';
                        renderFeed('All Posts');
                    }
                    saveCategories();
                }
            });
        });
    };

    // Event: Toggle Category Manager
    manageCatsBtn.addEventListener('click', () => {
        categoryManager.classList.toggle('hidden');
    });

    // Event: Add Category
    const handleAddCategory = () => {
        const newCat = newCatInput.value.trim();
        if (newCat) {
            if (!categories.includes(newCat)) {
                categories.push(newCat);
                saveCategories();
                newCatInput.value = '';
            } else {
                alert('Category already exists!');
            }
        }
    };
    addCatBtn.addEventListener('click', handleAddCategory);
    
    // --- User State Management ---
    const initialUsers = ['Me', 'Sarah', 'Tom H.', 'Mike R.'];
    let users = JSON.parse(localStorage.getItem('designHubUsers')) || initialUsers;
    let currentUser = localStorage.getItem('designHubCurrentUser') || 'Me';

    // Helper: Save User State
    const saveUserState = () => {
        localStorage.setItem('designHubUsers', JSON.stringify(users));
        localStorage.setItem('designHubCurrentUser', currentUser);
        updateUserUI();
    };

    // Helper: Update User UI (Navbar)
    const updateUserUI = () => {
        currentUserNameDisplay.textContent = currentUser;
        currentUserAvatar.textContent = currentUser.charAt(0).toUpperCase();
        renderUserDropdownList();
    };

    // Helper: Render Dropdown List
    const renderUserDropdownList = () => {
        userListContainer.innerHTML = '';
        users.forEach(user => {
            const isCurrent = user === currentUser;
            const div = document.createElement('div');
            div.className = `flex justify-between items-center p-2 rounded-lg cursor-pointer transition-colors ${isCurrent ? 'bg-indigo-50 text-indigo-600 font-bold' : 'hover:bg-slate-100 text-slate-600'}`;
            div.innerHTML = `
                <div class="flex items-center gap-2 flex-1 user-select-item" data-user="${user}">
                    <div class="w-6 h-6 rounded-full ${isCurrent ? 'bg-indigo-500 text-white' : 'bg-slate-200 text-slate-500'} flex items-center justify-center text-xs font-bold">
                        ${user.charAt(0).toUpperCase()}
                    </div>
                    <span>${user}</span>
                </div>
                ${!isCurrent && users.length > 1 ? `
                <button class="text-slate-300 hover:text-red-500 transition-colors delete-user-btn p-1" data-user="${user}">
                    <i data-lucide="x" class="w-3 h-3"></i>
                </button>` : ''}
            `;
            userListContainer.appendChild(div);
        });

        // Attach Listeners
        document.querySelectorAll('.user-select-item').forEach(item => {
            item.addEventListener('click', (e) => {
                currentUser = e.currentTarget.dataset.user;
                saveUserState();
                userDropdown.classList.add('hidden'); // Close dropdown
            });
        });

        document.querySelectorAll('.delete-user-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const userToDelete = e.currentTarget.dataset.user;
                if(confirm(`Remove user "${userToDelete}"?`)) {
                    users = users.filter(u => u !== userToDelete);
                    saveUserState(); // Will re-render
                }
            });
        });
        
        lucide.createIcons();
    };

    // Event: Toggle Dropdown
    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('hidden');
    });

    // Event: Close Dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.add('hidden');
        }
    });

    // Event: Add User
    const handleAddUser = () => {
        const newName = newUserNameInput.value.trim();
        if (newName) {
            if (!users.includes(newName)) {
                users.push(newName);
                currentUser = newName; // Switch to new user
                saveUserState();
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

    // Initialize UI
    updateUserUI();


    // Initial Data (if localStorage is empty)
    const initialData = [
        {
            id: 1,
            url: 'https://www.nngroup.com/articles/skeleton-screens/',
            category: 'UX Research',
            title: 'NNGroup: The Psychology of Loading Screens',
            note: 'Skeleton screens are better than spinners because they reduce perceived wait time. Keep animations under 400ms.',
            author: 'Tom H.',
            time: '2h ago'
        },
        {
            id: 2,
            url: 'https://github.com/upscaler/model-v4',
            category: 'AI Tools',
            title: 'New Upscaler Model v4',
            note: 'Found this new open-source model for upscaling low-res client assets. Works better on text than the current paid tool.',
            author: 'Sarah',
            time: '5h ago'
        },
        {
            id: 3,
            url: 'https://developer.apple.com/design/',
            category: 'UI Design',
            title: 'Apple\'s Bento Grid Analysis',
            note: 'Key to the "bento" feel is consistent gap sizing (usually 16px or 24px) and varying relative container aspect ratios (1:1 vs 2:1).',
            author: 'Me',
            time: '1d ago'
        }
    ];

    // Load posts from localStorage or use initial data
    let posts = JSON.parse(localStorage.getItem('designHubPosts')) || initialData;

    // Helper: Format URL to Title (Mock title generator)
    const formatUrlTitle = (url) => {
        try {
            const domain = new URL(url).hostname.replace('www.', '');
            return `Resource from ${domain}`;
        } catch (e) {
            return 'External Resource';
        }
    };

    // Render Function
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
            feedContainer.prepend(article); // Newer posts first
        });

        // Re-initialize icons for new elements
        lucide.createIcons();

        // Attach Delete Listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.id);
                deletePost(id);
            });
        });
    };

    // Add New Post
    const addNewPost = () => {
        const url = urlInput.value.trim();
        const category = categorySelect.value;
        const note = noteInput.value.trim();

        if (!url || !note) {
            alert('Please enter both a URL and a note.');
            return;
        }

        const newPost = {
            id: Date.now(),
            url: url,
            category: category,
            title: formatUrlTitle(url),
            note: note,
            author: currentUser, 
            time: 'Just now'
        };

        posts.unshift(newPost); // Add to beginning of array
        localStorage.setItem('designHubPosts', JSON.stringify(posts));
        
        // Reset Form
        urlInput.value = '';
        noteInput.value = '';
        
        renderFeed(activeFilter);
    };

    // Delete Post
    const deletePost = (id) => {
        if(confirm('Are you sure you want to delete this resource?')) {
            posts = posts.filter(post => post.id !== id);
            localStorage.setItem('designHubPosts', JSON.stringify(posts));
            renderFeed(activeFilter);
        }
    };

    // Event Listeners
    submitBtn.addEventListener('click', addNewPost);

    // Filter Logic Removed (Now handled by renderCategories)

    // Initial Render
    renderCategories();
    renderFeed();
});
