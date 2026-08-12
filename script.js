const EMAILJS_SDK_URL = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/index.min.js';
const PUBLIC_KEY = 'sgdQIdSdXs4BchEI6';
const SERVICE_ID = 'service_wz2pglu';
const TEMPLATE_ID = 'template_e9tym0u';

const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
}

const navLinks = document.querySelectorAll('.nav-menu a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');
    });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.skill-card, .education-card, .info-item, .timeline-content').forEach(el => {
    observer.observe(el);
});

// --- Email sending: improved logging, timeout and fallback ---
// Load EmailJS SDK (idempotent) with timeout
function loadEmailJSSDK(timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
        if (window.emailjs && typeof window.emailjs.send === 'function') {
            console.debug('[EmailJS] SDK already available, init (safe)');
            try { window.emailjs.init(PUBLIC_KEY); } catch (e) { console.debug('[EmailJS] init error (ignored):', e); }
            return resolve(window.emailjs);
        }

        // If a script tag already exists that looks like EmailJS, attach listeners
        const existing = Array.from(document.scripts).find(s => s.src && s.src.includes('@emailjs/browser'));
        if (existing) {
            const onLoad = () => {
                existing.removeEventListener('load', onLoad);
                existing.removeEventListener('error', onError);
                if (window.emailjs) {
                    try { window.emailjs.init(PUBLIC_KEY); } catch (e) {}
                    return resolve(window.emailjs);
                }
                return reject(new Error('EmailJS loaded but global missing'));
            };
            const onError = () => {
                existing.removeEventListener('load', onLoad);
                existing.removeEventListener('error', onError);
                reject(new Error('Failed to load EmailJS SDK (existing script)'));
            };
            existing.addEventListener('load', onLoad);
            existing.addEventListener('error', onError);
            return;
        }

        // otherwise inject
        const s = document.createElement('script');
        s.src = EMAILJS_SDK_URL;
        s.async = true;
        s.onload = () => {
            if (window.emailjs) {
                try { window.emailjs.init(PUBLIC_KEY); } catch (e) { console.debug('[EmailJS] init error', e); }
                resolve(window.emailjs);
            } else {
                reject(new Error('EmailJS SDK loaded but `emailjs` global is missing'));
            }
        };
        s.onerror = () => reject(new Error('Failed to load EmailJS SDK (network)'));
        document.head.appendChild(s);

        // timeout guard
        setTimeout(() => reject(new Error('Timed out loading EmailJS SDK')), timeoutMs);
    });
}

// Helper: timeout wrapper for a Promise
function withTimeout(promise, ms, message = 'Operation timed out') {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
    ]);
}

const contactForm = document.querySelector('#contact-form');
if (contactForm) {
    const statusEl = document.getElementById('form-status');

    function setStatus(text, isError = false) {
        if (!statusEl) return;
        statusEl.textContent = text;
        statusEl.style.color = isError ? '#c0392b' : '#2ecc71';
    }

    contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        console.debug('[Contact] submit');

        // honeypot
        const honeypot = contactForm.querySelector('input[name="company"]');
        if (honeypot && honeypot.value) {
            console.debug('[Contact] honeypot filled — likely bot, aborting');
            return;
        }

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending…';
        }

        const name = (contactForm.querySelector('input[name="from_name"]') || {}).value || '';
        const email = (contactForm.querySelector('input[name="reply_to"]') || {}).value || '';
        const message = (contactForm.querySelector('textarea[name="message"]') || {}).value || '';

        if (!name.trim() || !email.trim() || !message.trim()) {
            setStatus('Please complete all fields before sending.', true);
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
            return;
        }

        setStatus('Sending message…');
        console.debug('[Contact] Attempting to load EmailJS SDK and send');

        // Try SDK with a timeout; if it fails or times out, fallback to REST
        withTimeout(loadEmailJSSDK(), 10000, 'EmailJS SDK load timed out')
            .then(() => {
                if (window.emailjs && typeof window.emailjs.send === 'function') {
                    console.debug('[Contact] SDK loaded — calling emailjs.send');
                    return withTimeout(
                        window.emailjs.send(SERVICE_ID, TEMPLATE_ID, {
                            to_email: 'grgnrzmnn@gmail.com',
                            from_name: name,
                            reply_to: email,
                            message: message
                        }, PUBLIC_KEY),
                        10000,
                        'EmailJS send via SDK timed out'
                    );
                }
                return Promise.reject(new Error('EmailJS SDK not available after load'));
            })
            .then((result) => {
                console.debug('[Contact] SDK send result:', result);
                setStatus('Message sent! Thank you — I will reply as soon as I can.');
                contactForm.reset();
            })
            .catch((sdkError) => {
                console.warn('[Contact] SDK path failed or timed out:', sdkError);
                setStatus('Trying alternate send method…');

                // Fallback to EmailJS REST API
                return fetch('https://api.emailjs.com/api/v1.0/email/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        service_id: SERVICE_ID,
                        template_id: TEMPLATE_ID,
                        user_id: PUBLIC_KEY,
                        template_params: {
                            to_email: 'grgnrzmnn@gmail.com',
                            from_name: name,
                            reply_to: email,
                            message: message
                        }
                    })
                })
                .then(async response => {
                    const text = await response.text().catch(() => '');
                    if (response.ok) {
                        console.debug('[Contact] REST send succeeded:', response.status, text);
                        setStatus('Message sent! Thank you — I will reply as soon as I can.');
                        contactForm.reset();
                    } else {
                        console.error('[Contact] REST send failed:', response.status, text);
                        setStatus('Failed to send message. Please try again later or email me directly.', true);
                    }
                })
                .catch(error => {
                    console.error('[Contact] REST fetch error:', error);
                    setStatus('An error occurred while sending. Please try again later.', true);
                });
            })
            .finally(() => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            });
    });
}


const style = document.createElement('style');
style.textContent = `
    .skill-card, .education-card, .info-item, .timeline-content {
        opacity: 0;
        animation: fadeIn 0.6s ease-in-out forwards;
    }

    .fade-in {
        animation: fadeIn 0.6s ease-in-out forwards;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
});

window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === current) {
            link.classList.add('active');
        }
    });
});
