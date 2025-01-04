// Initialize Firebase Auth and Firestore
const auth = firebase.auth();
const db = firebase.firestore();

window.authGuard = {
    // Check if user is authenticated
    requireAuth: async (fromPage) => {
        return new Promise((resolve) => {
            auth.onAuthStateChanged(async (user) => {
                if (!user && fromPage !== 'auth') {
                    // Redirect to auth if not authenticated
                    window.location.href = '../Auth/auth.html?from=profile';
                    resolve(null);
                } else {
                    resolve(user);
                }
            });
        });
    },

    // Check if user has completed profile setup
    checkProfile: async (user) => {
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            return userDoc.exists && userDoc.data().profileCompleted;
        } catch (error) {
            console.error('Error checking profile:', error);
            return false;
        }
    },

    // Get user profile data
    getUserProfile: async (user) => {
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            return userDoc.exists ? userDoc.data() : null;
        } catch (error) {
            console.error('Error getting profile:', error);
            return null;
        }
    }
};
