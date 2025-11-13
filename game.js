// Idle Clicker Game - Main Game Logic
// Fully customizable via config.json

class IdleClickerGame {
    constructor() {
        this.config = null;
        this.gameState = {
            currency: 0,
            clickPower: 0,
            totalClicks: 0,
            totalEarned: 0,
            clickEarned: 0,
            generatorEarned: 0,
            prestigePoints: 0,
            prestigeCount: 0,
            rebirthPoints: 0,
            rebirthCount: 0,
            playTime: 0,
            generators: {},
            clickUpgrades: {},
            clickMultipliers: {},
            generatorMultipliers: {},
            autoClickerLevel: 0,
            shopPurchases: {},
            milestones: {},
            dailyReward: {
                lastClaim: 0,
                streak: 0
            },
            luckyEvent: {
                active: false,
                type: null,
                endTime: 0
            },
            achievements: {},
            lastSave: Date.now(),
            startTime: Date.now(),
            notifiedAbout: {
                prestigeReady: false,
                canAffordImportant: false
            }
        };
        this.lastUpdate = Date.now();
        this.updateInterval = null;
        this.saveInterval = null;
        
        // Click rate tracking
        this.recentClicks = [];
        this.clickRateWindow = 2000; // 2 second window
        
        // Sound system
        this.audioContext = null;
        this.initAudio();
        
        // Admin panel
        this.adminUnlocked = false;
        this.adminPassword = 'Admin123'; // Change this to your own password
        
        // Settings
        this.settings = {
            soundVolume: 0.5,
            soundEnabled: true,
            theme: 'dark'
        };
        this.loadSettings();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    playSound(type) {
        if (!this.audioContext || !this.settings.soundEnabled) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        const volume = this.settings.soundVolume;
        
        switch(type) {
            case 'click':
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.1 * volume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01 * volume, this.audioContext.currentTime + 0.1);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
            case 'buy':
                oscillator.frequency.value = 523.25; // C5
                gainNode.gain.setValueAtTime(0.15 * volume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01 * volume, this.audioContext.currentTime + 0.2);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
            case 'achievement':
                oscillator.frequency.value = 880; // A5
                gainNode.gain.setValueAtTime(0.2 * volume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01 * volume, this.audioContext.currentTime + 0.5);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.5);
                break;
        }
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('gemClickerSettings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.log('Could not load settings');
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('gemClickerSettings', JSON.stringify(this.settings));
        } catch (e) {
            console.log('Could not save settings');
        }
    }

    async init() {
        try {
            // Load config with cache-busting to ensure latest version
            const response = await fetch(`config.json?v=${Date.now()}`);
            this.config = await response.json();
            
            // Load save or initialize new game
            this.loadGame();
            
            // Initialize UI
            this.initUI();
            
            // Apply cosmetics from shop purchases
            this.applyCosmetics();
            
            // Start game loop
            this.startGameLoop();
            
            // Setup event listeners
            this.setupEventListeners();
            
            console.log('Game initialized successfully!');
        } catch (error) {
            console.error('Error initializing game:', error);
            alert('Error loading game. Please make sure config.json is present.');
        }
    }

    initUI() {
        // Set game title and icons
        document.getElementById('game-title').textContent = this.config.game.title;
        document.getElementById('currency-icon').textContent = this.config.game.currencyIcon;
        document.getElementById('clicker-icon').textContent = this.config.game.clickableIcon;
        
        // Initialize generators
        this.config.generators.forEach(generator => {
            if (!this.gameState.generators[generator.id]) {
                this.gameState.generators[generator.id] = { level: 0 };
            }
        });
        
        // Initialize click upgrades
        this.config.clickUpgrades.forEach(upgrade => {
            if (!this.gameState.clickUpgrades[upgrade.id]) {
                this.gameState.clickUpgrades[upgrade.id] = { level: 0 };
            }
        });
        
        // Initialize click multipliers
        this.config.clickMultipliers.forEach(multiplier => {
            if (!this.gameState.clickMultipliers[multiplier.id]) {
                this.gameState.clickMultipliers[multiplier.id] = { level: 0 };
            }
        });
        
        // Initialize generator multipliers
        this.config.generatorMultipliers.forEach(multiplier => {
            if (!this.gameState.generatorMultipliers[multiplier.id]) {
                this.gameState.generatorMultipliers[multiplier.id] = { level: 0 };
            }
        });
        
        // Initialize milestones
        if (this.config.milestones?.enabled) {
            this.config.milestones.list.forEach(milestone => {
                if (this.gameState.milestones[milestone.id] === undefined) {
                    this.gameState.milestones[milestone.id] = false;
                }
            });
        }
        
        // Initialize shop purchases
        if (this.config.shop?.enabled) {
            this.config.shop.items.forEach(item => {
                if (this.gameState.shopPurchases[item.id] === undefined) {
                    this.gameState.shopPurchases[item.id] = false;
                }
            });
        }
        
        // Initialize achievements
        if (this.config.achievements.enabled) {
            this.config.achievements.list.forEach(achievement => {
                if (this.gameState.achievements[achievement.id] === undefined) {
                    this.gameState.achievements[achievement.id] = false;
                }
            });
        }
        
        // Check for daily reward
        if (this.config.dailyRewards?.enabled) {
            this.checkDailyReward();
        }
        
        // Update click power
        this.updateClickPower();
        
        // Render UI elements
        this.renderGenerators();
        this.renderClickUpgrades();
        this.renderMultiplierUpgrades();
        this.renderShop();
        this.renderAchievements();
        this.renderMilestones();
        this.updateUI();
        
        // Show prestige UI if enabled
        if (this.config.prestige.enabled) {
            document.getElementById('prestige-section').style.display = 'block';
            document.getElementById('prestige-stat').style.display = 'flex';
            document.getElementById('prestige-icon').textContent = this.config.prestige.currencyIcon;
            // Don't set prestige-currency-name here - it's already in HTML
        }
        
        // Show rebirth UI if enabled and unlocked
        if (this.config.rebirth?.enabled && this.gameState.prestigeCount >= this.config.rebirth.requirement) {
            document.getElementById('rebirth-section').style.display = 'block';
        }
    }

    setupEventListeners() {
        // Main clicker
        const mainClicker = document.getElementById('main-clicker');
        mainClicker.addEventListener('click', (e) => this.handleClick(e));
        
        // Tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.getAttribute('data-tab');
                this.switchTab(tab);
            });
        });
        
        // Control buttons
        document.getElementById('save-button').addEventListener('click', () => this.saveGame(true));
        document.getElementById('reset-button').addEventListener('click', () => this.confirmReset());
        document.getElementById('export-button').addEventListener('click', () => this.exportSave());
        document.getElementById('import-button').addEventListener('click', () => this.showImportModal());
        
        // Auto clicker
        if (this.config.autoClicker.enabled) {
            document.getElementById('buy-auto-clicker').addEventListener('click', () => this.buyAutoClicker());
        }
        
        // Prestige button
        if (this.config.prestige.enabled) {
            document.getElementById('prestige-button').addEventListener('click', () => this.handlePrestige());
        }
        
        // Rebirth button
        if (this.config.rebirth?.enabled) {
            document.getElementById('rebirth-button').addEventListener('click', () => this.handleRebirth());
        }
        
        // Import modal
        document.getElementById('import-confirm').addEventListener('click', () => this.importSave());
        document.getElementById('import-cancel').addEventListener('click', () => this.hideImportModal());
        
        // Daily reward
        if (this.config.dailyRewards?.enabled) {
            document.getElementById('claim-daily-reward').addEventListener('click', () => this.claimDailyReward());
        }
        
        // Admin panel
        document.getElementById('admin-toggle').addEventListener('click', () => this.toggleAdminPanel());
        document.getElementById('admin-close').addEventListener('click', () => this.closeAdminPanel());
        document.getElementById('admin-add-gems').addEventListener('click', () => this.adminAddGems());
        document.getElementById('admin-set-generator').addEventListener('click', () => this.adminSetGenerator());
        document.getElementById('admin-set-upgrade').addEventListener('click', () => this.adminSetUpgrade());
        document.getElementById('admin-set-autoclicker').addEventListener('click', () => this.adminSetAutoClicker());
        document.getElementById('admin-set-prestige').addEventListener('click', () => this.adminSetPrestige());
        document.getElementById('admin-set-prestige-count').addEventListener('click', () => this.adminSetPrestigeCount());
        document.getElementById('admin-set-rebirth').addEventListener('click', () => this.adminSetRebirth());
        document.getElementById('admin-instant-rebirth').addEventListener('click', () => this.adminInstantRebirth());
        document.getElementById('admin-unlock-all').addEventListener('click', () => this.adminUnlockAllAchievements());
        document.getElementById('admin-reset-achievements').addEventListener('click', () => this.adminResetAchievements());
        document.getElementById('admin-unlock-shop').addEventListener('click', () => this.adminUnlockAllShop());
        document.getElementById('admin-reset-shop').addEventListener('click', () => this.adminResetShop());
        
        // Lucky event triggers (with null check for safety)
        const goldenBtn = document.getElementById('admin-trigger-golden');
        const rushBtn = document.getElementById('admin-trigger-rush');
        if (goldenBtn) goldenBtn.addEventListener('click', () => this.adminTriggerEvent('golden_gem'));
        if (rushBtn) rushBtn.addEventListener('click', () => this.adminTriggerEvent('gem_rush'));
        
        // Quick gem buttons
        document.querySelectorAll('.admin-quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.getAttribute('data-amount'));
                this.adminAddGems(amount);
            });
        });
        
        // Update current levels when changing selection
        document.getElementById('admin-generator-select').addEventListener('change', () => this.updateAdminGeneratorLevel());
        document.getElementById('admin-upgrade-select').addEventListener('change', () => this.updateAdminUpgradeLevel());
        
        // Populate admin dropdowns
        this.populateAdminDropdowns();
        
        // Settings
        document.getElementById('sound-toggle').addEventListener('change', (e) => this.toggleSound(e.target.checked));
        document.getElementById('volume-slider').addEventListener('input', (e) => this.updateVolume(e.target.value));
        
        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.getAttribute('data-theme');
                this.changeTheme(theme);
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // Save on page unload to ensure offline earnings work
        window.addEventListener('beforeunload', () => {
            this.saveGame();
        });
        
        // Apply saved settings
        this.applySettings();
    }
    
    pauseGame() {
        // Pause game loop (not currently used, but available for future features)
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
    
    resumeGame() {
        // Resume game loop (not currently used, but available for future features)
        if (!this.updateInterval) {
            this.lastUpdate = Date.now();
            this.startGameLoop();
        }
    }
    
    handleKeyboard(e) {
        // Don't trigger if typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        // Prevent key repeat for space bar
        if (e.key === ' ' && e.repeat) {
            e.preventDefault();
            return;
        }
        
        switch(e.key) {
            case ' ':
                e.preventDefault();
                document.getElementById('main-clicker').click();
                break;
            case '1':
                this.switchTab('generators');
                break;
            case '2':
                this.switchTab('upgrades');
                break;
            case '3':
                this.switchTab('multipliers');
                break;
            case '4':
                this.switchTab('shop');
                break;
            case '5':
                this.switchTab('achievements');
                break;
            case '6':
                this.switchTab('stats');
                break;
            case '7':
                this.switchTab('tips');
                break;
            case '8':
                this.switchTab('changelog');
                break;
            case '9':
                this.switchTab('settings');
                break;
        }
    }
    
    toggleSound(enabled) {
        this.settings.soundEnabled = enabled;
        this.saveSettings();
    }
    
    updateVolume(value) {
        this.settings.soundVolume = value / 100;
        document.getElementById('volume-display').textContent = value + '%';
        this.saveSettings();
    }
    
    changeTheme(theme) {
        this.settings.theme = theme;
        this.saveSettings();
        this.applySettings();
        
        // Update active button
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
    }
    
    applySettings() {
        // Apply theme
        if (this.settings.theme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
        }
        
        // Apply sound settings
        document.getElementById('sound-toggle').checked = this.settings.soundEnabled;
        document.getElementById('volume-slider').value = this.settings.soundVolume * 100;
        document.getElementById('volume-display').textContent = Math.round(this.settings.soundVolume * 100) + '%';
        
        // Update theme button
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-theme="${this.settings.theme}"]`)?.classList.add('active');
    }

    handleClick(e) {
        // Resume audio context on first interaction (browser requirement)
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Calculate earn amount (with golden gem bonus if active)
        let earnAmount = this.gameState.clickPower;
        
        if (this.gameState.luckyEvent.active && this.gameState.luckyEvent.type === 'golden_gem') {
            earnAmount *= this.config.luckyEvents.goldenGemMultiplier;
        }
        
        // Add currency
        this.gameState.currency += earnAmount;
        this.gameState.totalClicks++;
        this.gameState.totalEarned += earnAmount;
        this.gameState.clickEarned += earnAmount;
        
        // Track click for rate calculation
        const now = Date.now();
        this.recentClicks.push(now);
        
        // Remove old clicks outside the window
        this.recentClicks = this.recentClicks.filter(time => now - time < this.clickRateWindow);
        
        // Play click sound
        this.playSound('click');
        
        // Visual feedback
        const button = e.currentTarget;
        button.classList.add('clicked');
        setTimeout(() => button.classList.remove('clicked'), 300);
        
        // Floating number animation (show actual earned amount with multipliers)
        if (this.config.ui.animations.floatingNumbers) {
            this.createFloatingNumber(e.clientX, e.clientY, earnAmount);
        }
        
        // Particle effects
        if (this.config.ui.animations.particleEffects) {
            this.createParticles(e.clientX, e.clientY, 5);
        }
        
        this.updateUI();
        this.checkAchievements();
    }
    
    createParticles(x, y, count) {
        // Get particle colors based on purchased cosmetics
        let colors = ['#4ecdc4', '#9b59b6', '#3498db', '#f39c12', '#e74c3c']; // Default
        
        if (this.gameState.shopPurchases['rainbow_particles']) {
            colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        } else if (this.gameState.shopPurchases['golden_particles']) {
            colors = ['#FFD700', '#FFA500', '#FFFF00', '#FFE5B4', '#FFF8DC'];
        }
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            const angle = (Math.random() * Math.PI * 2);
            const velocity = 50 + Math.random() * 100;
            const vx = Math.cos(angle) * velocity;
            const vy = Math.sin(angle) * velocity - 50; // Bias upward
            
            particle.style.setProperty('--vx', vx + 'px');
            particle.style.setProperty('--vy', vy + 'px');
            
            document.getElementById('floating-numbers').appendChild(particle);
            
            setTimeout(() => particle.remove(), 1000);
        }
    }
    
    showNotification(message, type = 'info') {
        // Only show if notifications are enabled
        if (!this.gameState.shopPurchases['notifications']) return;
        
        const notification = document.createElement('div');
        notification.className = `toast-notification toast-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    createFloatingNumber(x, y, value) {
        const floatingNumber = document.createElement('div');
        floatingNumber.className = 'floating-number';
        floatingNumber.textContent = '+' + this.formatNumber(value);
        floatingNumber.style.left = x + 'px';
        floatingNumber.style.top = y + 'px';
        
        document.getElementById('floating-numbers').appendChild(floatingNumber);
        
        setTimeout(() => {
            floatingNumber.remove();
        }, 1000);
    }

    updateClickPower() {
        let power = this.config.game.clickPower;
        
        // Add click upgrades
        this.config.clickUpgrades.forEach(upgrade => {
            const level = this.gameState.clickUpgrades[upgrade.id].level;
            power += level * upgrade.powerIncrease;
        });
        
        // Apply click multipliers
        let clickMultiplier = 1;
        this.config.clickMultipliers.forEach(multiplier => {
            const level = this.gameState.clickMultipliers[multiplier.id].level;
            if (level > 0) {
                clickMultiplier *= Math.pow(multiplier.multiplier, level);
            }
        });
        power *= clickMultiplier;
        
        // Apply prestige bonus
        if (this.config.prestige.enabled) {
            const bonus = 1 + (this.gameState.prestigePoints * this.config.prestige.bonusPerPoint);
            power *= bonus;
        }
        
        // Apply rebirth bonus (multiplicative!)
        if (this.config.rebirth?.enabled && this.gameState.rebirthPoints > 0) {
            const rebirthBonus = Math.pow(this.config.rebirth.bonusPerPoint, this.gameState.rebirthPoints);
            power *= rebirthBonus;
        }
        
        // Apply Golden Touch shop upgrade
        if (this.gameState.shopPurchases['golden_touch']) {
            power *= 2;
        }
        
        this.gameState.clickPower = Math.floor(power);
    }

    calculateGeneratorMultiplier() {
        let totalMultiplier = 1;
        
        // Generator multipliers stack multiplicatively
        this.config.generatorMultipliers.forEach(multiplier => {
            const level = this.gameState.generatorMultipliers[multiplier.id].level;
            if (level > 0) {
                totalMultiplier *= Math.pow(multiplier.multiplier, level);
            }
        });
        
        // Apply milestones
        if (this.config.milestones?.enabled) {
            this.config.milestones.list.forEach(milestone => {
                if (this.gameState.milestones[milestone.id]) {
                    totalMultiplier *= (1 + milestone.bonus);
                }
            });
        }
        
        // Apply prestige bonus
        if (this.config.prestige.enabled) {
            const prestigeBonus = 1 + (this.gameState.prestigePoints * this.config.prestige.bonusPerPoint);
            totalMultiplier *= prestigeBonus;
        }
        
        // Apply rebirth bonus (multiplicative!)
        if (this.config.rebirth?.enabled && this.gameState.rebirthPoints > 0) {
            const rebirthBonus = Math.pow(this.config.rebirth.bonusPerPoint, this.gameState.rebirthPoints);
            totalMultiplier *= rebirthBonus;
        }
        
        // Apply lucky event bonus
        if (this.gameState.luckyEvent.active && this.gameState.luckyEvent.type === 'gem_rush') {
            totalMultiplier *= this.config.luckyEvents.gemRushMultiplier;
        }
        
        // Apply Overdrive shop upgrade (production boost)
        if (this.gameState.shopPurchases['production_boost']) {
            totalMultiplier *= 1.5;
        }
        
        return totalMultiplier;
    }
    
    checkMilestones() {
        if (!this.config.milestones?.enabled) return;
        
        this.config.milestones.list.forEach(milestone => {
            if (!this.gameState.milestones[milestone.id] && this.gameState.totalEarned >= milestone.threshold) {
                this.gameState.milestones[milestone.id] = true;
                this.showMilestoneNotification(milestone);
            }
        });
    }
    
    showMilestoneNotification(milestone) {
        this.playSound('achievement');
        
        const popup = document.createElement('div');
        popup.className = 'milestone-popup';
        popup.innerHTML = `
            <div class="milestone-popup-header">🌟 Milestone Reached!</div>
            <div class="milestone-popup-name">${milestone.name}</div>
            <div class="milestone-popup-desc">${milestone.description}</div>
        `;
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.classList.add('fade-out');
            setTimeout(() => popup.remove(), 500);
        }, 4000);
        
        console.log(`🌟 Milestone: ${milestone.name}`);
    }
    
    checkDailyReward() {
        const now = Date.now();
        const lastClaim = this.gameState.dailyReward.lastClaim;
        const oneDayMs = 24 * 60 * 60 * 1000;
        const twoDaysMs = 2 * oneDayMs;
        
        // Check if can claim
        if (now - lastClaim >= oneDayMs) {
            // Check if streak continues (within 2 days)
            if (now - lastClaim < twoDaysMs && lastClaim > 0) {
                // Continue streak
                this.gameState.dailyReward.streak = Math.min(
                    this.gameState.dailyReward.streak + 1,
                    this.config.dailyRewards.maxStreak
                );
            } else if (lastClaim > 0) {
                // Reset streak
                this.gameState.dailyReward.streak = 1;
            } else {
                // First time
                this.gameState.dailyReward.streak = 1;
            }
            
            // Show daily reward popup
            this.showDailyRewardPopup();
        }
    }
    
    claimDailyReward() {
        const baseReward = this.config.dailyRewards.baseReward;
        const streak = this.gameState.dailyReward.streak;
        const reward = Math.floor(baseReward * Math.pow(this.config.dailyRewards.streakMultiplier, streak - 1));
        
        this.gameState.currency += reward;
        this.gameState.totalEarned += reward;
        this.gameState.dailyReward.lastClaim = Date.now();
        
        this.playSound('achievement');
        this.updateUI();
        this.saveGame();
        
        // Hide popup
        document.getElementById('daily-reward-popup').classList.add('hidden');
        
        console.log(`✅ Claimed daily reward: ${this.formatNumber(reward)} gems! (Day ${streak})`);
    }
    
    showDailyRewardPopup() {
        const baseReward = this.config.dailyRewards.baseReward;
        const streak = this.gameState.dailyReward.streak;
        const reward = Math.floor(baseReward * Math.pow(this.config.dailyRewards.streakMultiplier, streak - 1));
        
        const popup = document.getElementById('daily-reward-popup');
        document.getElementById('daily-streak').textContent = streak;
        document.getElementById('daily-reward-amount').textContent = this.formatNumber(reward);
        popup.classList.remove('hidden');
    }
    
    showOfflineEarningsPopup(earnings, timeAway) {
        const hours = Math.floor(timeAway / 3600);
        const minutes = Math.floor((timeAway % 3600) / 60);
        
        let timeText = '';
        if (hours > 0) {
            timeText = `${hours}h ${minutes}m`;
        } else {
            timeText = `${minutes}m`;
        }
        
        const popup = document.createElement('div');
        popup.className = 'offline-earnings-popup';
        popup.innerHTML = `
            <h2>🌙 Welcome Back!</h2>
            <div class="offline-time">You were away for ${timeText}</div>
            <div class="offline-earnings">
                <div class="offline-label">Earned while offline:</div>
                <div class="offline-amount">+${this.formatNumber(earnings)} 💎</div>
            </div>
            <button class="claim-btn" onclick="this.parentElement.remove()">Awesome!</button>
        `;
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            if (popup.parentElement) {
                popup.classList.add('fade-out');
                setTimeout(() => popup.remove(), 500);
            }
        }, 8000);
    }
    
    calculateProductionPerSecond() {
        let production = 0;
        
        this.config.generators.forEach(generator => {
            const level = this.gameState.generators[generator.id].level;
            production += level * generator.baseProduction;
        });
        
        // Apply generator multipliers
        production *= this.calculateGeneratorMultiplier();
        
        return production;
    }

    buyGenerator(generatorId) {
        const generator = this.config.generators.find(g => g.id === generatorId);
        if (!generator) {
            console.log('Generator not found:', generatorId);
            return;
        }
        
        const currentLevel = this.gameState.generators[generatorId].level;
        const cost = this.calculateCost(generator.baseCost, generator.costMultiplier, currentLevel);
        
        console.log(`Attempting to buy ${generator.name}:`, {
            currentCurrency: this.gameState.currency,
            cost: cost,
            canAfford: this.gameState.currency >= cost
        });
        
        if (this.gameState.currency >= cost) {
            if (generator.maxLevel === null || currentLevel < generator.maxLevel) {
                this.gameState.currency -= cost;
                this.gameState.generators[generatorId].level++;
                
                console.log(`✅ Purchased ${generator.name}! New level: ${this.gameState.generators[generatorId].level}`);
                
                // Play buy sound
                this.playSound('buy');
                
                // Update everything
                this.renderGenerators();
                this.updateUI();
                this.checkAchievements();
            }
        } else {
            console.log(`❌ Cannot afford ${generator.name}. Need ${cost - this.gameState.currency} more gems.`);
        }
    }

    buyClickUpgrade(upgradeId) {
        const upgrade = this.config.clickUpgrades.find(u => u.id === upgradeId);
        if (!upgrade) {
            console.log('Upgrade not found:', upgradeId);
            return;
        }
        
        const currentLevel = this.gameState.clickUpgrades[upgradeId].level;
        const cost = this.calculateCost(upgrade.baseCost, upgrade.costMultiplier, currentLevel);
        
        console.log(`Attempting to buy ${upgrade.name}:`, {
            currentCurrency: this.gameState.currency,
            cost: cost,
            canAfford: this.gameState.currency >= cost
        });
        
        if (this.gameState.currency >= cost) {
            if (upgrade.maxLevel === null || currentLevel < upgrade.maxLevel) {
                this.gameState.currency -= cost;
                this.gameState.clickUpgrades[upgradeId].level++;
                
                console.log(`✅ Purchased ${upgrade.name}! New level: ${this.gameState.clickUpgrades[upgradeId].level}`);
                
                // Play buy sound
                this.playSound('buy');
                
                // Update everything
                this.updateClickPower();
                this.renderClickUpgrades();
                this.updateUI();
                this.checkAchievements();
            }
        } else {
            console.log(`❌ Cannot afford ${upgrade.name}. Need ${cost - this.gameState.currency} more gems.`);
        }
    }
    
    buyClickMultiplier(multiplierId) {
        const multiplier = this.config.clickMultipliers.find(m => m.id === multiplierId);
        if (!multiplier) {
            console.log('Click multiplier not found:', multiplierId);
            return;
        }
        
        const currentLevel = this.gameState.clickMultipliers[multiplierId].level;
        const cost = this.calculateCost(multiplier.baseCost, multiplier.costMultiplier, currentLevel);
        
        if (this.gameState.currency >= cost) {
            if (multiplier.maxLevel === null || currentLevel < multiplier.maxLevel) {
                this.gameState.currency -= cost;
                this.gameState.clickMultipliers[multiplierId].level++;
                
                console.log(`✅ Purchased ${multiplier.name}! New level: ${this.gameState.clickMultipliers[multiplierId].level}`);
                
                // Play buy sound
                this.playSound('buy');
                
                // Update everything
                this.updateClickPower();
                this.renderMultiplierUpgrades();
                this.updateUI();
                this.checkAchievements();
            }
        } else {
            console.log(`❌ Cannot afford ${multiplier.name}. Need ${cost - this.gameState.currency} more gems.`);
        }
    }
    
    buyGeneratorMultiplier(multiplierId) {
        const multiplier = this.config.generatorMultipliers.find(m => m.id === multiplierId);
        if (!multiplier) {
            console.log('Generator multiplier not found:', multiplierId);
            return;
        }
        
        const currentLevel = this.gameState.generatorMultipliers[multiplierId].level;
        const cost = this.calculateCost(multiplier.baseCost, multiplier.costMultiplier, currentLevel);
        
        if (this.gameState.currency >= cost) {
            if (multiplier.maxLevel === null || currentLevel < multiplier.maxLevel) {
                this.gameState.currency -= cost;
                this.gameState.generatorMultipliers[multiplierId].level++;
                
                console.log(`✅ Purchased ${multiplier.name}! New level: ${this.gameState.generatorMultipliers[multiplierId].level}`);
                
                // Play buy sound
                this.playSound('buy');
                
                // Update everything
                this.renderMultiplierUpgrades();
                this.renderGenerators(); // Update generator production displays
                this.updateUI();
                this.checkAchievements();
            }
        } else {
            console.log(`❌ Cannot afford ${multiplier.name}. Need ${cost - this.gameState.currency} more gems.`);
        }
    }

    calculateCost(baseCost, multiplier, currentLevel) {
        let cost = Math.floor(baseCost * Math.pow(multiplier, currentLevel));
        
        // Apply Bulk Discount shop upgrade (10% cost reduction)
        if (this.gameState.shopPurchases['discount_master']) {
            cost = Math.floor(cost * 0.9);
        }
        
        return cost;
    }

    calculatePrestigeGain() {
        if (!this.config.prestige.enabled) return 0;
        
        const totalEarned = this.gameState.totalEarned;
        
        // Scale requirement with prestige count (gets harder each time)
        const scaledRequirement = this.config.prestige.requirement * Math.pow(1.5, this.gameState.prestigeCount);
        
        if (totalEarned < scaledRequirement) return 0;
        
        let gain = 0;
        if (this.config.prestige.formula === 'sqrt') {
            gain = Math.floor(Math.sqrt(totalEarned / this.config.prestige.divisor));
        } else if (this.config.prestige.formula === 'log') {
            gain = Math.floor(Math.log10(totalEarned / this.config.prestige.divisor));
        }
        
        // Apply Prestige Master shop upgrade (double prestige)
        if (this.gameState.shopPurchases['double_prestige']) {
            gain *= 2;
        }
        
        return Math.max(0, gain);
    }
    
    getPrestigeRequirement() {
        // Calculate current prestige requirement based on prestige count
        return this.config.prestige.requirement * Math.pow(1.5, this.gameState.prestigeCount);
    }

    handlePrestige() {
        if (!this.config.prestige.enabled) return;
        
        const gain = this.calculatePrestigeGain();
        
        if (gain <= 0) return;
        
        if (this.config.prestige.confirmationRequired) {
            const confirmed = confirm(
                `Are you sure you want to prestige?\n\n` +
                `You will gain ${gain}⭐\n` +
                `This will reset all your progress but give you a permanent +${(gain * this.config.prestige.bonusPerPoint * 100).toFixed(1)}% bonus!`
            );
            
            if (!confirmed) return;
        }
        
        // Reset game but keep prestige
        const newPrestigePoints = this.gameState.prestigePoints + gain;
        const newPrestigeCount = this.gameState.prestigeCount + 1;
        const playTime = this.gameState.playTime;
        
        this.gameState = {
            currency: 0,
            clickPower: 0,
            totalClicks: 0,
            totalEarned: 0,
            clickEarned: 0,
            generatorEarned: 0,
            prestigePoints: newPrestigePoints,
            prestigeCount: newPrestigeCount,
            rebirthPoints: this.gameState.rebirthPoints, // Keep rebirth points
            rebirthCount: this.gameState.rebirthCount, // Keep rebirth count
            playTime: playTime,
            generators: {},
            clickUpgrades: {},
            clickMultipliers: {},
            generatorMultipliers: {},
            autoClickerLevel: 0,
            shopPurchases: this.gameState.shopPurchases, // Keep shop purchases
            milestones: this.gameState.milestones, // Keep milestones through prestige
            dailyReward: this.gameState.dailyReward, // Keep daily reward data
            luckyEvent: {
                active: false,
                type: null,
                endTime: 0
            },
            achievements: this.gameState.achievements,
            lastSave: Date.now(),
            startTime: Date.now()
        };
        
        // Re-initialize
        this.config.generators.forEach(generator => {
            this.gameState.generators[generator.id] = { level: 0 };
        });
        
        this.config.clickUpgrades.forEach(upgrade => {
            this.gameState.clickUpgrades[upgrade.id] = { level: 0 };
        });
        
        this.config.clickMultipliers.forEach(multiplier => {
            this.gameState.clickMultipliers[multiplier.id] = { level: 0 };
        });
        
        this.config.generatorMultipliers.forEach(multiplier => {
            this.gameState.generatorMultipliers[multiplier.id] = { level: 0 };
        });
        
        this.updateClickPower();
        this.renderGenerators();
        this.renderClickUpgrades();
        this.renderMultiplierUpgrades();
        this.updateUI();
        this.saveGame();
    }
    
    handleRebirth() {
        if (!this.config.rebirth?.enabled) return;
        
        // Check if player has enough prestiges
        if (this.gameState.prestigeCount < this.config.rebirth.requirement) {
            alert(`You need ${this.config.rebirth.requirement} prestiges to rebirth! (Currently: ${this.gameState.prestigeCount})`);
            return;
        }
        
        const gain = 1; // 1 rebirth point per rebirth
        
        if (this.config.rebirth.confirmationRequired) {
            const currentBonus = Math.pow(this.config.rebirth.bonusPerPoint, this.gameState.rebirthPoints);
            const newBonus = Math.pow(this.config.rebirth.bonusPerPoint, this.gameState.rebirthPoints + gain);
            const confirmed = confirm(
                `Are you sure you want to REBIRTH?\n\n` +
                `You will gain ${gain} ${this.config.rebirth.currencyName}.\n` +
                `This will reset EVERYTHING including prestige!\n\n` +
                `Current multiplier: ${this.formatNumber(currentBonus)}x\n` +
                `New multiplier: ${this.formatNumber(newBonus)}x`
            );
            
            if (!confirmed) return;
        }
        
        // Reset EVERYTHING but keep rebirth, milestones, shop, achievements, daily rewards
        const newRebirthPoints = this.gameState.rebirthPoints + gain;
        const newRebirthCount = this.gameState.rebirthCount + 1;
        const milestones = this.gameState.milestones;
        const shopPurchases = this.gameState.shopPurchases;
        const achievements = this.gameState.achievements;
        const dailyReward = this.gameState.dailyReward;
        
        this.gameState = {
            currency: 0,
            clickPower: 0,
            totalClicks: 0,
            totalEarned: 0,
            clickEarned: 0,
            generatorEarned: 0,
            prestigePoints: 0,
            prestigeCount: 0,
            rebirthPoints: newRebirthPoints,
            rebirthCount: newRebirthCount,
            playTime: 0,
            generators: {},
            clickUpgrades: {},
            clickMultipliers: {},
            generatorMultipliers: {},
            autoClickerLevel: 0,
            shopPurchases: shopPurchases,
            milestones: milestones,
            dailyReward: dailyReward,
            luckyEvent: {
                active: false,
                type: null,
                endTime: 0
            },
            achievements: achievements,
            lastSave: Date.now(),
            startTime: Date.now()
        };
        
        // Re-initialize everything
        this.config.generators.forEach(generator => {
            this.gameState.generators[generator.id] = { level: 0 };
        });
        
        this.config.clickUpgrades.forEach(upgrade => {
            this.gameState.clickUpgrades[upgrade.id] = { level: 0 };
        });
        
        this.config.clickMultipliers.forEach(multiplier => {
            this.gameState.clickMultipliers[multiplier.id] = { level: 0 };
        });
        
        this.config.generatorMultipliers.forEach(multiplier => {
            this.gameState.generatorMultipliers[multiplier.id] = { level: 0 };
        });
        
        this.updateClickPower();
        this.renderGenerators();
        this.renderClickUpgrades();
        this.renderMultiplierUpgrades();
        this.updateUI();
        this.saveGame();
        
        // Show rebirth notification
        const popup = document.createElement('div');
        popup.className = 'milestone-popup';
        popup.innerHTML = `
            <div class="milestone-popup-header">🔮 REBIRTH COMPLETE!</div>
            <div class="milestone-popup-name">+${gain} Rebirth Point${gain > 1 ? 's' : ''}!</div>
            <div class="milestone-popup-desc">${Math.pow(this.config.rebirth.bonusPerPoint, newRebirthPoints)}x multiplier to all production!</div>
        `;
        document.body.appendChild(popup);
        setTimeout(() => {
            popup.classList.add('fade-out');
            setTimeout(() => popup.remove(), 500);
        }, 5000);
    }

    checkAchievements() {
        if (!this.config.achievements.enabled) return;
        
        this.config.achievements.list.forEach(achievement => {
            if (this.gameState.achievements[achievement.id]) return;
            
            let unlocked = false;
            const req = achievement.requirement;
            
            switch (req.type) {
                case 'total_clicks':
                    unlocked = this.gameState.totalClicks >= req.value;
                    break;
                case 'total_earned':
                    unlocked = this.gameState.totalEarned >= req.value;
                    break;
                case 'generator_owned':
                    unlocked = this.gameState.generators[req.id]?.level >= req.value;
                    break;
                case 'currency':
                    unlocked = this.gameState.currency >= req.value;
                    break;
                case 'prestige_count':
                    unlocked = this.gameState.prestigeCount >= req.value;
                    break;
            }
            
            if (unlocked) {
                this.gameState.achievements[achievement.id] = true;
                this.showAchievementNotification(achievement);
                this.renderAchievements();
            }
        });
    }

    showAchievementNotification(achievement) {
        // Play achievement sound
        this.playSound('achievement');
        
        // Create achievement popup
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="achievement-popup-header">🏆 Achievement Unlocked!</div>
            <div class="achievement-popup-icon">${achievement.icon}</div>
            <div class="achievement-popup-name">${achievement.name}</div>
            <div class="achievement-popup-desc">${achievement.description}</div>
        `;
        
        document.body.appendChild(popup);
        
        // Remove after animation
        setTimeout(() => {
            popup.classList.add('fade-out');
            setTimeout(() => popup.remove(), 500);
        }, 4000);
        
        console.log(`🏆 Achievement Unlocked: ${achievement.name}`);
    }

    renderGenerators() {
        const container = document.getElementById('generators-container');
        container.innerHTML = '';
        
        this.config.generators.forEach(generator => {
            const level = this.gameState.generators[generator.id].level;
            const cost = this.calculateCost(generator.baseCost, generator.costMultiplier, level);
            const canAfford = this.gameState.currency >= cost;
            const production = level * generator.baseProduction;
            
            const prestigeBonus = this.config.prestige.enabled ? 
                (1 + (this.gameState.prestigePoints * this.config.prestige.bonusPerPoint)) : 1;
            const actualProduction = production * prestigeBonus;
            
            const item = document.createElement('div');
            item.className = `upgrade-item ${!canAfford ? 'disabled' : ''}`;
            item.style.cursor = 'pointer'; // Ensure cursor shows clickable
            item.innerHTML = `
                <div class="upgrade-icon">${generator.icon}</div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${generator.name}</div>
                    <div class="upgrade-description">${generator.description}</div>
                    <div class="upgrade-stats">
                        <span class="upgrade-level">Level: ${level}</span>
                        ${level > 0 ? `<span class="upgrade-production">+${this.formatNumber(actualProduction)}/s</span>` : ''}
                    </div>
                </div>
                <div class="upgrade-cost">${this.formatNumber(cost)} ${this.config.game.currencyIcon}</div>
            `;
            
            // Always add event listener - the buy function will check if affordable
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.buyGenerator(generator.id);
            });
            
            container.appendChild(item);
        });
    }

    renderClickUpgrades() {
        const container = document.getElementById('upgrades-container');
        container.innerHTML = '';
        
        this.config.clickUpgrades.forEach(upgrade => {
            const level = this.gameState.clickUpgrades[upgrade.id].level;
            const cost = this.calculateCost(upgrade.baseCost, upgrade.costMultiplier, level);
            const canAfford = this.gameState.currency >= cost;
            
            const item = document.createElement('div');
            item.className = `upgrade-item ${!canAfford ? 'disabled' : ''}`;
            item.style.cursor = 'pointer'; // Ensure cursor shows clickable
            item.innerHTML = `
                <div class="upgrade-icon">${upgrade.icon}</div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-description">${upgrade.description}</div>
                    <div class="upgrade-stats">
                        <span class="upgrade-level">Level: ${level}</span>
                        <span class="upgrade-production">+${this.formatNumber(upgrade.powerIncrease)} per click</span>
                    </div>
                </div>
                <div class="upgrade-cost">${this.formatNumber(cost)} ${this.config.game.currencyIcon}</div>
            `;
            
            // Always add event listener - the buy function will check if affordable
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.buyClickUpgrade(upgrade.id);
            });
            
            container.appendChild(item);
        });
    }
    
    renderMultiplierUpgrades() {
        const container = document.getElementById('multipliers-container');
        container.innerHTML = '';
        
        // Add Click Multipliers section header
        const clickHeader = document.createElement('h3');
        clickHeader.className = 'multiplier-section-header';
        clickHeader.textContent = '👆 Click Multipliers';
        container.appendChild(clickHeader);
        
        // Render click multipliers
        this.config.clickMultipliers.forEach(multiplier => {
            const level = this.gameState.clickMultipliers[multiplier.id].level;
            const cost = this.calculateCost(multiplier.baseCost, multiplier.costMultiplier, level);
            const canAfford = this.gameState.currency >= cost;
            const currentMultiplier = level > 0 ? Math.pow(multiplier.multiplier, level) : 1;
            const nextMultiplier = Math.pow(multiplier.multiplier, level + 1);
            
            const item = document.createElement('div');
            item.className = `upgrade-item ${!canAfford ? 'disabled' : ''}`;
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div class="upgrade-icon">${multiplier.icon}</div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${multiplier.name}</div>
                    <div class="upgrade-description">${multiplier.description}</div>
                    <div class="upgrade-stats">
                        <span class="upgrade-level">Level: ${level}</span>
                        ${level > 0 ? `<span class="upgrade-production">Current: ${this.formatNumber(currentMultiplier)}x → ${this.formatNumber(nextMultiplier)}x</span>` : `<span class="upgrade-production">Next: ${multiplier.multiplier}x</span>`}
                    </div>
                </div>
                <div class="upgrade-cost">${this.formatNumber(cost)} ${this.config.game.currencyIcon}</div>
            `;
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.buyClickMultiplier(multiplier.id);
            });
            
            container.appendChild(item);
        });
        
        // Add Generator Multipliers section header
        const generatorHeader = document.createElement('h3');
        generatorHeader.className = 'multiplier-section-header';
        generatorHeader.textContent = '🏭 Generator Multipliers';
        container.appendChild(generatorHeader);
        
        // Render generator multipliers
        this.config.generatorMultipliers.forEach(multiplier => {
            const level = this.gameState.generatorMultipliers[multiplier.id].level;
            const cost = this.calculateCost(multiplier.baseCost, multiplier.costMultiplier, level);
            const canAfford = this.gameState.currency >= cost;
            const currentMultiplier = level > 0 ? Math.pow(multiplier.multiplier, level) : 1;
            const nextMultiplier = Math.pow(multiplier.multiplier, level + 1);
            
            const item = document.createElement('div');
            item.className = `upgrade-item ${!canAfford ? 'disabled' : ''}`;
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div class="upgrade-icon">${multiplier.icon}</div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${multiplier.name}</div>
                    <div class="upgrade-description">${multiplier.description}</div>
                    <div class="upgrade-stats">
                        <span class="upgrade-level">Level: ${level}</span>
                        ${level > 0 ? `<span class="upgrade-production">Current: ${this.formatNumber(currentMultiplier)}x → ${this.formatNumber(nextMultiplier)}x</span>` : `<span class="upgrade-production">Next: ${multiplier.multiplier}x</span>`}
                    </div>
                </div>
                <div class="upgrade-cost">${this.formatNumber(cost)} ${this.config.game.currencyIcon}</div>
            `;
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.buyGeneratorMultiplier(multiplier.id);
            });
            
            container.appendChild(item);
        });
    }

    renderShop() {
        if (!this.config.shop?.enabled) return;
        
        const container = document.getElementById('shop-container');
        container.innerHTML = '';
        
        this.config.shop.items.forEach(item => {
            const purchased = this.gameState.shopPurchases[item.id];
            const canAfford = this.gameState.currency >= item.cost;
            
            const shopItem = document.createElement('div');
            shopItem.className = `upgrade-item ${purchased ? 'purchased' : (!canAfford ? 'disabled' : '')}`;
            shopItem.style.cursor = purchased ? 'default' : 'pointer';
            shopItem.innerHTML = `
                <div class="upgrade-icon">${item.icon}</div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${item.name}${purchased ? ' ✓' : ''}</div>
                    <div class="upgrade-description">${item.description}</div>
                </div>
                <div class="upgrade-cost">${purchased ? 'OWNED' : this.formatNumber(item.cost) + ' ' + this.config.game.currencyIcon}</div>
            `;
            
            if (!purchased) {
                shopItem.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.buyShopItem(item.id);
                });
            }
            
            container.appendChild(shopItem);
        });
    }
    
    buyShopItem(itemId) {
        const item = this.config.shop.items.find(i => i.id === itemId);
        if (!item || this.gameState.shopPurchases[itemId]) return;
        
        if (this.gameState.currency >= item.cost) {
            this.gameState.currency -= item.cost;
            this.gameState.shopPurchases[itemId] = true;
            
            this.playSound('achievement');
            
            // Recalculate powers/multipliers after shop purchase
            this.updateClickPower();
            
            // Apply cosmetics immediately
            this.applyCosmetics();
            
            this.renderShop();
            this.updateUI();
            
            // Show purchase notification
            const popup = document.createElement('div');
            popup.className = 'achievement-popup';
            popup.innerHTML = `
                <div class="achievement-popup-header">🏪 Shop Purchase!</div>
                <div class="achievement-popup-icon">${item.icon}</div>
                <div class="achievement-popup-name">${item.name}</div>
                <div class="achievement-popup-desc">Unlocked permanently!</div>
            `;
            document.body.appendChild(popup);
            setTimeout(() => {
                popup.classList.add('fade-out');
                setTimeout(() => popup.remove(), 500);
            }, 3000);
            
            console.log(`✅ Purchased: ${item.name}`);
            
            // Apply shop effects
            this.applyShopEffects();
        }
    }
    
    applyShopEffects() {
        // Shop effects are now applied directly in calculation methods
        // (updateClickPower, calculateGeneratorMultiplier, calculatePrestigeGain, etc.)
        // This function is kept for future shop items that need immediate application
    }
    
    applyCosmetics() {
        // Apply purchased cosmetic items
        
        // Deep Purple Theme
        if (this.gameState.shopPurchases['dark_theme']) {
            document.body.classList.add('theme-deep-purple');
        } else {
            document.body.classList.remove('theme-deep-purple');
        }
        
        // Ruby Gem Skin
        if (this.gameState.shopPurchases['gem_skin_ruby']) {
            document.body.classList.add('skin-ruby');
            // Change main gem icon to ruby
            const clickerIcon = document.getElementById('clicker-icon');
            if (clickerIcon) clickerIcon.textContent = '🔴';
        } else {
            document.body.classList.remove('skin-ruby');
            const clickerIcon = document.getElementById('clicker-icon');
            if (clickerIcon) clickerIcon.textContent = this.config.game.clickableIcon;
        }
    }
    
    checkSmartNotifications() {
        // Only run if notifications are purchased
        if (!this.gameState.shopPurchases['notifications']) return;
        
        // Check if can prestige
        const prestigeGain = this.calculatePrestigeGain();
        if (prestigeGain > 0 && !this.gameState.notifiedAbout.prestigeReady) {
            this.showNotification(`⭐ You can prestige for +${this.formatNumber(prestigeGain)}⭐!`, 'success');
            this.gameState.notifiedAbout.prestigeReady = true;
        }
        
        // Reset notification flag when no longer can prestige
        if (prestigeGain === 0) {
            this.gameState.notifiedAbout.prestigeReady = false;
        }
        
        // Check for expensive multipliers affordable
        const expensiveThreshold = this.gameState.currency * 0.5; // If it costs less than half current gems
        let foundAffordable = false;
        
        // Check generator multipliers
        this.config.generatorMultipliers.forEach(multiplier => {
            const level = this.gameState.generatorMultipliers[multiplier.id]?.level || 0;
            if (multiplier.maxLevel && level >= multiplier.maxLevel) return;
            
            const cost = this.calculateCost(multiplier.baseCost, multiplier.costMultiplier, level);
            if (this.gameState.currency >= cost && cost >= 100000 && !foundAffordable) {
                foundAffordable = true;
                if (!this.gameState.notifiedAbout.canAffordImportant) {
                    this.showNotification(`💪 You can afford ${multiplier.name}!`, 'info');
                    this.gameState.notifiedAbout.canAffordImportant = true;
                }
            }
        });
        
        // Reset notification flag when can't afford anymore
        if (!foundAffordable) {
            this.gameState.notifiedAbout.canAffordImportant = false;
        }
    }
    
    renderAchievements() {
        if (!this.config.achievements.enabled) return;
        
        const container = document.getElementById('achievements-container');
        container.innerHTML = '';
        
        this.config.achievements.list.forEach(achievement => {
            const unlocked = this.gameState.achievements[achievement.id];
            
            const item = document.createElement('div');
            item.className = `achievement-item ${unlocked ? 'unlocked' : 'locked'}`;
            item.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
            `;
            
            container.appendChild(item);
        });
    }
    
    renderMilestones() {
        if (!this.config.milestones?.enabled) return;
        
        const container = document.getElementById('milestones-container');
        container.innerHTML = '';
        
        this.config.milestones.list.forEach(milestone => {
            const unlocked = this.gameState.milestones[milestone.id];
            
            const item = document.createElement('div');
            item.className = `achievement-item milestone-item ${unlocked ? 'unlocked' : 'locked'}`;
            item.innerHTML = `
                <div class="achievement-icon">${unlocked ? '🌟' : '🔒'}</div>
                <div class="achievement-name">${milestone.name}</div>
                <div class="achievement-description">
                    ${milestone.description}<br>
                    <small style="color: ${unlocked ? '#2ecc71' : '#ffd43b'};">
                        ${unlocked ? '✓ UNLOCKED' : `Requires: ${this.formatNumber(milestone.threshold)} total gems`}
                    </small>
                </div>
            `;
            
            container.appendChild(item);
        });
    }

    updateAffordability() {
        // Update generator affordability without full re-render
        const generatorItems = document.querySelectorAll('#generators-container .upgrade-item');
        this.config.generators.forEach((generator, index) => {
            const level = this.gameState.generators[generator.id].level;
            const cost = this.calculateCost(generator.baseCost, generator.costMultiplier, level);
            const canAfford = this.gameState.currency >= cost;
            
            if (generatorItems[index]) {
                if (canAfford) {
                    generatorItems[index].classList.remove('disabled');
                } else {
                    generatorItems[index].classList.add('disabled');
                }
            }
        });
        
        // Update click upgrade affordability
        const upgradeItems = document.querySelectorAll('#upgrades-container .upgrade-item');
        this.config.clickUpgrades.forEach((upgrade, index) => {
            const level = this.gameState.clickUpgrades[upgrade.id].level;
            const cost = this.calculateCost(upgrade.baseCost, upgrade.costMultiplier, level);
            const canAfford = this.gameState.currency >= cost;
            
            if (upgradeItems[index]) {
                if (canAfford) {
                    upgradeItems[index].classList.remove('disabled');
                } else {
                    upgradeItems[index].classList.add('disabled');
                }
            }
        });
        
        // Update multiplier upgrade affordability
        const multiplierItems = document.querySelectorAll('#multipliers-container .upgrade-item');
        let multiplierIndex = 0;
        
        // Check click multipliers
        this.config.clickMultipliers.forEach((multiplier) => {
            const level = this.gameState.clickMultipliers[multiplier.id].level;
            const cost = this.calculateCost(multiplier.baseCost, multiplier.costMultiplier, level);
            const canAfford = this.gameState.currency >= cost;
            
            if (multiplierItems[multiplierIndex]) {
                if (canAfford) {
                    multiplierItems[multiplierIndex].classList.remove('disabled');
                } else {
                    multiplierItems[multiplierIndex].classList.add('disabled');
                }
            }
            multiplierIndex++;
        });
        
        // Check generator multipliers
        this.config.generatorMultipliers.forEach((multiplier) => {
            const level = this.gameState.generatorMultipliers[multiplier.id].level;
            const cost = this.calculateCost(multiplier.baseCost, multiplier.costMultiplier, level);
            const canAfford = this.gameState.currency >= cost;
            
            if (multiplierItems[multiplierIndex]) {
                if (canAfford) {
                    multiplierItems[multiplierIndex].classList.remove('disabled');
                } else {
                    multiplierItems[multiplierIndex].classList.add('disabled');
                }
            }
            multiplierIndex++;
        });
        
        // Update shop item affordability
        if (this.config.shop?.enabled) {
            const shopItems = document.querySelectorAll('#shop-container .upgrade-item');
            this.config.shop.items.forEach((item, index) => {
                const purchased = this.gameState.shopPurchases[item.id];
                const canAfford = this.gameState.currency >= item.cost;
                
                if (shopItems[index] && !purchased) {
                    if (canAfford) {
                        shopItems[index].classList.remove('disabled');
                    } else {
                        shopItems[index].classList.add('disabled');
                    }
                }
            });
        }
    }
    
    updateUI() {
        // Update currency display
        document.getElementById('currency-amount').textContent = this.formatNumber(this.gameState.currency);
        
        // Calculate per second from generators
        const generatorPerSecond = this.calculateProductionPerSecond();
        
        // Calculate per second from auto-clicker
        let autoClickerPerSecond = 0;
        if (this.config.autoClicker.enabled && this.gameState.autoClickerLevel > 0) {
            const clicksPerSec = this.config.autoClicker.clicksPerSecond + 
                (this.gameState.autoClickerLevel - 1) * this.config.autoClicker.clicksIncreasePerLevel;
            autoClickerPerSecond = clicksPerSec * this.gameState.clickPower;
        }
        
        // Calculate per second from manual clicking
        const now = Date.now();
        this.recentClicks = this.recentClicks.filter(time => now - time < this.clickRateWindow);
        const clickRate = this.recentClicks.length / (this.clickRateWindow / 1000);
        const manualClicksPerSecond = clickRate * this.gameState.clickPower;
        
        // Combine all rates
        const totalPerSecond = generatorPerSecond + autoClickerPerSecond + manualClicksPerSecond;
        
        // Show breakdown with gem rush indicator
        const gemRushActive = this.gameState.luckyEvent.active && this.gameState.luckyEvent.type === 'gem_rush';
        const rushEmoji = gemRushActive ? ' 🎊' : '';
        
        if (manualClicksPerSecond > 0.1 && autoClickerPerSecond > 0) {
            document.getElementById('per-second').textContent = 
                `${this.formatNumber(totalPerSecond)}${rushEmoji} (Gen: ${this.formatNumber(generatorPerSecond)} + Auto: ${this.formatNumber(autoClickerPerSecond)} + Click: ${this.formatNumber(manualClicksPerSecond)})`;
        } else if (manualClicksPerSecond > 0.1) {
            document.getElementById('per-second').textContent = 
                `${this.formatNumber(totalPerSecond)}${rushEmoji} (Gen: ${this.formatNumber(generatorPerSecond)} + Click: ${this.formatNumber(manualClicksPerSecond)})`;
        } else if (autoClickerPerSecond > 0) {
            document.getElementById('per-second').textContent = 
                `${this.formatNumber(totalPerSecond)}${rushEmoji} (Gen: ${this.formatNumber(generatorPerSecond)} + Auto: ${this.formatNumber(autoClickerPerSecond)})`;
        } else {
            document.getElementById('per-second').textContent = this.formatNumber(generatorPerSecond) + rushEmoji;
        }
        
        // Update click power with golden gem indicator
        const goldenGemActive = this.gameState.luckyEvent.active && this.gameState.luckyEvent.type === 'golden_gem';
        if (goldenGemActive) {
            const boostedPower = this.gameState.clickPower * this.config.luckyEvents.goldenGemMultiplier;
            document.getElementById('click-power').textContent = 
                `${this.formatNumber(boostedPower)} 🌟 (${this.config.luckyEvents.goldenGemMultiplier}x!)`;
        } else {
            document.getElementById('click-power').textContent = this.formatNumber(this.gameState.clickPower);
        }
        
        // Update total clicks
        document.getElementById('total-clicks').textContent = this.formatNumber(this.gameState.totalClicks);
        
        // Update prestige
        if (this.config.prestige.enabled) {
            document.getElementById('prestige-amount').textContent = this.formatNumber(this.gameState.prestigePoints);
            const bonus = (this.gameState.prestigePoints * this.config.prestige.bonusPerPoint * 100).toFixed(1);
            document.getElementById('prestige-bonus').textContent = bonus;
            
            const prestigeGain = this.calculatePrestigeGain();
            document.getElementById('prestige-gain').textContent = this.formatNumber(prestigeGain);
            
            // Update requirement text with scaled requirement
            const requirement = this.getPrestigeRequirement();
            const remaining = Math.max(0, requirement - this.gameState.totalEarned);
            if (remaining > 0) {
                document.getElementById('prestige-requirement-text').textContent = 
                    `Need ${this.formatNumber(remaining)} more gems (${this.formatNumber(this.gameState.totalEarned)} / ${this.formatNumber(requirement)})`;
            } else {
                document.getElementById('prestige-requirement-text').textContent = 
                    `Ready to prestige! (${this.formatNumber(this.gameState.totalEarned)} total earned)`;
            }
            
            const prestigeButton = document.getElementById('prestige-button');
            if (prestigeGain > 0) {
                prestigeButton.disabled = false;
            } else {
                prestigeButton.disabled = true;
            }
        }
        
        // Update rebirth
        if (this.config.rebirth?.enabled && this.gameState.rebirthPoints > 0) {
            document.getElementById('rebirth-stat').style.display = 'flex';
            document.getElementById('rebirth-amount').textContent = this.formatNumber(this.gameState.rebirthPoints);
            const rebirthMultiplier = Math.pow(this.config.rebirth.bonusPerPoint, this.gameState.rebirthPoints);
            document.getElementById('rebirth-multiplier').textContent = this.formatNumber(rebirthMultiplier);
        }
        
        // Update stats
        document.getElementById('stat-total-earned').textContent = this.formatNumber(this.gameState.totalEarned);
        document.getElementById('stat-total-clicks').textContent = this.formatNumber(this.gameState.totalClicks);
        document.getElementById('stat-click-earned').textContent = this.formatNumber(this.gameState.clickEarned);
        document.getElementById('stat-generator-earned').textContent = this.formatNumber(this.gameState.generatorEarned);
        
        // Calculate gems per hour
        const perHour = this.calculateProductionPerSecond() * 3600;
        document.getElementById('stat-per-hour').textContent = this.formatNumber(perHour);
        
        // Calculate average clicks per second
        const avgClicksPerSecond = this.gameState.playTime > 0 ? this.gameState.totalClicks / this.gameState.playTime : 0;
        document.getElementById('stat-avg-clicks').textContent = avgClicksPerSecond.toFixed(2);
        
        document.getElementById('stat-prestige-count').textContent = this.gameState.prestigeCount;
        document.getElementById('stat-rebirth-count').textContent = this.gameState.rebirthCount;
        document.getElementById('stat-play-time').textContent = this.formatPlayTime(this.gameState.playTime);
        
        // Update rebirth UI
        if (this.config.rebirth?.enabled) {
            const canRebirth = this.gameState.prestigeCount >= this.config.rebirth.requirement;
            const rebirthGain = canRebirth ? 1 : 0;
            const currentBonus = Math.pow(this.config.rebirth.bonusPerPoint, this.gameState.rebirthPoints);
            
            // Always show rebirth section if player has rebirthed at least once OR meets requirement
            if (this.gameState.rebirthPoints > 0 || canRebirth) {
                document.getElementById('rebirth-section').style.display = 'block';
            }
            
            document.getElementById('rebirth-gain').textContent = rebirthGain;
            document.getElementById('rebirth-bonus-display').textContent = this.formatNumber(currentBonus) + 'x';
            
            const rebirthButton = document.getElementById('rebirth-button');
            if (canRebirth) {
                rebirthButton.disabled = false;
            } else {
                rebirthButton.disabled = true;
            }
        }
        
        // Update auto clicker display
        if (this.config.autoClicker.enabled) {
            const cost = this.calculateCost(
                this.config.autoClicker.baseCost,
                this.config.autoClicker.costMultiplier,
                this.gameState.autoClickerLevel
            );
            const clicksPerSec = this.gameState.autoClickerLevel > 0 ?
                this.config.autoClicker.clicksPerSecond + 
                (this.gameState.autoClickerLevel - 1) * this.config.autoClicker.clicksIncreasePerLevel : 0;
            
            document.getElementById('auto-clicker-level').textContent = this.gameState.autoClickerLevel;
            document.getElementById('auto-clicker-speed').textContent = clicksPerSec;
            document.getElementById('auto-clicker-cost').textContent = this.formatNumber(cost);
            
            const buyButton = document.getElementById('buy-auto-clicker');
            if (this.gameState.currency >= cost) {
                buyButton.disabled = false;
                buyButton.classList.remove('disabled');
            } else {
                buyButton.disabled = true;
                buyButton.classList.add('disabled');
            }
        }
    }
    
    buyAutoClicker() {
        const cost = this.calculateCost(
            this.config.autoClicker.baseCost,
            this.config.autoClicker.costMultiplier,
            this.gameState.autoClickerLevel
        );
        
        if (this.gameState.currency >= cost) {
            this.gameState.currency -= cost;
            this.gameState.autoClickerLevel++;
            this.playSound('buy');
            this.updateUI();
            console.log(`✅ Auto Clicker upgraded to level ${this.gameState.autoClickerLevel}!`);
        }
    }

    formatNumber(num) {
        if (!this.config.ui.numberFormat.useShortFormat) {
            return num.toFixed(this.config.ui.numberFormat.decimalPlaces);
        }
        
        if (num < 1000) {
            return Math.floor(num).toString();
        }
        
        const suffixes = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
        const tier = Math.floor(Math.log10(num) / 3);
        
        if (tier <= 0) return Math.floor(num).toString();
        if (tier >= suffixes.length) {
            return num.toExponential(2);
        }
        
        const suffix = suffixes[tier];
        const scale = Math.pow(10, tier * 3);
        const scaled = num / scale;
        
        return scaled.toFixed(this.config.ui.numberFormat.decimalPlaces) + suffix;
    }

    formatPlayTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    switchTab(tabName) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to selected tab
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }

    startGameLoop() {
        // Main update loop (runs every 100ms)
        this.updateInterval = setInterval(() => {
            const now = Date.now();
            const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
            this.lastUpdate = now;
            
            // Update play time
            this.gameState.playTime += deltaTime;
            
            // Generate currency from generators
            const production = this.calculateProductionPerSecond();
            const earned = production * deltaTime;
            
            // Safety check: prevent infinity and NaN
            if (!Number.isFinite(earned) || earned > Number.MAX_SAFE_INTEGER) {
                console.warn('⚠️ Production too high, capping at safe maximum');
                this.gameState.currency = Number.MAX_SAFE_INTEGER;
                this.gameState.totalEarned = Number.MAX_SAFE_INTEGER;
            } else {
                this.gameState.currency += earned;
                this.gameState.totalEarned += earned;
                this.gameState.generatorEarned += earned;
            }
            
            // Auto clicker
            if (this.config.autoClicker.enabled && this.gameState.autoClickerLevel > 0) {
                const clicksPerSec = this.config.autoClicker.clicksPerSecond + 
                    (this.gameState.autoClickerLevel - 1) * this.config.autoClicker.clicksIncreasePerLevel;
                const autoClicks = clicksPerSec * deltaTime;
                let autoEarned = autoClicks * this.gameState.clickPower;
                
                // Apply golden gem multiplier to auto-clicker too
                if (this.gameState.luckyEvent.active && this.gameState.luckyEvent.type === 'golden_gem') {
                    autoEarned *= this.config.luckyEvents.goldenGemMultiplier;
                }
                
                this.gameState.currency += autoEarned;
                this.gameState.totalEarned += autoEarned;
                this.gameState.clickEarned += autoEarned;
                this.gameState.totalClicks += autoClicks;
            }
            
            // Update UI
            this.updateUI();
            
            // Update affordability of items (so they light up when you can buy)
            this.updateAffordability();
            
            // Check achievements
            this.checkAchievements();
            
            // Check milestones
            this.checkMilestones();
            
            // Check and update lucky events
            this.updateLuckyEvents();
            
            // Update progress bars
            this.updateProgressBars();
            
            // Check smart notifications (every 10 seconds to avoid spam)
            if (Math.random() < 0.01) { // ~1% chance per 100ms = once every ~10 seconds
                this.checkSmartNotifications();
            }
        }, 100);
        
        // Auto-save loop
        this.saveInterval = setInterval(() => {
            this.saveGame();
        }, this.config.game.saveInterval);
    }

    saveGame(showNotification = false) {
        // Don't save if we're in the middle of resetting
        if (this.isResetting) return;
        
        try {
            const saveData = {
                version: '1.0',
                gameState: this.gameState,
                timestamp: Date.now()
            };
            
            localStorage.setItem('idleClickerSave', JSON.stringify(saveData));
            
            if (showNotification) {
                this.showSaveNotification();
            }
        } catch (error) {
            console.error('Error saving game:', error);
        }
    }
    
    showSaveNotification() {
        const notification = document.createElement('div');
        notification.className = 'save-notification';
        notification.textContent = '💾 Game Saved!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    loadGame() {
        try {
            const savedData = localStorage.getItem('idleClickerSave');
            
            if (savedData) {
                const saveData = JSON.parse(savedData);
                
                // Handle offline progress
                const offlineTime = (Date.now() - saveData.timestamp) / 1000; // seconds
                
                console.log(`Time since last save: ${offlineTime.toFixed(1)} seconds`);
                
                // Merge saved state with current state
                this.gameState = {
                    ...this.gameState,
                    ...saveData.gameState
                };
                
                // Calculate offline earnings (limited to prevent exploits)
                // Only show if away for at least 30 seconds and less than 24 hours (or 48 with upgrade)
                const maxOfflineTime = this.gameState.shopPurchases?.['offline_cap'] ? 172800 : 86400;
                if (offlineTime > 30 && offlineTime < maxOfflineTime) { // 30 seconds to 24/48 hours
                    const production = this.calculateProductionPerSecond();
                    
                    // Also calculate auto-clicker offline production
                    let autoClickerProduction = 0;
                    if (this.config.autoClicker?.enabled && this.gameState.autoClickerLevel > 0) {
                        const clicksPerSec = this.config.autoClicker.clicksPerSecond + 
                            (this.gameState.autoClickerLevel - 1) * this.config.autoClicker.clicksIncreasePerLevel;
                        autoClickerProduction = clicksPerSec * this.gameState.clickPower;
                    }
                    
                    const totalProduction = production + autoClickerProduction;
                    const offlineEarnings = totalProduction * offlineTime;
                    
                    // Only give offline earnings if there's actual production
                    if (offlineEarnings > 0) {
                        this.gameState.currency += offlineEarnings;
                        this.gameState.totalEarned += offlineEarnings;
                        this.gameState.generatorEarned += offlineEarnings;
                        
                        // Show offline earnings popup
                        this.showOfflineEarningsPopup(offlineEarnings, offlineTime);
                        
                        console.log(`Welcome back! You earned ${this.formatNumber(offlineEarnings)} while away!`);
                    }
                }
                
                this.gameState.lastSave = Date.now();
                this.lastUpdate = Date.now();
            }
        } catch (error) {
            console.error('Error loading game:', error);
        }
    }

    updateLuckyEvents() {
        if (!this.config.luckyEvents?.enabled) return;
        
        const now = Date.now();
        
        // Check if current event ended
        if (this.gameState.luckyEvent.active && now >= this.gameState.luckyEvent.endTime) {
            this.gameState.luckyEvent.active = false;
            this.gameState.luckyEvent.type = null;
            document.getElementById('lucky-event-banner').style.display = 'none';
            console.log('Lucky event ended!');
        }
        
        // Update event timer and info display (even if triggered by admin)
        if (this.gameState.luckyEvent.active) {
            const remaining = Math.ceil((this.gameState.luckyEvent.endTime - now) / 1000);
            const eventTextContainer = document.getElementById('event-text-container');
            
            if (!eventTextContainer) {
                console.error('❌ Event text container not found!');
                return;
            }
            
            if (this.gameState.luckyEvent.type === 'golden_gem') {
                eventTextContainer.innerHTML = `
                    <div class="event-name">🌟 Golden Gem Active!</div>
                    <div class="event-timer">Click for ${this.config.luckyEvents.goldenGemMultiplier}x gems! ${remaining}s remaining</div>
                `;
            } else if (this.gameState.luckyEvent.type === 'gem_rush') {
                eventTextContainer.innerHTML = `
                    <div class="event-name">🎊 Gem Rush Active!</div>
                    <div class="event-timer">${this.config.luckyEvents.gemRushMultiplier}x production! ${remaining}s remaining</div>
                `;
            }
        }
        
        // Only randomly trigger events if shop item is unlocked
        if (!this.gameState.shopPurchases['lucky_events']) return;
        
        // Chance to trigger new event (only if no event active)
        if (!this.gameState.luckyEvent.active && Math.random() < 0.001) { // 0.1% chance per check
            this.triggerLuckyEvent();
        }
    }
    
    triggerLuckyEvent() {
        // Randomly choose event type
        const eventType = Math.random() < 0.6 ? 'golden_gem' : 'gem_rush';
        
        this.gameState.luckyEvent.active = true;
        this.gameState.luckyEvent.type = eventType;
        
        const banner = document.getElementById('lucky-event-banner');
        const eventIcon = document.getElementById('event-icon');
        const eventTextContainer = document.getElementById('event-text-container');
        
        if (!banner || !eventIcon || !eventTextContainer) {
            console.error('❌ Lucky event elements not found!');
            return;
        }
        
        if (eventType === 'golden_gem') {
            const duration = 15;
            this.gameState.luckyEvent.endTime = Date.now() + (duration * 1000);
            eventIcon.textContent = '🌟';
            eventTextContainer.innerHTML = `
                <div class="event-name">🌟 Golden Gem Active!</div>
                <div class="event-timer">Click for ${this.config.luckyEvents.goldenGemMultiplier}x gems! ${duration}s remaining</div>
            `;
        } else {
            const duration = this.config.luckyEvents.gemRushDuration;
            this.gameState.luckyEvent.endTime = Date.now() + (duration * 1000);
            eventIcon.textContent = '🎊';
            eventTextContainer.innerHTML = `
                <div class="event-name">🎊 Gem Rush Active!</div>
                <div class="event-timer">${this.config.luckyEvents.gemRushMultiplier}x production! ${duration}s remaining</div>
            `;
        }
        
        banner.style.display = 'flex';
        this.playSound('achievement');
    }
    
    updateProgressBars() {
        // Prestige progress
        const prestigeReq = this.config.prestige.requirement;
        const prestigeProgress = Math.min((this.gameState.totalEarned / prestigeReq) * 100, 100);
        document.getElementById('prestige-progress-bar').style.width = prestigeProgress + '%';
        document.getElementById('prestige-progress-text').textContent = 
            `${this.formatNumber(this.gameState.totalEarned)} / ${this.formatNumber(prestigeReq)}`;
        
        // Milestone progress
        if (this.config.milestones?.enabled) {
            const nextMilestone = this.config.milestones.list.find(m => !this.gameState.milestones[m.id]);
            if (nextMilestone) {
                const milestoneProgress = Math.min((this.gameState.totalEarned / nextMilestone.threshold) * 100, 100);
                document.getElementById('milestone-progress-bar').style.width = milestoneProgress + '%';
                document.getElementById('milestone-progress-text').textContent = 
                    `${this.formatNumber(this.gameState.totalEarned)} / ${this.formatNumber(nextMilestone.threshold)}`;
            } else {
                // All milestones completed
                document.getElementById('milestone-progress-bar').style.width = '100%';
                document.getElementById('milestone-progress-text').textContent = 'All Complete!';
            }
        }
    }
    
    confirmReset() {
        const confirmed = confirm('⚠️ FINAL WARNING ⚠️\n\nReset ALL progress?\n\nThis will DELETE:\n✗ All gems\n✗ All generators\n✗ All upgrades\n✗ All prestige/rebirth\n✗ All achievements\n✗ ALL progress\n\nThis CANNOT be undone!\n\nClick OK to PERMANENTLY DELETE everything.');
        
        if (!confirmed) {
            console.log('Reset cancelled');
            return;
        }
        
        try {
            console.log('🔄 RESET INITIATED...');
            
            // Flag to prevent auto-save during reset
            this.isResetting = true;
            
            // Create visual feedback
            const resetOverlay = document.createElement('div');
            resetOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                z-index: 99999;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 24px;
                font-weight: bold;
            `;
            resetOverlay.innerHTML = `
                <div>🔄 RESETTING GAME...</div>
                <div style="font-size: 16px; margin-top: 20px;">Please wait...</div>
            `;
            document.body.appendChild(resetOverlay);
            
            // Stop all game activity
            if (this.updateInterval) clearInterval(this.updateInterval);
            if (this.saveInterval) clearInterval(this.saveInterval);
            
            // Nuclear option: Delete everything
            try {
                localStorage.clear();
            } catch (e) {
                console.error('localStorage.clear() failed:', e);
            }
            
            // Double-check: manually remove known keys
            const keysToRemove = [
                'idleClickerSave',
                'gemClickerSettings',
                'gameState',
                'settings'
            ];
            keysToRemove.forEach(key => {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            });
            
            // Force reload in multiple ways
            setTimeout(() => {
                window.location.reload(true);
                window.location.href = window.location.href.split('?')[0] + '?reset=' + Date.now();
            }, 500);
            
        } catch (e) {
            console.error('❌ CRITICAL ERROR during reset:', e);
            alert('Reset failed! Please:\n\n1. Press F12\n2. Go to Application tab\n3. Click "Clear storage"\n4. Click "Clear site data"\n5. Refresh page\n\nOR use incognito mode');
        }
    }

    exportSave() {
        try {
            const saveData = localStorage.getItem('idleClickerSave');
            if (!saveData) {
                alert('No save data found!');
                return;
            }
            
            const encodedSave = btoa(saveData);
            
            // Copy to clipboard
            navigator.clipboard.writeText(encodedSave).then(() => {
                alert('Save exported to clipboard!');
            }).catch(() => {
                // Fallback: show in prompt
                prompt('Copy this save data:', encodedSave);
            });
        } catch (error) {
            console.error('Error exporting save:', error);
            alert('Error exporting save!');
        }
    }

    showImportModal() {
        document.getElementById('import-modal').classList.add('active');
        document.getElementById('import-textarea').value = '';
    }

    hideImportModal() {
        document.getElementById('import-modal').classList.remove('active');
    }

    importSave() {
        try {
            const encodedSave = document.getElementById('import-textarea').value.trim();
            if (!encodedSave) {
                alert('Please paste save data!');
                return;
            }
            
            const saveData = atob(encodedSave);
            const parsed = JSON.parse(saveData);
            
            // Validate save data
            if (!parsed.gameState) {
                throw new Error('Invalid save data');
            }
            
            localStorage.setItem('idleClickerSave', saveData);
            alert('Save imported successfully! Reloading game...');
            location.reload();
        } catch (error) {
            console.error('Error importing save:', error);
            alert('Error importing save! Make sure the data is correct.');
        }
    }
    
    // Admin Panel Functions
    toggleAdminPanel() {
        if (!this.adminUnlocked) {
            const password = prompt('🔒 Enter admin password:');
            if (password === this.adminPassword) {
                this.adminUnlocked = true;
                alert('✅ Admin panel unlocked!');
            } else if (password !== null) {
                alert('❌ Incorrect password!');
                return;
            } else {
                return;
            }
        }
        
        const panel = document.getElementById('admin-panel');
        const toggle = document.getElementById('admin-toggle');
        
        if (panel.classList.contains('hidden')) {
            panel.classList.remove('hidden');
            toggle.classList.add('hidden');
            // Update current values when opening
            this.updateAdminDisplay();
        } else {
            panel.classList.add('hidden');
            toggle.classList.remove('hidden');
        }
    }
    
    updateAdminDisplay() {
        // Update current gem count
        document.getElementById('admin-current-gems').textContent = this.formatNumber(this.gameState.currency);
        
        // Update generator level
        this.updateAdminGeneratorLevel();
        
        // Update upgrade level
        this.updateAdminUpgradeLevel();
        
        // Update auto clicker level
        document.getElementById('admin-current-autoclicker').textContent = this.gameState.autoClickerLevel;
        
        // Update prestige points and count
        document.getElementById('admin-current-prestige').textContent = this.gameState.prestigePoints;
        document.getElementById('admin-current-prestige-count').textContent = this.gameState.prestigeCount;
        
        // Update rebirth points
        document.getElementById('admin-current-rebirth').textContent = this.gameState.rebirthPoints;
    }
    
    updateAdminGeneratorLevel() {
        const generatorId = document.getElementById('admin-generator-select').value;
        const level = this.gameState.generators[generatorId]?.level || 0;
        document.getElementById('admin-current-generator-level').textContent = level;
    }
    
    updateAdminUpgradeLevel() {
        const upgradeId = document.getElementById('admin-upgrade-select').value;
        const level = this.gameState.clickUpgrades[upgradeId]?.level || 0;
        document.getElementById('admin-current-upgrade-level').textContent = level;
    }
    
    closeAdminPanel() {
        document.getElementById('admin-panel').classList.add('hidden');
        document.getElementById('admin-toggle').classList.remove('hidden');
    }
    
    populateAdminDropdowns() {
        // Populate generators dropdown
        const generatorSelect = document.getElementById('admin-generator-select');
        this.config.generators.forEach(generator => {
            const option = document.createElement('option');
            option.value = generator.id;
            option.textContent = `${generator.icon} ${generator.name}`;
            generatorSelect.appendChild(option);
        });
        
        // Populate upgrades dropdown
        const upgradeSelect = document.getElementById('admin-upgrade-select');
        this.config.clickUpgrades.forEach(upgrade => {
            const option = document.createElement('option');
            option.value = upgrade.id;
            option.textContent = `${upgrade.icon} ${upgrade.name}`;
            upgradeSelect.appendChild(option);
        });
    }
    
    adminAddGems(customAmount = null) {
        const amount = customAmount || parseFloat(document.getElementById('admin-gems-input').value);
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount!');
            return;
        }
        
        this.gameState.currency += amount;
        this.gameState.totalEarned += amount; // CRITICAL: Also add to totalEarned for prestige/stats!
        this.updateUI();
        this.renderGenerators();
        this.renderClickUpgrades();
        this.playSound('achievement');
        this.updateAdminDisplay();
        console.log(`✅ Admin: Added ${this.formatNumber(amount)} gems (total earned updated)`);
    }
    
    adminSetGenerator() {
        const generatorId = document.getElementById('admin-generator-select').value;
        const level = parseInt(document.getElementById('admin-generator-level').value);
        
        if (isNaN(level) || level < 0) {
            alert('Please enter a valid level!');
            return;
        }
        
        this.gameState.generators[generatorId].level = level;
        this.renderGenerators();
        this.updateUI();
        this.playSound('buy');
        this.updateAdminGeneratorLevel();
        
        const generator = this.config.generators.find(g => g.id === generatorId);
        console.log(`✅ Admin: Set ${generator.name} to level ${level}`);
    }
    
    adminSetUpgrade() {
        const upgradeId = document.getElementById('admin-upgrade-select').value;
        const level = parseInt(document.getElementById('admin-upgrade-level').value);
        
        if (isNaN(level) || level < 0) {
            alert('Please enter a valid level!');
            return;
        }
        
        this.gameState.clickUpgrades[upgradeId].level = level;
        this.updateClickPower();
        this.renderClickUpgrades();
        this.updateUI();
        this.playSound('buy');
        this.updateAdminUpgradeLevel();
        
        const upgrade = this.config.clickUpgrades.find(u => u.id === upgradeId);
        console.log(`✅ Admin: Set ${upgrade.name} to level ${level}`);
    }
    
    adminSetAutoClicker() {
        const level = parseInt(document.getElementById('admin-autoclicker-level').value);
        
        if (isNaN(level) || level < 0) {
            alert('Please enter a valid level!');
            return;
        }
        
        this.gameState.autoClickerLevel = level;
        this.updateUI();
        this.playSound('buy');
        this.updateAdminDisplay();
        
        console.log(`✅ Admin: Set Auto Clicker to level ${level}`);
    }
    
    adminUnlockAllAchievements() {
        if (!confirm('Unlock all achievements?')) return;
        
        this.config.achievements.list.forEach(achievement => {
            this.gameState.achievements[achievement.id] = true;
        });
        
        this.renderAchievements();
        this.playSound('achievement');
        console.log('✅ Admin: Unlocked all achievements');
    }
    
    adminResetAchievements() {
        if (!confirm('Reset all achievements? This cannot be undone!')) return;
        
        this.config.achievements.list.forEach(achievement => {
            this.gameState.achievements[achievement.id] = false;
        });
        
        this.renderAchievements();
        console.log('✅ Admin: Reset all achievements');
    }
    
    adminSetPrestige() {
        const points = parseInt(document.getElementById('admin-prestige-points').value);
        if (isNaN(points) || points < 0) {
            alert('Please enter a valid number!');
            return;
        }
        
        this.gameState.prestigePoints = points;
        this.updateUI();
        this.renderGenerators();
        this.playSound('achievement');
        this.updateAdminDisplay();
        console.log(`✅ Admin: Set prestige points to ${points}`);
    }
    
    adminSetPrestigeCount() {
        const count = parseInt(document.getElementById('admin-prestige-count').value);
        if (isNaN(count) || count < 0) {
            alert('Please enter a valid number!');
            return;
        }
        
        this.gameState.prestigeCount = count;
        this.updateUI();
        this.playSound('achievement');
        this.updateAdminDisplay();
        console.log(`✅ Admin: Set prestige count to ${count}`);
    }
    
    adminInstantPrestige() {
        if (!confirm('Perform instant prestige without resetting?')) return;
        
        const gain = this.calculatePrestigeGain();
        if (gain > 0) {
            this.gameState.prestigePoints += gain;
            this.gameState.prestigeCount++;
            this.updateUI();
            this.playSound('achievement');
            this.updateAdminDisplay();
            console.log(`✅ Admin: Instant prestige! +${gain} points`);
        } else {
            alert('Not enough total earned for prestige!');
        }
    }
    
    adminSetRebirth() {
        const points = parseInt(document.getElementById('admin-rebirth-points').value);
        if (isNaN(points) || points < 0) {
            alert('Please enter a valid number!');
            return;
        }
        
        this.gameState.rebirthPoints = points;
        this.updateUI();
        this.renderGenerators();
        this.playSound('achievement');
        this.updateAdminDisplay();
        console.log(`✅ Admin: Set rebirth points to ${points}`);
    }
    
    adminInstantRebirth() {
        if (!confirm('Perform instant rebirth without resetting?')) return;
        
        this.gameState.rebirthPoints++;
        this.gameState.rebirthCount++;
        this.updateUI();
        this.playSound('achievement');
        console.log(`✅ Admin: Instant rebirth! Now at ${this.gameState.rebirthPoints} points`);
    }
    
    adminUnlockAllShop() {
        if (!confirm('Unlock all shop items?')) return;
        
        this.config.shop.items.forEach(item => {
            this.gameState.shopPurchases[item.id] = true;
        });
        
        // Recalculate all bonuses
        this.updateClickPower();
        
        // Apply cosmetics
        this.applyCosmetics();
        
        this.renderShop();
        this.applyShopEffects();
        this.updateUI();
        this.playSound('achievement');
        console.log('✅ Admin: Unlocked all shop items');
    }
    
    adminResetShop() {
        if (!confirm('Reset all shop purchases?')) return;
        
        this.config.shop.items.forEach(item => {
            this.gameState.shopPurchases[item.id] = false;
        });
        
        // Recalculate all bonuses (remove shop effects)
        this.updateClickPower();
        
        // Remove cosmetics
        this.applyCosmetics();
        
        this.renderShop();
        this.updateUI();
        this.playSound('achievement');
        console.log('✅ Admin: Reset all shop purchases');
    }
    
    adminTriggerEvent(eventType) {
        // Admin can trigger events without shop unlock
        this.gameState.luckyEvent.active = true;
        this.gameState.luckyEvent.type = eventType;
        
        const banner = document.getElementById('lucky-event-banner');
        const eventIcon = document.getElementById('event-icon');
        const eventTextContainer = document.getElementById('event-text-container');
        
        if (!banner || !eventIcon || !eventTextContainer) {
            console.error('❌ Lucky event elements not found!');
            alert('Error: Event banner elements not found. Please refresh the page.');
            return;
        }
        
        if (eventType === 'golden_gem') {
            const duration = 15;
            this.gameState.luckyEvent.endTime = Date.now() + (duration * 1000);
            eventIcon.textContent = '🌟';
            eventTextContainer.innerHTML = `
                <div class="event-name">🌟 Golden Gem Active!</div>
                <div class="event-timer">Click for ${this.config.luckyEvents.goldenGemMultiplier}x gems! ${duration}s remaining</div>
            `;
        } else {
            const duration = this.config.luckyEvents.gemRushDuration;
            this.gameState.luckyEvent.endTime = Date.now() + (duration * 1000);
            eventIcon.textContent = '🎊';
            eventTextContainer.innerHTML = `
                <div class="event-name">🎊 Gem Rush Active!</div>
                <div class="event-timer">${this.config.luckyEvents.gemRushMultiplier}x production! ${duration}s remaining</div>
            `;
        }
        
        banner.style.display = 'flex';
        this.playSound('achievement');
    }
    
    adminForceReset() {
        // Admin command for instant reset (use from console: game.adminForceReset())
        console.log('👑 Admin force reset initiated');
        
        this.isResetting = true;
        
        // Stop everything
        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.saveInterval) clearInterval(this.saveInterval);
        
        // Clear storage
        localStorage.clear();
        sessionStorage.clear();
        
        setTimeout(() => {
            window.location.href = window.location.origin + window.location.pathname + '?reset=' + Date.now();
        }, 1000);
    }
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    window.game = new IdleClickerGame(); // Make game accessible in console
    window.game.init();
});

