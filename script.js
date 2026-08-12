const PUBLIC_KEY = 'sgdQIdSdXs4BchEI6';
const SERVICE_ID = 'service_wz2pglu';
const TEMPLATE_ID = 'template_e9tym0u';

function getEmailJS(timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        if (window.emailjs && typeof window.emailjs.send === 'function') {
            // attempt to init (safe to call multiple times)
            if (typeof window.emailjs.init === 'function' && PUBLIC_KEY) {
                try { window.emailjs.init(PUBLIC_KEY); } catch (e) { console.warn('EmailJS init() threw:', e); }
            }
            return resolve(window.emailjs);
        }
        
        let attempts = 0;
        const check = setInterval(() => {
            attempts++;
            if (window.emailjs && typeof window.emailjs.send === 'function') {
                clearInterval(check);
                if (typeof window.emailjs.init === 'function' && PUBLIC_KEY) {
                    try { window.emailjs.init(PUBLIC_KEY); } catch (e) { console.warn('EmailJS init() threw:', e); }
                }
                return resolve(window.emailjs);
            }
            if (attempts > timeoutMs / 100) {
                clearInterval(check);
                reject(new Error('EmailJS not available'));
            }
        }, 100);
    });
}

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
        console.debug('[Contact] Attempting to send via EmailJS');

        getEmailJS()
            .then(() => {
                console.debug('[Contact] EmailJS ready — calling send');
                // template variable names must match what's in your EmailJS template
                const templateParams = {
                    to_email: 'grgnrzmnn@gmail.com',
                    from_name: name,
                    reply_to: email,
                    message: message
                };

                // quick runtime sanity-check: ensure service/template ids are set
                if (!SERVICE_ID || !TEMPLATE_ID) {
                    throw new Error('Missing EmailJS SERVICE_ID or TEMPLATE_ID');
                }

                return window.emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
            })
            .then((result) => {
                console.debug('[Contact] Send succeeded:', result);
                setStatus('Message sent! Thank you — I will reply as soon as I can.');
                contactForm.reset();
            })
            .catch((error) => {
                // emailjs may return an object with .text or .status/text in different SDK versions
                console.error('[Contact] Send failed:', error);
                const serverMsg = error && (error.text || error.message || (error.status && JSON.stringify(error.status)) || JSON.stringify(error));
                setStatus('Failed to send message. ' + (serverMsg ? serverMsg : 'Please try again later or email me directly.'), true);
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
