const deviceSelect = document.getElementById('device');
const permission = document.getElementById('permission');
const clickAlert = document.getElementById('alert');
const video = document.getElementById('video');
const canvas_out = document.getElementById('canvas_out');
const scale_canvas = document.getElementById("scale_canvas");
const scale_ctx = scale_canvas.getContext("2d", {
    willReadFrequently: true
});
const result_canvas = document.getElementById("result_canvas");
const result_canvas_padding = 20;
const result_ctx = result_canvas.getContext("2d");

var facingModeIndex = 0;
var width, height, asciifyHeight;
const ASCII_CHARS = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,"^`\'.'.split('');
const buckets = 255 / ASCII_CHARS.length;
var asciifyWidth = 80;
const rem = parseInt(getComputedStyle(document.documentElement).fontSize);
var fontSize;
var result_letterSpacing, result_lineHight;

function getFrameFromVideo() {
    result_ctx.font = `${fontSize}px sans-serif`;
    result_ctx.textAlign = 'center';
    result_ctx.textBaseline = 'middle';

    result_ctx.clearRect(0, 0, result_canvas.width, result_canvas.height);
    //   result_ctx.save(); //儲存狀態
    scale_ctx.drawImage(video, 0, 0, width, height, 0, 0, asciifyWidth, asciifyHeight);
    //   scale_ctx.translate(asciifyWidth, 0);
    //   scale_ctx.scale(-1, 1);
    //   var canvasData = context.getImageData(0, 0, canvas.width, canvas.height);
    let imgData = scale_ctx.getImageData(0, 0, scale_ctx.canvas.width, scale_ctx.canvas.height);
    let pixels = imgData.data;
    for (var i = 0; i < asciifyHeight; i++) {
        for (var j = 0; j < asciifyWidth; j++) {
            let index = (i * asciifyWidth + j) * 4;
            let lightness = parseInt((pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3);
            result_ctx.fillStyle = `rgb(${pixels[index]},${pixels[index + 1]},${pixels[index + 2]})`;
            result_ctx.fillText(ASCII_CHARS[Math.floor(lightness / buckets)], j * result_letterSpacing + result_canvas_padding, i * result_lineHight + result_canvas_padding);
        }
    }
    //   scale_ctx.restore(); //到此才輸出，才不會還沒整體操作完就放出，會造成畫面快速抖動
    requestAnimationFrame(getFrameFromVideo);
};

function checkCameraAPI() {
    if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) return true;
    return false;
}

function getCamerasList() {
    return navigator.mediaDevices.enumerateDevices()
        .then(devices => devices.filter(device => device.kind == 'videoinput'))
}


function play_pause() {
    if (video.paused) {
        clickAlert.style.opacity = 0.2;
        video.play();
    } else {
        clickAlert.style.opacity = 1;
        video.pause();
    }
}

function startStream(deviceId = null) {
    return new Promise((resolve, reject) => {
        var option = {
            audio: false,
            video: (deviceId ? {
                deviceId: {
                    exact: deviceId
                }
            } : true)
        };
        navigator.mediaDevices.getUserMedia(option)
            .then(stream => {
                if (video.srcObject) video.srcObject.getVideoTracks().forEach(vidTrack => vidTrack.stop());

                function videoOnloadedmetadata() {
                    video.removeEventListener("loadedmetadata", videoOnloadedmetadata);
                    clickAlert.style.opacity = 0.2;
                    resolve({
                        width: this.videoWidth,
                        height: this.videoHeight
                    })
                }
                video.addEventListener("loadedmetadata", videoOnloadedmetadata);
                video.srcObject = stream;
                video.onloadedmetadata = () => video.play();
            })
            .catch(reject);
    })
};

function deviceSelectOnChange() {
    return startStream(this.value)
        .then(reset)
}

function reset(info) {
    width = info.width;
    height = info.height;
    asciifyHeight = Math.floor(asciifyWidth * height / width);

    scale_canvas.width = asciifyWidth;
    scale_canvas.height = asciifyHeight;

    result_canvas.width = (width + result_canvas_padding * 2);
    result_canvas.height = (height + result_canvas_padding * 2);

    result_letterSpacing = width / (asciifyWidth - 1);
    fontSize = result_letterSpacing; // Math.floor(width * 0.8 * rem / window.innerWidth);
    result_lineHight = height / (asciifyHeight - 1);
}

function init() {
    document.body.removeEventListener('click', init);
    if (checkCameraAPI()) {
        permission.innerText = '權限獲取中...';
        permission.classList.add('show');
        startStream()
            .then(info => {
                getCamerasList()
                    .then(devices => {
                        devices.forEach(device => {
                            var option = document.createElement('option');
                            option.innerText = device.label;
                            option.value = device.deviceId;
                            deviceSelect.appendChild(option)
                        })
                    })
                permission.classList.remove('show');
                deviceSelect.addEventListener('change', deviceSelectOnChange);
                deviceSelect.style.opacity = 1;
                reset(info);

                canvas_out.style.transform = 'scale(1)';

                getFrameFromVideo();
                result_canvas.addEventListener('click', play_pause);
                clickAlert.innerText = '點擊畫布開始/暫停';
            })
            .catch(() => {
                permission.innerText = '無法取得相機的使用權限';
                permission.classList.add('show');
            })
    } else {
        permission.innerText = '您的裝置可能不支援相機功能';
        permission.classList.add('show');
    }
}

document.addEventListener("DOMContentLoaded", function () {
    if (window.innerWidth < window.innerHeight) {
        result_canvas.style.width = '90vw';
        asciifyWidth = 40;
    } else {
        result_canvas.style.height = '90vh';
    }
    document.body.addEventListener('click', init);
})