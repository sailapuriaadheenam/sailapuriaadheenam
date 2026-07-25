const SUPABASE_URL = 'https://dgbudgjxejavmiilxpfc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnYnVkZ2p4ZWphdm1paWx4cGZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNjg3ODAsImV4cCI6MjA5OTc0NDc4MH0.DQDzbldnX79uIKxtM2oSFmj50JLhYvJ9lpQrmdWAGw8';
let supabaseClient;
try {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
    console.error("Failed to initialize Supabase client:", e);
}
document.addEventListener('DOMContentLoaded', async () => {
    // Admin Panel Auth Protection
    if (document.body.classList.contains('admin-body') && !document.getElementById('adminLoginForm')) {
        const urlParams = new URLSearchParams(window.location.search);
        const authParam = urlParams.get('auth');
        
        if (authParam === 'success') {
            sessionStorage.setItem('isAdminLoggedIn', 'true');
        }
        
        const isAdmin = sessionStorage.getItem('isAdminLoggedIn');
        if (isAdmin !== 'true') {
            window.location.href = 'admin-login.html';
        }
    }

    // 1. Navigation Scroll Effect
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                header.style.background = 'rgba(18, 18, 18, 0.95)';
                header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.5)';
            } else {
                header.style.background = 'rgba(18, 18, 18, 0.8)';
                header.style.boxShadow = 'none';
            }
        });
    }

    // 2. Mobile Menu Toggle
    const menuBtn = document.querySelector('.menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (menuBtn && navLinks) {
        menuBtn.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            navLinks.style.flexDirection = 'column';
            navLinks.style.position = 'absolute';
            navLinks.style.top = '100%';
            navLinks.style.left = '0';
            navLinks.style.width = '100%';
            navLinks.style.background = 'rgba(18, 18, 18, 0.95)';
            navLinks.style.padding = '20px';
        });
    }

    // 3. Admin Panel Tab Switching
    const adminNavLinks = document.querySelectorAll('.admin-nav a');
    const adminSections = document.querySelectorAll('.admin-section');
    if (adminNavLinks.length > 0 && adminSections.length > 0) {
        adminNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                if (targetId && targetId.startsWith('#') && targetId.length > 1) {
                    e.preventDefault();
                    
                    // Remove active from all links
                    adminNavLinks.forEach(l => l.classList.remove('active'));
                    // Add active to clicked link
                    link.classList.add('active');
                    
                    // Hide all sections
                    adminSections.forEach(sec => sec.style.display = 'none');
                    // Show target section
                    const targetSection = document.querySelector(targetId);
                    if (targetSection) targetSection.style.display = 'block';
                    
                    // Update header title dynamically
                    const adminHeaderTitle = document.querySelector('.admin-header h2');
                    if (adminHeaderTitle) {
                        if (targetId === '#dashboard-section') {
                            adminHeaderTitle.textContent = 'Dashboard Overview';
                        } else if (targetId === '#content-management') {
                            adminHeaderTitle.textContent = 'Website Content Management';
                        } else if (targetId === '#pooja-bookings') {
                            adminHeaderTitle.textContent = 'Recent Pooja Bookings';
                        } else if (targetId === '#donations-section') {
                            adminHeaderTitle.textContent = 'Recent Donations';
                        }
                    }
                }
            });
        });
    }

    // 4. Booking Form logic
    const poojaForm = document.getElementById('bookingForm');
    if (poojaForm) {
        poojaForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sessionStorage.setItem('paymentType', 'pooja');
            sessionStorage.setItem('bookingName', document.getElementById('bookingName').value);
            sessionStorage.setItem('bookingMobile', document.getElementById('bookingMobile').value);
            sessionStorage.setItem('bookingNakshatra', document.getElementById('bookingNakshatra').value);
            sessionStorage.setItem('bookingGothram', document.getElementById('bookingGothram').value);
            
            const poojaSelect = document.getElementById('poojaType');
            const poojaName = poojaSelect.options[poojaSelect.selectedIndex].text;
            sessionStorage.setItem('poojaType', poojaName);
            sessionStorage.setItem('poojaAmount', document.getElementById('amount').value);
            
            window.location.href = 'payment.html';
        });
    }

    const donationForm = document.getElementById('donationForm');
    if (donationForm) {
        donationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            sessionStorage.setItem('paymentType', 'donation');
            sessionStorage.setItem('donationAmount', document.getElementById('donationAmount').value);
            sessionStorage.setItem('donationName', document.getElementById('donationName').value);
            sessionStorage.setItem('donationPan', document.getElementById('donationPan').value);
            window.location.href = 'payment.html';
        });
    }

    // 5. Payment Flow (Manual)
    const paymentSimulator = document.getElementById('paymentSimulator');
    if (paymentSimulator) {
        const manualForm = document.getElementById('manualPaymentForm');
        if (manualForm) {
            manualForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const transactionId = document.getElementById('transactionId').value.trim();
                if (!transactionId) return;

                document.getElementById('paymentOptions').style.display = 'none';
                let loadingEl = document.getElementById('paymentLoading');
                if (loadingEl) loadingEl.style.display = 'block';

                const paymentType = sessionStorage.getItem('paymentType');

                if (paymentType === 'pooja') {
                    if (!supabaseClient) {
                        alert("Database is currently unreachable. Please try again later.");
                        return;
                    }
                    try {
                        const { data, error } = await supabaseClient
                            .from('pooja_bookings')
                            .insert([{ 
                                transaction_id: transactionId,
                                name: sessionStorage.getItem('bookingName'),
                                mobile: sessionStorage.getItem('bookingMobile'),
                                nakshatra: sessionStorage.getItem('bookingNakshatra'),
                                gothram: sessionStorage.getItem('bookingGothram'),
                                pooja_name: sessionStorage.getItem('poojaType'),
                                amount: parseFloat(sessionStorage.getItem('poojaAmount') || '0'),
                                status: 'Pending'
                            }])
                            .select();
                        
                        if (!error && data && data.length > 0) {
                            localStorage.setItem('booking_id', data[0].id);
                            alert('✅ Payment Reference Submitted Successfully!\nYour booking is now PENDING Admin Approval.\nRedirecting to Live Darshan page...');
                            window.location.href = 'live-darshan.html?booking_id=' + data[0].id;
                        } else {
                            alert('Error submitting payment details: ' + (error ? error.message : 'Unknown error'));
                            window.location.reload();
                        }
                    } catch (e) {
                        alert('Network Error submitting payment details. Please try again.');
                        window.location.reload();
                    }
                } else {
                    if (!supabaseClient) {
                        alert("Database is currently unreachable. Please try again later.");
                        return;
                    }
                    try {
                        const { data, error } = await supabaseClient
                            .from('donations')
                            .insert([{
                                transaction_id: transactionId,
                                donor_name: sessionStorage.getItem('donationName'),
                                amount: parseFloat(sessionStorage.getItem('donationAmount') || '0'),
                                pan_number: sessionStorage.getItem('donationPan'),
                                status: 'Pending'
                            }])
                            .select();
                        
                        if (!error) {
                            alert('Donation Details Submitted! Thank you for supporting our Dharma Seva.');
                            window.location.href = 'index.html';
                        } else {
                            alert('Error submitting donation details: ' + (error ? error.message : 'Unknown error'));
                            window.location.reload();
                        }
                    } catch (e) {
                        alert('Network Error submitting donation. Please try again.');
                        window.location.reload();
                    }
                }
            });
        }
    }

    // 6. Live Darshan Access Logic (Admin Approval Check)
    const liveDarshanContainer = document.getElementById('liveDarshanContainer');
    if (liveDarshanContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const bookingId = urlParams.get('booking_id') || localStorage.getItem('booking_id');
        const lockedOverlay = document.getElementById('lockedOverlay');
        const lockContentUnbooked = document.getElementById('lockContentUnbooked');
        const lockContentPending = document.getElementById('lockContentPending');
        const approvalStatusBanner = document.getElementById('approvalStatusBanner');
        const pendingTxnId = document.getElementById('pendingTxnId');
        const recheckStatusBtn = document.getElementById('recheckStatusBtn');

        const verifyBookingAccess = async () => {
            if (!bookingId) {
                if (lockedOverlay) lockedOverlay.style.display = 'flex';
                if (lockContentUnbooked) lockContentUnbooked.style.display = 'block';
                if (lockContentPending) lockContentPending.style.display = 'none';
                if (approvalStatusBanner) approvalStatusBanner.style.display = 'none';
                return;
            }

            if (!supabaseClient) {
                if (lockedOverlay) lockedOverlay.style.display = 'flex';
                return;
            }

            try {
                const { data, error } = await supabaseClient
                    .from('pooja_bookings')
                    .select('*')
                    .eq('id', bookingId);
                    
                if (data && data.length > 0) {
                    const booking = data[0];
                    const status = (booking.status || 'Pending').toLowerCase();
                    
                    if (status === 'approved' || status === 'confirmed') {
                        // Unlocked! Admin has approved
                        if (lockedOverlay) lockedOverlay.style.display = 'none';
                        if (approvalStatusBanner) {
                            approvalStatusBanner.style.display = 'block';
                            approvalStatusBanner.innerHTML = `✅ Booking Approved for <strong>${booking.name || 'Devotee'}</strong>! Welcome to Sailapuri Aadheenam Live Darshan.`;
                        }
                    } else if (status === 'pending') {
                        // Pending Admin Approval
                        if (lockedOverlay) lockedOverlay.style.display = 'flex';
                        if (lockContentUnbooked) lockContentUnbooked.style.display = 'none';
                        if (lockContentPending) lockContentPending.style.display = 'block';
                        if (approvalStatusBanner) approvalStatusBanner.style.display = 'none';
                        if (pendingTxnId) pendingTxnId.innerHTML = `Transaction ID: <strong style="color:var(--gold-primary);">${booking.transaction_id || 'N/A'}</strong>`;
                    } else {
                        // Rejected
                        if (lockedOverlay) lockedOverlay.style.display = 'flex';
                        if (lockContentUnbooked) lockContentUnbooked.style.display = 'block';
                        if (lockContentPending) lockContentPending.style.display = 'none';
                        if (approvalStatusBanner) approvalStatusBanner.style.display = 'none';
                    }
                } else {
                    if (lockedOverlay) lockedOverlay.style.display = 'flex';
                    if (lockContentUnbooked) lockContentUnbooked.style.display = 'block';
                    if (lockContentPending) lockContentPending.style.display = 'none';
                    localStorage.removeItem('booking_id');
                }
            } catch (e) {
                if (lockedOverlay) lockedOverlay.style.display = 'flex';
            }
        };

        if (recheckStatusBtn) {
            recheckStatusBtn.addEventListener('click', async () => {
                recheckStatusBtn.textContent = '🔄 Re-checking Status...';
                await verifyBookingAccess();
                setTimeout(() => {
                    recheckStatusBtn.textContent = '🔄 Check Approval Status';
                }, 800);
            });
        }

        await verifyBookingAccess();
    }

    // Admin Login
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const pass = document.getElementById('adminPassword').value;
            
            if (!supabaseClient) {
                alert("Database disconnected. Please check your internet connection.");
                return;
            }
            
            try {
                const { data, error } = await supabaseClient
                    .from('admin_users')
                    .select('*')
                    .eq('password', pass);

                if (error) {
                    alert("Database Error: " + error.message);
                    return;
                }

                if (data && data.length > 0) {
                    sessionStorage.setItem('isAdminLoggedIn', 'true');
                    alert("Login Success! Redirecting to Admin Panel...");
                    window.location.href = 'admin.html?auth=success';
                } else {
                    document.getElementById('loginError').style.display = 'block';
                }
            } catch (err) {
                alert("Critical Error: " + err.message);
            }
        });
    }

    // Admin Logout
    const logoutBtn = document.getElementById('adminLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('isAdminLoggedIn');
            window.location.href = 'index.html';
        });
    }

    // 7. CMS Engine - Load dynamic content from Supabase
    let cmsSettings = {};
    const loadDynamicContent = async () => {
        try {
            // First load from local cache if available for instant rendering
            const cachedSettings = localStorage.getItem('local_cms_settings');
            if (cachedSettings) {
                try {
                    const parsed = JSON.parse(cachedSettings);
                    if (Array.isArray(parsed)) {
                        parsed.forEach(item => {
                            cmsSettings[item.setting_key] = item.setting_value;
                        });
                    }
                } catch(e) {}
            }

            // Fetch live settings from Supabase Database
            if (supabaseClient) {
                const { data, error } = await supabaseClient.from('cms_settings').select('*');
                if (!error && data && data.length > 0) {
                    data.forEach(item => {
                        cmsSettings[item.setting_key] = item.setting_value;
                    });
                    localStorage.setItem('local_cms_settings', JSON.stringify(data));
                }
            }
        
            const updateEl = (id, val, isImg = false) => {
                const el = document.getElementById(id);
                if (el && val) {
                    if (isImg) el.src = val;
                    else el.textContent = val;
                }
            };

            updateEl('dyn-hero-title', cmsSettings['cms_hero_title']);
            updateEl('dyn-hero-subtitle', cmsSettings['cms_hero_subtitle']);
            
            if (cmsSettings['cms_hero_bg']) {
                const bodyEl = document.body;
                if (!bodyEl.classList.contains('admin-body') && document.querySelector('.hero')) {
                    bodyEl.style.backgroundImage = `linear-gradient(rgba(18, 18, 18, 0.85), rgba(18, 18, 18, 0.85)), url('${cmsSettings['cms_hero_bg']}')`;
                }
            }

            updateEl('dyn-spiritual-img', cmsSettings['cms_spiritual_img'], true);
            
            updateEl('dyn-bank-name', cmsSettings['cms_bank_name']);
            updateEl('dyn-bank-name-don', cmsSettings['cms_bank_name']);
            updateEl('dyn-acc-name', cmsSettings['cms_acc_name']);
            updateEl('dyn-acc-name-don', cmsSettings['cms_acc_name']);
            updateEl('dyn-acc-number', cmsSettings['cms_acc_number']);
            updateEl('dyn-acc-number-don', cmsSettings['cms_acc_number']);
            updateEl('dyn-ifsc', cmsSettings['cms_ifsc']);
            updateEl('dyn-ifsc-don', cmsSettings['cms_ifsc']);
            updateEl('dyn-qr-code', cmsSettings['cms_qr_code'], true);

        // Helper functions for video embedding (Google Drive, YouTube, Direct files)
        const getGoogleDriveEmbedUrl = (url) => {
            if (!url) return null;
            if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
                let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                if (match && match[1]) {
                    return `https://drive.google.com/file/d/${match[1]}/preview`;
                }
                match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                if (match && match[1]) {
                    return `https://drive.google.com/file/d/${match[1]}/preview`;
                }
            }
            return null;
        };

        const getYouTubeEmbedUrl = (url) => {
            if (!url) return null;
            const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(live\/)|(watch\?))\??v?=?([^#&?]*).*/;
            const match = url.match(regExp);
            let videoId = (match && match[8] && match[8].length === 11) ? match[8] : null;
            if (videoId) {
                return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
            }
            return null;
        };

        // Youtube & Video Player logic
        const darshanMode = cmsSettings['cms_darshan_mode'] || 'live';
        const darshanLiveBadge = document.getElementById('darshanLiveBadge');
        const liveVideoEl = document.getElementById('darshanVideo');
        const videoPlayerEl = document.getElementById('darshanVideoPlayer');
        const youtubeLinkContainer = document.getElementById('youtubeLinkContainer');

        if (darshanLiveBadge) {
            if (darshanMode === 'video') {
                darshanLiveBadge.textContent = '🎥 RECORDED TEMPLE DARSHAN';
                darshanLiveBadge.style.color = '#d4af37';
            } else {
                darshanLiveBadge.textContent = '🔴 LIVE TEMPLE DARSHAN';
                darshanLiveBadge.style.color = '#ff4d4d';
            }
        }

        if (darshanMode === 'video') {
            const rawVideoUrl = cmsSettings['cms_video_url'] || '';
            const gDriveEmbed = getGoogleDriveEmbedUrl(rawVideoUrl);
            const ytEmbed = getYouTubeEmbedUrl(rawVideoUrl);

            if (gDriveEmbed || ytEmbed) {
                const embedUrl = gDriveEmbed || ytEmbed;
                if (liveVideoEl) {
                    liveVideoEl.src = embedUrl;
                    liveVideoEl.style.display = 'block';
                }
                if (videoPlayerEl) videoPlayerEl.style.display = 'none';
                if (youtubeLinkContainer) youtubeLinkContainer.style.display = 'none';
            } else {
                if (videoPlayerEl) {
                    videoPlayerEl.style.display = 'block';
                    if (rawVideoUrl) videoPlayerEl.src = rawVideoUrl;
                }
                if (liveVideoEl) liveVideoEl.style.display = 'none';
                if (youtubeLinkContainer) youtubeLinkContainer.style.display = 'none';
            }
        } else {
            if (videoPlayerEl) videoPlayerEl.style.display = 'none';
            if (liveVideoEl) liveVideoEl.style.display = 'block';
            if (youtubeLinkContainer) youtubeLinkContainer.style.display = 'block';

            if (liveVideoEl && cmsSettings['cms_live_url']) {
                let finalUrl = cmsSettings['cms_live_url'];
                try {
                    let urlToParse = finalUrl;
                    if (urlToParse.includes('<iframe') && urlToParse.includes('src=')) {
                        const srcMatch = urlToParse.match(/src="([^"]+)"/);
                        if (srcMatch && srcMatch[1]) urlToParse = srcMatch[1];
                    }
                    const ytEmbed = getYouTubeEmbedUrl(urlToParse);
                    if (ytEmbed) {
                        finalUrl = ytEmbed;
                        const match = urlToParse.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(live\/)|(watch\?))\??v?=?([^#&?]*).*/);
                        if (match && match[8]) {
                            const directLinkEl = document.getElementById('directYoutubeLink');
                            if (directLinkEl) directLinkEl.href = `https://www.youtube.com/watch?v=${match[8]}`;
                        }
                    } else if (urlToParse.startsWith('http')) {
                        finalUrl = urlToParse;
                        const directLinkEl = document.getElementById('directYoutubeLink');
                        if (directLinkEl) directLinkEl.href = urlToParse;
                    }
                } catch(e) {}
                liveVideoEl.src = finalUrl;
            }
        }

        // Lists
        const updateList = (id, key) => {
            const el = document.getElementById(id);
            if (el && cmsSettings[key]) {
                el.innerHTML = '';
                cmsSettings[key].split('\n').forEach(line => {
                    const parts = line.split('|');
                    if (parts.length === 2) {
                        el.innerHTML += `<li><span>${parts[0].trim()}</span> <span>${parts[1].trim()}</span></li>`;
                    }
                });
            }
        };
        updateList('dyn-pooja-timings', 'cms_pooja_timings');
        updateList('dyn-upcoming-festivals', 'cms_upcoming_festivals');

        const elSevas = document.getElementById('dyn-sevas-services');
        if (elSevas && cmsSettings['cms_sevas_services']) {
            elSevas.innerHTML = '';
            cmsSettings['cms_sevas_services'].split(',').forEach(item => {
                if (item.trim()) elSevas.innerHTML += `<div class="btn btn-gold" style="padding: 10px; font-size: 0.8rem;">${item.trim()}</div>`;
            });
        }
        
        // Update Pooja Booking Amount on booking page
        const bookingAmtInput = document.getElementById('amount');
        if (bookingAmtInput && cmsSettings['cms_pooja_amount']) {
            bookingAmtInput.value = cmsSettings['cms_pooja_amount'];
        }
        
        return cmsSettings;
        } catch (e) {
            console.error("Error loading dynamic content:", e);
        }
    };

    await loadDynamicContent();

    // 8. Admin Panel Form
    const adminForm = document.getElementById('adminContentForm');
    if (adminForm) {
        // Setup image uploads for base64
        const setupImageUpload = (inputId, previewId) => {
            const fileInput = document.getElementById(inputId);
            const previewImg = document.getElementById(previewId);
            if (fileInput && previewImg) {
                fileInput.addEventListener('change', function() {
                    const file = this.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = function(e) {
                            previewImg.src = e.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
        };

        setupImageUpload('cms-hero-bg', 'preview-hero-bg');
        setupImageUpload('cms-spiritual-img', 'preview-spiritual-img');
        setupImageUpload('cms-qr-code', 'preview-qr-code');

        // Setup Video file upload & URL preview with Google Drive / YouTube / MP4 support
        const videoFileInput = document.getElementById('cms-video-file');
        const videoUrlInput = document.getElementById('cms-video-url');

        const getGoogleDriveEmbedUrl = (url) => {
            if (!url) return null;
            if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
                let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                if (match && match[1]) {
                    return `https://drive.google.com/file/d/${match[1]}/preview`;
                }
                match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
                if (match && match[1]) {
                    return `https://drive.google.com/file/d/${match[1]}/preview`;
                }
            }
            return null;
        };

        const getYouTubeEmbedUrl = (url) => {
            if (!url) return null;
            const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(live\/)|(watch\?))\??v?=?([^#&?]*).*/;
            const match = url.match(regExp);
            let videoId = (match && match[8] && match[8].length === 11) ? match[8] : null;
            if (videoId) {
                return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
            }
            return null;
        };

        const updateVideoPreview = (url) => {
            const previewIframe = document.getElementById('preview-iframe');
            const previewVideo = document.getElementById('preview-video');
            if (!previewIframe || !previewVideo) return;

            const gDriveEmbed = getGoogleDriveEmbedUrl(url);
            const ytEmbed = getYouTubeEmbedUrl(url);

            if (gDriveEmbed || ytEmbed) {
                previewIframe.src = gDriveEmbed || ytEmbed;
                previewIframe.style.display = 'block';
                previewVideo.style.display = 'none';
            } else if (url && url.trim().length > 5) {
                previewVideo.src = url;
                previewVideo.style.display = 'block';
                previewIframe.style.display = 'none';
            } else {
                previewIframe.style.display = 'none';
                previewVideo.style.display = 'none';
            }
        };

        if (cmsSettings['cms_video_url']) {
            if (videoUrlInput) videoUrlInput.value = cmsSettings['cms_video_url'];
            updateVideoPreview(cmsSettings['cms_video_url']);
        }

        if (videoFileInput) {
            videoFileInput.addEventListener('change', function() {
                const file = this.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        if (videoUrlInput) videoUrlInput.value = e.target.result;
                        updateVideoPreview(e.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        if (videoUrlInput) {
            videoUrlInput.addEventListener('input', function() {
                updateVideoPreview(this.value);
            });
        }

        // Radio mode pre-fill
        const currentMode = cmsSettings['cms_darshan_mode'] || 'live';
        if (currentMode === 'video') {
            const videoRadio = document.getElementById('mode-video');
            if (videoRadio) videoRadio.checked = true;
        } else {
            const liveRadio = document.getElementById('mode-live');
            if (liveRadio) liveRadio.checked = true;
        }

        // Pre-fill input text fields
        const inputIds = ['cms-hero-title', 'cms-hero-subtitle', 'cms-hero-bg', 'cms-spiritual-img', 'cms-live-url', 'cms-pooja-timings', 'cms-upcoming-festivals', 'cms-sevas-services', 'cms-pooja-amount', 'cms-qr-code', 'cms-bank-name', 'cms-acc-name', 'cms-acc-number', 'cms-ifsc'];
        
        inputIds.forEach(id => {
            const key = id.replace(/-/g, '_');
            const val = cmsSettings[key];
            if (val) {
                if (id === 'cms-hero-bg' || id === 'cms-spiritual-img' || id === 'cms-qr-code') {
                    const previewEl = document.getElementById(id.replace('cms-', 'preview-'));
                    if (previewEl) previewEl.src = val;
                } else {
                    const inputEl = document.getElementById(id);
                    if (inputEl) inputEl.value = val;
                }
            }
        });

        const getRelativePath = (url) => {
            if (!url) return '';
            if (url.startsWith('data:')) return url; // Keep base64 uploads as is
            if (url.startsWith('file:///')) {
                const idx = url.indexOf('images/');
                if (idx !== -1) return url.substring(idx);
            }
            try {
                const parsed = new URL(url);
                if (parsed.pathname.includes('images/')) {
                    const idx = parsed.pathname.indexOf('images/');
                    return parsed.pathname.substring(idx);
                }
            } catch(e) {}
            return url;
        };

        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const selectedMode = document.querySelector('input[name="cms_darshan_mode"]:checked')?.value || 'live';

            const updates = [
                { setting_key: 'cms_hero_title', setting_value: document.getElementById('cms-hero-title').value },
                { setting_key: 'cms_hero_subtitle', setting_value: document.getElementById('cms-hero-subtitle').value },
                { setting_key: 'cms_hero_bg', setting_value: getRelativePath(document.getElementById('preview-hero-bg').src) },
                { setting_key: 'cms_spiritual_img', setting_value: getRelativePath(document.getElementById('preview-spiritual-img').src) },
                { setting_key: 'cms_live_url', setting_value: document.getElementById('cms-live-url').value },
                { setting_key: 'cms_darshan_mode', setting_value: selectedMode },
                { setting_key: 'cms_video_url', setting_value: document.getElementById('cms-video-url').value || '' },
                { setting_key: 'cms_pooja_timings', setting_value: document.getElementById('cms-pooja-timings').value },
                { setting_key: 'cms_upcoming_festivals', setting_value: document.getElementById('cms-upcoming-festivals').value },
                { setting_key: 'cms_sevas_services', setting_value: document.getElementById('cms-sevas-services').value },
                { setting_key: 'cms_pooja_amount', setting_value: document.getElementById('cms-pooja-amount').value },
                { setting_key: 'cms_qr_code', setting_value: getRelativePath(document.getElementById('preview-qr-code').src) },
                { setting_key: 'cms_bank_name', setting_value: document.getElementById('cms-bank-name').value },
                { setting_key: 'cms_acc_name', setting_value: document.getElementById('cms-acc-name').value },
                { setting_key: 'cms_acc_number', setting_value: document.getElementById('cms-acc-number').value },
                { setting_key: 'cms_ifsc', setting_value: document.getElementById('cms-ifsc').value }
            ];

            // Save to local cache immediately
            localStorage.setItem('local_cms_settings', JSON.stringify(updates));

            if (!supabaseClient) {
                alert("Database disconnected. Changes saved locally.");
                return;
            }

            try {
                const { error } = await supabaseClient.from('cms_settings').upsert(updates);
                
                if (!error) {
                    const saveMsg = document.getElementById('saveMsg');
                    if (saveMsg) {
                        saveMsg.style.display = 'block';
                        setTimeout(() => { saveMsg.style.display = 'none'; }, 3000);
                    } else {
                        alert("Changes saved to Supabase Database successfully! Website is updated.");
                    }
                } else {
                    alert("Saved to local cache. Database Notice: " + error.message);
                }
            } catch (e) {
                alert("Saved to local cache. Network Notice: " + e.message);
            }
        });
    }

    // Global 12 Jyothirlinga Default Photos (used as initial base)
    const DEFAULT_JYOTHIRLINGA_PHOTOS = [
        { id: 'def-1', temple_id: 'somnath', temple_name: '1. சோமநாதர் (Somnath)', title: 'ஏகாதச ருத்ர மகா யாகம் - சோமநாதர்', image_url: 'images/65d5a204-f8ca-4eae-b4a4-95ddb7264ba6.jpeg' },
        { id: 'def-2', temple_id: 'somnath', temple_name: '1. சோமநாதர் (Somnath)', title: 'ருத்ராபிஷேகம் & பூர்ணாஹுதி', image_url: 'images/5af0807c-ef9a-45bd-8363-590f84ad1f09.jpeg' },
        { id: 'def-3', temple_id: 'mallikarjuna', temple_name: '2. மல்லிகார்ஜுனர் (Mallikarjuna)', title: 'ஸ்ரீ மல்லிகார்ஜுனர் ருத்ர ஹோமம்', image_url: 'images/0f5f1edd-2ee6-4163-b8c2-8ff76bded4a5.jpeg' },
        { id: 'def-4', temple_id: 'mahakaleshwar', temple_name: '3. மகாகாளேஸ்வரர் (Mahakaleshwar)', title: 'மகாகாளேஸ்வரர் பஸ்ம ஆரத்தி யாகம்', image_url: 'images/56fa0e18-81f3-4be4-989b-5fe764f29316.jpeg' },
        { id: 'def-5', temple_id: 'omkareshwar', temple_name: '4. ஓம்காரேஸ்வரர் (Omkareshwar)', title: 'ஓம்காரேஸ்வரர் நர்மதா தீர்த்த அபிஷேகம்', image_url: 'images/65d5a204-f8ca-4eae-b4a4-95ddb7264ba6.jpeg' },
        { id: 'def-6', temple_id: 'baidyanath', temple_name: '5. வைத்யநாதர் (Baidyanath)', title: 'வைத்யநாதர் ஆரோக்கிய ருத்ர யாகம்', image_url: 'images/5af0807c-ef9a-45bd-8363-590f84ad1f09.jpeg' },
        { id: 'def-7', temple_id: 'bhimashankar', temple_name: '6. பீமாசங்கரர் (Bhimashankar)', title: 'பீமாசங்கரர் ஜோதிர்லிங்க பூஜை', image_url: 'images/0f5f1edd-2ee6-4163-b8c2-8ff76bded4a5.jpeg' },
        { id: 'def-8', temple_id: 'rameshwaram', temple_name: '7. இராமநாதசுவாமி (Rameshwaram)', title: 'இராமநாதசுவாமி கோடி தீர்த்த அபிஷேகம்', image_url: 'images/56fa0e18-81f3-4be4-989b-5fe764f29316.jpeg' },
        { id: 'def-9', temple_id: 'nageshwar', temple_name: '8. நாகேஸ்வரர் (Nageshwar)', title: 'நாகேஸ்வரர் ஏகாதச ருத்ர பாராயணம்', image_url: 'images/65d5a204-f8ca-4eae-b4a4-95ddb7264ba6.jpeg' },
        { id: 'def-10', temple_id: 'kashi', temple_name: '9. காசி விஸ்வநாதர் (Kashi)', title: 'காசி விஸ்வநாதர் கங்கா தீர்த்த யாகம்', image_url: 'images/5af0807c-ef9a-45bd-8363-590f84ad1f09.jpeg' },
        { id: 'def-11', temple_id: 'trimbakeshwar', temple_name: '10. திரியம்பகேஸ்வரர் (Trimbakeshwar)', title: 'திரியம்பகேஸ்வரர் பிரம்மகிரி ருத்ராபிஷேகம்', image_url: 'images/0f5f1edd-2ee6-4163-b8c2-8ff76bded4a5.jpeg' },
        { id: 'def-12', temple_id: 'kedarnath', temple_name: '11. கேதாரநாதர் (Kedarnath)', title: 'கேதாரநாதர் இமயமலை ருத்ர யாகம்', image_url: 'images/56fa0e18-81f3-4be4-989b-5fe764f29316.jpeg' },
        { id: 'def-13', temple_id: 'grishneshwar', temple_name: '12. திருஷ்ணேஸ்வரர் (Grishneshwar)', title: 'திருஷ்ணேஸ்வரர் ருத்ராபிஷேக அலங்காரம்', image_url: 'images/65d5a204-f8ca-4eae-b4a4-95ddb7264ba6.jpeg' }
    ];

    const fetchAllGalleryPhotos = async () => {
        let photos = [];
        const localData = localStorage.getItem('jyothirlinga_photos');
        
        if (localData !== null) {
            try {
                photos = JSON.parse(localData);
            } catch(e) {}
        } else {
            photos = [...DEFAULT_JYOTHIRLINGA_PHOTOS];
            localStorage.setItem('jyothirlinga_photos', JSON.stringify(photos));
        }

        try {
            if (supabaseClient) {
                const { data } = await supabaseClient.from('jyothirlinga_gallery').select('*').order('created_at', { ascending: false });
                if (data && data.length > 0) {
                    data.forEach(dbItem => {
                        if (!photos.some(p => p.id === dbItem.id || (p.image_url === dbItem.image_url && p.temple_id === dbItem.temple_id))) {
                            photos.unshift(dbItem);
                        }
                    });
                }
            }
        } catch(e) {}

        return photos;
    };

    // 9. Load Bookings, Donations, and Gallery Photos in Admin Panel
    const bookingsTbody = document.getElementById('admin-bookings-tbody');
    const donationsTbody = document.getElementById('admin-donations-tbody');

    const loadAdminData = async () => {
        if (!supabaseClient) return;
        try {
            // Load Pooja Bookings
            if (bookingsTbody) {
                const { data, error } = await supabaseClient
                    .from('pooja_bookings')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (!error && data) {
                    bookingsTbody.innerHTML = '';
                    if (data.length === 0) {
                        bookingsTbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color: var(--text-muted);">No bookings found.</td></tr>';
                    } else {
                        let pendingCount = 0;
                        data.forEach(item => {
                            const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A';
                            const statusStr = item.status || 'Pending';
                            let badgeClass = 'pending';
                            if (statusStr.toLowerCase() === 'approved' || statusStr.toLowerCase() === 'confirmed') badgeClass = 'success';
                            else if (statusStr.toLowerCase() === 'rejected') badgeClass = 'danger';

                            if (statusStr.toLowerCase() === 'pending') pendingCount++;

                            // WhatsApp button logic
                            let whatsappBtn = '';
                            if (item.mobile) {
                                let cleanMobile = item.mobile.toString().replace(/\D/g, '');
                                if (cleanMobile.length === 10) cleanMobile = '91' + cleanMobile;
                                const waMsg = encodeURIComponent(`வணக்கம் ${item.name || 'பக்தர்'}! சைலாபுரி ஆதீன திருமடம் - ${item.pooja_name || 'பூஜை'} முன்பதிவு (Txn: ${item.transaction_id || ''}) பற்றி தொடர்பு கொள்கிறோம்.`);
                                whatsappBtn = `
                                    <a href="https://wa.me/${cleanMobile}?text=${waMsg}" target="_blank" style="display: inline-flex; align-items: center; gap: 4px; background: #25D366; color: white; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; text-decoration: none; font-weight: bold; margin-left: 6px; border: 1px solid #1ebe5d;" title="Chat with Devotee on WhatsApp">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                                        WhatsApp
                                    </a>
                                `;
                            }

                            let actionBtns = '';
                            if (statusStr.toLowerCase() === 'pending') {
                                actionBtns = `
                                    <button class="btn-action-approve" data-id="${item.id}" style="background: #4cd137; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.8rem; margin-right: 5px;">Approve</button>
                                    <button class="btn-action-reject" data-id="${item.id}" style="background: #e84118; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.8rem;">Reject</button>
                                `;
                            } else if (statusStr.toLowerCase() === 'approved' || statusStr.toLowerCase() === 'confirmed') {
                                actionBtns = `<span style="color: #4cd137; font-weight: bold; font-size: 0.85rem;">Approved ✓</span>`;
                            } else {
                                actionBtns = `<span style="color: #e84118; font-weight: bold; font-size: 0.85rem;">Rejected ✗</span>`;
                            }

                            bookingsTbody.innerHTML += `
                                <tr>
                                    <td>
                                        <strong style="font-size: 1rem; color: #fff;">${item.name || 'N/A'}</strong>
                                        <div style="margin-top: 4px; font-size: 0.8rem; color: #ccc;">
                                            <span>📞 ${item.mobile || '-'}</span> ${whatsappBtn}
                                        </div>
                                        <div style="font-size: 0.75rem; color: var(--gold-secondary); margin-top: 2px;">
                                            ⭐ நட்சத்திரம்: ${item.nakshatra || '-'} | கோத்திரம்: ${item.gothram || '-'}
                                        </div>
                                    </td>
                                    <td><strong>${item.pooja_name || 'N/A'}</strong></td>
                                    <td><strong style="color: var(--gold-primary); font-family: monospace; font-size: 0.95rem; background: rgba(0,0,0,0.5); padding: 3px 8px; border-radius: 4px; border: 1px solid var(--glass-border);">${item.transaction_id || 'N/A'}</strong></td>
                                    <td>${dateStr}</td>
                                    <td><strong style="color: var(--gold-primary);">₹ ${item.amount || '0'}</strong></td>
                                    <td><span class="badge ${badgeClass}">${statusStr}</span></td>
                                    <td>${actionBtns}</td>
                                </tr>
                            `;
                        });

                        // Update dashboard stats
                        const statBookings = document.getElementById('stat-bookings');
                        if (statBookings) statBookings.textContent = `${data.length} (${pendingCount} Pending)`;
                    }
                } else {
                    bookingsTbody.innerHTML = '<tr><td colspan="7" class="text-center" style="color: #ff4d4d;">Error loading bookings.</td></tr>';
                }
            }

            // Attach Approve/Reject event listeners for bookings
            document.querySelectorAll('.btn-action-approve').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    if (confirm(`Approve booking ID #${id}? Devotee will get access to Live Darshan stream.`)) {
                        const { error } = await supabaseClient.from('pooja_bookings').update({ status: 'Approved' }).eq('id', id);
                        if (!error) {
                            alert('Booking Approved Successfully!');
                            await loadAdminData();
                        } else {
                            alert('Error approving booking: ' + error.message);
                        }
                    }
                });
            });

            document.querySelectorAll('.btn-action-reject').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    if (confirm(`Reject booking ID #${id}?`)) {
                        const { error } = await supabaseClient.from('pooja_bookings').update({ status: 'Rejected' }).eq('id', id);
                        if (!error) {
                            alert('Booking Rejected.');
                            await loadAdminData();
                        } else {
                            alert('Error rejecting booking: ' + error.message);
                        }
                    }
                });
            });

            // Load ALL 12 Jyothirlinga Photos in Admin Table
            const adminGalleryTbody = document.getElementById('admin-gallery-tbody');
            if (adminGalleryTbody) {
                let photos = await fetchAllGalleryPhotos();
                
                const adminFilterSelect = document.getElementById('adminGalleryFilter');
                const filterVal = adminFilterSelect ? adminFilterSelect.value : 'all';

                let displayPhotos = filterVal === 'all' ? photos : photos.filter(p => p.temple_id === filterVal);

                adminGalleryTbody.innerHTML = '';
                if (displayPhotos.length === 0) {
                    adminGalleryTbody.innerHTML = '<tr><td colspan="4" class="text-center" style="color: var(--text-muted);">No photos found for this temple. Use the form above to add photos.</td></tr>';
                } else {
                    displayPhotos.forEach((p) => {
                        const globalIndex = photos.indexOf(p);
                        adminGalleryTbody.innerHTML += `
                            <tr>
                                <td><img src="${p.image_url}" style="width: 55px; height: 55px; object-fit: cover; border-radius: 6px; border: 1px solid var(--gold-secondary);"></td>
                                <td><strong style="color: var(--gold-primary);">${p.temple_name || p.temple_id}</strong></td>
                                <td>${p.title}</td>
                                <td>
                                    <button class="btn-edit-photo" data-index="${globalIndex}" data-id="${p.id || ''}" style="background: #f39c12; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.8rem; margin-right: 5px;">Edit ✏️</button>
                                    <button class="btn-delete-photo" data-id="${p.id || ''}" data-index="${globalIndex}" style="background: #e84118; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 0.8rem;">Delete 🗑️</button>
                                </td>
                            </tr>
                        `;
                    });

                    // Edit Photo Listener
                    document.querySelectorAll('.btn-edit-photo').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const idx = parseInt(e.target.getAttribute('data-index'));
                            let currentList = await fetchAllGalleryPhotos();
                            const photo = currentList[idx];
                            if (!photo) return;

                            const newTitle = prompt('Edit Photo Title:', photo.title);
                            if (newTitle === null) return;

                            const newUrl = prompt('Edit Photo Image URL / Base64:', photo.image_url);
                            if (newUrl === null) return;

                            photo.title = newTitle || photo.title;
                            photo.image_url = newUrl || photo.image_url;

                            if (photo.id && !photo.id.startsWith('def-') && supabaseClient) {
                                try {
                                    await supabaseClient.from('jyothirlinga_gallery').update({
                                        title: photo.title,
                                        image_url: photo.image_url
                                    }).eq('id', photo.id);
                                } catch(err) {}
                            }

                            currentList[idx] = photo;
                            localStorage.setItem('jyothirlinga_photos', JSON.stringify(currentList));

                            alert('Photo updated successfully! Website gallery will reflect changes.');
                            await loadAdminData();
                        });
                    });

                    // Delete Photo Listener
                    document.querySelectorAll('.btn-delete-photo').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const id = e.target.getAttribute('data-id');
                            const idx = parseInt(e.target.getAttribute('data-index'));
                            if (confirm('Are you sure you want to delete this photo from the website gallery?')) {
                                if (id && !id.startsWith('def-') && supabaseClient) {
                                    try {
                                        await supabaseClient.from('jyothirlinga_gallery').delete().eq('id', id);
                                    } catch(err) {}
                                }
                                
                                let currentList = await fetchAllGalleryPhotos();
                                currentList.splice(idx, 1);
                                localStorage.setItem('jyothirlinga_photos', JSON.stringify(currentList));
                                
                                alert('Photo removed from website successfully!');
                                await loadAdminData();
                            }
                        });
                    });
                }

                if (adminFilterSelect && !adminFilterSelect.dataset.hasListener) {
                    adminFilterSelect.dataset.hasListener = "true";
                    adminFilterSelect.addEventListener('change', async () => {
                        await loadAdminData();
                    });
                }
            }

        } catch (e) {
            console.error("Error loading admin lists:", e);
        }
    };

    if (bookingsTbody || donationsTbody || document.getElementById('admin-gallery-tbody')) {
        await loadAdminData();
    }

    // 10. Admin Jyothirlinga Photo Upload Form
    const jyothirlingaForm = document.getElementById('jyothirlingaForm');
    if (jyothirlingaForm) {
        const compressAndResizeImage = (file, maxDim = 1200, quality = 0.8) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = (event) => {
                    const img = new Image();
                    img.src = event.target.result;
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        if (width > maxDim || height > maxDim) {
                            if (width > height) {
                                height = Math.round((height * maxDim) / width);
                                width = maxDim;
                            } else {
                                width = Math.round((width * maxDim) / height);
                                height = maxDim;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;

                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);

                        const dataUrl = canvas.toDataURL('image/jpeg', quality);
                        resolve(dataUrl);
                    };
                    img.onerror = err => reject(err);
                };
                reader.onerror = err => reject(err);
            });
        };

        jyothirlingaForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const selectEl = document.getElementById('galleryTempleSelect');
            const templeId = selectEl.value;
            const templeName = selectEl.options[selectEl.selectedIndex].text;
            const title = document.getElementById('galleryPhotoTitle').value;
            const fileInput = document.getElementById('galleryPhotoFile');
            const urlInput = document.getElementById('galleryPhotoUrl');

            let finalImg = '';
            if (fileInput && fileInput.files && fileInput.files[0]) {
                try {
                    finalImg = await compressAndResizeImage(fileInput.files[0]);
                } catch(err) {
                    console.error('Error compressing file:', err);
                }
            }
            
            if (!finalImg && urlInput && urlInput.value.trim()) {
                finalImg = urlInput.value.trim();
            }

            if (!finalImg) {
                alert('தயவுசெய்து புகைப்படத்தை தேர்வு செய்யவும் (Select File) அல்லது புகைப்பட முகவரியை (Image URL) உள்ளீடு செய்யவும்.');
                return;
            }

            const newPhoto = {
                temple_id: templeId,
                temple_name: templeName,
                title: title,
                image_url: finalImg,
                created_at: new Date().toISOString()
            };

            // Save to Supabase Database
            let dbInserted = false;
            try {
                if (supabaseClient) {
                    const { data, error } = await supabaseClient.from('jyothirlinga_gallery').insert([newPhoto]).select();
                    if (!error && data && data.length > 0) {
                        newPhoto.id = data[0].id;
                        dbInserted = true;
                    }
                }
            } catch (err) {
                console.error('Supabase DB Insert Error:', err);
            }

            if (!dbInserted) {
                newPhoto.id = 'custom-' + Date.now();
            }

            // Save to local storage cache
            let currentList = await fetchAllGalleryPhotos();
            currentList.unshift(newPhoto);
            try {
                localStorage.setItem('jyothirlinga_photos', JSON.stringify(currentList));
            } catch(e) {
                console.warn("LocalStorage quota alert:", e);
            }

            alert('புகைப்படம் வெற்றிகரமாக பதிவேற்றப்பட்டது (Photo Uploaded Successfully)!');
            jyothirlingaForm.reset();
            if (fileInput) fileInput.value = '';
            await loadAdminData();
        });
    }

    // 11. Frontend 12 Jyothirlinga Gallery Engine
    const jyothirlingaGrid = document.getElementById('jyothirlingaGrid');
    if (jyothirlingaGrid) {
        let allPhotos = [];
        let currentFilter = 'all';
        let activePhotosList = [];
        let currentLightboxIndex = 0;

        const loadGalleryData = async () => {
            allPhotos = await fetchAllGalleryPhotos();
            renderGallery();
        };

        const renderGallery = () => {
            const grid = document.getElementById('jyothirlingaGrid');
            if (!grid) return;

            activePhotosList = currentFilter === 'all' 
                ? allPhotos 
                : allPhotos.filter(p => p.temple_id === currentFilter);

            // Update photo count badge
            const countAll = document.getElementById('count-all');
            if (countAll) countAll.textContent = allPhotos.length;

            grid.innerHTML = '';
            if (activePhotosList.length === 0) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">இந்த ஆலயத்திற்கு இன்னும் புகைப்படங்கள் பதிவேற்றப்படவில்லை.</div>';
                return;
            }

            activePhotosList.forEach((photo, idx) => {
                const card = document.createElement('div');
                card.className = 'gallery-card';
                card.innerHTML = `
                    <img src="${photo.image_url}" alt="${photo.title}" loading="lazy">
                    <div class="gallery-card-body">
                        <div class="gallery-card-title">${photo.title}</div>
                        <div class="gallery-card-meta">
                            <span>🛕 ${photo.temple_name || 'ஜோதிர்லிங்கம்'}</span>
                            <span>🔍 விரிவாகப் பார்க்க</span>
                        </div>
                    </div>
                `;
                card.addEventListener('click', () => openLightbox(idx));
                grid.appendChild(card);
            });
        };

        // Tab Switching
        const tabBtns = document.querySelectorAll('.gallery-tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.getAttribute('data-temple');
                renderGallery();
            });
        });

        // Lightbox Modal Handlers
        const lightboxModal = document.getElementById('lightboxModal');
        const lightboxImg = document.getElementById('lightboxImg');
        const lightboxCaption = document.getElementById('lightboxCaption');
        const lightboxClose = document.getElementById('lightboxClose');
        const lightboxPrev = document.getElementById('lightboxPrev');
        const lightboxNext = document.getElementById('lightboxNext');

        const openLightbox = (index) => {
            currentLightboxIndex = index;
            const photo = activePhotosList[currentLightboxIndex];
            if (photo && lightboxModal) {
                lightboxImg.src = photo.image_url;
                lightboxCaption.innerHTML = `<strong>${photo.title}</strong><br><small style="color:var(--text-muted);">${photo.temple_name || ''}</small>`;
                lightboxModal.style.display = 'flex';
            }
        };

        if (lightboxClose) {
            lightboxClose.addEventListener('click', () => {
                lightboxModal.style.display = 'none';
            });
        }

        if (lightboxPrev) {
            lightboxPrev.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentLightboxIndex > 0) {
                    openLightbox(currentLightboxIndex - 1);
                } else {
                    openLightbox(activePhotosList.length - 1);
                }
            });
        }

        if (lightboxNext) {
            lightboxNext.addEventListener('click', (e) => {
                e.stopPropagation();
                if (currentLightboxIndex < activePhotosList.length - 1) {
                    openLightbox(currentLightboxIndex + 1);
                } else {
                    openLightbox(0);
                }
            });
        }

        if (lightboxModal) {
            lightboxModal.addEventListener('click', (e) => {
                if (e.target === lightboxModal) {
                    lightboxModal.style.display = 'none';
                }
            });
        }

        await loadGalleryData();
    }

});
