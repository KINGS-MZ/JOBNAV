// Profile Manager
const profileManager = {
    // DOM Elements
    elements: {
        profileImage: document.getElementById('profile-pic'),
        profileName: document.querySelector('.profile-name'),
        profileHeadline: document.querySelector('.profile-headline'),
        profileLocation: document.querySelector('.profile-location'),
        aboutSection: document.querySelector('.about-text'),
        educationSection: document.querySelector('.education-list'),
        skillsSection: document.getElementById('skills-container'),
        experienceSection: document.querySelector('.experience-list'),
        editProfileBtn: document.querySelector('.edit-profile-btn'),
        editPhotoBtn: document.querySelector('.edit-photo-btn'),
        addExperienceBtn: document.querySelector('[data-type="experience"]'),
        addSkillContainer: document.querySelector('.add-skill-container'),
        skillInput: document.getElementById('skill-input'),
        addSkillBtn: document.querySelector('.add-skill-btn'),
        navProfilePic: document.getElementById('nav-profile-pic')
    },

    isEditing: false,
    originalData: null,

    // Load and display user profile data
    async loadUserProfile() {
        try {
            const user = firebase.auth().currentUser;
            if (!user) {
                console.log('No user found, redirecting to login');
                window.location.href = '../Auth/auth.html';
                return;
            }

            console.log('Loading profile for user:', user.uid);
            const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                console.log('No user document found');
                return;
            }

            const userData = userDoc.data();
            console.log('User data:', userData);

            const { elements } = this;

            // Update profile images
            const photoURL = userData.photoURL || '../Images/default-avatar.png';
            if (elements.profileImage) {
                elements.profileImage.src = photoURL;
            }
            if (elements.navProfilePic) {
                elements.navProfilePic.src = photoURL;
            }

            // Update profile info
            if (elements.profileName) {
                elements.profileName.textContent = `${userData.firstName} ${userData.lastName}`;
            }
            if (elements.profileHeadline) {
                elements.profileHeadline.textContent = userData.headline || 'Add a headline';
            }
            if (elements.profileLocation) {
                elements.profileLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${userData.location || 'Add location'}`;
            }
            if (elements.aboutSection) {
                elements.aboutSection.textContent = userData.about || 'Tell us about yourself...';
            }

            // Update education section
            if (elements.educationSection) {
                if (userData.degree && userData.institution) {
                    elements.educationSection.innerHTML = `
                        <div class="education-item">
                            <h4>${userData.degree}</h4>
                            <p>${userData.institution}</p>
                            <p>${userData.educationStart || ''} - ${userData.educationEnd || ''}</p>
                        </div>
                    `;
                } else {
                    elements.educationSection.innerHTML = '<div class="education-item">Add your education</div>';
                }
            }

            // Update skills section
            if (elements.skillsSection) {
                if (userData.skills && userData.skills.length > 0) {
                    elements.skillsSection.innerHTML = userData.skills
                        .map(skill => `<span class="skill-tag">${skill}</span>`)
                        .join('');
                } else {
                    elements.skillsSection.innerHTML = '<p>Add your skills</p>';
                }
            }

            console.log('Profile loaded successfully');

        } catch (error) {
            console.error('Error loading profile:', error);
        }
    },

    // Toggle edit mode
    toggleEditMode() {
        const { elements } = this;
        this.isEditing = !this.isEditing;

        if (this.isEditing) {
            // Store original data
            this.originalData = {
                name: elements.profileName.textContent,
                headline: elements.profileHeadline.textContent,
                location: elements.profileLocation.textContent.replace(/^\s*\S+\s*/, ''),
                about: elements.aboutSection.textContent
            };

            // Make fields editable
            elements.profileName.contentEditable = true;
            elements.profileHeadline.contentEditable = true;
            elements.profileLocation.contentEditable = true;
            elements.aboutSection.contentEditable = true;

            // Add editing class
            elements.profileName.classList.add('editing');
            elements.profileHeadline.classList.add('editing');
            elements.profileLocation.classList.add('editing');
            elements.aboutSection.classList.add('editing');

            // Show edit buttons
            elements.editPhotoBtn.style.display = 'block';
            elements.addExperienceBtn.style.display = 'block';
            elements.addSkillContainer.style.display = 'block';

            // Change edit button to save/cancel
            elements.editProfileBtn.innerHTML = `
                <button class="save-profile-btn"><i class="fas fa-check"></i> Save</button>
                <button class="cancel-edit-btn"><i class="fas fa-times"></i> Cancel</button>
            `;
        } else {
            // Make fields non-editable
            elements.profileName.contentEditable = false;
            elements.profileHeadline.contentEditable = false;
            elements.profileLocation.contentEditable = false;
            elements.aboutSection.contentEditable = false;

            // Remove editing class
            elements.profileName.classList.remove('editing');
            elements.profileHeadline.classList.remove('editing');
            elements.profileLocation.classList.remove('editing');
            elements.aboutSection.classList.remove('editing');

            // Hide edit buttons
            elements.editPhotoBtn.style.display = 'none';
            elements.addExperienceBtn.style.display = 'none';
            elements.addSkillContainer.style.display = 'none';

            // Restore edit button
            elements.editProfileBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Profile';
        }
    },

    // Save profile changes
    async saveProfileChanges() {
        const { elements } = this;
        const user = firebase.auth().currentUser;

        if (!user) {
            console.error('No user found');
            return;
        }

        try {
            elements.editProfileBtn.disabled = true;
            console.log('Saving profile changes...');

            const updatedData = {
                firstName: elements.profileName.textContent.split(' ')[0],
                lastName: elements.profileName.textContent.split(' ')[1] || '',
                headline: elements.profileHeadline.textContent,
                about: elements.aboutSection.textContent,
                location: elements.profileLocation.textContent.replace(/^\s*\S+\s*/, ''),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Update Firestore and Auth
            await Promise.all([
                firebase.firestore().collection('users').doc(user.uid).update(updatedData),
                user.updateProfile({
                    displayName: `${updatedData.firstName} ${updatedData.lastName}`
                })
            ]);

            this.toggleEditMode();
            await this.loadUserProfile();

            elements.editProfileBtn.disabled = false;
            console.log('Profile updated successfully!');

        } catch (error) {
            console.error('Error saving profile:', error);
            elements.editProfileBtn.disabled = false;
        }
    },

    // Cancel editing
    cancelEditing() {
        const { elements } = this;
        
        if (this.originalData) {
            // Restore original data
            elements.profileName.textContent = this.originalData.name;
            elements.profileHeadline.textContent = this.originalData.headline;
            elements.aboutSection.textContent = this.originalData.about;
            elements.profileLocation.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${this.originalData.location}`;
        }

        this.toggleEditMode();
    },

    // Initialize profile manager
    async initialize() {
        try {
            // Wait for Firebase Auth to initialize
            await new Promise((resolve) => {
                const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                    unsubscribe();
                    resolve(user);
                });
            });

            // Load user profile
            await this.loadUserProfile();

            // Add event listeners for edit profile
            const { elements } = this;
            elements.editProfileBtn.addEventListener('click', (event) => {
                const target = event.target;
                if (target.classList.contains('save-profile-btn')) {
                    this.saveProfileChanges();
                } else if (target.classList.contains('cancel-edit-btn')) {
                    this.cancelEditing();
                } else {
                    this.toggleEditMode();
                }
            });

            // Initialize photo upload
            if (elements.editPhotoBtn) {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = 'image/*';
                fileInput.style.display = 'none';
                document.body.appendChild(fileInput);

                elements.editPhotoBtn.addEventListener('click', () => {
                    fileInput.click();
                });

                fileInput.addEventListener('change', async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        try {
                            // Upload to ImgBB
                            const formData = new FormData();
                            formData.append('image', file);
                            formData.append('key', 'e0a6fcfe00b70b788c6cf56e59297e2f');

                            const response = await fetch('https://api.imgbb.com/1/upload', {
                                method: 'POST',
                                body: formData
                            });

                            const result = await response.json();
                            if (!response.ok || !result.data?.url) {
                                throw new Error('Upload failed');
                            }

                            const photoURL = result.data.url;

                            // Update profile
                            const user = firebase.auth().currentUser;
                            await Promise.all([
                                firebase.firestore().collection('users').doc(user.uid).update({
                                    photoURL: photoURL
                                }),
                                user.updateProfile({
                                    photoURL: photoURL
                                })
                            ]);

                            // Update UI
                            elements.profileImage.src = photoURL;
                            elements.navProfilePic.src = photoURL;

                        } catch (error) {
                            console.error('Error uploading photo:', error);
                            alert('Error uploading photo. Please try again.');
                        }
                    }
                });
            }

        } catch (error) {
            console.error('Error initializing profile:', error);
        }
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing profile manager...');
    profileManager.initialize();
});
