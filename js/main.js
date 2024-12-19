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

    // 卡通化处理
    async function cartoonize(imageElement) {
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.width;
        canvas.height = imageElement.height;
        const ctx = canvas.getContext('2d');
        
        // 绘制原始图片
        ctx.drawImage(imageElement, 0, 0);
        
        // 添加边缘检测效果
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        
        for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];
            
            // 简化颜色
            const threshold = 32; // 增大阈值，使颜色分层更明显
            pixels[i] = Math.floor(r / threshold) * threshold;
            pixels[i + 1] = Math.floor(g / threshold) * threshold;
            pixels[i + 2] = Math.floor(b / threshold) * threshold;
            
            // 增强边缘
            if (i > 0 && i < pixels.length - 4) {
                const prevR = pixels[i - 4];
                const prevG = pixels[i - 3];
                const prevB = pixels[i - 2];
                
                const diff = Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
                if (diff > 100) {
                    pixels[i] = pixels[i + 1] = pixels[i + 2] = 0; // 边缘变黑
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // 最后增加饱和度和对比度
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        return canvas.toDataURL('image/jpeg', qualitySlider.value / 100);
    }

    // 处理样式切换
    document.getElementById('compressBtn').addEventListener('click', function() {
        this.classList.add('active');
        document.getElementById('cartoonBtn').classList.remove('active');
        currentMode = 'compress';
        if (originalPreview.src) {
            compressImage(originalPreview.src, qualitySlider.value / 100);
        }
    });

    document.getElementById('cartoonBtn').addEventListener('click', async function() {
        this.classList.add('active');
        document.getElementById('compressBtn').classList.remove('active');
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
            if (currentMode === 'cartoon') {
                cartoonize(originalPreview).then(dataUrl => {
                    if (dataUrl) {
                        compressedPreview.src = dataUrl;
                        const size = Math.round((dataUrl.length - 'data:image/jpeg;base64,'.length) * 3/4);
                        document.getElementById('compressedSize').textContent = formatFileSize(size);
                    }
                });
            } else {
                compressImage(e.target.result, qualitySlider.value / 100);
            }
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