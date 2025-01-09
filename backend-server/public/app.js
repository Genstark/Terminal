// const socket = io('https://nodelink-guxh.onrender.com/');
const socket = io('http://localhost:5173');
let admin;

let term = new Terminal({ convertEol: true });
let output = '';

const functionKeys = [
    '\x1b[15~',
    '\x1b[17~',
    '\x1b[18~',
    '\x1b[19~',
    '\x1b[20~',
    '\x1b[21~',
    '\x1b[23~',
    '\x1b[24~'
];
const messages = [
    'F5 key pressed',
    'F6 key pressed',
    'F7 key pressed',
    'F8 key pressed',
    'F9 key pressed',
    'F10 key pressed',
    'F11 key pressed',
    'F12 key pressed'
];

const keyMappings = {
    '\x1bOP': 'F1 key pressed',
    '\x1bOS': 'F2 key pressed',
    '\x1bOQ': 'F3 key pressed',
    '\x1bOR': 'F4 key pressed',
    '\x1b[15~': 'F5 key pressed',
    '\x1b[17~': 'F6 key pressed',
    '\x1b[18~': 'F7 key pressed',
    '\x1b[19~': 'F8 key pressed',
    '\x1b[20~': 'F9 key pressed',
    '\x1b[21~': 'F10 key pressed',
    '\x1b[23~': 'F11 key pressed',
    '\x1b[24~': 'F12 key pressed'
};

const helpCommand = [
    { command: 'help', dis: 'show all command and how to use' },
    { command: 'clear', dis: 'clear the screen' },
    { command: 'exit', dis: 'exit the program' },
    { command: 'send', dis: 'call data from server' },
];
const commands = ['help', 'calc', 'connection', 'clear', 'ls', 'send', 'search'];
let userCommands = []
let x, y;

const colors = {
    'red': '\x1b[91m',
    'green': '\x1b[92m',
    'blue': '\x1b[94m',
    'yellow': '\x1b[93m',
    'magenta': '\x1b[95m',
    'cyan': '\x1b[96m',
    'reset': '\x1b[0m',
    'white': '\x1b[37m'
};

const keysRegression = {
    'upKey': '\x1b[C',
    'downKey': '\x1b[D',
    'leftKey': '\x1b[A',
    'rightKey': '\x1b[B',
    'enterKey': '\r',
    'backSpace': '\b',
    'escKey': '\x1b' || '\e',
    'homeKey': '\x1b[H',
    'endKey': '\x1b[F',
    'delete': '\x1b[3~',
    'insert': '\x1b[2~',
    'pageUp': '\x1b[5~',
    'pageDown': '\x1b[6~',
};

const control = {
    'ctrl+A': '\x01',
    'ctrl+B': '\x02',
    'ctrl+C': '\x03',
    'ctrl+D': '\x04',
    'ctrl+E': '\x05',
    'ctrl+F': '\x06',
    'ctrl+G': '\x07',
    'ctrl+H': '\x08',
    'ctrl+I': '\x09',
    'ctrl+J': '\x0a',
    'ctrl+K': '\x0b',
    'ctrl+L': '\x0c',
    'ctrl+M': '\x0d',
    'ctrl+N': '\x0e',
    'ctrl+O': '\x0f',
    'ctrl+P': '\x10',
    'ctrl+Q': '\x11',
    'ctrl+R': '\x12',
    'ctrl+S': '\x13',
    'ctrl+T': '\x14',
    'ctrl+U': '\x15',
    'ctrl+V': '\x16',
    'ctrl+W': '\x17',
    'ctrl+X': '\x18',
    'ctrl+Y': '\x19',
    'ctrl+Z': '\x1a',
};

const progressBar = '\u2588';

function setCursorPosition(x, y) {
    // Move the cursor to the (x, y) position using ANSI escape codes
    // term.write(`\x1b[${y};${x}H`);
    term.write(`\x1b[H`);
    console.log(`Cursor manually moved to: (${x}, ${y})`);
}

term.onCursorMove(() => {
    const cursorX = term._core.buffer.x;
    const cursorY = term._core.buffer.y;
    x = cursorX;
    y = cursorY;
    console.log(`Cursor position: (${cursorX}, ${cursorY})`);
});


term.open(document.getElementById('terminal'));
term.write('$~');
let input = '';

let inputlength = 0;
let cursorX = 0;

let lastcommand = 0;
let isListenerAdded = false;

// term.element.addEventListener('keydown', (event) => {
//     if (event.ctrlKey) {
//         console.log(`Ctrl key pressed with: ${event.key}`);
//     } else {
//         console.log(`Key pressed: ${event.key}`);
//     }
// });

term.onData((e) => {

    if (e === control["ctrl+A"]) {
        console.log('Ctrl+A pressed');
    }
    if (e === control["ctrl+B"]) {
        console.log('Ctrl+B pressed');
    }
    if (e === control["ctrl+C"]) {
        console.log('Ctrl+C pressed');
        input = '';
        return;
    }
    if (e === control["ctrl+V"]) {
        console.log('Ctrl+V pressed');
        navigator.clipboard.readText().then(text => {
            term.write(`${text}\n`);
        }).catch(err => {
            console.error('Error reading clipboard:', err);
        });
    }
    if (e === control["ctrl+X"]) {
        console.log('Ctrl+X pressed');
    }
    if (e === control["ctrl+Q"]) {
        console.log('Ctrl+Q pressed');
        term.clear();
        term.write(`\x1b[2K\r$~`);
        input = '';
        return;
    }

    if (input.length === 0 && userCommands.length === 0) {
        if (e === '\x1b[C' || e === '\x1b[D' || e === '\x1b[A' || e === '\x1b[B') {
            console.log(`Ignoring ${e} as input is empty.`);
            return;
        }
    }

    if (e === '\x1b[A' || e === keysRegression.pageUp) {
        const checkCommand = userCommands[lastcommand];
        console.log(lastcommand);
        if (checkCommand) {
            term.write('\x1b[2K\r$~');
            input = userCommands[lastcommand];
            term.write(`${userCommands[lastcommand]}`);

            if (lastcommand > 0) {
                lastcommand--;
            }
        }
    }
    else if (e === '\x1b[B' || e === keysRegression.downKey) {
        const checkCommand = userCommands[lastcommand];
        console.log(lastcommand);
        if (checkCommand) {
            term.write('\x1b[2K\r$~');
            input = userCommands[lastcommand];
            term.write(`${userCommands[lastcommand]}`);

            if (lastcommand < userCommands.length - 1) {
                lastcommand++;
            }
        }
    }


    if (e === '\x1b[D') {
        if (cursorX <= input.length && cursorX > 0) {
            cursorX--;
            term.write('\x1b[D');
            console.log(cursorX);
        }
        console.log('Left Arrow key pressed');
        return;
    }
    else if (e === '\x1b[C') {
        if (cursorX < input.length || cursorX === 0) {
            cursorX++;
            term.write('\x1b[C');
            console.log(cursorX);
        }
        console.log('Right Arrow key pressed');
        return;
    }


    if (e.startsWith('\x1b')) {
        console.log(e);
        if (keyMappings[e]) {
            term.write(`\n${keyMappings[e]}\n$~`);
            return;
        }
        else if (e === '\x1b[A' || e === '\x1b[B') {
            return;
        }
        else if (e === '\x1b' || e === '\e') {
            console.log('esc key');
            term.write('\nesc key\n$~');
        }
        else if (e === '\x1b[3~') {
            console.log('delete key');
            term.write('\ndelete key\n$~');
        }
        else if (e === keysRegression.homeKey) {
            console.log('home key');
        }
        else if (e === '\x1b[F') {
            console.log('end key');
        }
        else {
            term.write(`Unknown escape sequence: ${e}\n$~`);
        }
    }
    else {
        console.log('Received:', e);
    }

    if (e === '\r' || e === '\n') {
        input = input.trim();
        console.log(input);
        userCommands.push(input);
        lastcommand = userCommands.length - 1;

        if (input.trim() === '') {
            term.write('\n$~');
        }
        else if (input.trim() === 'h' || input.trim() === 'help') {
            term.write('\nFor more information on a specific command, type HELP command-name');
            helpCommand.forEach(data => term.write(`\n${colors.blue}--${data.command} ${colors.cyan}${data.dis}`));
            term.write(`\n${colors.white}$~`);
        }
        else if (input.trim() === 'read') {
            term.write('\nread\n$~');
        }
        else if (input.trim().split(' ')[0] === 'calc') {
            term.write(`\n${check(input)}\n$~`);
            check(input);
        }
        else if (input.trim() === 'connection') {
            term.write(`\n${socket.id}\n$~`);
        }
        else if (input.trim() === 'ls') {
            for (let i = 0; i < commands.length; i++) {
                term.write(`\n${colors.blue}--${commands[i]}`);
            }
            term.write(`\n${colors.white}$~`);
        }
        else if (input.trim() === 'clear') {
            term.clear();
            term.write(`\x1b[2K\r$~`);
        }
        else if (input.trim().split(' ')[0] === 'send') {
            toServer(input);
            term.write(`\ndata sended`);
            console.time('');

            if (!isListenerAdded) {
                socket.on('get', (data) => {
                    console.log(data);
                    const items = data.items.data;
                    if (items) {
                        for (let i = 0; i < items.length; i++) {
                            term.write(`\n${colors.green}${items[i]._id} ${items[i].user_id}`);
                            // term.write(`\n${colors.green}${items[i]}`);
                        }
                        term.write(`${colors.white}\n$~`);
                        console.timeEnd('');
                    }
                    else {
                        term.write(`\n${colors.red}No data ${data.message}${colors.white}\n$~`);
                    }
                });
                isListenerAdded = true;
            }
        }
        else if (input.trim().split(' ')[0] === 'search') {
            findServer(input);
            term.write(`\nsearching...`);
            if (!isListenerAdded) {
                socket.on('term_search', (data) => {
                    console.log(data);
                    const items = data.items.data;
                    if (items) {
                        console.log(items._id, items.user_id);
                        for (let i = 0; i < items.length; i++) {
                            term.write(`\n${colors.green}${items[0]._id} ${items[0].user_id}`);
                        }
                        term.write(`${colors.white}\n$~`);
                    }
                    else {
                        term.write(`\n${colors.red}No data ${data.message}${colors.white}\n$~`);
                    }
                });
            }
        }
        else if (input.trim().split(' ')[0] === 'admin') {
            admin = io('http://localhost:5173/admin');
            admin.on('connect', () => {
                console.log('admin connected', admin.id);
                // admin.emit('message', 'admin send');
            });
            term.write('\n$~');
            // console.log(admin);
        }
        else if (input.trim().split(' ')[0] === 'admin-d') {
            if (admin['connected']) {
                console.log('admin disconnect');
                admin.disconnect();
            }
            else {
                console.log('No admin connection to disconnect');
            }
            term.write('\n$~');
            // console.log(admin);
        }
        else {
            try {
                term.write(`\n${eval(input)}\n$~`);
            }
            catch {
                term.write(`\n${colors.red}${input} ${colors.white}invalid\n$~`);
            }
        }
        input = '';
        inputlength = 0;
    }
    else if (e === '\b' || e.charCodeAt(0) === 127) {
        if (input.length > 0 && cursorX > 0) {
            input = input.slice(0, cursorX - 1) + input.slice(cursorX);
            // cursorX--;
            term.write(`\x1b[2K\r$~${input}`);
            // term.write(`\x1b[4;1H`);
            console.log(input.length, input);
            console.log(cursorX);
            cursorX = input.length;
        }
    }
    else {
        if (cursorX < input.length) {
            input = input.slice(0, cursorX) + e + input.slice(cursorX);
            cursorX = input.length;
        }
        else {
            input += e;
            cursorX = input.length;
        }
        term.write(`\x1b[2K\r$~${input}`);
        // term.write(`\x1b[${x};${y}H`);
        console.log(input, '\x84');
        console.log(cursorX);
    }
});


function check(data) {
    const arry = data.split(' ');
    console.log(arry)
    if (arry[0] === 'calc') {
        arry.shift();
        const num1 = arry.join(' ');
        console.log(num1);
        try {
            const result = eval(num1);
            console.log(result);
            return result;
        } catch (error) {
            console.log('Error in evaluating expression:', error.message);
        }
    }
}

function toServer(userinput) {
    const data = userinput.split(' ');
    if (data[0] === 'send' && data.length > 1) {
        data.shift();
        console.log(data);
        const message = data.join(' ');
        socket.emit('term', { message: message, id: socket.id, datafill: true });
    }
    else {
        console.log('incomplete command');
        socket.emit('term', { message: null, id: socket.id, datafill: false });
    }
}

function findServer(userinput) {
    const data = userinput.split(' ');
    if (data[0] === 'search' && data.length > 1) {
        data.shift();
        console.log(data);
        const search = data.join(' ');
        socket.emit('term_search', { message: search, id: socket.id, datafill: true });
    }
    else {
        console.log('incomplete command');
        socket.emit('term_search', { message: null, id: socket.id, datafill: false });
    }
}

//(48-57) = 0-9
// + = 43
// - = 45
// * = 42
// / = 47
//(=) = 61
// Backspace = '\x7F'

// const socket = io('https://nodelink-guxh.onrender.com/');
// const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('a user connected', socket.id);
});

socket.on('disconnect', () => {
    console.log('a user disconnected', socket.id);
});


const nextBtn = document.getElementById('nextBtn');
const imageUploadSection = document.getElementById('imageUploadSection');
const inputGroup = document.getElementById('input-group');
const imageInput = document.getElementById("imageInput");
const username = document.getElementById('username');

nextBtn.addEventListener('click', (event) => {
    event.preventDefault();
    inputGroup.style.display = 'none';
    imageUploadSection.style.display = 'block';
    sessionStorage.setItem('userdata', JSON.stringify({ username: username.value, socketid: socket.id }));
});

let imagedata;
let filename;

imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const buffer = e.target.result;
            const imgearray = new Uint8Array(buffer);
            imagedata = imgearray;
            filename = file.name;
            const previewURL = URL.createObjectURL(file);
            imagePreview.src = previewURL;
            imagePreview.style.display = "block";
            uploadBtn.disabled = false;
        };
        reader.readAsArrayBuffer(file);
    }
});

const uploadBtn = document.getElementById('uploadBtn');
uploadBtn.addEventListener('click', (event) => {
    event.preventDefault();
    socket.emit('number', { id: socket.id });
    const data = JSON.parse(sessionStorage.getItem('userdata'));
    data['image'] = imagedata;
    data['filename'] = filename;
    console.log(data);
    socket.emit('file-upload', data);
    console.log('data is sent to server');
});

socket.on('receive-file', (data) => {
    console.log(data);
});

const changeImage = document.getElementById('imagePreview');
socket.on('AI', (data) => {
    console.log(data);
    if (data && data.message) {
        const imageBuffer = new Uint8Array(data.message);
        const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
        const imageURL = URL.createObjectURL(blob);
        changeImage.src = imageURL;
        changeImage.style.display = 'block';
    }
    else {
        console.log('Invalid data received');
    }
});