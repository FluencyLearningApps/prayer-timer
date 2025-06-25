document.addEventListener('DOMContentLoaded', () => {
    // State
    let totalDuration = 3600; // in seconds (60 minutes)
    let prayerStructure = 'preset';
    let customSets = [];
    let activeCustomSet = null; // The set currently selected for the session
    let editingSet = null; // The set currently being edited
    let timerInterval = null;
    let isPaused = false;
    let isMuted = false;
    let timeRemaining = 0;
    let currentSegmentIndex = 0;
    let segmentTimeRemaining = 0;
    let draggedStep = null;

    const PRESET_STEPS = [
        'Praise', 'Silence', 'Confession', 'Scripture Prayer',
        'Watching', 'Intercession', 'Supplication', 'Thanksgiving',
        'Singing', 'Meditation', 'Listening', 'Praise'
    ];

    // DOM Elements
    const screens = {
        setup: document.getElementById('setup-screen'),
        timer: document.getElementById('timer-screen'),
        completion: document.getElementById('completion-screen'),
    };

    const durationSlider = document.getElementById('duration-slider');
    const durationHoursInput = document.getElementById('duration-hours');
    const durationMinutesInput = document.getElementById('duration-minutes');
    const presetBtn = document.getElementById('preset-btn');
    const customBtn = document.getElementById('custom-btn');
    const presetMode = document.getElementById('preset-mode');
    const customMode = document.getElementById('custom-mode');
    const presetList = document.getElementById('preset-list');
    const startBtn = document.getElementById('start-btn');

    // Custom Mode Elements
    const customListContainer = document.getElementById('custom-list-container');
    const newSetBtn = document.getElementById('new-set-btn');
    const editorContainer = document.getElementById('custom-set-editor-container');
    const customSetNameInput = document.getElementById('custom-set-name');
    const customStepsList = document.getElementById('custom-steps-list');
    const newStepInput = document.getElementById('new-step-input');
    const addStepBtn = document.getElementById('add-step-btn');
    const saveSetBtn = document.getElementById('save-set-btn');
    const deleteSetBtn = document.getElementById('delete-set-btn');
    const closeEditorBtn = document.getElementById('close-editor-btn');

    // Timer Screen Elements
    const pieCanvas = document.getElementById('pie-timer');
    const segmentTitle = document.getElementById('segment-title');
    const segmentCountdown = document.getElementById('segment-countdown');
    const totalCountdown = document.getElementById('total-countdown');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const muteBtn = document.getElementById('mute-btn');

    // Completion Screen Elements
    const restartBtn = document.getElementById('restart-btn');
    const returnHomeBtn = document.getElementById('return-home-btn');

    // Audio
    const chime = document.getElementById('chime-sound');

    // --- INITIALIZATION ---
    function init() {
        // Duration controls
        durationSlider.addEventListener('input', handleSliderInput);
        durationHoursInput.addEventListener('input', handleManualInput);
        durationMinutesInput.addEventListener('input', handleManualInput);
        durationMinutesInput.addEventListener('blur', formatMinutesInput); // Format on blur
        updateDurationUIFromTotalSeconds();

        // Structure tabs
        presetBtn.addEventListener('click', () => switchTab('preset'));
        customBtn.addEventListener('click', () => switchTab('custom'));

        // Populate preset list
        populatePresetList();

        // Custom set controls
        newSetBtn.addEventListener('click', () => openEditor());
        addStepBtn.addEventListener('click', addStepToEditor);
        newStepInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') addStepToEditor(); });
        saveSetBtn.addEventListener('click', saveCustomSet);
        deleteSetBtn.addEventListener('click', deleteCustomSet);
        closeEditorBtn.addEventListener('click', closeEditor);

        // Main buttons
        startBtn.addEventListener('click', startPrayerSession);
        pauseBtn.addEventListener('click', togglePause);
        resetBtn.addEventListener('click', resetTimer);
        muteBtn.addEventListener('click', toggleMute);
        restartBtn.addEventListener('click', () => {
            switchScreen('setup');
            startPrayerSession();
        });
        returnHomeBtn.addEventListener('click', () => switchScreen('setup'));

        // Drag and drop events
        customStepsList.addEventListener('dragstart', handleDragStart);
        customStepsList.addEventListener('dragover', handleDragOver);
        customStepsList.addEventListener('drop', handleDrop);
        customStepsList.addEventListener('dragend', handleDragEnd);

        // Load data
        loadCustomSets();
        renderCustomSets();
    }

    // --- SCREEN MANAGEMENT ---
    function switchScreen(screenName) {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
        if (screenName === 'setup') {
            resetTimerState();
        }
    }

    // --- SETUP SCREEN LOGIC ---
    function updateDurationUIFromTotalSeconds() {
        const totalMinutes = Math.floor(totalDuration / 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        durationHoursInput.value = hours;
        durationMinutesInput.value = String(minutes).padStart(2, '0');

        if (totalMinutes >= 1 && totalMinutes <= 120) {
            durationSlider.value = totalMinutes;
        } else if (totalMinutes < 1) {
            durationSlider.value = 1;
        } else {
            durationSlider.value = 120;
        }
    }

    function handleSliderInput(e) {
        const totalMinutes = parseInt(e.target.value, 10);
        totalDuration = totalMinutes * 60;
        updateDurationUIFromTotalSeconds();
    }

    function handleManualInput() {
        const hours = parseInt(durationHoursInput.value, 10) || 0;
        const minutes = parseInt(durationMinutesInput.value, 10) || 0;

        if (hours < 0 || hours > 99 || minutes < 0 || minutes > 59) {
            updateDurationUIFromTotalSeconds(); // Revert to last valid state
            return;
        }

        const totalMinutes = (hours * 60) + minutes;
        totalDuration = totalMinutes * 60;

        // Update slider if within its range
        if (totalMinutes >= 1 && totalMinutes <= 120) {
            durationSlider.value = totalMinutes;
        }
    }

    function formatMinutesInput() {
        let minutes = parseInt(durationMinutesInput.value, 10) || 0;
        if (minutes < 0) minutes = 0;
        if (minutes > 59) minutes = 59;
        durationMinutesInput.value = String(minutes).padStart(2, '0');
    }

    function switchTab(tabName) {
        prayerStructure = tabName;
        if (tabName === 'preset') {
            presetBtn.classList.add('active');
            customBtn.classList.remove('active');
            presetMode.classList.add('active');
            customMode.classList.remove('active');
            activeCustomSet = null;
            renderCustomSets(); // Deselect all
        } else {
            presetBtn.classList.remove('active');
            customBtn.classList.add('active');
            presetMode.classList.remove('active');
            customMode.classList.add('active');
        }
    }

    function populatePresetList() {
        presetList.innerHTML = PRESET_STEPS.map(step => `<li>${step}</li>`).join('');
    }

    // --- TIMER LOGIC ---
    function startPrayerSession() {
        // Unlock audio context on user gesture
        const playPromise = chime.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                chime.pause();
                chime.currentTime = 0;
            }).catch(error => {
                console.log("Audio unlock failed. Sound may not play.", error);
            });
        }

        let segments;
        if (prayerStructure === 'preset') {
            segments = PRESET_STEPS;
        } else {
            if (!activeCustomSet) {
                alert('Please select a custom prayer set to start.');
                return;
            }
            segments = activeCustomSet.steps;
        }

        if (segments.length === 0) {
            alert('The selected prayer structure has no steps.');
            return;
        }

        timeRemaining = totalDuration;
        currentSegmentIndex = 0;
        const segmentDuration = Math.floor(totalDuration / segments.length);
        segmentTimeRemaining = segmentDuration;

        switchScreen('timer');
        updateTimerDisplay(segments, segmentDuration);
        startCountdown(segments, segmentDuration);
    }

    function startCountdown(segments, segmentDuration) {
        clearInterval(timerInterval);
        isPaused = false;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';

        timerInterval = setInterval(() => {
            if (isPaused) return;

            timeRemaining--;
            segmentTimeRemaining--;

            if (segmentTimeRemaining < 0) {
                playChime();
                currentSegmentIndex++;
                if (currentSegmentIndex >= segments.length) {
                    finishSession();
                    return;
                }
                segmentTimeRemaining = segmentDuration - 1;
            }

            if (timeRemaining < 0) {
                finishSession();
            } else {
                updateTimerDisplay(segments, segmentDuration);
            }
        }, 1000);
    }

    function updateTimerDisplay(segments, segmentDuration) {
        const currentSegment = segments[currentSegmentIndex];
        segmentTitle.textContent = currentSegment;
        segmentCountdown.textContent = formatTime(segmentTimeRemaining);
        totalCountdown.textContent = `Total time left: ${formatTime(timeRemaining)}`;
        drawPieTimer(segments, segmentDuration);
    }

    function togglePause() {
        isPaused = !isPaused;
        pauseBtn.innerHTML = isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    }

    function resetTimer() {
        clearInterval(timerInterval);
        switchScreen('setup');
    }

    function resetTimerState() {
        clearInterval(timerInterval);
        timerInterval = null;
        isPaused = false;
        currentSegmentIndex = 0;
    }

    function finishSession() {
        clearInterval(timerInterval);
        playChime();
        switchScreen('completion');
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    // --- PIE CHART ---
    function drawPieTimer(segments, segmentDuration) {
        const ctx = pieCanvas.getContext('2d');
        const centerX = pieCanvas.width / 2;
        const centerY = pieCanvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;
        const totalSegments = segments.length;
        if (totalSegments === 0) return;
        const anglePerSegment = (2 * Math.PI) / totalSegments;

        const colors = {
            completed: '#50e3c2', // green
            active: '#4a90e2',    // blue
            upcoming: '#d6eaff',  // light blue
            progress: 'rgba(80, 227, 194, 0.7)' // transparent green
        };

        ctx.clearRect(0, 0, pieCanvas.width, pieCanvas.height);

        // Draw segments
        for (let i = 0; i < totalSegments; i++) {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            const startAngle = i * anglePerSegment - Math.PI / 2;
            const endAngle = (i + 1) * anglePerSegment - Math.PI / 2;
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            if (i < currentSegmentIndex) {
                ctx.fillStyle = colors.completed;
            } else if (i === currentSegmentIndex) {
                ctx.fillStyle = colors.active;
            } else {
                ctx.fillStyle = colors.upcoming;
            }
            
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // Draw progress on the current segment
        if (segmentTimeRemaining >= 0 && currentSegmentIndex < segments.length) {
            const progress = (segmentDuration - segmentTimeRemaining) / segmentDuration;
            const currentSegmentStartAngle = currentSegmentIndex * anglePerSegment - Math.PI / 2;
            const progressAngle = currentSegmentStartAngle + (progress * anglePerSegment);

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius + 1, currentSegmentStartAngle, progressAngle);
            ctx.closePath();
            ctx.fillStyle = colors.progress;
            ctx.fill();
        }
    }

    // --- SOUND ---
    function toggleMute() {
        isMuted = !isMuted;
        muteBtn.innerHTML = isMuted ? `<i class="fas fa-volume-mute"></i>` : `<i class="fas fa-volume-up"></i>`;
    }

    function playChime() {
        if (!isMuted) {
            chime.currentTime = 0;
            chime.play().catch(e => {
                if (e.name === 'NotSupportedError') {
                    console.warn('Audio file not found or supported. Chime will not play.');
                } else {
                    console.error("Audio play failed:", e);
                }
            });
        }
    }

    // --- LOCALSTORAGE & CUSTOM SETS ---
    function saveCustomSetsToStorage() {
        localStorage.setItem('prayerTimerCustomSets', JSON.stringify(customSets));
    }

    function loadCustomSets() {
        const saved = localStorage.getItem('prayerTimerCustomSets');
        if (saved) {
            customSets = JSON.parse(saved);
        }
    }

    function renderCustomSets() {
        customListContainer.innerHTML = '';
        if (customSets.length === 0) {
            customListContainer.innerHTML = '<p>No custom sets yet. Create one!</p>';
            return;
        }
        customSets.forEach(set => {
            const el = document.createElement('div');
            el.classList.add('custom-set-item');
            if (activeCustomSet && activeCustomSet.id === set.id) {
                el.style.borderColor = 'var(--primary-color)';
                el.style.borderWidth = '2px';
            }
            el.innerHTML = `
                <span>${set.name}</span>
                <div class="custom-set-actions">
                    <button class="load-btn"><i class="fas fa-check"></i></button>
                    <button class="edit-btn"><i class="fas fa-pencil-alt"></i></button>
                </div>
            `;
            el.querySelector('.load-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                selectCustomSet(set);
            });
            el.querySelector('.edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                openEditor(set);
            });
            customListContainer.appendChild(el);
        });
    }

    function selectCustomSet(set) {
        activeCustomSet = set;
        switchTab('custom');
        renderCustomSets();
    }

    function openEditor(set = null) {
        editingSet = set;
        customSetNameInput.value = set ? set.name : '';
        deleteSetBtn.style.display = set ? 'inline-block' : 'none';
        renderEditorSteps(set ? set.steps : []);
        editorContainer.style.display = 'flex';
        newSetBtn.style.display = 'none';
        customListContainer.style.display = 'none';
    }

    function closeEditor() {
        editingSet = null;
        editorContainer.style.display = 'none';
        newSetBtn.style.display = 'block';
        customListContainer.style.display = 'block';
    }

    function renderEditorSteps(steps) {
        customStepsList.innerHTML = '';
        steps.forEach((stepText, index) => {
            const stepEl = document.createElement('div');
            stepEl.classList.add('step');
            stepEl.setAttribute('draggable', true);
            stepEl.dataset.index = index;
            stepEl.innerHTML = `
                <span>${stepText}</span>
                <button class="remove-step-btn"><i class="fas fa-times"></i></button>
            `;
            stepEl.querySelector('.remove-step-btn').addEventListener('click', () => {
                const currentSteps = Array.from(customStepsList.querySelectorAll('.step span')).map(s => s.textContent);
                currentSteps.splice(index, 1);
                renderEditorSteps(currentSteps);
            });
            customStepsList.appendChild(stepEl);
        });
    }

    function addStepToEditor() {
        const stepText = newStepInput.value.trim();
        if (stepText) {
            const currentSteps = Array.from(customStepsList.querySelectorAll('.step span')).map(s => s.textContent);
            currentSteps.push(stepText);
            renderEditorSteps(currentSteps);
            newStepInput.value = '';
            newStepInput.focus();
        }
    }

    function saveCustomSet() {
        const name = customSetNameInput.value.trim();
        if (!name) {
            alert('Please enter a name for the prayer set.');
            return;
        }
        const steps = Array.from(customStepsList.querySelectorAll('.step span')).map(s => s.textContent);
        if (editingSet) {
            editingSet.name = name;
            editingSet.steps = steps;
        } else {
            const newSet = { id: Date.now(), name, steps };
            customSets.push(newSet);
            editingSet = newSet;
        }
        if (activeCustomSet && activeCustomSet.id === editingSet.id) {
            activeCustomSet = editingSet;
        }
        saveCustomSetsToStorage();
        renderCustomSets();
        closeEditor();
    }

    function deleteCustomSet() {
        if (editingSet && confirm(`Are you sure you want to delete "${editingSet.name}"?`)) {
            customSets = customSets.filter(s => s.id !== editingSet.id);
            if (activeCustomSet && activeCustomSet.id === editingSet.id) {
                activeCustomSet = null;
            }
            saveCustomSetsToStorage();
            renderCustomSets();
            closeEditor();
        }
    }

    // --- DRAG AND DROP --- 
    function handleDragStart(e) {
        if (e.target.classList.contains('step')) {
            draggedStep = e.target;
            setTimeout(() => e.target.style.opacity = '0.5', 0);
        }
    }

    function handleDragEnd(e) {
        if (draggedStep) {
            draggedStep.style.opacity = '1';
            draggedStep = null;
        }
    }

    function handleDragOver(e) {
        e.preventDefault();
        const afterElement = getDragAfterElement(customStepsList, e.clientY);
        if (draggedStep) {
            if (afterElement == null) {
                customStepsList.appendChild(draggedStep);
            } else {
                customStepsList.insertBefore(draggedStep, afterElement);
            }
        }
    }

    function handleDrop(e) {
        e.preventDefault();
    }

    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.step:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // --- KICK IT OFF ---
    init();
});
