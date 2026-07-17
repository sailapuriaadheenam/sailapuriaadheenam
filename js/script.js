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
                const transactionId = document.getElementById('transactionId').value;
                if (!transactionId) return;

                document.getElementById('paymentOptions').style.display = 'none';
                // Create loading msg if it doesnt exist
                let loadingEl = document.getElementById('paymentLoading');
                if (!loadingEl) {
                    loadingEl = document.createElement('div');
                    loadingEl.id = 'paymentLoading';
                    loadingEl.innerHTML = '<h3 class="gold-text">Verifying Payment...</h3><p>Please wait.</p>';
                    document.getElementById('paymentSimulator').appendChild(loadingEl);
                }
                loadingEl.style.display = 'block';

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
                                amount: parseFloat(sessionStorage.getItem('poojaAmount') || '0')
                            }])
                            .select();
                        
                        if (!error && data && data.length > 0) {
                            // Store the booking ID as proof of payment
                            localStorage.setItem('booking_id', data[0].id);
                            alert('Payment Details Submitted! Redirecting to Live Darshan...');
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
                                pan_number: sessionStorage.getItem('donationPan')
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

    // 6. Live Darshan Access
    const liveDarshanContainer = document.getElementById('liveDarshanContainer');
    if (liveDarshanContainer) {
        const urlParams = new URLSearchParams(window.location.search);
        const bookingId = urlParams.get('booking_id') || localStorage.getItem('booking_id');
        const lockedOverlay = document.getElementById('lockedOverlay');
        
        if (bookingId) {
            if (!supabaseClient) {
                if (lockedOverlay) lockedOverlay.style.display = 'flex';
                return;
            }
            try {
                // Verify booking ID in Supabase
                const { data, error } = await supabaseClient
                    .from('pooja_bookings')
                    .select('id')
                    .eq('id', bookingId);
                    
                if (data && data.length > 0) {
                if (lockedOverlay) lockedOverlay.style.display = 'none';
                } else {
                    if (lockedOverlay) lockedOverlay.style.display = 'flex';
                    localStorage.removeItem('booking_id'); // Invalid booking
                }
            } catch (e) {
                if (lockedOverlay) lockedOverlay.style.display = 'flex';
            }
        } else {
            if (lockedOverlay) lockedOverlay.style.display = 'flex';
        }
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
        if (!supabaseClient) return;
        try {
            const { data, error } = await supabaseClient.from('cms_settings').select('*');
            if (error || !data) return;
        
        data.forEach(item => {
            cmsSettings[item.setting_key] = item.setting_value;
        });

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

        // Youtube logic
        const liveVideoEl = document.getElementById('darshanVideo');
        if (liveVideoEl && cmsSettings['cms_live_url']) {
            let finalUrl = cmsSettings['cms_live_url'];
            try {
                let urlToParse = finalUrl;
                if (urlToParse.includes('<iframe') && urlToParse.includes('src=')) {
                    const srcMatch = urlToParse.match(/src="([^"]+)"/);
                    if (srcMatch && srcMatch[1]) urlToParse = srcMatch[1];
                }
                const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(live\/)|(watch\?))\??v?=?([^#&?]*).*/;
                const match = urlToParse.match(regExp);
                let videoId = (match && match[8] && match[8].length === 11) ? match[8] : null;
                
                if (videoId) {
                    finalUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
                    const directLinkEl = document.getElementById('directYoutubeLink');
                    if (directLinkEl) directLinkEl.href = `https://www.youtube.com/watch?v=${videoId}`;
                } else if (urlToParse.startsWith('http')) {
                    finalUrl = urlToParse;
                    const directLinkEl = document.getElementById('directYoutubeLink');
                    if (directLinkEl) directLinkEl.href = urlToParse;
                }
            } catch(e) {}
            liveVideoEl.src = finalUrl;
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

        // Pre-fill
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

        adminForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updates = [
                { setting_key: 'cms_hero_title', setting_value: document.getElementById('cms-hero-title').value },
                { setting_key: 'cms_hero_subtitle', setting_value: document.getElementById('cms-hero-subtitle').value },
                { setting_key: 'cms_hero_bg', setting_value: document.getElementById('preview-hero-bg').src },
                { setting_key: 'cms_spiritual_img', setting_value: document.getElementById('preview-spiritual-img').src },
                { setting_key: 'cms_live_url', setting_value: document.getElementById('cms-live-url').value },
                { setting_key: 'cms_pooja_timings', setting_value: document.getElementById('cms-pooja-timings').value },
                { setting_key: 'cms_upcoming_festivals', setting_value: document.getElementById('cms-upcoming-festivals').value },
                { setting_key: 'cms_sevas_services', setting_value: document.getElementById('cms-sevas-services').value },
                { setting_key: 'cms_pooja_amount', setting_value: document.getElementById('cms-pooja-amount').value },
                { setting_key: 'cms_qr_code', setting_value: document.getElementById('preview-qr-code').src },
                { setting_key: 'cms_bank_name', setting_value: document.getElementById('cms-bank-name').value },
                { setting_key: 'cms_acc_name', setting_value: document.getElementById('cms-acc-name').value },
                { setting_key: 'cms_acc_number', setting_value: document.getElementById('cms-acc-number').value },
                { setting_key: 'cms_ifsc', setting_value: document.getElementById('cms-ifsc').value }
            ];

            if (!supabaseClient) {
                alert("Database disconnected. Cannot save changes.");
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
                        alert("Changes saved to Database successfully!");
                    }
                } else {
                    alert("Error saving data to Database: " + error.message);
                }
            } catch (e) {
                alert("Network Error saving data: " + e.message);
            }
        });
    }

    // 9. Load Bookings and Donations in Admin Panel
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
                        bookingsTbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: var(--text-muted);">No bookings found.</td></tr>';
                    } else {
                        data.forEach(item => {
                            const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A';
                            const badgeClass = item.status === 'Confirmed' ? 'success' : 'pending';
                            bookingsTbody.innerHTML += `
                                <tr>
                                    <td>${item.name || 'N/A'}</td>
                                    <td>${item.pooja_name || 'N/A'}</td>
                                    <td>${dateStr}</td>
                                    <td>₹ ${item.amount || '0'}</td>
                                    <td><span class="badge ${badgeClass}">${item.status || 'Pending'}</span></td>
                                </tr>
                            `;
                        });
                    }
                } else {
                    bookingsTbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: #ff4d4d;">Error loading bookings.</td></tr>';
                }
            }

            // Load Donations
            if (donationsTbody) {
                const { data, error } = await supabaseClient
                    .from('donations')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (!error && data) {
                    donationsTbody.innerHTML = '';
                    if (data.length === 0) {
                        donationsTbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: var(--text-muted);">No donations found.</td></tr>';
                    } else {
                        data.forEach(item => {
                            const dateStr = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A';
                            const badgeClass = item.status === 'Confirmed' ? 'success' : 'pending';
                            donationsTbody.innerHTML += `
                                <tr>
                                    <td>${item.donor_name || 'N/A'}</td>
                                    <td>${item.pan_number || 'N/A'}</td>
                                    <td>${dateStr}</td>
                                    <td>₹ ${item.amount || '0'}</td>
                                    <td><span class="badge ${badgeClass}">${item.status || 'Pending'}</span></td>
                                </tr>
                            `;
                        });
                    }
                } else {
                    donationsTbody.innerHTML = '<tr><td colspan="5" class="text-center" style="color: #ff4d4d;">Error loading donations.</td></tr>';
                }
            }
        } catch (e) {
            console.error("Error loading admin lists:", e);
        }
    };

    if (bookingsTbody || donationsTbody) {
        await loadAdminData();
    }

});
