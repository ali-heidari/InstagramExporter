function download(event) {
    event.preventDefault();
    var data = document.forms[0]['url'].value;

    var xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
            var filename = "file." + xhr.response.type.split('/')[1];

            // The actual download
            var blob = new Blob([xhr.response], {
                type: xhr.response.type
            });
            var link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = filename;

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            document.getElementById("spinner").style.visibility = 'hidden';
            document.getElementById("btnDownload").disabled = false;
        }
    });

    xhr.open("POST", "http://127.0.0.1:3000/");
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    xhr.responseType = 'blob';

    document.getElementById("spinner").style.visibility = 'visible';
    document.getElementById("btnDownload").disabled = true;

    xhr.send(data);



    return false;
}