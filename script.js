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

// Contact form handling using EmailJS SDK
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

        // EmailJS configuration
        const SERVICE_ID = 'service_wz2pglu';
        const TEMPLATE_ID = 'template_e9tym0u';
        // emailjs.init(...) is already called in index.html

        const templateParams = {
            to_email: 'grgnrzmnn@gmail.com',
            from_name: name,
            reply_to: email,
            message: message
        };

        // Use EmailJS SDK method which handles CORS and proper headers
        if (window.emailjs && typeof window.emailjs.send === 'function') {
            window.emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
                .then(function () {
                    setStatus('Message sent! Thank you — I will reply as soon as I can.');
                    contactForm.reset();
                }, function (error) {
                    console.error('EmailJS error:', error);
                    setStatus('Failed to send message. Please try again later or contact me directly via email.', true);
                })
                .finally(function () {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                    }
                });
        } else {
            // Fallback: try REST API
            fetch('https://api.emailjs.com/api/v1.0/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    service_id: SERVICE_ID,
                    template_id: TEMPLATE_ID,
                    user_id: 'sgdQIdSdXs4BchEI6',
                    template_params: templateParams
                })
            })
            .then(response => {
                if (response.ok) {
                    setStatus('Message sent! Thank you — I will reply as soon as I can.');
                    contactForm.reset();
                } else {
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
        }
    });
}


function sendEmailViaEmailJS(name, email, message) {
    // kept for backward compatibility in case any other code calls it
    const SERVICE_ID = 'service_wz2pglu';
    const TEMPLATE_ID = 'template_e9tym0u';

    const templateParams = {
        to_email: 'grgnrzmnn@gmail.com',
        from_name: name,
        reply_to: email,
        message: message
    };

    if (window.emailjs && typeof window.emailjs.send === 'function') {
        return window.emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams);
    }

    return fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            service_id: SERVICE_ID,
            template_id: TEMPLATE_ID,
            user_id: 'sgdQIdSdXs4BchEI6',
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
