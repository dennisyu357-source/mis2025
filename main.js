import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { morphologyData, profileData, datingRecords, plans, clues } from './data.js';
import { initAnimations } from './animations.js';
// 【修改 1】添加这一行，引入你刚才写好的 audio_player.js
import { initAudio } from './audio_player.js';

let scene, camera, renderer, model, raycaster, mouse;
const container = document.getElementById('three-cat-container');
const voiceAudio = document.getElementById('voice-audio');
const speechBubble = document.getElementById('speech-bubble');
// 向左转 10 度 (如果是向右，就把前面变成负数 -10)
const offsetAngle = -10 * (Math.PI / 180);


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

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(2, 5, 2);
    scene.add(directionalLight);

    const loader = new GLTFLoader();
    loader.load('./cat.glb', 
    (gltf) => {
        model = gltf.scene;
        
        // --- 原来的这些 set 可以删掉或保留，反正会被下面的 adjust 覆盖 ---
        // model.position.set(1.5, -0.5, 0); 
        // model.scale.set(1.2, 1.2, 1.2);
        
        model.rotation.set(0, 0, 0); 
        model.rotation.y = offsetAngle;
        
        scene.add(model);
        
        // 【新增这一行】：加载完立刻判断屏幕调整位置
        adjustModelForMobile(); 
        
        gsap.to(container, { opacity: 1, duration: 2, ease: "power2.out" });
        animateThree();
    }
);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    window.addEventListener('resize', onWindowResize);
}

function onClick(event) {
    // 【新增修改 1】过滤点击目标
    // 如果点击的不是 3D 画布（canvas），而是网页上的图片(IMG)、文字(P, H1)或容器(DIV)等
    // 直接退出函数，不进行射线检测
    if (event.target.tagName !== 'CANVAS') return;

    // 【新增修改 2】安全检查 (上一轮改过的)
    if (!model) return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // 【之前改过的】只检测猫
    const intersects = raycaster.intersectObjects([model], true);

    if (intersects.length > 0) {
        const voiceAudio = document.getElementById('voice-audio');
        const speechBubble = document.getElementById('speech-bubble');

        voiceAudio.currentTime = 0;
        voiceAudio.play();

        speechBubble.classList.add('active');
        gsap.to(speechBubble, { opacity: 1, scale: 1, duration: 0.4 });
        
        setTimeout(() => {
            speechBubble.classList.remove('active');
            gsap.to(speechBubble, { opacity: 0, scale: 0.9, duration: 0.4 });
        }, 4000);
    }
}

function onMouseMove(event) {
    if (!model) return;
    const x = (event.clientX / window.innerWidth) - 0.5;
    const y = (event.clientY / window.innerHeight) - 0.5;
    
    gsap.to(model.rotation, {
        y: x * (Math.PI / 4)+ offsetAngle,
        x: y * (Math.PI / 10),
        duration: 1.2,
        ease: "power2.out"
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // 【新增这一行】：窗口大小变了（比如手机横屏），也要重新调整位置
    adjustModelForMobile();
}

// main.js 中新增这个函数

function adjustModelForMobile() {
    if (!model) return;

    const width = window.innerWidth;

    if (width < 768) {
        // 【手机端配置】
        // x=0 居中, y=-0.5 稍微往下放一点
        model.position.set(0, -0.8, 0); 
        // 缩小一点，防止占满屏幕挡住字
        model.scale.set(0.9, 0.9, 0.9);
    } else {
        // 【电脑端配置 - 保持原样】
        model.position.set(1.5, -0.5, 0); 
        model.scale.set(1.2, 1.2, 1.2);
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
                
                <p class="clue-roast mt-4 text-[9px] text-gold italic border-t border-white/5 pt-4 opacity-0 translate-y-4 transition-all duration-700 ease-out">
                    ${clue.roast}
                </p>
            </div>
        </div>
    `).join('');

    // 绑定点击事件
    const items = grid.querySelectorAll('.clue-item');
    items.forEach(item => {
        item.addEventListener('click', () => {
            const roast = item.querySelector('.clue-roast');
            const overlay = item.querySelector('.clue-overlay');

            // 1. 文字浮现动画 (移除隐藏样式)
            roast.classList.remove('opacity-0', 'translate-y-4');
            
            // 2. 强制隐藏遮罩层 (让内容完全清晰)
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none'; // 防止遮罩层挡住后续操作
        });
    });
}

function createPawPrint(x, y) {
    const layer = document.getElementById('paw-layer');
    const paw = document.createElement('div');
    paw.className = 'absolute w-12 h-12 pointer-events-none z-50';
    paw.style.left = `${x - 24}px`;
    paw.style.top = `${y - 24}px`;
    paw.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="14" r="5" fill="#D4AF37" fill-opacity="0.4"/>
            <circle cx="7" cy="6" r="3" fill="#D4AF37" fill-opacity="0.4"/>
            <circle cx="17" cy="6" r="3" fill="#D4AF37" fill-opacity="0.4"/>
            <circle cx="4" cy="11" r="2.5" fill="#D4AF37" fill-opacity="0.4"/>
            <circle cx="20" cy="11" r="2.5" fill="#D4AF37" fill-opacity="0.4"/>
        </svg>
    `;
    layer.appendChild(paw);

    gsap.fromTo(paw, { scale: 0, opacity: 0 }, { 
        scale: 1, 
        opacity: 0.8, 
        duration: 0.3, 
        ease: "back.out(2)",
        onComplete: () => {
            gsap.to(paw, { opacity: 0, y: -20, duration: 0.5, delay: 0.5, onComplete: () => paw.remove() });
        }
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
            const rect = item.getBoundingClientRect();
            const parentRect = document.querySelector('.journal-paper').getBoundingClientRect();
            const x = e.clientX - parentRect.left;
            const y = e.clientY - parentRect.top;
            
            createPawPrint(x, y);


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
            <div class="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-300">
                <i data-lucide="${item.icon}" class="w-3.5 h-3.5"></i>
            </div>
            <span class="text-sm font-serif text-stone-600">${item.name}</span>
        </div>
    `).join('');

    dislikesGrid.innerHTML = profileData.dislikes.map(item => `
        <div class="flex items-center gap-4 opacity-40">
            <div class="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
                <i data-lucide="${item.icon}" class="w-3.5 h-3.5"></i>
            </div>
            <span class="text-sm font-serif text-stone-500">${item.name}</span>
        </div>
    `).join('');
}

// main.js - 修复版 initFooterSurprise

function initFooterSurprise() {
    const quoteEl = document.getElementById('footer-quote');
    if (!quoteEl) return;

    let clickCount = 0;
    
    // 【关键修复】把变量定义放进点击事件外面，但确保在这里被初始化
    const normalMessages = [
        "“新的一年，<br>请允许我继续陪伴你。”",
        "“新的一年，<br>请允许我继续书写你。”",
        "“新的一年，<br>请允许我继续敷衍你。”",
        "“新的一年，<br>请允许我继续注视你。”",
        "“新的一年，<br>请允许我继续研究你。”"
    ];

    const specialMessage = "“新的一年，<br>请允许我继续喜欢你。”";

    quoteEl.addEventListener('click', (e) => {
        clickCount++;
        // 可以在控制台打印一下次数，方便你调试
        console.log("当前点击次数:", clickCount);

        // 1. 先隐藏文字
        gsap.to(quoteEl, {
            opacity: 0,
            y: -10,
            duration: 0.2,
            onComplete: () => {
                // 2. 隐藏完成后，执行换字逻辑
                try {
                    let targetText = "";

                    // --- 逻辑判断 ---
                    if (clickCount === 10) {
                        // 第 10 次：必须是彩蛋
                        targetText = specialMessage;
                    } else {
                        // 其他次数：随机抽取
                        // 如果超过10次，把彩蛋加进池子；否则只用普通池
                        // 这是一个新数组，确保不会修改原数组
                        const currentPool = clickCount > 10 
                            ? normalMessages.concat([specialMessage]) 
                            : normalMessages;
                        
                        // 随机且不重复（防止连续两次一样）
                        do {
                            const randomIndex = Math.floor(Math.random() * currentPool.length);
                            targetText = currentPool[randomIndex];
                        } while (targetText === quoteEl.innerHTML && currentPool.length > 1);
                    }

                    // --- 赋值 ---
                    if (targetText) {
                        quoteEl.innerHTML = targetText;
                    } else {
                        // 万一出错了，回滚到默认文字，防止空白
                        quoteEl.innerHTML = "“新的一年，<br>请允许我继续研究你。”";
                    }

                    // --- 样式特效 ---
                    if (targetText === specialMessage) {
                        quoteEl.classList.add('love-text');
                        // 只有在变成彩蛋的那一刻飘心
                        triggerHearts(e.clientX, e.clientY);
                    } else {
                        quoteEl.classList.remove('love-text');
                    }

                } catch (error) {
                    console.error("换字逻辑出错:", error);
                    // 出错兜底：至少把字显示出来
                    quoteEl.style.opacity = 1;
                }

                // 3. 换好字了，重新显示出来
                gsap.to(quoteEl, { opacity: 1, y: 0, duration: 0.4 });
            }
        });
    });
}

// --- 辅助函数：生成飘浮爱心 ---
// 请确保这段代码在 main.js 中存在，且不在其他函数内部
function triggerHearts(x, y) {
    // 每次生成 5-10 个爱心
    const count = 5 + Math.floor(Math.random() * 5); 
    
    for (let i = 0; i < count; i++) {
        const heart = document.createElement('div');
        heart.classList.add('floating-heart');
        heart.innerHTML = '❤️'; // 你也可以换成 '💖' 或 '🌸'
        
        // 随机偏移位置 (让爱心散开一点)
        const offsetX = (Math.random() - 0.5) * 80;
        const offsetY = (Math.random() - 0.5) * 80;
        
        // 设置初始位置 (在鼠标点击的位置附近)
        heart.style.left = `${x + offsetX}px`;
        heart.style.top = `${y + offsetY}px`;
        
        // 随机大小和旋转角度，看起来更自然
        const scale = 0.6 + Math.random() * 0.8;
        const rotate = (Math.random() - 0.5) * 45;
        heart.style.transform = `scale(${scale}) rotate(${rotate}deg)`;
        
        document.body.appendChild(heart);

        // 1.5秒动画结束后，自动把元素删掉，防止页面变卡
        setTimeout(() => {
            heart.remove();
        }, 1500);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initThree();
    initAudio();
    renderMorphology();
    renderProfile();
    renderClues();
    renderDating();
    renderPlans();
    
    lucide.createIcons();
    initAnimations();
    initFooterSurprise();
    
    const loader = document.getElementById('loader');
    const progress = loader.querySelector('.loader-progress');
    
    gsap.to(progress, {
        width: "100%",
        duration: 1.5,
        ease: "power2.inOut",
        onComplete: () => {
            gsap.to(loader, {
                opacity: 0,
                duration: 0.8,
                onComplete: () => loader.style.display = 'none'
            });
        }
    });
});
