const https = require('https');
const http = require('http');
const fs = require('fs');
const utf8 = require('utf8');

http.createServer(function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    res.end('Hello World\n');
    const file = fs.createWriteStream("video");

    (async function () {
        // let res = await httpGet("https://www.instagram.com/p/B-AKqROBEeS/?utm_source=ig_web_button_share_sheet");
        let res = await httpGet("https://www.instagram.com/p/B-C0QHdhkQN/?utm_source=ig_web_button_share_sheet");

        let content = res.substr(res.indexOf('graphql') - 2);
        content = content.substr(0, content.indexOf('</script>') - 2);
        if (content.contains('"is_video":false')) {
            content = content.substr(content.indexOf('"display_url":') + 15);
        } else if (content.contains('"is_video":true')) {
            content = content.substr(content.indexOf('"video_url":') + 13);
        }
        content = content.substr(0, content.indexOf('",'));
        content = content.replace(/\\u0026/g, "&");

        https.get(content, res => {
            res.pipe(file);
        });
    })();
}).listen(3000, "127.0.0.1");
console.log('Server running at http://127.0.0.1:3000/');

const httpGet = url => {
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            res.setEncoding('utf8');
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        }).on('error', reject);
    });
};