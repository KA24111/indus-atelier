document.addEventListener('DOMContentLoaded', () => {
    function toggleMenu() {
        const navLinks = document.getElementById('navLinks');
        if (navLinks) {
            navLinks.classList.toggle('show');
        }
    }

    window.toggleMenu = toggleMenu;

    const urlParams = new URLSearchParams(window.location.search);
    let mode = urlParams.get('mode') || 'friend';
    const validModes = ['friend', 'easy', 'medium', 'hard', 'timed', 'hidden'];
    if (!validModes.includes(mode)) {
        window.location.href = '404.html';
        return;
    }

    const modeTitle = document.getElementById('mode-title');
    if (modeTitle) {
        modeTitle.textContent = 'Game Mode: ' + mode;
    }

    const board = Array(9).fill('');
    let currentPlayer = 'X';
    let gameOver = false;
    let timer;
    let timeLeft = 5;
    const hiddenMoves = Array(9).fill('');

    const cells = Array.from(document.querySelectorAll('.cell'));
    const status = document.getElementById('status');
    const timerDisplay = document.getElementById('timer');

    function restartGame() {
        for (let i = 0; i < 9; i++) {
            board[i] = '';
            hiddenMoves[i] = '';
            cells[i].textContent = '';
            cells[i].style.backgroundColor = '#dce4e8';
        }
        currentPlayer = 'X';
        gameOver = false;
        updateStatus();
        if (mode === 'timed') startTimer();
        if (mode !== 'friend' && mode !== 'timed' && mode !== 'hidden' && currentPlayer === 'O') {
            aiMove();
        }
    }

    function checkWinner(b) {
        const wins = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];
        for (let [a,b1,c] of wins) {
            if (b[a] && b[a] === b[b1] && b[a] === b[c]) {
                return { winner: b[a], line: [a, b1, c] };
            }
        }
        return b.includes('') ? null : { winner: 'Draw', line: [] };
    }

    function highlightWinningTiles(line) {
        line.forEach(index => {
            cells[index].style.backgroundColor = '#a8e6a1';
        });
    }

    function updateStatus() {
        if (!status) return;
        if (mode === 'friend' || mode === 'timed' || mode === 'hidden') {
            status.textContent = `Player ${currentPlayer}'s move`;
        } else {
            status.textContent = currentPlayer === 'X' ? 'Your move!' : 'AI is thinking...';
        }
    }

    function startTimer() {
        if (mode !== 'timed' || gameOver) return;
        clearInterval(timer);
        timeLeft = 5;
        if (timerDisplay) {
            timerDisplay.style.display = 'block';
            timerDisplay.textContent = `Time left: ${timeLeft}s`;
        }
        timer = setInterval(() => {
            timeLeft--;
            if (timerDisplay) {
                timerDisplay.textContent = `Time left: ${timeLeft}s`;
            }
            if (timeLeft <= 0) {
                clearInterval(timer);
                autoMove();
            }
        }, 1000);
    }

    function autoMove() {
        const empty = board.map((v, i) => v === '' ? i : null).filter(v => v !== null);
        if (empty.length > 0) {
            const move = empty[Math.floor(Math.random() * empty.length)];
            board[move] = currentPlayer;
            if (mode === 'hidden') {
                hiddenMoves[move] = currentPlayer;
            } else {
                cells[move].textContent = currentPlayer;
            }
            handleMoveCompletion();
        }
    }

    function handleMoveCompletion() {
        const result = checkWinner(board);
        if (result) {
            if (result.winner !== 'Draw') {
                status.textContent = result.winner + ' wins!';
                highlightWinningTiles(result.line);
                if (result.winner === 'X') {
                    updateScore();
                }
            } else {
                status.textContent = "It's a draw!";
            }
            gameOver = true;
            clearInterval(timer);
            if (timerDisplay) {
                timerDisplay.style.display = 'none';
            }
            if (mode === 'hidden') {
                for (let i = 0; i < 9; i++) {
                    cells[i].textContent = hiddenMoves[i];
                }
            }
        } else {
            currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
            updateStatus();
            if (mode === 'timed') startTimer();
            if (mode !== 'friend' && mode !== 'timed' && mode !== 'hidden' && currentPlayer === 'O') {
                setTimeout(aiMove, 500);
            }
        }
    }

    function updateScore() {
        const username = localStorage.getItem('username') || 'Guest';
        const scores = JSON.parse(localStorage.getItem('scores') || '{}');
        if (!scores[username]) {
            scores[username] = { easy: 0, medium: 0, hard: 0 };
        }
        if (mode === 'easy') scores[username].easy += 1;
        if (mode === 'medium') scores[username].medium += 5;
        if (mode === 'hard') scores[username].hard += 10;
        localStorage.setItem('scores', JSON.stringify(scores));
    }

    function aiMove() {
        if (gameOver) return;
        let move;
        if (mode === 'easy') {
            const empty = board.map((v,i) => v === '' ? i : null).filter(v => v !== null);
            move = empty[Math.floor(Math.random() * empty.length)];
        } else if (mode === 'medium') {
            move = mediumAI();
        } else if (mode === 'hard') {
            move = minimaxAI(board, 'O').index;
        }
        if (move !== undefined) {
            board[move] = 'O';
            cells[move].textContent = 'O';
            handleMoveCompletion();
        }
    }

    function mediumAI() {
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'O';
                if (checkWinner(board)?.winner === 'O') {
                    board[i] = '';
                    return i;
                }
                board[i] = '';
            }
        }
        for (let i = 0; i < 9; i++) {
            if (board[i] === '') {
                board[i] = 'X';
                if (checkWinner(board)?.winner === 'X') {
                    board[i] = '';
                    return i;
                }
                board[i] = '';
            }
        }
        const empty = board.map((v,i) => v === '' ? i : null).filter(v => v !== null);
        return empty[Math.floor(Math.random() * empty.length)];
    }

    function minimaxAI(newBoard, player) {
        const availSpots = newBoard.map((v,i) => v === '' ? i : null).filter(v => v !== null);
        const result = checkWinner(newBoard);
        if (result?.winner === 'X') return {score: -10};
        if (result?.winner === 'O') return {score: 10};
        if (result?.winner === 'Draw') return {score: 0};

        const moves = [];
        for (let i = 0; i < availSpots.length; i++) {
            const move = {};
            move.index = availSpots[i];
            newBoard[availSpots[i]] = player;
            const subResult = minimaxAI(newBoard, player === 'O' ? 'X' : 'O');
            move.score = subResult.score;
            newBoard[availSpots[i]] = '';
            moves.push(move);
        }

        let bestMove;
        if (player === 'O') {
            let bestScore = -Infinity;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        } else {
            let bestScore = Infinity;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        }
        return moves[bestMove];
    }

    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            const i = Number(cell.dataset.index);
            if (board[i] === '' && !gameOver) {
                if (mode === 'friend' || mode === 'timed' || mode === 'hidden' || currentPlayer === 'X') {
                    board[i] = currentPlayer;
                    if (mode === 'hidden') {
                        hiddenMoves[i] = currentPlayer;
                    } else {
                        cell.textContent = currentPlayer;
                    }
                    handleMoveCompletion();
                }
            }
        });
    });

    const restartButton = document.getElementById('restartBtn');
    if (restartButton) {
        restartButton.addEventListener('click', restartGame);
    }

    updateStatus();
    if (mode === 'timed') startTimer();
    if (mode !== 'friend' && mode !== 'timed' && mode !== 'hidden' && currentPlayer === 'O') {
        aiMove();
    }
});