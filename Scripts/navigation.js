// Navigation Manager
const navigationManager = {
    elements: null,  // Will be initialized when DOM is ready

    initialize() {
        console.log('Initializing navigation manager...');
        // Initialize elements
        this.elements = {
            themeToggle: document.getElementById('theme-toggle'),
            themeIcon: document.querySelector('#theme-toggle i'),
            userMenuBtn: document.getElementById('user-menu-btn'),
            userDropdown: document.getElementById('user-dropdown'),
            userAvatar: document.getElementById('user-avatar'),
            avatarInitials: document.getElementById('avatar-initials'),
            dropdownInitials: document.getElementById('dropdown-initials'),
            dropdownAvatar: document.getElementById('dropdown-avatar-img'),
            userName: document.getElementById('user-name'),
            userEmail: document.getElementById('user-email'),
            logoutLink: document.getElementById('logout-link')
        };

        console.log('Elements initialized:', this.elements);
        
        this.setupThemeToggle();
        this.setupUserMenu();
        this.setupLogout();
        
        // Add auth state listener
        firebase.auth().onAuthStateChanged(user => {
            console.log('Auth state changed:', user ? user.uid : 'No user');
            if (user) {
                this.loadUserData();
            }
        });
    },

    setupThemeToggle() {
        const { themeToggle, themeIcon } = this.elements;
        console.log('Setting up theme toggle:', { themeToggle, themeIcon });
        
        if (!themeToggle || !themeIcon) {
            console.error('Theme toggle elements not found');
            return;
        }
        
        // Set initial theme
        const isDark = localStorage.getItem('darkMode') === 'true';
        document.body.classList.toggle('dark-mode', isDark);
        themeIcon.classList.toggle('fa-sun', isDark);
        themeIcon.classList.toggle('fa-moon', !isDark);

        // Theme toggle click handler
        themeToggle.addEventListener('click', () => {
            const isDarkMode = document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', isDarkMode);
            themeIcon.classList.toggle('fa-sun', isDarkMode);
            themeIcon.classList.toggle('fa-moon', !isDarkMode);
        });
    },

    setupUserMenu() {
        const { userMenuBtn, userDropdown } = this.elements;
        console.log('Setting up user menu:', { userMenuBtn, userDropdown });
        
        if (!userMenuBtn || !userDropdown) {
            console.error('User menu elements not found');
            return;
        }

        userMenuBtn.addEventListener('click', (e) => {
            console.log('User menu clicked');
            e.stopPropagation();
            userDropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) {
                userDropdown.classList.remove('active');
            }
        });
    },

    setupLogout() {
        const { logoutLink } = this.elements;
        
        if (!logoutLink) {
            console.error('Logout link not found');
            return;
        }
        
        logoutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await firebase.auth().signOut();
                window.location.href = '../Auth/auth.html';
            } catch (error) {
                console.error('Error signing out:', error);
            }
        });
    },

    async loadUserData() {
        const { userAvatar, avatarInitials, dropdownInitials, dropdownAvatar, userName, userEmail } = this.elements;
        
        if (!userAvatar || !avatarInitials || !dropdownInitials || !dropdownAvatar || !userName || !userEmail) {
            console.error('User data elements not found');
            return;
        }

        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                console.log('No user found');
                return;
            }

            console.log('Loading user data for:', user.uid);

            // Update user info in dropdown
            userName.textContent = user.displayName || 'Guest User';
            userEmail.textContent = user.email || 'guest@example.com';

            // Get user profile from Firestore
            const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            const userData = userDoc.exists ? userDoc.data() : null;
            console.log('User data from Firestore:', userData);

            // Update avatars
            if (userData && userData.photoURL) {
                console.log('Setting profile image:', userData.photoURL);
                userAvatar.src = userData.photoURL;
                dropdownAvatar.src = userData.photoURL;
                userAvatar.style.display = 'block';
                dropdownAvatar.style.display = 'block';
                avatarInitials.style.display = 'none';
                dropdownInitials.style.display = 'none';
            } else {
                const initials = this.getInitials(user.displayName || 'Guest User');
                console.log('Setting initials:', initials);
                avatarInitials.textContent = initials;
                dropdownInitials.textContent = initials;
                userAvatar.style.display = 'none';
                dropdownAvatar.style.display = 'none';
                avatarInitials.style.display = 'flex';
                dropdownInitials.style.display = 'flex';
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Show initials as fallback
            const initials = this.getInitials(user?.displayName || 'Guest User');
            avatarInitials.textContent = initials;
            dropdownInitials.textContent = initials;
            userAvatar.style.display = 'none';
            dropdownAvatar.style.display = 'none';
            avatarInitials.style.display = 'flex';
            dropdownInitials.style.display = 'flex';
        }
    },

    getInitials(name) {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing navigation manager...');
    navigationManager.initialize();
});
