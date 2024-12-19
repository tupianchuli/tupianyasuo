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

    // 加载卡通化模型
    async function loadCartoonModel() {
        try {
            cartoonModel = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/style_transfer/1/model.json');
        } catch (error) {
            console.error('模型加载失败:', error);
            alert('模型加载失败，请检查网络连接');
        }
    }

    // 初始化加载模型
    loadCartoonModel();

    // 卡通化处理
    async function cartoonize(imageElement) {
        if (!cartoonModel) {
            alert('模型还未加载完成，请稍后再试');
            return null;
        }

        try {
            // 预处理图片
            const tensor = tf.browser.fromPixels(imageElement)
                .toFloat()
                .resizeBilinear([256, 256])  // 调整大小以提高性能
                .div(255.0)
                .expandDims();

            // 应用风格转换
            const result = await cartoonModel.predict(tensor);

            // 后处理
            const cartoonImage = await tf.browser.toPixels(result.squeeze());

            const canvas = document.createElement('canvas');
            canvas.width = imageElement.width;
            canvas.height = imageElement.height;
            const ctx = canvas.getContext('2d');
            ctx.putImageData(new ImageData(cartoonImage, canvas.width, canvas.height), 0, 0);

            return canvas.toDataURL('image/jpeg', qualitySlider.value / 100);
        } catch (error) {
            console.error('处理图片时出错:', error);
            alert('处理图片时出错，请重试');
            return null;
        }
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