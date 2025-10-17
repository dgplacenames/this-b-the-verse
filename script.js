let poems = {};
let lines = [];
let currentQuestion = null;
let selectedOption = null;
let score = { correct: 0, total: 0 };
let currentPoem = '';

async function loadPoemsConfig() {
    try {
        const response = await fetch('poems.json');
        poems = await response.json();
        
        const select = document.getElementById('poem-select');
        select.innerHTML = '';
        
        Object.entries(poems).forEach(([id, poem]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = poem.name;
            select.appendChild(option);
        });
        
        currentPoem = Object.keys(poems)[0];
        select.value = currentPoem;
        
        loadPoem();
    } catch (error) {
        console.error('Error loading poems configuration:', error);
        document.getElementById('loading').textContent = 'Error loading configuration. Please refresh.';
    }
}

async function loadPoem() {
    const poem = poems[currentPoem];
    document.getElementById('loading').textContent = `Loading ${poem.name}...`;
    
    try {
        const response = await fetch(poem.file);
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        const lineElements = xmlDoc.querySelectorAll('l');
        lines = [];
        
        lineElements.forEach((line, index) => {
            const caesura = line.querySelector('caesura');
            if (caesura) {
                const aVerse = line.childNodes[0]?.textContent.trim();
                const bVerse = line.childNodes[2]?.textContent.trim();
                
                if (aVerse && bVerse) {
                    lines.push({
                        lineNumber: index + 1,
                        aVerse: aVerse,
                        bVerse: bVerse
                    });
                }
            }
        });
        
        const attributionLink = document.getElementById('attribution-link');
        if (attributionLink) {
            attributionLink.href = `https://clasp.ell.ox.ac.uk/db-latest/poem/${currentPoem}`;
        }
        
        score = { correct: 0, total: 0 };
        document.getElementById('correct').textContent = score.correct;
        document.getElementById('total').textContent = score.total;
        
        document.getElementById('loading').style.display = 'none';
        document.getElementById('quiz').style.display = 'block';
        
        nextQuestion();
    } catch (error) {
        document.getElementById('loading').textContent = 'Error loading poem. Please refresh.';
        console.error(error);
    }
}

function changePoem() {
    currentPoem = document.getElementById('poem-select').value;
    document.getElementById('quiz').style.display = 'none';
    document.getElementById('loading').style.display = 'block';
    loadPoem();
}

function getRandomLines(exclude, count) {
    const available = lines.filter(l => l !== exclude);
    const shuffled = available.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
}

function nextQuestion() {
    if (lines.length === 0) return;
    
    currentQuestion = lines[Math.floor(Math.random() * lines.length)];
    const wrongAnswers = getRandomLines(currentQuestion, 4);
    
    const allOptions = [
        { text: currentQuestion.bVerse, correct: true },
        ...wrongAnswers.map(l => ({ text: l.bVerse, correct: false }))
    ].sort(() => Math.random() - 0.5);
    
    document.getElementById('lineNum').textContent = currentQuestion.lineNumber;
    document.getElementById('aVerse').textContent = currentQuestion.aVerse;
    
    const optionsDiv = document.getElementById('options');
    optionsDiv.innerHTML = '';
    
    allOptions.forEach(option => {
        const div = document.createElement('div');
        div.className = 'option';
        div.textContent = option.text;
        div.dataset.correct = option.correct;
        div.dataset.originalText = option.text;
        div.onclick = () => selectOption(div);
        optionsDiv.appendChild(div);
    });
    
    selectedOption = null;
    document.getElementById('checkBtn').disabled = true;
    document.getElementById('checkBtn').style.display = 'inline-block';
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('feedback').textContent = '';
    document.getElementById('feedback').className = 'feedback';
}

function selectOption(div) {
    if (div.classList.contains('disabled')) return;
    
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    div.classList.add('selected');
    selectedOption = div;
    document.getElementById('checkBtn').disabled = false;
}

function checkAnswer() {
    if (!selectedOption) return;
    
    const isCorrect = selectedOption.dataset.correct === 'true';
    
    score.total++;
    if (isCorrect) score.correct++;
    
    document.getElementById('correct').textContent = score.correct;
    document.getElementById('total').textContent = score.total;
    
    const feedback = document.getElementById('feedback');
    if (isCorrect) {
        feedback.textContent = '✓ Correct!';
        feedback.className = 'feedback correct';
        selectedOption.classList.add('correct');
    } else {
        feedback.textContent = '✗ Incorrect';
        feedback.className = 'feedback incorrect';
        selectedOption.classList.add('incorrect');
        
        document.querySelectorAll('.option').forEach(opt => {
            if (opt.dataset.correct === 'true') {
                opt.classList.add('correct');
                opt.textContent = '✓ ' + opt.dataset.originalText;
            }
        });
    }
    
    document.querySelectorAll('.option').forEach(opt => {
        opt.classList.add('disabled');
    });
    
    document.getElementById('checkBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'inline-block';
}

window.addEventListener('DOMContentLoaded', loadPoemsConfig);