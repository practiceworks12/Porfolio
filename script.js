document.addEventListener('DOMContentLoaded', () => {

    // --- === CONFIGURATION === ---
    const CONFIG = {
        STICKY_NAV_OFFSET: 10,
        SCROLL_TOP_VISIBILITY_OFFSET: 300,
        FORM_CONFIRMATION_TIMEOUT: 4000,
        CONTACT_FORM_ENDPOINT: "YOUR_FORM_ENDPOINT_HERE", // <<<====== !!! REPLACE THIS !!! IMPORTANT !!!
        INITIAL_PROJECTS_VISIBLE: 2, // MODIFIED: How many projects show initially (Set to 2 for demo)
        COPY_BUTTON_TIMEOUT: 2000,
        // === ADDED Config ===
        TYPING_SPEED: 100, // Milliseconds per character
        TYPING_DELETE_SPEED: 50,
        TYPING_DELAY_BETWEEN_WORDS: 2000, // Delay before starting next word
        COUNTER_ANIMATION_DURATION: 1500, // Milliseconds for counter animation
    };

    // --- === ELEMENT SELECTORS === ---
    const select = (selector, parent = document) => parent.querySelector(selector);
    const selectAll = (selector, parent = document) => parent.querySelectorAll(selector);

    const body = document.body;
    const header = select('#main-header');
    const hamburgerBtn = select('#hamburgerBtn');
    const mobileNavPanel = select('#mobileNavPanel');
    const themeToggleBtn = select('#themeToggle');
    const contactForm = select('#contact-form-main');
    const formStatusMsg = select('#contact-form-status');
    const scrollTopBtn = select('.scroll-to-top-btn');
    const animatedElements = selectAll('[data-animation]');
    const projectGrid = select('.project-grid');
    const allProjectCards = selectAll('#projects .project-card'); // Get NodeList for easier manipulation
    const showMoreProjectsBtn = select('#show-more-projects');
    const snippetCards = selectAll('.snippet-card');
    const allNavLinks = selectAll('.main-navigation .nav-link, .mobile-nav-panel .nav-link');
    const mobileNavLinks = selectAll('.nav-link', mobileNavPanel);

    // === ADDED Selectors ===
    const typingEffectElement = select('#typing-effect');
    const statNumberElements = selectAll('.stat-number');
    const testimonialCards = selectAll('.testimonial-card');


    // --- === STATE === ---
    let isMobileMenuVisible = false;
    let activeNavLink = select('.nav-link.active');
    // === ADDED State ===
    const wordsToType = ["Developer", "Designer", "Creator", "Problem Solver"]; // CONFIG: Words for typing effect
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    // --- === THEME HANDLING === ---
    const applyTheme = (theme) => {
        body.setAttribute('data-theme', theme);
        localStorage.setItem('portfolioTheme', theme);
        const sunIcon = select('.theme-icon-sun', themeToggleBtn);
        const moonIcon = select('.theme-icon-moon', themeToggleBtn);
        if(sunIcon && moonIcon) {
            sunIcon.style.display = theme === 'light' ? 'inline-block' : 'none';
            moonIcon.style.display = theme === 'dark' ? 'inline-block' : 'none';
        }
    };

    const initializeTheme = () => {
        const savedTheme = localStorage.getItem('portfolioTheme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
    };

    // --- === NAVIGATION === ---
    const toggleMobileMenu = () => {
        isMobileMenuVisible = !isMobileMenuVisible;
        hamburgerBtn?.classList.toggle('active', isMobileMenuVisible);
        hamburgerBtn?.setAttribute('aria-expanded', isMobileMenuVisible);
        mobileNavPanel?.classList.toggle('active', isMobileMenuVisible);
        body.style.overflow = isMobileMenuVisible ? 'hidden' : '';
        body.classList.toggle('mobile-menu-open', isMobileMenuVisible);
    };

    const closeMobileMenu = () => {
        if (isMobileMenuVisible) toggleMobileMenu();
    };

    // --- === SCROLL HANDLING === ---
    const handleScroll = () => {
        const currentScrollY = window.scrollY;
        header?.classList.toggle('sticky', currentScrollY > CONFIG.STICKY_NAV_OFFSET);
        scrollTopBtn?.classList.toggle('visible', currentScrollY > CONFIG.SCROLL_TOP_VISIBILITY_OFFSET);

        let currentSectionId = '';
        const sections = selectAll('main > section[id]'); // Select direct children sections of main
        const navHeightOffset = (header?.offsetHeight ?? 70) + 60; // Added offset for better activation point

        sections.forEach(section => {
            const sectionTop = section.offsetTop - navHeightOffset;
            const sectionBottom = sectionTop + section.offsetHeight;

            if (currentScrollY >= sectionTop && currentScrollY < sectionBottom) {
                 currentSectionId = section.getAttribute('id');
            }
            // Handle edge case where scroll is past the last section but not enough to trigger footer
             else if (currentScrollY >= sectionBottom && section === sections[sections.length - 1]) {
                 currentSectionId = section.getAttribute('id');
             }
        });

        // Fallback for when near the very top or slightly scrolled down into hero
        if (!currentSectionId && currentScrollY < (sections[0]?.offsetTop ?? navHeightOffset) ) {
             currentSectionId = 'home';
        } else if (!currentSectionId && currentScrollY >= (sections[sections.length-1].offsetTop + sections[sections.length-1].offsetHeight - window.innerHeight)) {
             // If scrolled near the bottom and no section matched, assume last section
             currentSectionId = sections[sections.length-1].getAttribute('id');
        }


        const newActiveLinkTarget = `#${currentSectionId}`;
        const currentActiveLink = select('.nav-link.active');

        // Update active link only if necessary
        if (currentSectionId && (!currentActiveLink || currentActiveLink.getAttribute('href') !== newActiveLinkTarget)) {
            allNavLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === newActiveLinkTarget);
            });
            activeNavLink = select(`.nav-link[href="${newActiveLinkTarget}"]`);
        }
    };


    // --- === HERO TYPING EFFECT (ADDED) === ---
    const typeEffect = () => {
        if (!typingEffectElement) return; // Exit if element doesn't exist

        const currentWord = wordsToType[wordIndex];
        const speed = isDeleting ? CONFIG.TYPING_DELETE_SPEED : CONFIG.TYPING_SPEED;

        // Update text content
        typingEffectElement.textContent = currentWord.substring(0, charIndex);

        // Logic for typing or deleting
        if (!isDeleting && charIndex < currentWord.length) {
            charIndex++;
            setTimeout(typeEffect, speed);
        } else if (isDeleting && charIndex > 0) {
            charIndex--;
            setTimeout(typeEffect, speed);
        } else {
            // Switch state (deleting or moving to next word)
            isDeleting = !isDeleting;
            if (!isDeleting) { // Finished deleting, move to next word
                wordIndex = (wordIndex + 1) % wordsToType.length;
            }
            // Use longer delay before starting to type, shorter before starting to delete
            const delay = isDeleting ? CONFIG.TYPING_DELAY_BETWEEN_WORDS / 2 : CONFIG.TYPING_DELAY_BETWEEN_WORDS;
            setTimeout(typeEffect, delay);
        }
    };

    // --- === STATS COUNTER ANIMATION (ADDED) === ---
    const animateCounter = (element) => {
        const target = parseInt(element.dataset.target, 10);
        if (isNaN(target) || element.dataset.counted === 'true') return; // Skip if not a number or already counted

        element.dataset.counted = 'true'; // Mark as counted
        element.textContent = '0'; // Start from 0 visually
        let current = 0;
        const stepTime = 16; // Approx 60fps
        const totalSteps = Math.max(1, CONFIG.COUNTER_ANIMATION_DURATION / stepTime); // Avoid division by zero
        const increment = target / totalSteps;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                element.textContent = Math.ceil(current);
                requestAnimationFrame(updateCounter); // Use rAF for smoother animation
            } else {
                element.textContent = target; // Ensure exact target value at the end
            }
        };
        requestAnimationFrame(updateCounter); // Start the animation frame loop
    };

    // --- === TESTIMONIAL STAR RATING (ADDED) === ---
    const renderStars = (card) => {
        const ratingContainer = select('.star-rating', card);
        const rating = parseFloat(card.dataset.rating);
        // Prevent re-rendering if already done
        if (!ratingContainer || isNaN(rating) || ratingContainer.dataset.rendered === 'true') return;

        ratingContainer.dataset.rendered = 'true'; // Mark as rendered
        ratingContainer.innerHTML = ''; // Clear potential placeholders
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        

        for (let i = 0; i < fullStars; i++) {
            ratingContainer.innerHTML += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            ratingContainer.innerHTML += '<i class="fas fa-star-half-alt"></i>';
        }
        for (let i = 0; i < emptyStars; i++) {
            ratingContainer.innerHTML += '<i class="far fa-star"></i>'; // Use 'far' for empty stars
        }
    };


    // --- === CONTACT FORM === ---
    const handleFormSubmission = async (event) => {
        event.preventDefault();
        if (!contactForm) return;
        const endpoint = CONFIG.CONTACT_FORM_ENDPOINT;
        if (!endpoint || endpoint === "YOUR_FORM_ENDPOINT_HERE") {
            showFormStatus("Error: Form endpoint not configured!", 'error', 5000);
            console.error("Contact form endpoint missing in script.js CONFIG");
            return;
        }
        const formData = new FormData(contactForm);
        const submitBtn = select('.submit-btn-contact', contactForm);
        submitBtn.disabled = true; submitBtn.classList.add('loading'); hideFormStatus();
        try {
            const response = await fetch(endpoint, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' } });
            if (response.ok) {
                showFormStatus("Message sent successfully! Thank you.", 'success');
                contactForm.reset();
            } else {
                // Try to parse error from server, fallback to status text
                let errorMsg = `Server error: ${response.statusText} (${response.status})`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.error) {
                        errorMsg = errorData.error;
                    }
                } catch (parseError) {
                     console.warn("Could not parse error response as JSON.", parseError);
                }
                 throw new Error(errorMsg);
            }
        } catch (error) {
            console.error("Form submission error:", error);
            showFormStatus(`Error: ${error.message || 'Could not send message.'}`, 'error');
        } finally {
            submitBtn.disabled = false; submitBtn.classList.remove('loading');
        }
    };
    const showFormStatus = (message, type = 'info', duration = CONFIG.FORM_CONFIRMATION_TIMEOUT) => {
        if (!formStatusMsg) return;
        formStatusMsg.textContent = message;
        // Reset classes before adding new ones
        formStatusMsg.className = 'form-status-display';
        // Add visibility and type classes after a tiny delay for transition
        setTimeout(() => {
             formStatusMsg.classList.add('visible', type);
        }, 10);
        // Clear any existing timeout
        if (formStatusMsg.timeoutId) clearTimeout(formStatusMsg.timeoutId);
        // Set new timeout to hide
        formStatusMsg.timeoutId = setTimeout(hideFormStatus, duration);
    };
    const hideFormStatus = () => {
        if(formStatusMsg) {
            formStatusMsg.classList.remove('visible');
            // Optionally remove type classes after transition ends
            // setTimeout(() => formStatusMsg.classList.remove('success', 'error', 'info'), 300);
            if (formStatusMsg.timeoutId) {
                clearTimeout(formStatusMsg.timeoutId);
                formStatusMsg.timeoutId = null;
            }
        }
    };

    // --- === PROJECTS "SHOW MORE" (MODIFIED & IMPLEMENTED) === ---
    const showMoreProjects = () => {
        if (!projectGrid || !showMoreProjectsBtn) return;

        // Find hidden projects *within the projectGrid*
        const hiddenProjects = projectGrid.querySelectorAll('.project-card.project-hidden');

        if (hiddenProjects.length === 0) {
            showMoreProjectsBtn.style.display = 'none'; // Hide button if no hidden projects left
            showMoreProjectsBtn.disabled = true;
            return;
        }

        hiddenProjects.forEach((project, index) => {
            // 1. Make it take up space (removes display: none)
            project.style.display = 'block';
            // 2. Use setTimeout to allow CSS transition to catch the change from hidden styles
            setTimeout(() => {
                project.classList.remove('project-hidden'); // This triggers the opacity/transform transition in CSS
            }, 50 * index); // Stagger the appearance slightly (optional)
        });

        // Hide the button immediately after click (or you could wait for animation)
        showMoreProjectsBtn.style.display = 'none';
        showMoreProjectsBtn.disabled = true;
    };


    // --- === CODE SNIPPETS INTERACTIONS === ---
    const toggleSnippetSection = (card, sectionClass) => {
        const isCodeTarget = sectionClass === 'code-visible';
        const targetWrapper = select(isCodeTarget ? '.snippet-code-wrapper' : '.snippet-details-wrapper', card);
        const otherWrapper = select(isCodeTarget ? '.snippet-details-wrapper' : '.snippet-code-wrapper', card);
        const targetButton = select(isCodeTarget ? '.snippet-toggle-code' : '.snippet-toggle-details', card);
        const otherButton = select(isCodeTarget ? '.snippet-toggle-details' : '.snippet-toggle-code', card);
        const otherClass = isCodeTarget ? 'details-visible' : 'code-visible';

        // Close other section if open
        if (card.classList.contains(otherClass)) {
            card.classList.remove(otherClass);
            otherButton?.classList.remove('active');
            otherButton?.setAttribute('aria-expanded', 'false');
        }

        // Toggle target section
        const isOpening = !card.classList.contains(sectionClass);
        card.classList.toggle(sectionClass, isOpening);
        targetButton?.classList.toggle('active', isOpening);
        targetButton?.setAttribute('aria-expanded', isOpening);
    };

    const handleCopyCode = async (button) => {
        const codeWrapper = button.closest('.snippet-code-wrapper');
        // Find the hidden textarea specifically for copying
        const textarea = select('.copy-textarea', codeWrapper);
        if (!textarea || !textarea.value) {
            console.warn("Textarea for copying not found or is empty.");
            button.innerHTML = '<i class="fas fa-times"></i> Error';
            return;
        }

        const originalButtonHTML = button.innerHTML; // Store full HTML
        try {
            await navigator.clipboard.writeText(textarea.value);
            button.innerHTML = '<i class="fas fa-check"></i> Copied!';
            button.classList.add('copied');
            button.disabled = true; // Disable briefly
        } catch (err) {
            console.error('Failed to copy: ', err);
            button.innerHTML = '<i class="fas fa-times"></i> Error';
             button.classList.add('error');
        } finally {
            setTimeout(() => {
                button.innerHTML = originalButtonHTML;
                button.classList.remove('copied', 'error');
                button.disabled = false; // Re-enable
            }, CONFIG.COPY_BUTTON_TIMEOUT);
        }
    };

    // Attach listeners to snippet cards
    snippetCards.forEach(card => {
        select('.snippet-toggle-code', card)?.addEventListener('click', () => toggleSnippetSection(card, 'code-visible'));
        select('.snippet-toggle-details', card)?.addEventListener('click', () => toggleSnippetSection(card, 'details-visible'));
        select('.snippet-copy-code', card)?.addEventListener('click', (e) => handleCopyCode(e.currentTarget));
    });

    // --- === Intersection Observer (Scroll Animations - MODIFIED) === ---
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const targetElement = entry.target;
                const delay = targetElement.dataset.delay || '0s';
                targetElement.style.setProperty('--animation-delay', delay);
                targetElement.classList.add('is-visible');

                // === Trigger counters, stars, and skills on visibility ===
                if (targetElement.classList.contains('stat-item')) {
                    const counter = select('.stat-number', targetElement);
                    if(counter) animateCounter(counter);
                } else if (targetElement.classList.contains('testimonial-card')) {
                    renderStars(targetElement);
                } else if (targetElement.classList.contains('skill-card')) {
                    // CSS : .skill-card.is-visible .skill-progress-bar span handles animation
                }

                // Unobserve after animation for performance
                observer.unobserve(targetElement);

            }
            // Note: Not removing 'is-visible' when scrolling out
        });
    };
    // Create the observer instance
    const scrollObserver = new IntersectionObserver(observerCallback, {
        threshold: 0.1, // Trigger when 10% visible
        rootMargin: "0px 0px -50px 0px" // Trigger slightly before fully in view
    });

    // Observe all elements with the [data-animation] attribute
    animatedElements.forEach(el => {
        scrollObserver.observe(el);
    });


    // --- === EVENT LISTENERS (General) === ---
    themeToggleBtn?.addEventListener('click', () => {
        applyTheme(body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });
    hamburgerBtn?.addEventListener('click', toggleMobileMenu);

    window.addEventListener('scroll', handleScroll, { passive: true });
    scrollTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    contactForm?.addEventListener('submit', handleFormSubmission);
    showMoreProjectsBtn?.addEventListener('click', showMoreProjects); // Listener for show more
    document.addEventListener('keydown', (e) => { if (e.key === "Escape" && isMobileMenuVisible) closeMobileMenu(); });
    // Close mobile menu when a link inside it is clicked
    mobileNavLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

    // --- === SNIPPET-SPECIFIC JS (Example Fetch) === ---
    const setupSnippetExamples = () => {
        const fetchDataBtn = select('#fetchDataBtn');
        const outputElement = select('#fetchResultOutput'); // Select output element once

        if (fetchDataBtn && outputElement) {
            fetchDataBtn.addEventListener('click', async () => {
                const userId = Math.floor(Math.random() * 10) + 1;
                const apiUrl = `https://jsonplaceholder.typicode.com/users/${userId}`;
                outputElement.textContent = 'Fetching...';
                fetchDataBtn.disabled = true; // Disable button during fetch
                try {
                    const response = await fetch(apiUrl);
                    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
                    const data = await response.json();
                    outputElement.textContent = JSON.stringify(data, null, 2);
                } catch (error) {
                    console.error('Error fetching data:', error);
                    outputElement.textContent = `Error: ${error.message}`;
                } finally {
                    fetchDataBtn.disabled = false; // Re-enable button
                }
            });
        }
    };

    // --- === INITIALIZATIONS === ---
    const initializeApp = () => {
        console.log("Initializing Portfolio App ...");
        initializeTheme();
        handleScroll(); // Run scroll handler once on load for correct initial nav state

        // Set Footer Year
        const footerYear = select('#footer-year');
        if (footerYear) footerYear.textContent = new Date().getFullYear();

        // === MODIFIED: Initialize Project Visibility ===
        if (projectGrid && allProjectCards.length > CONFIG.INITIAL_PROJECTS_VISIBLE) {
            allProjectCards.forEach((card, index) => {
                if (index >= CONFIG.INITIAL_PROJECTS_VISIBLE) {
                    card.style.display = 'none'; // Hide initially
                    card.classList.add('project-hidden'); // Add class for CSS targeting and JS selection
                } else {
                    card.style.display = 'block'; // Ensure initially visible ones are displayed correctly
                    card.classList.remove('project-hidden');
                }
            });
            // Show the button only if there are projects to show
            if (showMoreProjectsBtn) {
                 showMoreProjectsBtn.style.display = 'inline-flex'; // Show the button using its default display type
                 showMoreProjectsBtn.disabled = false;
            }
        } else {
             // Hide button if not needed (e.g., fewer projects than initial count)
            if (showMoreProjectsBtn) {
                showMoreProjectsBtn.style.display = 'none';
            }
        }

        // Initialize Snippet Examples
        setupSnippetExamples();

        // === Start Typing Effect ===
        if(typingEffectElement) {
            // Optional: Clear initial text before starting to type if needed
            // typingEffectElement.textContent = '';
            setTimeout(typeEffect, CONFIG.TYPING_DELAY_BETWEEN_WORDS / 2); // Start after a short delay
        } else {
            console.warn("Typing effect element (#typing-effect) not found.");
        }

        // === Initial Star Render (for above-the-fold testimonials) ===
        testimonialCards.forEach(card => {
             const cardRect = card.getBoundingClientRect();
             if (cardRect.top < window.innerHeight && cardRect.bottom >= 0) {
                 renderStars(card);
             }
        });

        console.log("Initialization Complete.");
    };

    initializeApp(); // Run all initialization tasks

}); // End DOMContentLoaded