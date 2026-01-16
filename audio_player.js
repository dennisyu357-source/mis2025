export function initAudio() {
    const audio = new Audio('./music.mp3');
    audio.loop = true;
    const btn = document.getElementById('music-toggle');
    let isPlaying = false;

    btn.addEventListener('click', () => {
        if (isPlaying) {
            audio.pause();
            btn.classList.remove('bg-white/60');
            btn.innerHTML = '<i data-lucide="music" class="w-4 h-4"></i>';
        } else {
            audio.play().catch(e => console.log("User interaction required"));
            btn.classList.add('bg-white/60');
            btn.innerHTML = '<i data-lucide="volume-2" class="w-4 h-4"></i>';
        }
        isPlaying = !isPlaying;
        lucide.createIcons();
    });
}
