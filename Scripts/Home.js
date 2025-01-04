// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Check if we came from setup-profile or auth
const urlParams = new URLSearchParams(window.location.search);
const fromPage = urlParams.get('from');

// Keep track of redirections
let hasRedirected = false;

// Function to get initials from a name
function getInitials(name) {
    if (!name) return 'JN';
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Function to update user profile UI
async function updateUserUI(user) {
    const userAvatar = document.getElementById('user-avatar');
    const dropdownAvatarImg = document.getElementById('dropdown-avatar-img');
    const avatarInitials = document.getElementById('avatar-initials');
    const dropdownInitials = document.getElementById('dropdown-initials');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    
    if (user) {
        // Update user info
        const displayName = user.displayName || 'User';
        userName.textContent = displayName;
        userEmail.textContent = user.email;
        
        try {
            // Fetch user profile from Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (userDoc.exists && userDoc.data().photoURL) {
                const profileImageUrl = userDoc.data().photoURL;
                userAvatar.src = profileImageUrl;
                dropdownAvatarImg.src = profileImageUrl;
                userAvatar.style.display = 'block';
                dropdownAvatarImg.style.display = 'block';
                avatarInitials.style.display = 'none';
                dropdownInitials.style.display = 'none';
            } else {
                // Fallback to initials if no profile image
                const initials = getInitials(displayName);
                avatarInitials.textContent = initials;
                dropdownInitials.textContent = initials;
                userAvatar.style.display = 'none';
                dropdownAvatarImg.style.display = 'none';
                avatarInitials.style.display = 'block';
                dropdownInitials.style.display = 'block';
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
            // Fallback to initials on error
            const initials = getInitials(displayName);
            avatarInitials.textContent = initials;
            dropdownInitials.textContent = initials;
            userAvatar.style.display = 'none';
            dropdownAvatarImg.style.display = 'none';
            avatarInitials.style.display = 'block';
            dropdownInitials.style.display = 'block';
        }
    } else {
        // Reset to defaults for logged out state
        userName.textContent = 'Guest User';
        userEmail.textContent = 'guest@example.com';
        userAvatar.style.display = 'none';
        dropdownAvatarImg.style.display = 'none';
        avatarInitials.style.display = 'block';
        dropdownInitials.style.display = 'block';
        avatarInitials.textContent = 'JN';
        dropdownInitials.textContent = 'JN';
    }
}

// Function to handle logout
async function handleLogout() {
    try {
        await auth.signOut();
        window.location.href = '../Auth/auth.html?from=home';
    } catch (error) {
        console.error('Error signing out:', error);
        alert('Error signing out. Please try again.');
    }
}

// Function to initialize UI elements and event listeners
function initializeUI() {
    // Theme toggle functionality
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    function setTheme(isDark) {
        document.body.classList.toggle('dark-mode', isDark);
        document.body.classList.toggle('light-mode', !isDark);
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
        localStorage.setItem('darkMode', isDark);
    }
    
    themeToggle.addEventListener('click', () => {
        const isDark = !document.body.classList.contains('dark-mode');
        setTheme(isDark);
    });
    
    // Initialize theme
    const isDark = localStorage.getItem('darkMode') === 'true';
    setTheme(isDark);
    
    // User menu functionality
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');
    
    userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });
    
    document.addEventListener('click', (e) => {
        if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });
    
    // Logout functionality
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }

    // Search Functionality
    const searchBtn = document.getElementById('search-btn');
    const jobSearch = document.getElementById('job-search');
    const locationSearch = document.getElementById('location-search');
    const experienceLevel = document.getElementById('experience-level');
    const jobType = document.getElementById('job-type');
    const salaryRange = document.getElementById('salary-range');

    function handleSearch(event) {
        event.preventDefault();
        
        // Get the search values
        const jobQuery = jobSearch ? jobSearch.value.trim() : '';
        const locationQuery = locationSearch ? locationSearch.value.trim() : '';
        const experience = experienceLevel ? experienceLevel.value : '';
        const type = jobType ? jobType.value : '';
        const salary = salaryRange ? salaryRange.value : '';
        
        // Build the query string
        const params = new URLSearchParams();
        
        if (jobQuery) params.append('query', jobQuery);
        if (locationQuery) params.append('location', locationQuery);
        if (experience) params.append('experience', experience);
        if (type) params.append('type', type);
        if (salary) params.append('salary', salary);
        
        // Redirect to the jobs page with the search parameters
        window.location.href = `Jobs.html${params.toString() ? '?' + params.toString() : ''}`;
    }

    // Add search event listeners
    if (searchBtn) {
        searchBtn.addEventListener('click', handleSearch);
    }

    if (jobSearch) {
        jobSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch(e);
        });
    }

    if (locationSearch) {
        locationSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch(e);
        });
    }

    // Quick search tags
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.addEventListener('click', function() {
            if (jobSearch) {
                jobSearch.value = this.textContent.trim();
                handleSearch(new Event('click'));
            }
        });
    });

    // Floating Menu
    const floatingMenu = document.querySelector('.floating-menu');
    const menuBtn = document.querySelector('.menu-btn');
    const menuItems = document.querySelector('.menu-items');

    if (menuBtn && menuItems) {
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menuItems.classList.toggle('active');
            menuBtn.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
            if (!floatingMenu.contains(event.target)) {
                menuItems.classList.remove('active');
                menuBtn.classList.remove('active');
            }
        });

        // Update menu links to include source page parameter
        const menuLinks = document.querySelectorAll('.menu-item');
        menuLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.includes('?')) {
                link.setAttribute('href', `${href}?from=home`);
            }
        });

        // Highlight current page
        const currentPath = window.location.pathname;
        const pageName = currentPath.split('/').pop().toLowerCase();
        
        menuLinks.forEach(link => {
            const linkHref = link.getAttribute('href').toLowerCase();
            if (linkHref.includes(pageName) || (pageName === '' && linkHref.includes('home.html'))) {
                link.classList.add('active');
            }
        });

        // Close menu on scroll
        let lastScrollTop = 0;
        window.addEventListener('scroll', () => {
            const st = window.pageYOffset || document.documentElement.scrollTop;
            if (Math.abs(lastScrollTop - st) > 50) {
                menuItems.classList.remove('active');
                menuBtn.classList.remove('active');
                lastScrollTop = st;
            }
        });
    }
}

// Handle auth state changes
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            // Check if user has completed profile setup
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (!userDoc.exists || !userDoc.data().profileCompleted) {
                console.log('Profile incomplete, redirecting to setup');
                window.location.href = 'setup-profile.html?from=home';
            } else {
                // User is authenticated and has completed profile
                console.log('User authenticated and profile complete');
                updateUserUI(user);
            }
        } catch (error) {
            console.error('Error checking profile:', error);
            window.location.href = 'setup-profile.html?from=home';
        }
    } else if (!user && !hasRedirected && fromPage !== 'auth') {
        // Only redirect to auth if we didn't come from there
        hasRedirected = true;
        console.log('No user signed in, redirecting to auth');
        window.location.href = '../Auth/auth.html?from=home';
    }
});

// Initialize UI Elements
initializeUI();