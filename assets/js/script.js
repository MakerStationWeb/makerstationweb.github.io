// Maker Station - Interactive JavaScript

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav__link');
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

    // Toggle mobile menu
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', function() {
            const isActive = hamburger.classList.contains('active');
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');

            // Update ARIA attribute
            hamburger.setAttribute('aria-expanded', !isActive);
        });

        // Close mobile menu when clicking on a regular nav link
        navLinks.forEach(link => {
            if (!link.classList.contains('dropdown-toggle')) {
                link.addEventListener('click', function() {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                    hamburger.setAttribute('aria-expanded', 'false');
                });
            }
        });

        // Handle dropdown toggles on mobile
        dropdownToggles.forEach(toggle => {
            toggle.addEventListener('click', function(e) {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    const dropdown = this.parentElement;
                    dropdown.classList.toggle('active');
                }
            });
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navMenu.contains(event.target);
            const isClickOnHamburger = hamburger.contains(event.target);

            if (!isClickInsideNav && !isClickOnHamburger && navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');

                // Close all dropdowns
                document.querySelectorAll('.nav-dropdown.active').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });

        // Close mobile menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navMenu.classList.contains('active')) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Tool preview handling - using Screenshot API
    const toolPreviews = document.querySelectorAll('.tool-preview');
    const API_TOKEN = 'BT9EB4K-JJ14EHG-KZ4HZ5X-QZ8QK32';
    const SCREENSHOT_WIDTH = 800;
    const SCREENSHOT_HEIGHT = 450;

    toolPreviews.forEach(preview => {
        const targetUrl = preview.getAttribute('data-url');

        // Skip if no URL or placeholder
        if (!targetUrl || targetUrl === 'about:blank') {
            return;
        }

        // Add loading state
        preview.classList.add('loading');

        // Encode the target URL
        const encodedUrl = encodeURIComponent(targetUrl);

        // Build screenshot API URL
        const screenshotUrl = `https://shot.screenshotapi.net/v3/screenshot?token=${API_TOKEN}&url=${encodedUrl}&width=${SCREENSHOT_WIDTH}&height=${SCREENSHOT_HEIGHT}&output=image&file_type=png&no_cookie_banners=true&wait_for_event=load`;

        // Create an image to preload the screenshot
        const img = new Image();

        img.onload = () => {
            // Set as background image
            preview.style.backgroundImage = `url('${screenshotUrl}')`;
            preview.classList.remove('loading');
            preview.classList.add('loaded');
        };

        img.onerror = () => {
            // Keep gradient background on error
            preview.classList.remove('loading');
            console.warn(`Failed to load screenshot for: ${targetUrl}`);
        };

        // Start loading
        img.src = screenshotUrl;
    });

    console.log(`Initialized ${toolPreviews.length} tool preview cards with Screenshot API`);
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add active state to navigation based on scroll position
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.quick-link-btn');

    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 100)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});

// Add fade-in animation on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe resource cards for animation
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.resource-card, .equipment-feature-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
});

// External link warning (optional)
document.querySelectorAll('a[target="_blank"]').forEach(link => {
    link.addEventListener('click', (e) => {
        // Optional: Add external link icon or warning
        // For now, just ensures external links work properly
    });
});

console.log('Maker Station - Ready');
