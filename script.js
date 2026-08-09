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

// Utility: load EmailJS SDK if it's not already available
function loadEmailJSSDK() {
    return new Promise((resolve, reject) => {
        if (window.emailjs && typeof window.emailjs.send === 'function') {
            // already available
            try {
                window.emailjs.init(PUBLIC_KEY);
            } catch (e) {
                // ignore init errors
            }
            return resolve(window.emailjs);
        }

        // If a script tag for EmailJS already exists in the document, attach listeners
        const existing = Array.from(document.scripts).find(s => s.src && s.src.includes('emailjs'));
        if (existing) {
            existing.addEventListener('load', () => {
                if (window.emailjs) {
                    try { window.emailjs.init(PUBLIC_KEY); } catch (e) {}
                    resolve(window.emailjs);
                } else {
                    reject(new Error('EmailJS loaded but `emailjs` global is missing'));
                }
            });
            existing.addEventListener('error', () => reject(new Error('Failed to load EmailJS SDK')));
            return;
        }

        // Otherwise, dynamically inject the SDK
        const s = document.createElement('script');
        s.src = EMAILJS_SDK_URL;
        s.async = true;
        s.onload = () => {
            if (window.emailjs) {
                try { window.emailjs.init(PUBLIC_KEY); } catch (e) {}
                resolve(window.emailjs);
            } else {
                reject(new Error('EmailJS SDK loaded but `emailjs` global is missing'));
            }
        };
        s.onerror = () => reject(new Error('Failed to load EmailJS SDK'));
        document.head.appendChild(s);
    });
}

// Contact form handling using EmailJS SDK (with robust loading & fallback)
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

        // Honeypot check
        const honeypot = contactForm.querySelector('input[name="company"]');
        if (honeypot && honeypot.value) {
            // likely bot
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

        // Try to load EmailJS SDK (or use existing) and send via SDK first
        loadEmailJSSDK()
            .then(() => {
                if (window.emailjs && typeof window.emailjs.send === 'function') {
                    // include public key explicitly as 4th parameter for reliability
                    return window.emailjs.send(SERVICE_ID, TEMPLATE_ID, {
                        to_email: 'grgnrzmnn@gmail.com',
                        from_name: name,
                        reply_to: email,
                        message: message
                    }, PUBLIC_KEY);
                }
                // If SDK still not available, reject to trigger fallback
                return Promise.reject(new Error('EmailJS SDK not available after load'));
            })
            .then(() => {
                setStatus('Message sent! Thank you — I will reply as soon as I can.');
                contactForm.reset();
            })
            .catch((sdkError) => {
                // If SDK failed to send or didn't load, fall back to REST API call
                console.warn('EmailJS SDK send failed or not available:', sdkError);

                // REST fallback
                fetch('https://api.emailjs.com/api/v1.0/email/send', {
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
                .then(response => {
                    if (response.ok) {
                        setStatus('Message sent! Thank you — I will reply as soon as I can.');
                        contactForm.reset();
                    } else {
                        response.text().then(text => console.error('EmailJS REST response:', response.status, text));
                        setStatus('Failed to send message. Please try again later or contact me directly via email.', true);
                    }
                })
                .catch(error => {
                    console.error('Error sending email (fallback):', error);
                    setStatus('An error occurred. Please try again later.', true);
                })
                .finally(() => {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                    }
                });
            })
            .finally(() => {
                // If SDK path succeeded, re-enable button here as well
                if (submitBtn && !submitBtn.disabled) return; // already reset by fallback finally
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            });
    });
}


function sendEmailViaEmailJS(name, email, message) {
    // kept for backward compatibility in case any other code calls it
    const templateParams = {
        to_email: 'grgnrzmnn@gmail.com',
        from_name: name,
        reply_to: email,
        message: message
    };

    if (window.emailjs && typeof window.emailjs.send === 'function') {
        return window.emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
    }

    return fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_id: SERVICE_ID,
            template_id: TEMPLATE_ID,
            user_id: PUBLIC_KEY,
            template_params: templateParams
        })
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
