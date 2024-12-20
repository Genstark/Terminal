// const socket = io('https://nodelink-guxh.onrender.com/');
const socket = io('http://localhost:5173');

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

const commands = ['help', 'calc', 'connection', 'clear', 'ls', 'send'];
let userCommands = []
let x, y;

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

let inputlength = 0
let cursorX = 0

let lastcommand = 0;
let isListenerAdded = false;

term.onData((e) => {

    if (input.length === 0 && userCommands.length === 0) {
        if (e === '\x1b[C' || e === '\x1b[D' || e === '\x1b[A' || e === '\x1b[B') {
            console.log(`Ignoring ${e} as input is empty.`);
            return;
        }
    }

    if (e === '\x1b[A') {
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
    else if (e === '\x1b[B') {
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
        if (keyMappings[e]) {
            term.write(`\n${keyMappings[e]}\n$~`);
            return;
        }
        else if (e === '\x1b[A' || e === '\x1b[B') {
            return;
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

        if (input === '') {
            term.write('\n$~');
        }
        else if (input === 'h') {
            term.write('\nhelp\n$~');
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
                term.write(`\n--${commands[i]}`);
            }
            term.write(`\n$~`);
        }
        else if (input.trim() === 'clear') {
            term.clear();
            term.write(`\x1b[2K\r$~`);
        }
        else if (input.trim().split(' ')[0] === 'send') {
            toServer(input);
            term.write(`\ndata sended`);

            if (!isListenerAdded) {
                socket.on('get', (data) => {
                    console.log(data);
                    const items = data.items.data;
                    for (let i = 0; i < items.length; i++) {
                        term.write(`\n${items[i]._id} ${items[i].user_id}`);
                    }
                    term.write(`\n$~`);
                });
                isListenerAdded = true;
            }
        }
        else {
            try {
                term.write(`\n${eval(input)}\n$~`);
            }
            catch {
                term.write(`\n${input} invalid\n$~`);
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
    if (data[0] === 'send') {
        data.shift();
        console.log(data);
        const message = data.join(' ');
        socket.emit('term', { message: message, id: socket.id });
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