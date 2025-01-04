// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

// Set persistence to LOCAL (survives browser restart)
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log('Persistence set to LOCAL');
    })
    .catch((error) => {
        console.error('Error setting persistence:', error);
    });

// Function to show toast and redirect
function showToastAndRedirect(user) {
    const overlay = document.querySelector('.toast-overlay');
    const toast = document.querySelector('.toast-notification');
    const userInfo = document.querySelector('.toast-user');
    
    if (overlay && toast && userInfo) {
        // Update user info in toast
        userInfo.textContent = `Signed in as ${user.email}`;
        
        // Show overlay and toast
        overlay.style.display = 'block';
        toast.style.display = 'block';
        
        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = '../Pages/setup-profile.html?from=auth';
        }, 2000);
    } else {
        // If toast elements not found, redirect immediately
        window.location.href = '../Pages/setup-profile.html?from=auth';
    }
}

// Keep track of redirections
let hasRedirected = false;

// Check if user is already signed in
auth.onAuthStateChanged(async (user) => {
    console.log('Auth state changed:', user ? 'User is signed in' : 'User is signed out');
    
    if (user) {
        // Save user data to localStorage
        localStorage.setItem('user', JSON.stringify({
            email: user.email,
            displayName: user.displayName,
            uid: user.uid
        }));

        // Only redirect if we're on the auth page
        if (!hasRedirected && window.location.pathname.includes('auth.html')) {
            hasRedirected = true;
            console.log('User is signed in:', user.email);

            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists && userDoc.data().profileCompleted) {
                    console.log('Profile complete, redirecting to home');
                    window.location.href = '../Pages/Home.html?from=auth';
                } else {
                    console.log('Profile incomplete, redirecting to setup');
                    window.location.href = '../Pages/setup-profile.html?from=auth';
                }
            } catch (error) {
                console.error('Error checking profile:', error);
                window.location.href = '../Pages/setup-profile.html?from=auth';
            }
        }
    } else {
        // User is signed out
        console.log('User is signed out');
        localStorage.removeItem('user');
        hasRedirected = false;
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const signInForm = document.querySelector('.sign-in-form');
    const signUpForm = document.querySelector('.sign-up-form');
    const switchFormLinks = document.querySelectorAll('.switch-form-link');
    const welcomeTitle = document.querySelector('.welcome-content h1');
    const welcomeText = document.querySelector('.welcome-content p');

    // Check URL parameters for action
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    if (action === 'signup') {
        signInForm.classList.remove('active-form');
        signUpForm.classList.add('active-form');
        welcomeTitle.textContent = 'Join Our Community!';
        welcomeText.textContent = 'Create an account to unlock personalized job recommendations and start your career journey.';
    }

    // Form switch functionality
    switchFormLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            signInForm.classList.toggle('active-form');
            signUpForm.classList.toggle('active-form');
            
            // Update welcome text based on active form
            if (signUpForm.classList.contains('active-form')) {
                welcomeTitle.textContent = 'Join Our Community!';
                welcomeText.textContent = 'Create an account to unlock personalized job recommendations and start your career journey.';
            } else {
                welcomeTitle.textContent = 'Welcome Back!';
                welcomeText.textContent = 'Your journey to the perfect job starts here. Sign in to access personalized job recommendations and track your applications.';
            }
        });
    });

    // Sign In Form Submission
    document.getElementById('signInForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signInEmail').value;
        const password = document.getElementById('signInPassword').value;
        const rememberMe = document.querySelector('.remember-me input[type="checkbox"]').checked;

        try {
            // Set persistence based on remember me checkbox
            await auth.setPersistence(
                rememberMe 
                    ? firebase.auth.Auth.Persistence.LOCAL  // Persists even after browser restart
                    : firebase.auth.Auth.Persistence.SESSION // Until browser is closed
            );

            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            console.log('Signed in successfully!');
            // Redirect happens automatically via onAuthStateChanged
        } catch (error) {
            showError(error.message);
        }
    });

    // Sign Up Form Submission
    document.getElementById('signUpForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signUpEmail').value;
        const password = document.getElementById('signUpPassword').value;
        const confirmPassword = document.getElementById('signUpConfirmPassword').value;
        const fullName = document.getElementById('signUpName').value;

        // Validate passwords match
        if (password !== confirmPassword) {
            showError('Passwords do not match');
            return;
        }

        // Validate password strength
        if (password.length < 6) {
            showError('Password should be at least 6 characters long');
            return;
        }

        try {
            // Create user
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Update profile with full name
            await user.updateProfile({
                displayName: fullName
            });

            // Initialize Firestore document for user
            await db.collection('users').doc(user.uid).set({
                email: email,
                displayName: fullName,
                uid: user.uid,
                profileCompleted: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            console.log('Account created successfully!');
            showToastAndRedirect(user);
        } catch (error) {
            showError(error.message);
        }
    });

    // Google Sign In
    const googleBtn = document.querySelector('.google-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            try {
                const result = await auth.signInWithPopup(provider);
                const user = result.user;
                
                // Check if this is a new user
                const userDoc = await db.collection('users').doc(user.uid).get();
                
                if (!userDoc.exists) {
                    // Initialize Firestore document for new Google user
                    await db.collection('users').doc(user.uid).set({
                        email: user.email,
                        displayName: user.displayName,
                        uid: user.uid,
                        profileCompleted: false,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    showToastAndRedirect(user);
                } else if (!userDoc.data().profileCompleted) {
                    window.location.href = '../Pages/setup-profile.html?from=auth';
                } else {
                    window.location.href = '../Pages/Home.html?from=auth';
                }
            } catch (error) {
                showError(error.message);
            }
        });
    }

    // Microsoft Sign In
    const microsoftBtn = document.querySelector('.microsoft-btn');
    if (microsoftBtn) {
        microsoftBtn.addEventListener('click', async () => {
            const provider = new firebase.auth.OAuthProvider('microsoft.com');
            try {
                await auth.signInWithPopup(provider);
                // Redirect happens automatically via onAuthStateChanged
            } catch (error) {
                showError(error.message);
            }
        });
    }

    // Error handling
    function showError(message) {
        // Create error element if it doesn't exist
        let errorDiv = document.querySelector('.auth-error');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'auth-error';
            const activeForm = document.querySelector('.active-form');
            activeForm.insertBefore(errorDiv, activeForm.querySelector('button'));
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';

        // Hide error after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    // Floating Menu
    const floatingMenu = document.querySelector('.floating-menu');
    const mainBtn = floatingMenu.querySelector('.main-btn');
    const menuItems = floatingMenu.querySelector('.menu-items');
    const floatingThemeToggle = document.getElementById('floating-theme-toggle');

    mainBtn.addEventListener('click', () => {
        menuItems.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!floatingMenu.contains(e.target)) {
            menuItems.classList.remove('active');
        }
    });

    // Theme toggle functionality for floating menu
    floatingThemeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const icon = floatingThemeToggle.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
        menuItems.classList.remove('active');
    });
});
