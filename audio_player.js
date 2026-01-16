// audio_player.js
export function initAudio() {
    const audio = document.getElementById('bg-music');
    const btn = document.getElementById('music-toggle');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    
    let isPlaying = false;
    let userHasPaused = false; 

    function updateState(playing) {
        isPlaying = playing;
        if (playing) {
            btn.classList.add('bg-white/60');
            playIcon.classList.add('hidden');
            pauseIcon.classList.remove('hidden');
        } else {
            btn.classList.remove('bg-white/60');
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
        }
    }

    function playMusic() {
        if (isPlaying || userHasPaused) return;
        audio.play().then(() => {
            console.log("Music auto-played successfully!");
            updateState(true);
            removeListeners();
        }).catch(error => {
            console.log("Waiting for user interaction...");
        });
    }

    function interactionHandler() {
        playMusic();
    }

    // 监听 鼠标点击、键盘按下、手机触摸
    function addListeners() {
        document.addEventListener('click', interactionHandler, { capture: true, once: true });
        document.addEventListener('keydown', interactionHandler, { capture: true, once: true });
        document.addEventListener('touchstart', interactionHandler, { capture: true, once: true });
    }

    function removeListeners() {
        document.removeEventListener('click', interactionHandler, { capture: true });
        document.removeEventListener('keydown', interactionHandler, { capture: true });
        document.removeEventListener('touchstart', interactionHandler, { capture: true });
    }

    // 手动按钮控制
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isPlaying) {
            audio.pause();
            userHasPaused = true;
            updateState(false);
        } else {
            audio.play();
            userHasPaused = false;
            updateState(true);
        }
    });

    // 1. 加载时尝试直接播
    playMusic();
    // 2. 只有交互了才能播
    addListeners();
}
