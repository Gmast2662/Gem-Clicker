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
    }

    handleClick(e) {
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

    calculateProductionPerSecond() {
        let production = 0;
        
        this.config.generators.forEach(generator => {
            const level = this.gameState.generators[generator.id].level;
            production += level * generator.baseProduction;
        });
        
        // Apply prestige bonus
        if (this.config.prestige.enabled) {
            const bonus = 1 + (this.gameState.prestigePoints * this.config.prestige.bonusPerPoint);
            production *= bonus;
        }
        
        return production;
    }

    buyGenerator(generatorId) {
        const generator = this.config.generators.find(g => g.id === generatorId);
        if (!generator) return;
        
        const currentLevel = this.gameState.generators[generatorId].level;
        const cost = this.calculateCost(generator.baseCost, generator.costMultiplier, currentLevel);
        
        if (this.gameState.currency >= cost) {
            if (generator.maxLevel === null || currentLevel < generator.maxLevel) {
                this.gameState.currency -= cost;
                this.gameState.generators[generatorId].level++;
                
                // Play buy sound
                this.playSound('buy');
                
                // Update everything
                this.renderGenerators();
                this.updateUI();
                this.checkAchievements();
            }
        }
    }

    buyClickUpgrade(upgradeId) {
        const upgrade = this.config.clickUpgrades.find(u => u.id === upgradeId);
        if (!upgrade) return;
        
        const currentLevel = this.gameState.clickUpgrades[upgradeId].level;
        const cost = this.calculateCost(upgrade.baseCost, upgrade.costMultiplier, currentLevel);
        
        if (this.gameState.currency >= cost) {
            if (upgrade.maxLevel === null || currentLevel < upgrade.maxLevel) {
                this.gameState.currency -= cost;
                this.gameState.clickUpgrades[upgradeId].level++;
                
                // Play buy sound
                this.playSound('buy');
                
                // Update everything
                this.updateClickPower();
                this.renderClickUpgrades();
                this.updateUI();
                this.checkAchievements();
            }
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
        
        this.updateClickPower();
        this.renderGenerators();
        this.renderClickUpgrades();
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
                <div class="upgrade-cost">${this.formatNumber(cost)}</div>
            `;
            
            // Always add event listener - the buy function will check if affordable
            item.addEventListener('click', () => this.buyGenerator(generator.id));
            
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
                <div class="upgrade-cost">${this.formatNumber(cost)}</div>
            `;
            
            // Always add event listener - the buy function will check if affordable
            item.addEventListener('click', () => this.buyClickUpgrade(upgrade.id));
            
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

    updateUI() {
        // Update currency display
        document.getElementById('currency-amount').textContent = this.formatNumber(this.gameState.currency);
        
        // Calculate per second from generators
        const generatorPerSecond = this.calculateProductionPerSecond();
        
        // Calculate per second from clicking
        const now = Date.now();
        this.recentClicks = this.recentClicks.filter(time => now - time < this.clickRateWindow);
        const clicksPerSecond = (this.recentClicks.length / (this.clickRateWindow / 1000)) * this.gameState.clickPower;
        
        // Combine both rates
        const totalPerSecond = generatorPerSecond + clicksPerSecond;
        
        // Show combined rate, with breakdown if actively clicking
        if (clicksPerSecond > 0) {
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
                console.log('Game saved!');
                // Could add a visual notification here
            }
        } catch (error) {
            console.error('Error saving game:', error);
        }
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
}

// Initialize game when page loads
window.addEventListener('DOMContentLoaded', () => {
    const game = new IdleClickerGame();
    game.init();
});

