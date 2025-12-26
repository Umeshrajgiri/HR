document.addEventListener('DOMContentLoaded', () => {
    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
            navbar.style.padding = '1rem 5%';
            navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
        } else {
            navbar.style.background = 'rgba(15, 23, 42, 0.8)';
            navbar.style.padding = '1.5rem 5%';
            navbar.style.boxShadow = 'none';
        }
    });

    // Mobile menu toggle (simple version)
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if(hamburger) {
        hamburger.addEventListener('click', () => {
            // In a real app, I'd toggle a class to slide in a menu
            // For now, let's just alert or log since we didn't style the mobile menu overlay deeply
             console.log('Mobile menu toggled');
             // Quick inline toggle for demonstration if this was full screen
             const isFlex = navLinks.style.display === 'flex';
             navLinks.style.display = isFlex ? 'none' : 'flex';
             if(!isFlex) {
                 navLinks.style.flexDirection = 'column';
                 navLinks.style.position = 'absolute';
                 navLinks.style.top = '70px';
                 navLinks.style.left = '0';
                 navLinks.style.right = '0';
                 navLinks.style.background = 'var(--bg-card)';
                 navLinks.style.padding = '2rem';
                 navLinks.style.borderBottom = '1px solid var(--glass-border)';
             } else {
                 navLinks.removeAttribute('style');
             }
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Simple entrance animation for cards
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.feature-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.6s ease-out';
        observer.observe(card);
    });
});
