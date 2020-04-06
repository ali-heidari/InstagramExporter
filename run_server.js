// Import modules
const https = require('https');
const http = require('http');
const archiver = require('archiver');

// Create a server and accept incoming request
http.createServer(function (req, res) {
    // Reject favicon requests which some browser make second request for it 
    if (req.url === "/favicon.ico") return;
    // Store incoming data, the post body
    let data = []
    req.on('data', chunk => {
        data.push(chunk)
    })
    req.on('end', () => {
        const postURL = data.join('').trim()
        // Make sure requested link is instagram post
        if (!postURL.startsWith('https://www.instagram.com/p/')) return;

        (async function (response) {
            // Request to the given url, which is instagram post url
            let result = await httpGet(postURL);
            // Instagram pages contain a JavaScript object which after load, converts to HTML element
            // This means we do not have access to HTML elements before some scripts to run 
            // Extract the script content  
            let content = result.substr(result.indexOf('graphql') - 2);
            content = content.substr(0, content.indexOf('</script>'));
            content = content.substr(0, content.indexOf("]},\"hostname\""));
            let jsonObj = JSON.parse(content);
            let short_media = jsonObj.graphql.shortcode_media;
            let slides = NaN;
            if (short_media.edge_sidecar_to_children == null) {
                slides = [1];
                slides[0] = new Object();
                slides[0]["node"] = new Object();
                if (short_media.is_video)
                    slides[0]["node"]["video_url"] = short_media.video_url;
                else
                    slides[0]["node"]["display_url"] = short_media.display_url;
                slides[0]["node"]["is_video"] = short_media.is_video;
            } else
                slides = short_media.edge_sidecar_to_children.edges;
            let res = NaN;

            // Set response headers
            response.writeHead(200, {
                'Content-Type': 'application/zip', //res.headers['content-type'],
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Headers": "Origin, X-Requested-With, Content-Type, Accept"
            });

            const zip = archiver('zip');
            for (let slide of slides) {
                if (slide.node.is_video) {
                    res = await downloadFile(slide.node.video_url);
                } else
                    res = await downloadFile(slide.node.display_url);

                zip.append(res, {
                    name: new Date().getTime() + "." + res.headers["content-type"].split("/")[1]
                })
            }
            // Send the file to the page output.
            zip.pipe(response);

            zip.finalize();


        })(res);
    });
}).listen(3000, "0.0.0.0");
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

/**
 * Download the file from instagram
 * @param url url of file
 */
const downloadFile = url => {
    return new Promise((resolve, reject) => {
        // Request the file and store it in a temp file
        https.get(url, res => {
            resolve(res);
        });
    });
}

const streamsIntoZip = (streams, index) => {
    return new Promise((resolve, reject) => {
        zip.addFile(streams[index], {
            name: new Date().getTime().toString()
        }, function () {
            if (streams.length < index - 1) {
                streamsIntoZip(streams, index++)
            }
            resolve(true);
        });
    });
}