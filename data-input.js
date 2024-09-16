const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dataDir = path.join(__dirname, 'data');
const publicDir = path.join(__dirname, 'public');
[dataDir, publicDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
});

const dataFile = path.join(dataDir, 'data.txt');
const indexFile = path.join(publicDir, 'index.html');

const postServer = http.createServer((req, res) => {
    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            fs.appendFile(dataFile, body + '\n', err => {
                if (err) {
                    console.error('Error writing to file:', err);
                    res.writeHead(500);
                    res.end('Error saving data');
                } else {
                    res.writeHead(200);
                    res.end('Data received and saved');
                }
            });
        });
    } else {
        res.writeHead(405);
        res.end('Method Not Allowed');
    }
});

postServer.listen(3000, () => {
    console.log('POST server listening on port 3000');
});

const displayServer = http.createServer((req, res) => {
    if (req.url === '/') {
        fs.readFile(indexFile, (err, content) => {
            if (err) {
                res.writeHead(500);
                res.end('Error loading index.html');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(content);
            }
        });
    } else if (req.url === '/api/data') {
        // อ่าน 10 บรรทัดล่าสุดจากไฟล์
        const fileStream = fs.createReadStream(dataFile);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        let lastLines = [];
        rl.on('line', (line) => {
            lastLines.push(line);
            if (lastLines.length > 10) {
                lastLines.shift();
            }
        });

        rl.on('close', () => {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(lastLines.reverse()));
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

displayServer.listen(8080, () => {
    console.log('Display server listening on port 8080');
});