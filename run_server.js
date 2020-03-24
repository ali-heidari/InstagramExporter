// Import modules
const https = require('https');
const http = require('http');
const fs = require('fs');

// Create a server and accept incoming request
http.createServer(function (req, res) {
    // Response type
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    // Reject favicon requests which some browser make second request for it 
    if (req.url === "/favicon.ico") return;
    // Store incoming data, the post body
    let data = []
    req.on('data', chunk => {
        data.push(chunk)
    })
    req.on('end', () => {
        // Write something in response
        res.end('Processing\n');
        // Store saved file in a file with random name
        let file = fs.createWriteStream((new Date().getTime() / 1000).toString() + ".temp.file");

        (async function () {
            // Request to the given url, which is instagram post url
            let res = await httpGet(decodeURIComponent(data.join('').trim()));
            // Instagram pages contain a JavaScript object which after load, converts to HTML element
            // This means we do not have access to HTML elements before some scripts to run 
            // Extract the script content  
            let content = res.substr(res.indexOf('graphql') - 2);
            content = content.substr(0, content.indexOf('</script>') - 2);
            // Examine the video or image
            if (content.indexOf('"is_video":false') > 0) {
                content = content.substr(content.indexOf('"display_url":') + 15);
            } else if (content.indexOf('"is_video":true') > 0) {
                content = content.substr(content.indexOf('"video_url":') + 13);
            }
            content = content.substr(0, content.indexOf('",'));
            // Some encoding problems need to be solved manually
            content = content.replace(/\\u0026/g, "&");
            // Request the file and store it in a temp file
            https.get(content, res => {
                res.pipe(file);
            });
        })();
    })
}).listen(3000, "127.0.0.1");
console.log('Server running at http://127.0.0.1:3000/');

/**
 * Get request to the URL and return result as string. 
 * @param url 
 */
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