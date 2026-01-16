export function initAnimations() {
    gsap.registerPlugin(ScrollTrigger);


    gsap.to('.hero-content', {
        y: 0,
        opacity: 1,
        duration: 2,
        ease: "expo.out",
        delay: 0.5
    });


    gsap.utils.toArray('.reveal-section').forEach(section => {
        gsap.to(section, {
            scrollTrigger: {
                trigger: section,
                start: "top 85%",
                toggleActions: "play none none none"
            },
            y: 0,
            opacity: 1,
            duration: 1.5,
            ease: "power3.out"
        });
    });


    const container = document.getElementById('particle-container');
    for (let i = 0; i < 15; i++) {
        const p = document.createElement('div');
        p.className = 'absolute bg-gold/5 rounded-full blur-[2px] pointer-events-none';
        const size = Math.random() * 8 + 4;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        container.appendChild(p);
        
        gsap.to(p, {
            y: `+=${Math.random() * 300 - 150}`,
            x: `+=${Math.random() * 200 - 100}`,
            opacity: Math.random() * 0.2,
            duration: Math.random() * 15 + 10,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
        });
    }


    gsap.utils.toArray('#morphology-grid > div').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: '#morphology',
                start: "top 70%",
            },
            y: 50,
            opacity: 0,
            duration: 1,
            delay: i * 0.15,
            ease: "power2.out"
        });
    });
}
