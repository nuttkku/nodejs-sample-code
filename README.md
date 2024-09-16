# nodejs-sample-code
 
# โปรเจกต์บันทึกและแสดงข้อมูลแบบเรียลไทม์

โปรเจกต์นี้เป็นแอปพลิเคชันเว็บอย่างง่ายที่ใช้ Node.js ในการรับข้อมูล บันทึกลงไฟล์ และแสดงผลบนหน้าเว็บ โดยจะแสดง 10 รายการล่าสุดและรีเฟรชทุก 5 วินาที

## การติดตั้ง

1. ติดตั้ง Node.js บนเครื่องของคุณ
2. Clone โปรเจกต์นี้
3. เปิด Terminal หรือ Command Prompt แล้วเข้าไปที่โฟลเดอร์ของโปรเจกต์
4. รันคำสั่ง `npm install` เพื่อติดตั้ง dependencies (ถ้ามี)

## วิธีใช้งาน

1. รันเซิร์ฟเวอร์ด้วยคำสั่ง `node server.js`
2. เปิดเบราว์เซอร์แล้วไปที่ `http://localhost:8080` เพื่อดูหน้าแสดงผล
3. ใช้เครื่องมือ API ทดสอบ (เช่น Postman) หรือคำสั่ง curl เพื่อส่ง POST request ไปที่ `http://localhost:3000` พร้อมข้อมูลที่ต้องการบันทึก

## โครงสร้างโปรเจกต์

```
project_folder/
│
├── server.js
├── public/
│   └── index.html
├── data/
│   └── data.txt
└── .gitignore
```

## อธิบายโค้ด

### server.js

```javascript
const http = require('http');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
```
- นำเข้าโมดูลที่จำเป็น: http สำหรับสร้างเซิร์ฟเวอร์, fs สำหรับจัดการไฟล์, path สำหรับจัดการเส้นทาง, readline สำหรับอ่านไฟล์แบบบรรทัดต่อบรรทัด

```javascript
const dataDir = path.join(__dirname, 'data');
const publicDir = path.join(__dirname, 'public');
[dataDir, publicDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
});
```
- กำหนดตำแหน่งของโฟลเดอร์ data และ public
- สร้างโฟลเดอร์ถ้ายังไม่มี

```javascript
const dataFile = path.join(dataDir, 'data.txt');
const indexFile = path.join(publicDir, 'index.html');
```
- กำหนดตำแหน่งของไฟล์ data.txt และ index.html

```javascript
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
```
- สร้างเซิร์ฟเวอร์สำหรับรับ POST request
- รับข้อมูลจาก request แล้วเขียนลงในไฟล์ data.txt
- ส่งข้อความตอบกลับว่าบันทึกสำเร็จหรือไม่

```javascript
postServer.listen(3000, () => {
    console.log('POST server listening on port 3000');
});
```
- เริ่มต้นเซิร์ฟเวอร์ POST ที่พอร์ต 3000

```javascript
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
```
- สร้างเซิร์ฟเวอร์สำหรับแสดงผล
- ถ้าเข้าที่ root ('/') จะส่งไฟล์ index.html
- ถ้าเข้าที่ '/api/data' จะอ่าน 10 บรรทัดล่าสุดจาก data.txt และส่งกลับเป็น JSON
- ถ้าเข้า URL อื่นจะแสดงข้อความ 'Not Found'

```javascript
displayServer.listen(8080, () => {
    console.log('Display server listening on port 8080');
});
```
- เริ่มต้นเซิร์ฟเวอร์แสดงผลที่พอร์ต 8080

### index.html

```html
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ข้อมูลล่าสุด 10 รายการ (รีเฟรชทุก 5 วินาที)</title>
    <style>
        /* CSS styles */
    </style>
</head>
<body>
    <h1>ข้อมูลล่าสุด 10 รายการ (รีเฟรชทุก 5 วินาที):</h1>
    <div id="data-container"></div>
    <script>
        const dataContainer = document.getElementById('data-container');

        function fetchData() {
            fetch('/api/data')
                .then(response => response.json())
                .then(data => {
                    dataContainer.innerHTML = data.map(item => `<div class="data-item">${item}</div>`).join('');
                    dataContainer.scrollTop = dataContainer.scrollHeight;
                })
                .catch(error => console.error('Error fetching data:', error));
        }

        // เรียกข้อมูลครั้งแรก
        fetchData();

        // รีเฟรชทุก 5 วินาที
        setInterval(fetchData, 5000);
    </script>
</body>
</html>
```
- หน้า HTML สำหรับแสดงผล
- ใช้ JavaScript เพื่อดึงข้อมูลจาก '/api/data' ทุก 5 วินาที
- แสดงข้อมูล 10 รายการล่าสุดในรูปแบบ HTML

## การพัฒนาต่อ

คุณสามารถพัฒนาโปรเจกต์นี้ต่อได้ เช่น:
- เพิ่มการรับรองความปลอดภัย
- เพิ่มฟีเจอร์การค้นหาหรือกรองข้อมูล
- ปรับแต่ง UI ให้สวยงามมากขึ้น
- เพิ่มการจัดการข้อมูลแบบฐานข้อมูล

## ข้อควรระวัง

- โปรเจกต์นี้เป็นตัวอย่างอย่างง่าย ไม่เหมาะสำหรับใช้ในการผลิตจริงโดยไม่มีการปรับแต่งเพิ่มเติม
- ควรระวังเรื่องความปลอดภัยและการจัดการข้อมูลที่ละเอียดอ่อน
