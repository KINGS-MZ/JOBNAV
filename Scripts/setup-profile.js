// Initialize Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// DOM Elements
const setupProfileForm = document.getElementById('setupProfileForm');
const profilePicPreview = document.getElementById('profilePicPreview');
const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
const skillInput = document.getElementById('skillInput');
const addSkillBtn = document.getElementById('addSkillBtn');
const skillsTags = document.getElementById('skillsTags');

let selectedFile = null;
const skills = new Set();

// Check Authentication State
auth.onAuthStateChanged(async (user) => {
    if (!user) {
        // Redirect to auth page if not signed in
        window.location.href = '../Auth/auth.html?from=setup-profile';
        return;
    }

    // Check if profile is already completed
    const userDoc = await db.collection('users').doc(user.uid).get();
    if (userDoc.exists && userDoc.data().profileCompleted) {
        // Redirect to home if profile is already set up
        window.location.href = 'Home.html';
        return;
    }

    // Load existing profile data if any
    if (userDoc.exists) {
        const userData = userDoc.data();
        populateForm(userData);
    }
});

// Populate form with existing data
function populateForm(userData) {
    if (userData.photoURL) {
        profilePicPreview.src = userData.photoURL;
    }
    if (userData.firstName) document.getElementById('firstName').value = userData.firstName;
    if (userData.lastName) document.getElementById('lastName').value = userData.lastName;
    if (userData.headline) document.getElementById('headline').value = userData.headline;
    if (userData.location) document.getElementById('location').value = userData.location;
    if (userData.about) document.getElementById('about').value = userData.about;
    if (userData.degree) document.getElementById('degree').value = userData.degree;
    if (userData.institution) document.getElementById('institution').value = userData.institution;
    if (userData.educationStart) document.getElementById('educationStart').value = userData.educationStart;
    if (userData.educationEnd) document.getElementById('educationEnd').value = userData.educationEnd;
    if (userData.skills) {
        userData.skills.forEach(skill => addSkill(skill));
    }
}

// Handle profile photo upload
uploadPhotoBtn.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        selectedFile = e.target.files[0];
        if (selectedFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePicPreview.src = e.target.result;
            };
            reader.readAsDataURL(selectedFile);
        }
    };
    input.click();
});

// Handle skills
addSkillBtn.addEventListener('click', () => {
    const skill = skillInput.value.trim();
    if (skill) {
        addSkill(skill);
        skillInput.value = '';
    }
});

skillInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        addSkillBtn.click();
    }
});

function addSkill(skill) {
    if (skills.has(skill)) return;
    
    skills.add(skill);
    const tag = document.createElement('div');
    tag.className = 'skill-tag';
    tag.innerHTML = `
        ${skill}
        <button type="button" class="remove-skill">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    tag.querySelector('.remove-skill').addEventListener('click', () => {
        skills.delete(skill);
        tag.remove();
    });
    
    skillsTags.appendChild(tag);
}

// Upload photo to ImgBB
async function uploadPhoto(file) {
    try {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('key', 'e0a6fcfe00b70b788c6cf56e59297e2f'); // ImgBB API key

        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        if (!response.ok || !result.data || !result.data.url) {
            throw new Error(`ImgBB upload failed: ${result.error?.message || 'Unknown error'}`);
        }

        return result.data.url;
    } catch (error) {
        console.error('Error uploading to ImgBB:', error);
        throw error;
    }
}

// Handle form submission
setupProfileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    
    try {
        const submitBtn = setupProfileForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Setting up...';

        const user = auth.currentUser;
        if (!user) throw new Error('No user signed in');

        let photoURL = user.photoURL;
        
        // Upload profile photo if selected
        if (selectedFile) {
            try {
                photoURL = await uploadPhoto(selectedFile);
            } catch (error) {
                console.error('Error uploading photo:', error);
                alert('Error uploading photo. Profile will be saved without the new photo.');
            }
        }

        // Prepare user data
        const userData = {
            firstName: document.getElementById('firstName').value,
            lastName: document.getElementById('lastName').value,
            headline: document.getElementById('headline').value,
            location: document.getElementById('location').value,
            about: document.getElementById('about').value,
            degree: document.getElementById('degree').value,
            institution: document.getElementById('institution').value,
            educationStart: document.getElementById('educationStart').value,
            educationEnd: document.getElementById('educationEnd').value,
            skills: Array.from(skills),
            photoURL: photoURL,
            profileCompleted: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Update user profile
        await Promise.all([
            user.updateProfile({
                displayName: `${userData.firstName} ${userData.lastName}`,
                photoURL: photoURL
            }),
            db.collection('users').doc(user.uid).set(userData, { merge: true })
        ]);

        // Redirect to home page
        window.location.href = 'Home.html?from=setup-profile';
        
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Error saving profile. Please try again.');
        const submitBtn = setupProfileForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Complete Setup';
    }
});
