// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBxAoXoqZDHMDxj6mgB9WKm3F8GZZRdXBM",
    authDomain: "job-navigator-e3f4d.firebaseapp.com",
    projectId: "job-navigator-e3f4d",
    storageBucket: "job-navigator-e3f4d.appspot.com",
    messagingSenderId: "1080465769723",
    appId: "1:1080465769723:web:5e0e4f9c5a0a5a0a0a0a0a"
};

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

// Initialize UI Elements
initializeUI();

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
                updateUserUI(user, userDoc.data());
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

// Update user-specific UI elements
function updateUserUI(user, userData) {
    const userBtn = document.querySelector('.user-btn');
    if (userData.photoURL) {
        userBtn.innerHTML = `
            <img src="${userData.photoURL}" alt="Profile" class="user-avatar">
            <i class="fas fa-chevron-down"></i>
        `;
    }
}

// Initialize all UI elements and event listeners
function initializeUI() {
    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    const body = document.body;

    function applyTheme(isDark) {
        if (isDark) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }

    // Initialize theme
    const isDark = localStorage.getItem('darkMode') === 'true';
    applyTheme(isDark);

    // Theme toggle click handler
    themeToggle.addEventListener('click', () => {
        const isDark = !body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        applyTheme(isDark);
    });

    // User Menu
    const userMenuBtn = document.getElementById('user-menu-btn');
    const userDropdown = document.getElementById('user-dropdown');

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', () => {
            userDropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (event) => {
            if (!userMenuBtn.contains(event.target) && !userDropdown.contains(event.target)) {
                userDropdown.classList.remove('active');
            }
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
        const jobQuery = jobSearch.value.trim();
        const locationQuery = locationSearch.value.trim();
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
        menuBtn.addEventListener('click', () => {
            menuItems.classList.toggle('active');
            menuBtn.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.floating-menu')) {
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
            if (linkHref.includes(pageName) || (pageName === '' && linkHref.includes('Home.html'))) {
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

    // Sign out handler
    const signOutLink = document.querySelector('.logout-link');
    if (signOutLink) {
        signOutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await auth.signOut();
                window.location.href = '../Auth/auth.html?from=home';
            } catch (error) {
                console.error('Error signing out:', error);
            }
        });
    }
}