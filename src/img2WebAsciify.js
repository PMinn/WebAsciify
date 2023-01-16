const ASCII_CHARS = '$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,"^`\'.'.split('');
const buckets = 255 / ASCII_CHARS.length;

function img2WebAsciify(image, width) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = width * image.height / image.width;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, canvas.width, canvas.height);
    let imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    let pixels = imgData.data;
    var newPixels = [];
    for (var i = 0; i < canvas.height; i++) {
        newPixels[i] = [];
        for (var j = 0; j < canvas.width; j++) {
            let index = (i * canvas.width + j) * 4;
            let lightness = parseInt((pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3);
            newPixels[i][j] = ASCII_CHARS[Math.floor(lightness / buckets)];
        }
    }
    return newPixels;
}