document.addEventListener('DOMContentLoaded', function() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalSize = document.getElementById('originalSize');
    const compressedSize = document.getElementById('compressedSize');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');

    let originalFile = null;
    let currentMode = 'normal';
    let cartoonModel = null;

    // 卡通化处理
    async function cartoonize(imageElement) {
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.width;
        canvas.height = imageElement.height;
        const ctx = canvas.getContext('2d');
        
        // 绘制原始图片
        ctx.drawImage(imageElement, 0, 0);
        
        // 应用卡通效果
        ctx.filter = 'saturate(150%) contrast(120%) brightness(110%)';
        ctx.drawImage(canvas, 0, 0);
        
        // 添加边缘检测效果
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            
            // 转换为灰度
            const gray = 0.3 * r + 0.59 * g + 0.11 * b;
            
            // 简化颜色
            const threshold = 5;
            pixels[i] = Math.floor(r / threshold) * threshold;
            pixels[i + 1] = Math.floor(g / threshold) * threshold;
            pixels[i + 2] = Math.floor(b / threshold) * threshold;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        return canvas.toDataURL('image/jpeg', qualitySlider.value / 100);
    }

    // 处理样式切换
    document.getElementById('normalBtn').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('cartoonBtn').classList.remove('active');
        currentMode = 'normal';
        if (originalPreview.src) {
            compressImage(originalPreview.src, qualitySlider.value / 100);
        }
    });

    document.getElementById('cartoonBtn').addEventListener('click', async function() {
        this.classList.add('active');
        document.getElementById('normalBtn').classList.remove('active');
        currentMode = 'cartoon';
        if (originalPreview.src) {
            const cartoonDataUrl = await cartoonize(originalPreview);
            if (cartoonDataUrl) {
                compressedPreview.src = cartoonDataUrl;
                const compressedSize = Math.round((cartoonDataUrl.length - 'data:image/jpeg;base64,'.length) * 3/4);
                document.getElementById('compressedSize').textContent = formatFileSize(compressedSize);
            }
        }
    });

    // 处理拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#007AFF';
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // 处理点击上传
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // 处理文件上传
    function handleFile(file) {
        if (!file.type.match(/image\/(png|jpeg)/i)) {
            alert('请上传 PNG 或 JPG 格式的图片！');
            return;
        }

        originalFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            originalPreview.src = e.target.result;
            originalSize.textContent = formatFileSize(file.size);
            previewContainer.style.display = 'block';
            compressImage(e.target.result, qualitySlider.value / 100);
        };
        reader.readAsDataURL(file);
    }

    // 压缩图片
    function compressImage(dataUrl, quality) {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            
            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            compressedPreview.src = compressedDataUrl;
            
            // 计算压缩后的大小
            const compressedSize = Math.round((compressedDataUrl.length - 'data:image/jpeg;base64,'.length) * 3/4);
            document.getElementById('compressedSize').textContent = formatFileSize(compressedSize);
        };
        img.src = dataUrl;
    }

    // 质量滑块事件
    qualitySlider.addEventListener('input', (e) => {
        const quality = e.target.value;
        qualityValue.textContent = quality + '%';
        if (originalPreview.src) {
            compressImage(originalPreview.src, quality / 100);
        }
    });

    // 下载按钮事件
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'compressed_image.jpg';
        link.href = compressedPreview.src;
        link.click();
    });

    // 文件大小格式化
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}); 