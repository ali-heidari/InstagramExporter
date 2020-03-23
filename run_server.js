const https = require('https');
const http = require('http');
const fs = require('fs');

http.createServer(function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    if (req.url === "/favicon.ico") {
        return;
    }
    let data = []
    req.on('data', chunk => {
        data.push(chunk)
    })
    req.on('end', () => {

        res.end('Processing\n');

        let file = fs.createWriteStream((new Date().getTime() / 1000).toString() + ".temp.file");

        (async function () {
            let res = await httpGet(decodeURIComponent(data.join('').trim()));


            let content = res.substr(res.indexOf('graphql') - 2);
            content = content.substr(0, content.indexOf('</script>') - 2);
            if (content.indexOf('"is_video":false') > 0) {
                content = content.substr(content.indexOf('"display_url":') + 15);
            } else if (content.indexOf('"is_video":true') > 0) {
                content = content.substr(content.indexOf('"video_url":') + 13);
            }
            content = content.substr(0, content.indexOf('",'));
            content = content.replace(/\\u0026/g, "&");

            https.get(content, res => {
                res.pipe(file);
            });
        })();
    })
}).listen(3000, "127.0.0.1");
console.log('Server running at http://127.0.0.1:3000/');

const httpGet = url => {
    console.log(url);
    return new Promise((resolve, reject) => {
        https.get(url, res => {
            res.setEncoding('utf8');
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve(body));
        }).on('error', reject);
    });
};