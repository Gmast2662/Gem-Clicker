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
            playTime: 0,
            generators: {},
            clickUpgrades: {},
            multiplierUpgrades: {},
            achievements: {},
            lastSave: Date.now(),
            startTime: Date.now()
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
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    playSound(type) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        switch(type) {
            case 'click':
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.1);
                break;
            case 'buy':
                oscillator.frequency.value = 523.25; // C5
                gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
            case 'achievement':
                oscillator.frequency.value = 880; // A5
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.5);
                break;
        }
    }

    async init() {
        try {
            // Load config
            const response = await fetch('config.json');
            this.config = await response.json();
            
            // Load save or initialize new game
            this.loadGame();
            
            // Initialize UI
            this.initUI();
            
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
        
        // Initialize multiplier upgrades
        this.config.multiplierUpgrades.forEach(upgrade => {
            if (!this.gameState.multiplierUpgrades[upgrade.id]) {
                this.gameState.multiplierUpgrades[upgrade.id] = { level: 0 };
            }
        });
        
        // Initialize achievements
        if (this.config.achievements.enabled) {
            this.config.achievements.list.forEach(achievement => {
                if (this.gameState.achievements[achievement.id] === undefined) {
                    this.gameState.achievements[achievement.id] = false;
                }
            });
        }
        
        // Update click power
        this.updateClickPower();
        
        // Render UI elements
        this.renderGenerators();
        this.renderClickUpgrades();
        this.renderMultiplierUpgrades();
        this.renderAchievements();
        this.updateUI();
        
        // Show prestige UI if enabled
        if (this.config.prestige.enabled) {
            document.getElementById('prestige-section').style.display = 'block';
            document.getElementById('prestige-stat').style.display = 'flex';
            document.getElementById('prestige-icon').textContent = this.config.prestige.currencyIcon;
            document.getElementById('prestige-currency-name').textContent = this.config.prestige.currencyIcon;
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
        
        // Prestige button
        if (this.config.prestige.enabled) {
            document.getElementById('prestige-button').addEventListener('click', () => this.handlePrestige());
        }
        
        // Import modal
        document.getElementById('import-confirm').addEventListener('click', () => this.importSave());
        document.getElementById('import-cancel').addEventListener('click', () => this.hideImportModal());
        
        // Admin panel
        document.getElementById('admin-toggle').addEventListener('click', () => this.toggleAdminPanel());
        document.getElementById('admin-close').addEventListener('click', () => this.closeAdminPanel());
        document.getElementById('admin-add-gems').addEventListener('click', () => this.adminAddGems());
        document.getElementById('admin-set-generator').addEventListener('click', () => this.adminSetGenerator());
        document.getElementById('admin-set-upgrade').addEventListener('click', () => this.adminSetUpgrade());
        
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
    }

    handleClick(e) {
        // Resume audio context on first interaction (browser requirement)
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        
        // Add currency
        this.gameState.currency += this.gameState.clickPower;
        this.gameState.totalClicks++;
        this.gameState.totalEarned += this.gameState.clickPower;
        this.gameState.clickEarned += this.gameState.clickPower;
        
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
        
        // Floating number animation
        if (this.config.ui.animations.floatingNumbers) {
            this.createFloatingNumber(e.clientX, e.clientY, this.gameState.clickPower);
        }
        
        this.updateUI();
        this.checkAchievements();
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
        
        // Apply prestige bonus
        if (this.config.prestige.enabled) {
            const bonus = 1 + (this.gameState.prestigePoints * this.config.prestige.bonusPerPoint);
            power *= bonus;
        }
        
        this.gameState.clickPower = Math.floor(power);
    }

    calculateTotalMultiplier() {
        let totalMultiplier = 1;
        
        // Multiplier upgrades stack multiplicatively
        this.config.multiplierUpgrades.forEach(upgrade => {
            const level = this.gameState.multiplierUpgrades[upgrade.id].level;
            if (level > 0) {
                totalMultiplier *= Math.pow(upgrade.multiplier, level);
            }
        });
        
        // Apply prestige bonus
        if (this.config.prestige.enabled) {
            const prestigeBonus = 1 + (this.gameState.prestigePoints * this.config.prestige.bonusPerPoint);
            totalMultiplier *= prestigeBonus;
        }
        
        return totalMultiplier;
    }
    
    calculateProductionPerSecond() {
        let production = 0;
        
        this.config.generators.forEach(generator => {
            const level = this.gameState.generators[generator.id].level;
            production += level * generator.baseProduction;
        });
        
        // Apply all multipliers
        production *= this.calculateTotalMultiplier();
        
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
    
    buyMultiplierUpgrade(upgradeId) {
        const upgrade = this.config.multiplierUpgrades.find(u => u.id === upgradeId);
        if (!upgrade) {
            console.log('Multiplier upgrade not found:', upgradeId);
            return;
        }
        
        const currentLevel = this.gameState.multiplierUpgrades[upgradeId].level;
        const cost = this.calculateCost(upgrade.baseCost, upgrade.costMultiplier, currentLevel);
        
        console.log(`Attempting to buy ${upgrade.name}:`, {
            currentCurrency: this.gameState.currency,
            cost: cost,
            canAfford: this.gameState.currency >= cost
        });
        
        if (this.gameState.currency >= cost) {
            if (upgrade.maxLevel === null || currentLevel < upgrade.maxLevel) {
                this.gameState.currency -= cost;
                this.gameState.multiplierUpgrades[upgradeId].level++;
                
                console.log(`✅ Purchased ${upgrade.name}! New level: ${this.gameState.multiplierUpgrades[upgradeId].level}`);
                
                // Play buy sound
                this.playSound('buy');
                
                // Update everything
                this.renderMultiplierUpgrades();
                this.renderGenerators(); // Update generator production displays
                this.updateUI();
                this.checkAchievements();
            }
        } else {
            console.log(`❌ Cannot afford ${upgrade.name}. Need ${cost - this.gameState.currency} more gems.`);
        }
    }

    calculateCost(baseCost, multiplier, currentLevel) {
        return Math.floor(baseCost * Math.pow(multiplier, currentLevel));
    }

    calculatePrestigeGain() {
        if (!this.config.prestige.enabled) return 0;
        
        const totalEarned = this.gameState.totalEarned;
        if (totalEarned < this.config.prestige.requirement) return 0;
        
        let gain = 0;
        if (this.config.prestige.formula === 'sqrt') {
            gain = Math.floor(Math.sqrt(totalEarned / this.config.prestige.divisor));
        } else if (this.config.prestige.formula === 'log') {
            gain = Math.floor(Math.log10(totalEarned / this.config.prestige.divisor));
        }
        
        return Math.max(0, gain);
    }

    handlePrestige() {
        if (!this.config.prestige.enabled) return;
        
        const gain = this.calculatePrestigeGain();
        
        if (gain <= 0) return;
        
        if (this.config.prestige.confirmationRequired) {
            const confirmed = confirm(
                `Are you sure you want to prestige?\n\n` +
                `You will gain ${gain} ${this.config.prestige.currencyName}.\n` +
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
            playTime: playTime,
            generators: {},
            clickUpgrades: {},
            multiplierUpgrades: {},
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
        
        this.config.multiplierUpgrades.forEach(upgrade => {
            this.gameState.multiplierUpgrades[upgrade.id] = { level: 0 };
        });
        
        this.updateClickPower();
        this.renderGenerators();
        this.renderClickUpgrades();
        this.renderMultiplierUpgrades();
        this.updateUI();
        this.saveGame();
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
        
        // Simple notification - could be enhanced
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
        
        this.config.multiplierUpgrades.forEach(upgrade => {
            const level = this.gameState.multiplierUpgrades[upgrade.id].level;
            const cost = this.calculateCost(upgrade.baseCost, upgrade.costMultiplier, level);
            const canAfford = this.gameState.currency >= cost;
            const currentMultiplier = level > 0 ? Math.pow(upgrade.multiplier, level) : 1;
            const nextMultiplier = Math.pow(upgrade.multiplier, level + 1);
            
            const item = document.createElement('div');
            item.className = `upgrade-item ${!canAfford ? 'disabled' : ''}`;
            item.style.cursor = 'pointer';
            item.innerHTML = `
                <div class="upgrade-icon">${upgrade.icon}</div>
                <div class="upgrade-info">
                    <div class="upgrade-name">${upgrade.name}</div>
                    <div class="upgrade-description">${upgrade.description}</div>
                    <div class="upgrade-stats">
                        <span class="upgrade-level">Level: ${level}</span>
                        ${level > 0 ? `<span class="upgrade-production">Current: ${this.formatNumber(currentMultiplier)}x → ${this.formatNumber(nextMultiplier)}x</span>` : `<span class="upgrade-production">Next: ${upgrade.multiplier}x</span>`}
                    </div>
                </div>
                <div class="upgrade-cost">${this.formatNumber(cost)} ${this.config.game.currencyIcon}</div>
            `;
            
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.buyMultiplierUpgrade(upgrade.id);
            });
            
            container.appendChild(item);
        });
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
        this.config.multiplierUpgrades.forEach((upgrade, index) => {
            const level = this.gameState.multiplierUpgrades[upgrade.id].level;
            const cost = this.calculateCost(upgrade.baseCost, upgrade.costMultiplier, level);
            const canAfford = this.gameState.currency >= cost;
            
            if (multiplierItems[index]) {
                if (canAfford) {
                    multiplierItems[index].classList.remove('disabled');
                } else {
                    multiplierItems[index].classList.add('disabled');
                }
            }
        });
    }
    
    updateUI() {
        // Update currency display
        document.getElementById('currency-amount').textContent = this.formatNumber(this.gameState.currency);
        
        // Calculate per second from generators
        const generatorPerSecond = this.calculateProductionPerSecond();
        
        // Calculate per second from clicking
        const now = Date.now();
        this.recentClicks = this.recentClicks.filter(time => now - time < this.clickRateWindow);
        const clickRate = this.recentClicks.length / (this.clickRateWindow / 1000);
        const clicksPerSecond = clickRate * this.gameState.clickPower;
        
        // Combine both rates
        const totalPerSecond = generatorPerSecond + clicksPerSecond;
        
        // Show combined rate, with breakdown if actively clicking
        if (clicksPerSecond > 0.1) {
            document.getElementById('per-second').textContent = 
                `${this.formatNumber(totalPerSecond)} (${this.formatNumber(generatorPerSecond)} + ${this.formatNumber(clicksPerSecond)})`;
        } else {
            document.getElementById('per-second').textContent = this.formatNumber(generatorPerSecond);
        }
        
        // Update click power
        document.getElementById('click-power').textContent = this.formatNumber(this.gameState.clickPower);
        
        // Update total clicks
        document.getElementById('total-clicks').textContent = this.formatNumber(this.gameState.totalClicks);
        
        // Update prestige
        if (this.config.prestige.enabled) {
            document.getElementById('prestige-amount').textContent = this.formatNumber(this.gameState.prestigePoints);
            const bonus = (this.gameState.prestigePoints * this.config.prestige.bonusPerPoint * 100).toFixed(1);
            document.getElementById('prestige-bonus').textContent = bonus;
            
            const prestigeGain = this.calculatePrestigeGain();
            document.getElementById('prestige-gain').textContent = this.formatNumber(prestigeGain);
            
            const prestigeButton = document.getElementById('prestige-button');
            if (prestigeGain > 0) {
                prestigeButton.disabled = false;
            } else {
                prestigeButton.disabled = true;
            }
        }
        
        // Update stats
        document.getElementById('stat-total-earned').textContent = this.formatNumber(this.gameState.totalEarned);
        document.getElementById('stat-total-clicks').textContent = this.formatNumber(this.gameState.totalClicks);
        document.getElementById('stat-click-earned').textContent = this.formatNumber(this.gameState.clickEarned);
        document.getElementById('stat-generator-earned').textContent = this.formatNumber(this.gameState.generatorEarned);
        document.getElementById('stat-prestige-count').textContent = this.gameState.prestigeCount;
        document.getElementById('stat-play-time').textContent = this.formatPlayTime(this.gameState.playTime);
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
            this.gameState.currency += earned;
            this.gameState.totalEarned += earned;
            this.gameState.generatorEarned += earned;
            
            // Update UI
            this.updateUI();
            
            // Update affordability of items (so they light up when you can buy)
            this.updateAffordability();
            
            // Check achievements
            this.checkAchievements();
        }, 100);
        
        // Auto-save loop
        this.saveInterval = setInterval(() => {
            this.saveGame();
        }, this.config.game.saveInterval);
    }

    saveGame(showNotification = false) {
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
                
                // Merge saved state with current state
                this.gameState = {
                    ...this.gameState,
                    ...saveData.gameState
                };
                
                // Calculate offline earnings (limited to prevent exploits)
                if (offlineTime > 0 && offlineTime < 86400) { // Max 24 hours
                    const production = this.calculateProductionPerSecond();
                    const offlineEarnings = production * offlineTime;
                    this.gameState.currency += offlineEarnings;
                    this.gameState.totalEarned += offlineEarnings;
                    this.gameState.generatorEarned += offlineEarnings;
                    
                    console.log(`Welcome back! You earned ${this.formatNumber(offlineEarnings)} while away!`);
                }
                
                this.gameState.lastSave = Date.now();
                this.lastUpdate = Date.now();
            }
        } catch (error) {
            console.error('Error loading game:', error);
        }
    }

    confirmReset() {
        const confirmed = confirm('Are you sure you want to reset ALL progress? This cannot be undone!');
        if (confirmed) {
            localStorage.removeItem('idleClickerSave');
            location.reload();
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
        this.updateUI();
        this.renderGenerators();
        this.renderClickUpgrades();
        this.playSound('achievement');
        this.updateAdminDisplay();
        console.log(`✅ Admin: Added ${this.formatNumber(amount)} gems`);
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
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new IdleClickerGame();
    game.init();
});

