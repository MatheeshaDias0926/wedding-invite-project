/* ========================================================================
   WEDDING INVITATION — JavaScript
   ======================================================================== */

const ADMIN_PASSWORD = 'wedding2026';
const STORAGE_KEY_RSVP = 'wedding_rsvp_counts';
const STORAGE_KEY_DATA = 'wedding_admin_data';
const STORAGE_KEY_RESPONDED = 'wedding_user_responded';

document.addEventListener('DOMContentLoaded', () => {
    loadAdminData();
    initIntroSlideshow();
    initCountdown();
    initScrollAnimations();
    initLightbox();
    initSmoothScroll();
    initRSVP();
    initAdminModal();
    initAmbientMusic();
});

/* ========================================================================
   INTERACTIVE LETTER INTRO
   ======================================================================== */
function initIntroSlideshow() {
    // Keep function name for backward compatibility in init()
    const overlay = document.getElementById('intro-overlay');
    const sealBtn = document.getElementById('intro-seal-btn');
    
    document.body.classList.add('intro-active');

    if (!sealBtn) return;

    sealBtn.addEventListener('click', () => {
        // Trigger music on click
        if (window.startAmbientMusic) {
            window.startAmbientMusic();
        }

        // Add opening state to trigger door animations and hide content
        overlay.classList.add('is-opening');
        createParticles();

        // After doors are fully opened, remove intro-active from body to allow scroll
        setTimeout(() => {
            document.body.classList.remove('intro-active');
            
            // Fade out the overlay entirely
            overlay.classList.add('fade-out');
            
            // Remove overlay from DOM after fade out transition
            setTimeout(() => {
                overlay.remove();
            }, 1200);
        }, 1500); // matches CSS transition duration approximately
    });
}

function createParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;

    const particleCount = 40;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random properties
        const size = Math.random() * 6 + 2; // 2px to 8px
        const left = Math.random() * 100; // 0% to 100%
        const animationDuration = Math.random() * 2 + 2; // 2s to 4s
        const animationDelay = Math.random() * 0.5;
        
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.bottom = `-10px`;
        particle.style.animationDuration = `${animationDuration}s`;
        particle.style.animationDelay = `${animationDelay}s`;
        
        container.appendChild(particle);
    }
}

/* ========================================================================
   AMBIENT MUSIC (Web Audio API — realistic romantic pad)
   ======================================================================== */
function initAmbientMusic() {
    const toggleBtn = document.getElementById('music-toggle');
    const iconOn = document.getElementById('music-icon-on');
    const iconOff = document.getElementById('music-icon-off');

    let audioCtx = null;
    let isPlaying = false;
    let masterGain = null;
    let nodes = [];

    function createReverbImpulse(ctx, duration, decay) {
        const rate = ctx.sampleRate;
        const length = rate * duration;
        const impulse = ctx.createBuffer(2, length, rate);
        for (let ch = 0; ch < 2; ch++) {
            const data = impulse.getChannelData(ch);
            for (let i = 0; i < length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        return impulse;
    }

    function createAmbientPad() {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0;

        // Reverb for spacious, cathedral-like sound
        const convolver = audioCtx.createConvolver();
        convolver.buffer = createReverbImpulse(audioCtx, 4, 2.5);

        const reverbGain = audioCtx.createGain();
        reverbGain.gain.value = 0.4;

        const dryGain = audioCtx.createGain();
        dryGain.gain.value = 0.6;

        // Warm low-pass filter on everything
        const warmFilter = audioCtx.createBiquadFilter();
        warmFilter.type = 'lowpass';
        warmFilter.frequency.value = 900;
        warmFilter.Q.value = 0.5;

        // Romantic Cmaj9 chord voicing: C2, E3, G3, B3, C4, D4, G4
        const voices = [
            { freq: 65.41,  type: 'sine',     vol: 0.018 },  // C2 — deep root
            { freq: 130.81, type: 'sine',     vol: 0.014 },  // C3 — root
            { freq: 164.81, type: 'sine',     vol: 0.010 },  // E3 — major third
            { freq: 196.00, type: 'sine',     vol: 0.009 },  // G3 — fifth
            { freq: 246.94, type: 'triangle', vol: 0.005 },  // B3 — major seventh
            { freq: 261.63, type: 'sine',     vol: 0.006 },  // C4 — octave
            { freq: 293.66, type: 'sine',     vol: 0.004 },  // D4 — ninth
            { freq: 392.00, type: 'triangle', vol: 0.003 },  // G4 — high fifth
        ];

        // Mixing bus for oscillators
        const oscBus = audioCtx.createGain();
        oscBus.gain.value = 1;

        voices.forEach((v, i) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = v.type;
            osc.frequency.value = v.freq;

            // Each voice has its own gentle pitch drift (detuning)
            const lfo = audioCtx.createOscillator();
            const lfoGain = audioCtx.createGain();
            lfo.type = 'sine';
            lfo.frequency.value = 0.03 + Math.random() * 0.06;
            lfoGain.gain.value = 0.15 + Math.random() * 0.15;
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            lfo.start();

            // Gentle volume breathing per voice
            const breathLfo = audioCtx.createOscillator();
            const breathGain = audioCtx.createGain();
            breathLfo.type = 'sine';
            breathLfo.frequency.value = 0.06 + Math.random() * 0.08;
            breathGain.gain.value = v.vol * 0.3;
            breathLfo.connect(breathGain);
            breathGain.connect(gain.gain);
            breathLfo.start();

            gain.gain.value = v.vol;

            osc.connect(gain);
            gain.connect(oscBus);
            osc.start();

            nodes.push(osc, lfo, breathLfo);
        });

        // Soft filtered noise — like vinyl warmth
        const bufferSize = audioCtx.sampleRate * 3;
        const noiseBuffer = audioCtx.createBuffer(2, bufferSize, audioCtx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
            const channelData = noiseBuffer.getChannelData(ch);
            for (let i = 0; i < bufferSize; i++) {
                channelData[i] = (Math.random() * 2 - 1) * 0.004;
            }
        }
        const noiseSource = audioCtx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.value = 350;

        const noiseGain = audioCtx.createGain();
        noiseGain.gain.value = 0.12;

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(oscBus);
        noiseSource.start();
        nodes.push(noiseSource);

        // Delicate high shimmer — very quiet high harmonics
        const shimmer = audioCtx.createOscillator();
        const shimmerGain = audioCtx.createGain();
        shimmer.type = 'sine';
        shimmer.frequency.value = 523.25; // C5
        shimmerGain.gain.value = 0.0015;

        const shimmerLfo = audioCtx.createOscillator();
        const shimmerLfoGain = audioCtx.createGain();
        shimmerLfo.type = 'sine';
        shimmerLfo.frequency.value = 0.04;
        shimmerLfoGain.gain.value = 0.0008;
        shimmerLfo.connect(shimmerLfoGain);
        shimmerLfoGain.connect(shimmerGain.gain);
        shimmerLfo.start();

        shimmer.connect(shimmerGain);
        shimmerGain.connect(oscBus);
        shimmer.start();
        nodes.push(shimmer, shimmerLfo);

        // Route: oscBus → warmFilter → (dry + reverb) → master
        oscBus.connect(warmFilter);
        warmFilter.connect(dryGain);
        warmFilter.connect(convolver);
        convolver.connect(reverbGain);
        dryGain.connect(masterGain);
        reverbGain.connect(masterGain);
        masterGain.connect(audioCtx.destination);

        return masterGain;
    }

    function startMusic() {
        if (!audioCtx) {
            masterGain = createAmbientPad();
        } else {
            audioCtx.resume();
        }
        // Very gentle 5-second fade in
        masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
        masterGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + 5);
        isPlaying = true;
        iconOn.style.display = 'block';
        iconOff.style.display = 'none';
        toggleBtn.classList.add('playing');
    }

    function stopMusic() {
        if (masterGain && audioCtx) {
            masterGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2);
            setTimeout(() => audioCtx.suspend(), 2100);
        }
        isPlaying = false;
        iconOn.style.display = 'none';
        iconOff.style.display = 'block';
        toggleBtn.classList.remove('playing');
    }

    // Toggle button
    toggleBtn.addEventListener('click', () => {
        if (!isPlaying) {
            startMusic();
        } else {
            stopMusic();
        }
    });

    // Expose startMusic globally so the seal button can trigger it
    window.startAmbientMusic = startMusic;
}

/* ========================================================================
   COUNTDOWN TIMER
   ======================================================================== */
function initCountdown() {
    const data = getAdminData();
    const dateStr = data.weddingDateTime || '2026-07-31T16:00:00+05:30';
    const weddingDate = new Date(dateStr).getTime();

    function update() {
        const now = Date.now();
        const diff = weddingDate - now;

        if (diff <= 0) {
            ['cd-days', 'cd-hours', 'cd-minutes', 'cd-seconds'].forEach(id => {
                document.getElementById(id).textContent = '00';
            });
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        animateNumber('cd-days', days);
        animateNumber('cd-hours', hours);
        animateNumber('cd-minutes', minutes);
        animateNumber('cd-seconds', seconds);
    }

    function animateNumber(id, value) {
        const el = document.getElementById(id);
        const formatted = String(value).padStart(2, '0');
        if (el.textContent !== formatted) {
            el.style.transform = 'translateY(-4px)';
            el.style.opacity = '0.6';
            setTimeout(() => {
                el.textContent = formatted;
                el.style.transform = 'translateY(0)';
                el.style.opacity = '1';
            }, 150);
        }
    }

    update();
    setInterval(update, 1000);
}

/* ========================================================================
   SCROLL ANIMATIONS
   ======================================================================== */
function initScrollAnimations() {
    const selectors = [
        '.countdown-title', '.countdown-boxes',
        '.note-image-frame', '.note-quote', '.note-invited-line',
        '.celebration-title', '.celebration-image-wrapper',
        '.event-card', '.gallery-title', '.gallery-item',
        '.rsvp-title', '.rsvp-text', '.rsvp-buttons',
        '.footer-title', '.dress-code', '.section-label'
    ];

    selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach((el, i) => {
            el.classList.add('animate-on-scroll');
            if (sel === '.gallery-item' || sel === '.event-card') {
                el.classList.add(`delay-${(i % 4) + 1}`);
            }
        });
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

/* ========================================================================
   LIGHTBOX
   ======================================================================== */
function initLightbox() {
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
        <button class="lightbox-close" aria-label="Close lightbox">&times;</button>
        <img src="" alt="Gallery photo enlarged">
    `;
    document.body.appendChild(overlay);

    const lightboxImg = overlay.querySelector('img');
    const closeBtn = overlay.querySelector('.lightbox-close');

    document.querySelectorAll('.gallery-item img').forEach(img => {
        img.addEventListener('click', () => {
            lightboxImg.src = img.src;
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeLightbox() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); closeLightbox(); });
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeLightbox(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });
}

/* ========================================================================
   SMOOTH SCROLL
   ======================================================================== */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href === '#') return;
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const top = target.getBoundingClientRect().top + window.scrollY - 20;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });
}

/* ========================================================================
   RSVP — Simple Accept/Decline Counter
   ======================================================================== */
function initRSVP() {
    const btnAccept = document.getElementById('btn-accept');
    const btnDecline = document.getElementById('btn-decline');
    const buttonsEl = document.getElementById('rsvp-buttons');
    const confirmationEl = document.getElementById('rsvp-confirmation');
    const confirmTitle = document.getElementById('confirmation-title');
    const confirmText = document.getElementById('confirmation-text');

    // Check if user already responded
    const alreadyResponded = localStorage.getItem(STORAGE_KEY_RESPONDED);
    if (alreadyResponded) {
        buttonsEl.style.display = 'none';
        confirmationEl.style.display = 'block';
        confirmTitle.textContent = 'Thank you!';
        confirmText.textContent = alreadyResponded === 'accept'
            ? 'You have accepted the invitation. We can\'t wait to see you!'
            : 'We\'ll miss you. Thank you for your response.';
        return;
    }

    btnAccept.addEventListener('click', () => handleResponse('accept'));
    btnDecline.addEventListener('click', () => handleResponse('decline'));

    function handleResponse(type) {
        // Update counts
        const counts = getRSVPCounts();
        if (type === 'accept') {
            counts.accepted++;
        } else {
            counts.declined++;
        }
        localStorage.setItem(STORAGE_KEY_RSVP, JSON.stringify(counts));
        localStorage.setItem(STORAGE_KEY_RESPONDED, type);

        // Show confirmation
        buttonsEl.style.display = 'none';
        confirmationEl.style.display = 'block';

        if (type === 'accept') {
            confirmTitle.textContent = 'We\'re so happy!';
            confirmText.textContent = 'Thank you for accepting. We can\'t wait to celebrate with you!';
        } else {
            confirmTitle.textContent = 'We\'ll miss you!';
            confirmText.textContent = 'Thank you for letting us know. You\'ll be in our thoughts.';
        }

        confirmationEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function getRSVPCounts() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_RSVP)) || { accepted: 0, declined: 0 };
    } catch {
        return { accepted: 0, declined: 0 };
    }
}

/* ========================================================================
   ADMIN MODAL (Secret entrance)
   ======================================================================== */
function initAdminModal() {
    const entry = document.getElementById('secret-admin-entry');
    const overlay = document.getElementById('admin-modal-overlay');
    const closeBtn = document.getElementById('admin-modal-close');
    const loginForm = document.getElementById('admin-login-form');
    const errorEl = document.getElementById('admin-error');

    entry.addEventListener('click', () => {
        overlay.classList.add('active');
    });

    closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
        errorEl.style.display = 'none';
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
            errorEl.style.display = 'none';
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const pwd = document.getElementById('admin-password').value;

        if (pwd === ADMIN_PASSWORD) {
            overlay.classList.remove('active');
            document.getElementById('admin-password').value = '';
            errorEl.style.display = 'none';
            window.location.href = 'admin.html';
        } else {
            errorEl.style.display = 'block';
            document.getElementById('admin-password').value = '';
        }
    });
}

/* ========================================================================
   ADMIN DATA — Load saved data into the invitation
   ======================================================================== */
function getAdminData() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY_DATA)) || {};
    } catch {
        return {};
    }
}

function loadAdminData() {
    const data = getAdminData();
    if (!data || Object.keys(data).length === 0) return;

    // Names
    if (data.partner1) {
        const el = document.getElementById('hero-name1');
        if (el) el.textContent = data.partner1;
    }
    if (data.partner2) {
        const el = document.getElementById('hero-name2');
        if (el) el.textContent = data.partner2;
    }

    // Intro text
    if (data.partner1 && data.partner2) {
        const introText = document.getElementById('intro-text');
        if (introText) introText.textContent = `${data.partner1} & ${data.partner2}`;
    }

    // Hero date & venue
    if (data.weddingDateDisplay) {
        const el = document.getElementById('hero-date');
        if (el) el.textContent = data.weddingDateDisplay;
    }
    if (data.heroVenue) {
        const el = document.getElementById('hero-venue');
        if (el) el.textContent = data.heroVenue;
    }

    // Note text
    if (data.noteText) {
        const el = document.getElementById('note-text');
        if (el) el.textContent = data.noteText;
    }

    // Ceremony
    if (data.ceremonyDate) {
        const el = document.getElementById('ceremony-date');
        if (el) el.innerHTML = `<strong>${data.ceremonyDate}</strong>`;
    }
    if (data.ceremonyTime) {
        const el = document.getElementById('ceremony-time');
        if (el) el.textContent = data.ceremonyTime;
    }
    if (data.ceremonyVenue) {
        const el = document.getElementById('ceremony-venue');
        if (el) el.textContent = data.ceremonyVenue;
    }
    if (data.ceremonyAddress) {
        const el = document.getElementById('ceremony-address');
        if (el) el.textContent = data.ceremonyAddress;
    }

    // Reception
    if (data.receptionDate) {
        const el = document.getElementById('reception-date');
        if (el) el.innerHTML = `<strong>${data.receptionDate}</strong>`;
    }
    if (data.receptionTime) {
        const el = document.getElementById('reception-time');
        if (el) el.textContent = data.receptionTime;
    }
    if (data.receptionVenue) {
        const el = document.getElementById('reception-venue');
        if (el) el.textContent = data.receptionVenue;
    }
    if (data.receptionAddress) {
        const el = document.getElementById('reception-address');
        if (el) el.textContent = data.receptionAddress;
    }

    // Dress code
    if (data.dressCode) {
        const el = document.getElementById('dress-code-value');
        if (el) el.textContent = data.dressCode;
    }

    // Footer info
    if (data.weddingDateDisplay && data.receptionVenue) {
        const el = document.getElementById('footer-info');
        if (el) el.textContent = `${data.weddingDateDisplay} • ${data.receptionVenue}`;
    }

    // --- New Fields ---
    
    // Intro & Bride/Groom Details
    if (data.partner1) {
        const el = document.getElementById('intro-name1');
        if (el) el.textContent = data.partner1;
        
        const brideEl = document.getElementById('bride-name');
        if (brideEl) brideEl.textContent = data.partner1;
        
        const sealEl = document.getElementById('seal-letters');
        if (sealEl && data.partner2) {
            sealEl.textContent = `${data.partner1.charAt(0)}${data.partner2.charAt(0)}`;
        }
    }
    
    if (data.partner2) {
        const el = document.getElementById('intro-name2');
        if (el) el.textContent = data.partner2;
        
        const groomEl = document.getElementById('groom-name');
        if (groomEl) groomEl.textContent = data.partner2;
    }
    
    if (data.weddingDateDisplay) {
        const el = document.getElementById('intro-date-text');
        if (el) el.textContent = data.weddingDateDisplay;
    }

    if (data.brideParents) {
        const el = document.getElementById('bride-parents');
        if (el) el.textContent = data.brideParents;
    }

    if (data.groomParents) {
        const el = document.getElementById('groom-parents');
        if (el) el.textContent = data.groomParents;
    }
    
    // Contacts
    if (data.contact1Name) {
        const el = document.getElementById('contact-name1');
        if (el) el.textContent = data.contact1Name;
    }
    if (data.contact1Phone) {
        const el = document.getElementById('contact-number1');
        if (el) el.textContent = data.contact1Phone;
        const wa = document.getElementById('contact-wa1');
        if (wa) {
            // Remove + or spaces for whatsapp link
            const cleanPhone = data.contact1Phone.replace(/[\s\+]/g, '');
            // Simple check if it starts with 0 to replace with 94 for SL
            const waPhone = cleanPhone.startsWith('0') ? '94' + cleanPhone.substring(1) : cleanPhone;
            wa.href = `https://wa.me/${waPhone}`;
        }
    }
    
    if (data.contact2Name) {
        const el = document.getElementById('contact-name2');
        if (el) el.textContent = data.contact2Name;
    }
    if (data.contact2Phone) {
        const el = document.getElementById('contact-number2');
        if (el) el.textContent = data.contact2Phone;
        const wa = document.getElementById('contact-wa2');
        if (wa) {
            const cleanPhone = data.contact2Phone.replace(/[\s\+]/g, '');
            const waPhone = cleanPhone.startsWith('0') ? '94' + cleanPhone.substring(1) : cleanPhone;
            wa.href = `https://wa.me/${waPhone}`;
        }
    }

    // Map URL
    if (data.mapEmbedUrl) {
        const wrapper = document.getElementById('map-wrapper');
        if (wrapper) {
            wrapper.innerHTML = `<iframe src="${data.mapEmbedUrl}" width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
        }
    }

    // Schedule (if provided in admin)
    // Here we'll expect schedule HTML or array in data.schedule
    // Since admin logic is simple right now, we won't fully implement dynamic schedule building 
    // unless the admin interface is updated for array-based timeline. 
}
