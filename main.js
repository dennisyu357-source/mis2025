// --- main.js 完整版 (方案：稳重镜头 + 流光星钻 + 底部金色重写) ---

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'; 
import { morphologyData, profileData, datingRecords, plans, clues } from './data.js';
import { initAnimations } from './animations.js';
import { initAudio } from './audio_player.js';

// --- 全局变量 ---
let scene, camera, renderer, model, raycaster, mouse;
let isAnimating = false; 
let bubbleTimer = null;  

const container = document.getElementById('three-cat-container');
const voiceAudio = document.getElementById('voice-audio');
const speechBubble = document.getElementById('speech-bubble');
const offsetAngle = -20 * (Math.PI / 180);

function initThree() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5; 

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // 灯光
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
    directionalLight.position.set(2, 5, 5); 
    scene.add(directionalLight);
    
    const backLight = new THREE.DirectionalLight(0xffd700, 0.5); 
    backLight.position.set(-2, 3, -5);
    scene.add(backLight);

    // 加载器
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' }); 

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    
    const loaderEl = document.getElementById('loader');
    const progressEl = loaderEl.querySelector('.loader-progress');

    loader.load(
        './cat.glb', 
        (gltf) => {
            model = gltf.scene;
            model.rotation.set(0, 0, 0); 
            model.rotation.y = offsetAngle;
            scene.add(model);
            adjustModelForMobile(); 
            gsap.to(container, { opacity: 1, duration: 2, ease: "power2.out" });
            gsap.to(loaderEl, { opacity: 0, duration: 0.8, onComplete: () => { loaderEl.style.display = 'none'; }});
            animateThree();
        },
        (xhr) => {
            if (xhr.lengthComputable) {
                const percent = (xhr.loaded / xhr.total) * 100;
                gsap.to(progressEl, { width: `${percent}%`, duration: 0.2, overwrite: true });
            }
        },
        (error) => { console.error('模型加载失败:', error); gsap.to(loaderEl, { opacity: 0, onComplete: () => loaderEl.style.display = 'none' }); }
    );

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    window.addEventListener('resize', onWindowResize);
}

// --- 交互核心 ---
function onClick(event) {
    if (event.target.tagName !== 'CANVAS') return;
    if (!model) return;
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([model], true);

    if (intersects.length > 0) {
        // 1. 闪光
        triggerWhiteFlash();

        // 2. 气泡
        if (speechBubble) {
            if (bubbleTimer) { clearTimeout(bubbleTimer); bubbleTimer = null; }
            speechBubble.classList.add('active');
            gsap.to(speechBubble, { opacity: 1, scale: 1, duration: 0.6, ease: "back.out(1.7)", overwrite: true });
            bubbleTimer = setTimeout(() => {
                speechBubble.classList.remove('active');
                gsap.to(speechBubble, { opacity: 0, scale: 0.9, duration: 0.4 });
                bubbleTimer = null;
            }, 7000); 
        }

        // 3. 动作
        if (!isAnimating) {
            isAnimating = true;
            if (voiceAudio) { voiceAudio.currentTime = 0; voiceAudio.play().catch(e => console.log('Audio error:', e)); }

            const isMobile = window.innerWidth < 768;
            const baseY = isMobile ? -0.8 : -0.5;
            const baseScale = isMobile ? 0.9 : 1.2;
            const tl = gsap.timeline({ onComplete: () => { isAnimating = false; } });

            tl.to(model.position, { y: baseY + 0.04, z: model.position.z + 0.15, duration: 0.6, ease: "power2.out" })
              .to(model.scale, { x: baseScale * 1.01, y: baseScale * 1.01, z: baseScale * 1.01, duration: 0.6, ease: "power2.out" }, "<")
              .to({}, { duration: 0.2 }) 
              .to(model.position, { y: baseY, z: 0, duration: 0.8, ease: "power2.inOut" })
              .to(model.scale, { x: baseScale, y: baseScale, z: baseScale, duration: 0.8, ease: "power2.inOut" }, "<");
        }

        // 4. 特效：流光星钻
        triggerSparkles(event.clientX, event.clientY);
    }
}

// 柔光闪烁
function triggerWhiteFlash() {
    const flash = document.createElement('div');
    flash.style.position = 'fixed'; flash.style.inset = '0'; flash.style.backgroundColor = 'white';
    flash.style.zIndex = '9997'; flash.style.pointerEvents = 'none'; flash.style.opacity = '0';
    document.body.appendChild(flash);
    gsap.to(flash, { opacity: 0.3, duration: 0.15, yoyo: true, repeat: 1, onComplete: () => flash.remove() });
}

// 流光星钻特效
function triggerSparkles(x, y) {
    // 十字星
    const star = document.createElement('div');
    star.style.position = 'fixed'; star.style.left = `${x}px`; star.style.top = `${y}px`;
    star.style.width = '0px'; star.style.height = '0px'; star.style.backgroundColor = '#FFFFFF';
    star.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
    star.style.transform = 'translate(-50%, -50%)'; star.style.zIndex = '9999'; star.style.pointerEvents = 'none';
    document.body.appendChild(star);
    gsap.to(star, { width: '50px', height: '50px', rotation: 90, opacity: 0, duration: 0.4, ease: "power2.out", onComplete: () => star.remove() });

    // 波纹
    const ripple = document.createElement('div');
    ripple.style.position = 'fixed'; ripple.style.left = `${x}px`; ripple.style.top = `${y}px`;
    ripple.style.width = '0px'; ripple.style.height = '0px';
    ripple.style.border = '1.5px solid rgba(255, 255, 255, 0.8)'; 
    ripple.style.borderRadius = '50%'; ripple.style.transform = 'translate(-50%, -50%)';
    ripple.style.pointerEvents = 'none'; ripple.style.zIndex = '9998'; 
    document.body.appendChild(ripple);
    gsap.to(ripple, { width: '80px', height: '80px', opacity: 0, duration: 0.5, ease: "power1.out", onComplete: () => ripple.remove() });

    // 粒子
    const count = 16 + Math.floor(Math.random() * 8); 
    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        const size = 3 + Math.random() * 5; 
        particle.style.position = 'fixed'; particle.style.left = `${x}px`; particle.style.top = `${y}px`;
        particle.style.width = `${size}px`; particle.style.height = `${size}px`;
        const colorType = Math.random();
        if(colorType > 0.6) particle.style.backgroundColor = '#FFD700'; 
        else if(colorType > 0.2) particle.style.backgroundColor = '#FFFFFF'; 
        else particle.style.backgroundColor = '#E0F7FA'; 
        particle.style.transform = 'rotate(45deg)'; 
        particle.style.pointerEvents = 'none'; particle.style.zIndex = '9999';
        particle.style.boxShadow = `0 0 ${size}px ${particle.style.backgroundColor}`;
        document.body.appendChild(particle);
        const angle = Math.random() * Math.PI * 2;
        const velocity = 40 + Math.random() * 60; 
        const moveX = Math.cos(angle) * velocity;
        const moveY = Math.sin(angle) * velocity;
        gsap.to(particle, { x: moveX, y: moveY, rotation: Math.random() * 360, opacity: 0, scale: 0, duration: 0.5 + Math.random() * 0.5, ease: "power2.out", onComplete: () => { particle.remove(); } });
    }
}

// --- 基础功能 ---
function onMouseMove(event) {
    if (!model) return;
    const x = (event.clientX / window.innerWidth) - 0.5;
    const y = (event.clientY / window.innerHeight) - 0.5;
    gsap.to(model.rotation, { y: x * (Math.PI / 3) + offsetAngle, x: y * (Math.PI / 12), duration: 1.0, ease: "power2.out" });
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    adjustModelForMobile();
}
function adjustModelForMobile() {
    if (!model) return;
    const width = window.innerWidth;
    if (width < 768) {
        model.position.set(0, -0.8, 0); model.scale.set(0.9, 0.9, 0.9);
        camera.position.z = 6; 
    } else {
        model.position.set(1.5, -0.5, 0); model.scale.set(1.2, 1.2, 1.2);
        camera.position.z = 5; 
    }
}
function animateThree() {
    requestAnimationFrame(animateThree);
    renderer.render(scene, camera);
}
function renderClues() {
    const grid = document.getElementById('clue-grid');
    grid.innerHTML = clues.map(clue => `
        <div class="clue-item group rounded-xl p-8 flex flex-col justify-end cursor-pointer relative overflow-hidden transition-all duration-500 active:scale-95">
            <div class="clue-overlay absolute inset-0 bg-stone-900/80 backdrop-blur-md flex items-center justify-center transition-all duration-500 z-20">
                <div class="flex flex-col items-center gap-2 group-hover:opacity-0 transition-opacity duration-300">
                    <i data-lucide="eye-off" class="w-6 h-6 text-stone-500"></i>
                    <span class="text-[10px] text-stone-600 uppercase tracking-widest mt-2">点击揭秘</span>
                </div>
            </div>
            <div class="relative z-10">
                <span class="text-[10px] text-gold uppercase tracking-[0.3em] font-serif mb-2 block">${clue.tag}</span>
                <h4 class="text-xl font-serif mb-3">${clue.title}</h4>
                <p class="text-xs text-stone-400 leading-relaxed font-light">${clue.desc}</p>
                <p class="clue-roast mt-4 text-[9px] text-gold italic border-t border-white/5 pt-4 opacity-0 translate-y-4 transition-all duration-700 ease-out">${clue.roast}</p>
            </div>
        </div>
    `).join('');
    grid.querySelectorAll('.clue-item').forEach(item => {
        item.addEventListener('click', () => {
            item.querySelector('.clue-roast').classList.remove('opacity-0', 'translate-y-4');
            item.querySelector('.clue-overlay').style.opacity = '0';
            item.querySelector('.clue-overlay').style.pointerEvents = 'none'; 
        });
    });
}
function renderPlans() {
    const planList = document.getElementById('plan-list');
    planList.innerHTML = plans.map((plan, i) => `
        <div class="checklist-item group py-8 border-b border-stone-100 flex items-center justify-between cursor-pointer" data-index="${i}">
            <div class="flex-1">
                <h3 class="text-2xl font-serif font-bold transition-all duration-500">${plan.text}</h3>
                <p class="text-[10px] text-stone-400 italic mt-1 uppercase tracking-widest font-serif">${plan.tip}</p>
            </div>
            <div class="w-12 h-12 border border-stone-100 flex items-center justify-center rounded-full group-hover:border-gold/50 transition-all">
                <i data-lucide="check" class="w-4 h-4 text-gold opacity-0 check-icon"></i>
            </div>
        </div>
    `).join('');
    document.querySelectorAll('.checklist-item').forEach(item => {
        item.addEventListener('click', (e) => {
            triggerSparkles(e.clientX, e.clientY);
            gsap.to(item, { x: 5, duration: 0.05, repeat: 3, yoyo: true });
            const isCompleted = item.classList.toggle('completed');
            item.querySelector('.check-icon').style.opacity = isCompleted ? '1' : '0';
        });
    });
}
function renderDating() {
    const timeline = document.getElementById('dating-timeline');
    timeline.innerHTML = datingRecords.map((record, i) => `
        <article class="flex flex-col md:flex-row gap-20 group">
            <div class="md:w-1/3 border-t border-stone-200 pt-10">
                <span class="text-[10px] text-stone-300 tracking-[0.8em] uppercase block mb-6 font-serif">${record.date}</span>
                <h3 class="text-4xl font-serif font-bold text-stone-800 mb-4">${record.location}</h3>
            </div>
            <div class="md:w-2/3 pt-10">
                <p class="text-stone-700 font-serif text-2xl leading-relaxed mb-8 italic">“${record.evaluation}”</p>
                <div class="text-stone-500 text-sm leading-[2] font-sans max-w-xl font-light">
                    ${record.narrative}
                </div>
            </div>
        </article>
    `).join('');
}
function renderMorphology() {
    const grid = document.getElementById('morphology-grid');
    grid.innerHTML = morphologyData.map(item => `
        <div class="group">
            <div class="aspect-[4/5] rounded-2xl overflow-hidden mb-6 bg-stone-100">
                <img src="${item.image}" class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700">
            </div>
            <h4 class="text-[10px] tracking-[0.4em] text-gold uppercase mb-2 font-bold font-serif">${item.title}</h4>
            <p class="text-xs text-stone-400 font-light leading-relaxed">${item.desc}</p>
        </div>
    `).join('');
}
function renderProfile() {
    const likesGrid = document.getElementById('likes-grid');
    const dislikesGrid = document.getElementById('dislikes-grid');
    likesGrid.innerHTML = profileData.likes.map(item => `
        <div class="flex items-center gap-4">
            <div class="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-300"><i data-lucide="${item.icon}" class="w-3.5 h-3.5"></i></div>
            <span class="text-sm font-serif text-stone-600">${item.name}</span>
        </div>
    `).join('');
    dislikesGrid.innerHTML = profileData.dislikes.map(item => `
        <div class="flex items-center gap-4 opacity-40">
            <div class="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400"><i data-lucide="${item.icon}" class="w-3.5 h-3.5"></i></div>
            <span class="text-sm font-serif text-stone-500">${item.name}</span>
        </div>
    `).join('');
}

// ============================================
// 👾 方案三 (刷新重置版)：数码解密 + 全句彩蛋 + 每次刷新归零
// ============================================
function initFooterSurprise() {
    const quoteEl = document.getElementById('footer-quote');
    if (!quoteEl) return;

    // 1. 计数器：每次刷新页面都会重置为 0
    let clickCount = 0;
    
    // 2. 词库：普通词里没有“喜欢你”
    const normalKeywords = ["陪伴你", "书写你", "敷衍你", "注视你", "治愈你"];
    const specialKeyword = "喜欢你";
    const prefixText = "新的一年，<br>请允许我继续";
    
    // 初始化 DOM
    quoteEl.style.transition = "all 0.5s ease";
    quoteEl.innerHTML = `
        <span id="quote-prefix" style="opacity: 0.6; transition: all 0.5s ease;">${prefixText}</span>
        <span id="quote-keyword" style="display:inline-block; color: #D4AF37; font-weight: bold; margin-left: 4px; min-width: 60px; font-family: monospace;">研究你</span>
    `;

    const keywordEl = document.getElementById('quote-keyword');
    const prefixEl = document.getElementById('quote-prefix');

    quoteEl.addEventListener('click', (e) => {
        clickCount++;
        // 可以在控制台打印一下，方便你自己测试
        // console.log("当前点击次数:", clickCount); 
        
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        // 3. 决定目标词
        let targetWord = "";
        
        // 严格设定：必须是第 10 次 (或者 20, 30...)
        if (clickCount > 0 && clickCount % 10 === 0) {
            targetWord = specialKeyword;
        } else {
            // 随机取普通词，且不重复当前显示的词
            do { 
                targetWord = normalKeywords[Math.floor(Math.random() * normalKeywords.length)];
            } while (targetWord === keywordEl.innerText);
        }

        // 4. 数码解密动画
        const chars = "!@#$%^&*()_+-=[]{}|;:,.<>?01";
        let iterations = 0;
        
        const interval = setInterval(() => {
            keywordEl.innerText = targetWord.split("")
                .map((letter, index) => {
                    if (index < iterations) return targetWord[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                })
                .join("");
            
            if (iterations >= targetWord.length) { 
                clearInterval(interval);
                keywordEl.innerText = targetWord;

                // --- 🌟 触发全句彩蛋逻辑 ---
                if (targetWord === specialKeyword) {
                    // A. 触发流光星钻特效
                    triggerSparkles(mouseX, mouseY);
                    
                    // B. 全句变身：整句话变成樱花粉 + 发光
                    keywordEl.style.color = "#FFB7C5"; 
                    keywordEl.style.textShadow = "0 0 15px rgba(255, 183, 197, 0.9)";
                    
                    prefixEl.style.color = "#FFB7C5";
                    prefixEl.style.opacity = "1"; 
                    prefixEl.style.textShadow = "0 0 10px rgba(255, 183, 197, 0.5)";
                    
                    // 心跳动画
                    gsap.fromTo(quoteEl, 
                        { scale: 1 }, 
                        { scale: 1.05, duration: 0.2, yoyo: true, repeat: 1, ease: "power2.out" }
                    );

                } else {
                    // C. 还原普通状态
                    keywordEl.style.color = "#D4AF37"; // 金色
                    keywordEl.style.textShadow = "none";
                    
                    prefixEl.style.color = ""; // 恢复默认
                    prefixEl.style.opacity = "0.6";
                    prefixEl.style.textShadow = "none";
                }
            }
            iterations += 1/3; 
        }, 50); 
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initThree(); initAudio(); renderMorphology(); renderProfile();
    renderClues(); renderDating(); renderPlans();
    lucide.createIcons(); initAnimations(); initFooterSurprise();
});
