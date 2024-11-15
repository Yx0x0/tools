// 添加在文件顶部,其他代码之前
// 定义常量
const MAX_RETRIES = 3;  // 最大重试次数
const RETRY_DELAY = 1000;  // 重试延迟时间(毫秒)

// 带重试机制的fetch函数
async function fetchWithRetry(url, options = {}, maxRetries = MAX_RETRIES) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            // 发起请求并添加User-Agent
            const response = await fetch(url, {
                ...options,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                    ...options.headers
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === maxRetries - 1) throw error;
            // 等待时间随重试次数增加
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
        }
    }
}

// 代理请求处理函数
async function handleProxyRequest(url) {
    try {
        const response = await fetchWithRetry(url);
        const headers = new Headers(response.headers);
        // 设置CORS头
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        
        // 为视频内容添加缓存控制
        if (url.includes('.mp4') || url.includes('video')) {
            headers.set('Cache-Control', 'public, max-age=14400'); // 4小时缓存
            headers.set('CDN-Cache-Control', 'max-age=14400');
            headers.set('Cloudflare-CDN-Cache-Control', 'max-age=14400');
        } else {
            // 对于非视频内容使用较短的缓存时间
            headers.set('Cache-Control', 'public, max-age=300'); // 5分钟缓存
        }
        
        return new Response(response.body, {
            status: response.status,
            headers: headers
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return new Response('代理请求失败: ' + error.message, { 
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store' // 错误响应不缓存
            }
        });
    }
}

// Cloudflare Workers 的入口
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

// 水印函数 - 为HTML内容添加水印
function wrapResponseWithWatermark(htmlContent) {
    const watermarkCode = `
        <style>
            // 水印容器样式
            .watermark-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 0;
                opacity: 0.08;
            }
            // 确保所有交互元素在水印之上
            .container, .module, .input-group, button, input, a, .settings {
                position: relative;
                z-index: 1;
            }
        </style>
        <div class="watermark-container"></div>
        <script>
            window.addEventListener('load', function() {
                const container = document.querySelector('.watermark-container');
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = 600;
                canvas.height = 300;
                
                const largeIndex = Math.floor(Math.random() * 6);
                
                function createWatermark() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    const now = new Date();
                    const timeStr = now.toLocaleString('zh-CN');
                    
                    // 创建离屏 canvas 用于双缓冲
                    const offscreenCanvas = document.createElement('canvas');
                    offscreenCanvas.width = canvas.width;
                    offscreenCanvas.height = canvas.height;
                    const offscreenCtx = offscreenCanvas.getContext('2d');
                    
                    for(let row = 0; row < 2; row++) {
                        for(let col = 0; col < 3; col++) {
                            offscreenCtx.save();
                            const currentIndex = row * 3 + col;
                            offscreenCtx.translate(col * 200, row * 150);
                            offscreenCtx.rotate(-15 * Math.PI / 180);
                            
                            offscreenCtx.font = currentIndex === largeIndex ? '16px Arial' : '12px Arial';
                            offscreenCtx.fillStyle = 'rgba(0, 0, 0, 1)';
                            
                            offscreenCtx.fillText(window.location.hostname, 20, 40);
                            offscreenCtx.fillText(timeStr, 20, 60);
                            offscreenCtx.restore();
                        }
                    }
                    
                    // 将离屏 canvas 的内容一次性复制到主 canvas
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(offscreenCanvas, 0, 0);
                    
                    // 使用 requestAnimationFrame 更新背景
                    requestAnimationFrame(() => {
                        container.style.backgroundImage = \`url('\${canvas.toDataURL()}')\`;
                        container.style.backgroundRepeat = 'repeat';
                    });
                }
                
                createWatermark();
                // 降低更新频率到每秒一次
                setInterval(createWatermark, 1000);
            });
        </script>
    `;
    
    return htmlContent.replace('<body>', '<body>' + watermarkCode);
}

// 处理请求的函数
async function handleRequest(request) {
    const url = new URL(request.url);

    // 路由处理
    switch (url.pathname) {
        case '/proxy':
            const targetUrl = url.searchParams.get('url');
            if (!targetUrl) {
                return new Response('缺少 url 参数', { 
                    status: 400,
                    headers: {
                        'Access-Control-Allow-Origin': '*'
                    }
                });
            }
            return handleProxyRequest(targetUrl);

        case '/encode':
            if (request.method === 'POST') {
                const formData = await request.formData();
                const originalUrl = formData.get('url');
                
                if (originalUrl) {
                    const encodedUrl = encodeURIComponent(originalUrl);
                    return new Response(wrapResponseWithWatermark(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>URL 转码结果</title>
                            <style>
                                body { 
                                    font-family: Arial, sans-serif; 
                                    margin: 0; 
                                    padding: 0; 
                                    background-color: #f4f4f4; 
                                }
                                .container {
                                    max-width: 760px;
                                    margin: 20px auto;
                                    padding: 30px;
                                    background: white;
                                    border-radius: 12px;
                                    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                                }
                                h1 {
                                    color: #333;
                                    text-align: center;
                                    margin-bottom: 30px;
                                }
                                .result-box {
                                    margin: 20px 0;
                                    padding: 15px;
                                    background: #f8f9fa;
                                    border-radius: 6px;
                                    word-break: break-all;
                                }
                                .result-label {
                                    font-weight: bold;
                                    color: #555;
                                    margin-bottom: 5px;
                                }
                                .result-content {
                                    padding: 10px;
                                    background: white;
                                    border: 1px solid #ddd;
                                    border-radius: 4px;
                                    margin-top: 5px;
                                }
                                .back-link {
                                    display: block;
                                    text-align: center;
                                    color: #007BFF;
                                    text-decoration: none;
                                    margin-top: 20px;
                                    padding: 10px;
                                    border-radius: 6px;
                                }

                                @media screen and (max-width: 768px) {
                                    .container {
                                        margin: 10px;
                                        padding: 20px;
                                    }
                                    h1 {
                                        font-size: 20px;
                                    }
                                    .result-box {
                                        padding: 10px;
                                    }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h1>转码结果</h1>
                                <div class="result-box">
                                    <div class="result-label">原始 URL:</div>
                                    <div class="result-content">${originalUrl}</div>
                                    <div class="result-label" style="margin-top: 15px;">转码后的 URL:</div>
                                    <div class="result-content">${encodedUrl}</div>
                                </div>
                                <a href="/encode" class="back-link">继续转码</a>
                                <a href="/" class="back-link">返回首页</a>
                            </div>
                        </body>
                        </html>
                    `), {
                        headers: { 'Content-Type': 'text/html; charset=utf-8' },
                    });
                }
            }

            // GET 请求返回表单页面
            return new Response(wrapResponseWithWatermark(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>URL 转码</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0; 
                            padding: 0; 
                            background-color: #f4f4f4; 
                        }
                        .container {
                            max-width: 760px;
                            margin: 20px auto;
                            padding: 30px;
                            background: white;
                            border-radius: 12px;
                            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            color: #333;
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        form {
                            margin-top: 20px;
                        }
                        label {
                            display: block;
                            margin-bottom: 10px;
                            color: #555;
                            font-weight: bold;
                        }
                        input[type="text"] {
                            width: 100%;
                            padding: 12px;
                            margin: 10px 0;
                            border: 1px solid #ddd;
                            border-radius: 6px;
                            font-size: 16px;
                            box-sizing: border-box;
                        }
                        button {
                            width: 100%;
                            padding: 12px;
                            background-color: #007BFF;
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 16px;
                            margin-top: 10px;
                            transition: all 0.3s;
                        }
                        button:hover {
                            background-color: #0056b3;
                        }
                        .back-link {
                            display: block;
                            text-align: center;
                            color: #007BFF;
                            text-decoration: none;
                            margin-top: 20px;
                            padding: 10px;
                        }

                        @media screen and (max-width: 768px) {
                            .container {
                                margin: 10px;
                                padding: 20px;
                            }
                            h1 {
                                font-size: 20px;
                            }
                            input[type="text"] {
                                font-size: 16px;
                                padding: 10px;
                            }
                            button {
                                padding: 15px;
                            }
                        }

                        @media (hover: none) {
                            button:active {
                                opacity: 0.8;
                                transform: scale(0.98);
                            }
                            .back-link:active {
                                background: #f0f0f0;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>URL 转码工具</h1>
                        <form method="POST" action="/encode">
                            <label for="url">请输入需要转码的 URL:</label>
                            <input type="text" id="url" name="url" required placeholder="请输入URL">
                            <button type="submit">转码</button>
                        </form>
                        <a href="/" class="back-link">返回首页</a>
                    </div>
                </body>
                </html>
            `), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });

        case '/realtime':
            return new Response(wrapResponseWithWatermark(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
                    <title>实时线报</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0; 
                            padding: 0; 
                            background-color: #f4f4f4; 
                        }
                        .container {
                            max-width: 760px;
                            margin: 20px auto;
                            padding: 20px;
                            background: white;
                            border-radius: 12px;
                            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                        }
                        h1, h2 {
                            color: #333;
                            text-align: center;
                        }
                        .tabs {
                            display: flex;
                            justify-content: center;
                            gap: 10px;
                            margin: 20px 0;
                            flex-wrap: wrap;
                        }
                        .tabs button {
                            padding: 10px 20px;
                            border: none;
                            border-radius: 6px;
                            background: #007bff;
                            color: white;
                            cursor: pointer;
                            transition: all 0.3s;
                        }
                        .tabs button:hover {
                            background: #0056b3;
                        }
                        .news-list {
                            list-style: decimal;
                            padding-left: 20px;
                        }
                        .news-item {
                            padding: 12px 0;
                            border-bottom: 1px solid #eee;
                        }
                        .news-item a {
                            color: #333;
                            text-decoration: none;
                            transition: color 0.3s;
                        }
                        .news-item a:hover {
                            color: #007bff;
                        }
                        .back-link {
                            display: block;
                            text-align: center;
                            color: #007BFF;
                            text-decoration: none;
                            margin-top: 20px;
                            padding: 10px;
                        }
                        .loading {
                            text-align: center;
                            padding: 20px;
                        }
                        .loading .spinner {
                            border: 4px solid #f3f3f3;
                            border-top: 4px solid #3498db;
                            border-radius: 50%;
                            width: 40px;
                            height: 40px;
                            animation: spin 1s linear infinite;
                            margin: 0 auto 10px;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }

                        /* 端适配 */
                        @media screen and (max-width: 768px) {
                            .container {
                                margin: 10px;
                                padding: 15px;
                            }
                            h1 {
                                font-size: 20px;
                            }
                            h2 {
                                font-size: 18px;
                            }
                            .tabs button {
                                width: calc(50% - 10px);
                                padding: 12px 0;
                                font-size: 14px;
                            }
                            .news-item {
                                padding: 15px 0;
                                font-size: 15px;
                            }
                        }

                        /* 触摸设备优化 */
                        @media (hover: none) {
                            .tabs button:active {
                                opacity: 0.8;
                                transform: scale(0.98);
                            }
                            .news-item:active {
                                background: #f8f9fa;
                            }
                            .back-link:active {
                                background: #f0f0f0;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>实时线报</h1>
                        <div class="tabs">
                            <button onclick="fetchData('http://new.ixbk.net/plus/json/push_16.json', '赚客吧')">赚客吧</button>
                            <button onclick="fetchData('http://new.ixbk.net/plus/json/push_17.json', '酷安')">酷安</button>
                            <button onclick="fetchData('http://new.ixbk.net/plus/json/push_19.json', '值得买')">值得买</button>
                    </div>
                        <div id="resultContainer">
                            <div class="loading">
                                <div class="spinner"></div>
                                <p>加载中...</p>
                            </div>
                        </div>
                        <a href="/" class="back-link">返回首页</a>
                    </div>
                    <script>
                        async function fetchData(apiUrl, tabName) {
                            const resultContainer = document.getElementById('resultContainer');
                            resultContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>加载中...</p></div>';

                            try {
                                const response = await fetch(apiUrl);
                                const data = await response.json();
                                
                                let html = '<h2>' + tabName + '</h2><ol class="news-list">';
                                data.forEach(item => {
                                    const fullUrl = 'http://new.ixbk.net' + item.url;
                                    html += '<li class="news-item"><a href="' + fullUrl + '" target="_blank">' + item.title + '</a></li>';
                                });
                                html += '</ol>';
                                
                                resultContainer.innerHTML = html;
                            } catch (error) {
                                resultContainer.innerHTML = '<p style="text-align: center; color: #dc3545; padding: 20px;">加载失败，请稍后重试</p>';
                            }
                        }

                        // 默认赚客据
                        fetchData('http://new.ixbk.net/plus/json/push_16.json', '赚客吧');
                    </script>
                </body>
                </html>
            `), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
            
        case '/bzq':
            return new Response(wrapResponseWithWatermark(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>保质期计算器</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0; 
                            padding: 0; 
                            background-color: #f4f4f4; 
                        }
                        .container {
                            max-width: 760px;
                            margin: 20px auto;
                            padding: 30px;
                            background: white;
                            border-radius: 12px;
                            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            color: #333;
                            margin-bottom: 30px;
                            font-size: 24px;
                            text-align: center;
                        }
                        .input-group {
                            margin: 13px 0;
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                        }
                        label {
                            display: block;
                            margin-bottom: 10px;
                            color: #555;
                            font-weight: bold;
                        }
                        input[type="date"],
                        input[type="number"],
                        select {
                            width: 96%;
                            padding: 12px;
                            border: 1px solid #ddd;
                            border-radius: 6px;
                            font-size: 16px;
                            margin-bottom: 10px;
                        }
                        .button-group {
                            display: flex;
                            justify-content: center;
                            gap: 15px;
                        }
                        button {
                            padding: 12px 30px;
                            border: none;
                            border-radius: 6px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: all 0.3s;
                            min-width: 120px;
                        }
                        button:first-child {
                            background: #007bff;
                            color: white;
                        }
                        button:last-child {
                            background: #6c757d;
                            color: white;
                        }
                        #result {
                            margin: 25px 0;
                            padding: 20px;
                            font-size: 18px;
                            text-align: center;
                        }
                        .back-link {
                            display: block;
                            text-align: center;
                            color: #007BFF;
                            text-decoration: none;
                            margin-top: 20px;
                            padding: 10px;
                        }

                        /* 移动端适配 */
                        @media screen and (max-width: 768px) {
                            .container {
                                margin: 10px;
                                padding: 15px;
                            }
                            h1 {
                                font-size: 20px;
                                margin-bottom: 20px;
                            }
                            .input-group {
                                padding: 15px;
                                margin: 15px 0;
                            }
                            .button-group {
                                flex-direction: column;
                            }
                            button {
                                width: 100%;
                                margin: 5px 0;
                            }
                            input[type="date"],
                            input[type="number"],
                            select {
                                font-size: 16px;
                                -webkit-appearance: none;
                            }
                        }

                        /* 触摸设备优化 */
                        @media (hover: none) {
                            button:active {
                                opacity: 0.8;
                                transform: scale(0.98);
                            }
                            .back-link:active {
                                background: #f0f0f0;
                            }
                        }

                        input[type="date"] {
                            width: 100%;
                            padding: 12px;
                            border: 1px solid #ddd;
                            border-radius: 6px;
                            font-size: 16px;
                            box-sizing: border-box;
                            -webkit-appearance: none;
                            background-color: #fff;
                        }

                        input[type="date"]::-webkit-calendar-picker-indicator {
                            background: transparent;
                            bottom: 0;
                            color: transparent;
                            cursor: pointer;
                            height: auto;
                            left: 0;
                            position: absolute;
                            right: 0;
                            top: 0;
                            width: auto;
                        }

                        input[type="date"]::before {
                            content: attr(placeholder);
                            color: #999;
                        }

                        input[type="date"]:valid::before {
                            display: none;
                        }

                        .input-wrapper {
                            display: flex;
                            gap: 10px;
                        }

                        .input-wrapper input[type="number"] {
                            flex: 2;
                            width: auto;
                        }

                        .input-wrapper select {
                            flex: 1;
                            width: auto;
                        }

                        /* 移动端适配 */
                        @media screen and (max-width: 768px) {
                            input[type="date"] {
                                font-size: 16px;
                                padding: 10px;
                            }
                            
                            .input-wrapper {
                                flex-direction: row;
                            }
                            
                            .input-wrapper input[type="number"],
                            .input-wrapper select {
                                font-size: 16px;
                                padding: 10px;
                            }
                        }

                        .date-input-container {
                            position: relative;
                            width: 100%;
                        }

                        .date-input-container input[type="date"] {
                            width: 100%;
                            padding: 12px;
                            border: 1px solid #ddd;
                            border-radius: 6px;
                            font-size: 16px;
                            box-sizing: border-box;
                            background-color: #fff;
                            position: relative;
                            z-index: 1;
                        }

                        /* 移除默认的日期选择器按钮 */
                        .date-input-container input[type="date"]::-webkit-calendar-picker-indicator {
                            position: absolute;
                            right: 10px;
                            top: 50%;
                            transform: translateY(-50%);
                            z-index: 2;
                        }

                        /* 移动端适配 */
                        @media screen and (max-width: 768px) {
                            .date-input-container input[type="date"] {
                                font-size: 16px;
                                padding: 10px;
                            }
                        }

                        .result-expired {
                            background: #ffebee !important;
                            color: #c62828 !important;
                            padding: 15px;
                            border-radius: 6px;
                            text-align: center;
                            margin-top: 20px;
                        }
                        .result-valid {
                            background: #e8f5e9 !important;
                            color: #2e7d32 !important;
                            padding: 15px;
                            border-radius: 6px;
                            text-align: center;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>保质期计算器</h1>
                        <div class="input-group">
                            <label for="productDate">生产日期</label>
                            <div class="date-input-container">
                                <input type="date" id="productDate">
                            </div>
                        </div>
                        <div class="input-group">
                            <label>保质期</label>
                            <div class="input-wrapper">
                                <input type="number" id="expiryValue" min="1" max="365" value="30">
                                <select id="expiryUnit">
                                    <option value="days" selected>天</option>
                                    <option value="months">月</option>
                                </select>
                            </div>
                        </div>
                        <div id="result"></div>
                        <div class="button-group">
                            <button type="button" onclick="calculateExpiry()">计算</button>
                            <button type="button" onclick="resetForm()">重置</button>
                        </div>
                        <a href="/" class="back-link">返回首页</a>
                    </div>
                    <script>
                        // 初始化日期为今天并设置最大日期
                        function initDate() {
                            const today = new Date();
                            const dateString = today.toISOString().split('T')[0];
                            const dateInput = document.getElementById('productDate');
                            dateInput.value = dateString;
                            dateInput.max = dateString; // 设置最大日期为今天

                            // 监听期变化，确保不超过今天
                            dateInput.addEventListener('change', function() {
                                const selectedDate = new Date(this.value);
                                const today = new Date();
                                today.setHours(0, 0, 0, 0); // 设置时间为天开始

                                if (selectedDate > today) {
                                    this.value = dateString;
                                    alert('生产日期不能超过今天');
                                }
                            });
                        }

                        // 页面加载时初始化日期
                        document.addEventListener('DOMContentLoaded', initDate);

                        function calculateExpiry() {
                            const dateInput = document.getElementById('productDate');
                            const value = parseInt(document.getElementById('expiryValue').value);
                            const unit = document.getElementById('expiryUnit').value;
                            
                            const productDate = new Date(dateInput.value);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);

                            if (productDate > today) {
                                alert('生产日期不能超过今天');
                                dateInput.value = today.toISOString().split('T')[0];
                                return;
                            }

                            const expiryDate = new Date(productDate);
                            
                            if(unit === 'months') {
                                expiryDate.setMonth(expiryDate.getMonth() + value);
                            } else {
                                expiryDate.setDate(expiryDate.getDate() + value);
                            }

                            // 计算天数差
                            const currentDate = new Date();
                            currentDate.setHours(0, 0, 0, 0);
                            const timeDiff = expiryDate.getTime() - currentDate.getTime();
                            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
                            
                            const result = document.getElementById('result');
                            let resultHTML = '';

                            if (daysDiff < 0) {
                                // 已过期
                                resultHTML = \`
                                    <div class="result-expired">
                                        <div style="font-size: 18px; margin-bottom: 10px;">已过期 \${Math.abs(daysDiff)} 天</div>
                                        <div style="font-size: 14px;">
                                            生产日期：\${productDate.toLocaleDateString()}<br>
                                            到期日期：\${expiryDate.toLocaleDateString()}
                                        </div>
                                    </div>
                                \`;
                            } else if (daysDiff === 0) {
                                // 今天到期
                                resultHTML = \`
                                    <div class="result-expired">
                                        <div style="font-size: 18px; margin-bottom: 10px;">今天到期</div>
                                        <div style="font-size: 14px;">
                                            生产日期：\${productDate.toLocaleDateString()}<br>
                                            到期日期：\${expiryDate.toLocaleDateString()}
                                        </div>
                                    </div>
                                \`;
                            } else {
                                // 未过期
                                resultHTML = \`
                                    <div class="result-valid">
                                        <div style="font-size: 18px; margin-bottom: 10px;">还有 \${daysDiff} 天到期</div>
                                        <div style="font-size: 14px;">
                                            生产日期：\${productDate.toLocaleDateString()}<br>
                                            到期日期：\${expiryDate.toLocaleDateString()}
                                        </div>
                                    </div>
                                \`;
                            }
                            
                            result.innerHTML = resultHTML;
                        }

                        function resetForm() {
                            document.getElementById('productDate').value = new Date().toISOString().split('T')[0];
                            document.getElementById('expiryValue').value = '30';
                            document.getElementById('expiryUnit').value = 'days';
                            document.getElementById('result').style.display = 'none';
                        }

                        // 阻止按钮点击事件冒泡
                        document.querySelectorAll('button').forEach(button => {
                            button.addEventListener('click', (e) => {
                                e.stopPropagation();
                            });
                        });

                        // 添加输入限制处理
                        document.getElementById('expiryValue').addEventListener('input', function(e) {
                            const unit = document.getElementById('expiryUnit').value;
                            if (unit === 'months') {
                                if (this.value > 12) this.value = 12;
                                if (this.value < 1) this.value = 1;
                            } else {
                                if (this.value > 365) this.value = 365;
                                if (this.value < 1) this.value = 1;
                            }
                        });

                        // 添加单位切换处理
                        document.getElementById('expiryUnit').addEventListener('change', function(e) {
                            const valueInput = document.getElementById('expiryValue');
                            if (this.value === 'months') {
                                if (valueInput.value > 12) valueInput.value = 12;
                                valueInput.max = 12;
                            } else {
                                valueInput.max = 365;
                            }
                        });
                    </script>
                </body>
                </html>
            `), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });

        case '/hotspot':
            return new Response(wrapResponseWithWatermark(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>今日热点</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0; 
                            padding: 0; 
                            background-color: #f4f4f4; 
                        }
                        .container { 
                            max-width: 760px; 
                            margin: 20px auto; 
                            padding: 20px;
                        }
                        h1, h2 {
                            text-align: center;
                            color: #333;
                        }
                        .hotspot-section {
                            margin-bottom: 15px;
                            background: #fff;
                            border-radius: 8px;
                            padding: 15px;
                        }
                        ul {
                            margin: 0;
                            padding-left: 20px;
                        }
                        li {
                            margin: 8px 0;
                        }

                        @media screen and (max-width: 768px) {
                            .container {
                                margin: 10px;
                                padding: 15px;
                            }
                            .hotspot-header {
                                padding: 15px;
                                background: #f8f9fa;
                                cursor: pointer;
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                            }
                            .hotspot-content {
                                display: none;
                                padding: 10px 15px;
                            }
                            .hotspot-content.active {
                                display: block;
                            }
                            .arrow {
                                transition: transform 0.3s;
                            }
                            .arrow.active {
                                transform: rotate(180deg);
                            }
                            .hotspot-container-web {
                                display: none;
                            }
                        }

                        @media screen and (min-width: 769px) {
                            .hotspot-container-mobile {
                                display: none;
                            }
                            .hotspot-container-web > div {
                                display: flex;
                                gap: 20px;
                            }
                            .hotspot-section {
                                flex: 1;
                            }
                        }

                        /* 添加链接样式 */
                        a:hover,
                        a:active,
                        a:visited,
                        a:link {
                            text-decoration: none;
                        }

                        /* 热搜列表样式 */
                        ul {
                            list-style-type: decimal;
                            margin: 0;
                            padding-left: 30px;
                        }

                        /* 热搜链接颜色 */
                        .hotspot-section li a {
                            color: #000;
                        }

                        /* 返回首页链接样式 */
                        .back-link {
                            display: block;
                            text-align: center;
                            margin: 20px auto;
                            color: #007BFF;
                        }

                        /* 列表项悬停效果 */
                        li {
                            margin: 8px 0;
                            padding: 5px;
                        }

                        li:hover {
                            border-bottom: 1px dashed #ccc;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>今日热点</h1>
                        <div id="content">
                            <div class="loading">
                                <div class="spinner"></div>
                                <p>加载中...</p>
                            </div>
                        </div>
                        <a href="/" class="back-link">返回首页</a>
                    </div>
                    <script>
                        async function fetchHotspotData() {
                            try {
                                const [bilibiliResponse, zhihuResponse, douyinResponse] = await Promise.all([
                                    fetch('https://uapis.cn/api/hotlist?type=bilibili'),
                                    fetch('https://uapis.cn/api/hotlist?type=zhihu'),
                                    fetch('https://uapis.cn/api/hotlist?type=douyin')
                                ]);

                                const [bilibiliData, zhihuData, douyinData] = await Promise.all([
                                    bilibiliResponse.json(),
                                    zhihuResponse.json(),
                                    douyinResponse.json()
                                ]);

                                const content = document.getElementById('content');
                                
                                const webContent = \`
                                    <div class="hotspot-container-web">
                                        <div>
                                            <div class="hotspot-section">
                                                <h2>哔哩哔哩热搜</h2>
                                                <ul>\${bilibiliData.data.slice(0, 20).map(item => 
                                                    \`<li><a href="https://search.bilibili.com/all?keyword=\${encodeURIComponent(item.title)}" target="_blank">\${item.title}</a></li>\`
                                                ).join('')}</ul>
                                            </div>
                                            <div class="hotspot-section">
                                                <h2>知乎热搜</h2>
                                                <ul>\${zhihuData.data.slice(0, 20).map(item => 
                                                    \`<li><a href="https://www.zhihu.com/search?type=content&q=\${encodeURIComponent(item.title)}" target="_blank">\${item.title}</a></li>\`
                                                ).join('')}</ul>
                                            </div>
                                            <div class="hotspot-section">
                                                <h2>抖音热搜</h2>
                                                <ul>\${douyinData.data.slice(0, 20).map(item => 
                                                    \`<li><a href="https://www.douyin.com/search/\${encodeURIComponent(item.title)}" target="_blank">\${item.title}</a></li>\`
                                                ).join('')}</ul>
                                            </div>
                                        </div>
                                    </div>
                                \`;

                                const mobileContent = \`
                                    <div class="hotspot-container-mobile">
                                        <div class="hotspot-section">
                                            <div class="hotspot-header" onclick="toggleSection(this)">
                                                <h2>哔哩哔哩热搜</h2>
                                                <span class="arrow">▼</span>
                                            </div>
                                            <div class="hotspot-content">
                                                <ul>\${bilibiliData.data.slice(0, 20).map(item => 
                                                    \`<li><a href="https://search.bilibili.com/all?keyword=\${encodeURIComponent(item.title)}" target="_blank">\${item.title}</a></li>\`
                                                ).join('')}</ul>
                                            </div>
                                        </div>
                                        <div class="hotspot-section">
                                            <div class="hotspot-header" onclick="toggleSection(this)">
                                                <h2>知乎热搜</h2>
                                                <span class="arrow">▼</span>
                                            </div>
                                            <div class="hotspot-content">
                                                <ul>\${zhihuData.data.slice(0, 20).map(item => 
                                                    \`<li><a href="https://www.zhihu.com/search?type=content&q=\${encodeURIComponent(item.title)}" target="_blank">\${item.title}</a></li>\`
                                                ).join('')}</ul>
                                            </div>
                                        </div>
                                        <div class="hotspot-section">
                                            <div class="hotspot-header" onclick="toggleSection(this)">
                                                <h2>抖音热搜</h2>
                                                <span class="arrow">▼</span>
                                            </div>
                                            <div class="hotspot-content">
                                                <ul>\${douyinData.data.slice(0, 20).map(item => 
                                                    \`<li><a href="https://www.douyin.com/search/\${encodeURIComponent(item.title)}" target="_blank">\${item.title}</a></li>\`
                                                ).join('')}</ul>
                                            </div>
                                        </div>
                                    </div>
                                \`;

                                content.innerHTML = webContent + mobileContent;

                                if (window.innerWidth <= 768) {
                                    const firstHeader = document.querySelector('.hotspot-container-mobile .hotspot-header');
                                    if (firstHeader) {
                                        toggleSection(firstHeader);
                                    }
                                }
                            } catch (error) {
                                console.error('获取数据失败:', error);
                                content.innerHTML = '<p style="text-align: center; color: #dc3545; padding: 20px;">加载失败，请稍后重试</p>';
                            }
                        }

                        function toggleSection(header) {
                            const content = header.nextElementSibling;
                            const arrow = header.querySelector('.arrow');
                            const allContents = document.querySelectorAll('.hotspot-content');
                            const allArrows = document.querySelectorAll('.arrow');
                            
                            allContents.forEach(item => {
                                if (item !== content) {
                                    item.classList.remove('active');
                                }
                            });
                            allArrows.forEach(item => {
                                if (item !== arrow) {
                                    item.classList.remove('active');
                                }
                            });

                            content.classList.toggle('active');
                            arrow.classList.toggle('active');
                        }

                        fetchHotspotData();
                    </script>
                </body>
                </html>
            `), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });

        case '/history':
            return new Response(wrapResponseWithWatermark(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>那年今日</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0; 
                            padding: 0; 
                            background-color: #f4f4f4; 
                        }
                        .container {
                            max-width: 760px;
                            margin: 20px auto;
                            padding: 20px;
                            background: white;
                            border-radius: 12px;
                            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            color: #333;
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        .history-list {
                            padding: 0;
                            margin: 0;
                        }
                        .history-item {
                            padding: 15px;
                            margin: 10px 0;
                            background: #f8f9fa;
                            border-radius: 8px;
                            line-height: 1.5;
                            transition: all 0.3s ease;
                        }
                        .back-link {
                            display: block;
                            text-align: center;
                            color: #007BFF;
                            text-decoration: none;
                            margin-top: 20px;
                            padding: 10px;
                            border-radius: 6px;
                        }
                        .loading {
                            text-align: center;
                            padding: 20px;
                        }
                        .loading .spinner {
                            border: 4px solid #f3f3f3;
                            border-top: 4px solid #3498db;
                            border-radius: 50%;
                            width: 40px;
                            height: 40px;
                            animation: spin 1s linear infinite;
                            margin: 0 auto 10px;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }

                        /* 移动端适配 */
                        @media screen and (max-width: 768px) {
                            .container {
                                margin: 10px;
                                padding: 15px;
                                border-radius: 8px;
                            }
                            h1 {
                                font-size: 20px;
                                margin-bottom: 20px;
                            }
                            .history-item {
                                padding: 12px;
                                font-size: 15px;
                                margin: 8px 0;
                            }
                        }

                        /* 触摸设备优化 */
                        @media (hover: none) {
                            .history-item:active {
                                background: #e9ecef;
                                transform: scale(0.99);
                            }
                            .back-link:active {
                                background: #f0f0f0;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>历史上的今天</h1>
                        <div id="content">
                            <div class="loading">
                                <div class="spinner"></div>
                                <p>加载中...</p>
                            </div>
                        </div>
                        <a href="/" class="back-link">返回首页</a>
                    </div>
                    <script>
                        async function fetchHistoryData() {
                            try {
                                const response = await fetch('https://uapis.cn/api/hotlist?type=history');
                                const data = await response.json();
                                
                                const content = document.getElementById('content');
                                content.innerHTML = \`
                                    <div class="history-list">
                                        \${data.data.slice(0, 20).map(item => \`
                                            <div class="history-item">\${item.title}</div>
                                        \`).join('')}
                                    </div>
                                \`;
                            } catch (error) {
                                console.error('获取数据失败:', error);
                                document.getElementById('content').innerHTML = 
                                    '<p style="text-align: center; color: #dc3545; padding: 20px;">加载失败，请稍后重试</p>';
                            }
                        }

                        fetchHistoryData();
                    </script>
                </body>
                </html>
            `), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });

        case '/bmi':
            return new Response(wrapResponseWithWatermark(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>BMI计算器</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0; 
                            padding: 0; 
                            background-color: #f4f4f4; 
                        }
                        .container {
                            max-width: 760px;
                            margin: 20px auto;
                            padding: 30px;
                            background: white;
                            border-radius: 12px;
                            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            color: #333;
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        .input-group {
                            margin: 15px 0;
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                        }
                        label {
                            display: block;
                            margin-bottom: 10px;
                            color: #555;
                            font-weight: bold;
                        }
                        input[type="number"] {
                            width: 100%;
                            padding: 12px;
                            border: 1px solid #ddd;
                            border-radius: 6px;
                            font-size: 16px;
                            box-sizing: border-box;
                        }
                        .button-group {
                            display: flex;
                            justify-content: center;
                            gap: 15px;
                            margin-top: 20px;
                        }
                        button {
                            padding: 12px 30px;
                            border: none;
                            border-radius: 6px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: all 0.3s;
                            min-width: 120px;
                        }
                        button:first-child {
                            background: #007bff;
                            color: white;
                        }
                        button:last-child {
                            background: #6c757d;
                            color: white;
                        }
                        #result {
                            margin: 20px 0;
                            padding: 20px;
                            border-radius: 8px;
                            text-align: center;
                            font-size: 18px;
                            display: none;
                        }
                        .back-link {
                            display: block;
                            text-align: center;
                            color: #007BFF;
                            text-decoration: none;
                            margin-top: 20px;
                            padding: 10px;
                        }
                        .normal { background-color: #d4edda; color: #155724; }
                        .overweight { background-color: #fff3cd; color: #856404; }
                        .obese { background-color: #f8d7da; color: #721c24; }
                        .underweight { background-color: #cce5ff; color: #004085; }

                        @media screen and (max-width: 768px) {
                            .container {
                                margin: 10px;
                                padding: 15px;
                            }
                            h1 {
                                font-size: 20px;
                            }
                            .input-group {
                                padding: 15px;
                            }
                            button {
                                width: 100%;
                            }
                            .button-group {
                                flex-direction: column;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>BMI计算器</h1>
                        <div class="input-group">
                            <label for="height">身高 (cm)</label>
                            <input type="number" id="height" min="100" max="999" step="0.1" placeholder="请输入身高(100-999)">
                        </div>
                        <div class="input-group">
                            <label for="weight">体重 (kg)</label>
                            <input type="number" id="weight" min="20" max="999" step="0.1" placeholder="请输入体重(20-999)">
                        </div>
                        <div id="result"></div>
                        <div class="button-group">
                            <button onclick="calculateBMI()">计算</button>
                            <button onclick="resetForm()">重置</button>
                        </div>
                        <a href="/" class="back-link">返回首页</a>
                    </div>
                    <script>
                        function calculateBMI() {
                            const height = document.getElementById('height').value;
                            const weight = document.getElementById('weight').value;
                            const result = document.getElementById('result');

                            // 验证输入
                            if (!height || !weight) {
                                alert('请输入身高和体重');
                                return;
                            }

                            // 验证身高范围
                            if (height < 100 || height > 999) {
                                alert('身高必须在100-999cm之间');
                                return;
                            }

                            // 验证体重范围
                            if (weight < 20 || weight > 999) {
                                alert('体重必须在20-999kg之间');
                                return;
                            }

                            // 验证小数位数
                            if (weight.toString().includes('.') && weight.toString().split('.')[1].length > 1) {
                                alert('体重最多保留一位小数');
                                return;
                            }

                            // 计算BMI
                            const heightInMeters = height / 100;
                            const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
                            
                            // 确定BMI范围和对应的类
                            let category, cssClass;
                            if (bmi < 18.5) {
                                category = '偏瘦';
                                cssClass = 'underweight';
                            } else if (bmi >= 18.5 && bmi < 24) {
                                category = '正常';
                                cssClass = 'normal';
                            } else if (bmi >= 24 && bmi < 28) {
                                category = '偏胖';
                                cssClass = 'overweight';
                            } else {
                                category = '肥胖';
                                cssClass = 'obese';
                            }

                            // 显示结果
                            result.style.display = 'block';
                            result.className = cssClass;
                            result.innerHTML = \`
                                您的BMI指数为: \${bmi}<br>
                                身体状态: \${category}
                            \`;
                        }

                        function resetForm() {
                            document.getElementById('height').value = '';
                            document.getElementById('weight').value = '';
                            document.getElementById('result').style.display = 'none';
                        }

                        // 限制输入
                        document.getElementById('height').addEventListener('input', function(e) {
                            if (this.value.includes('.')) {
                                let parts = this.value.split('.');
                                if (parts[0].length > 3) {
                                    parts[0] = parts[0].slice(0, 3);
                                }
                                if (parts[1] && parts[1].length > 1) {
                                    parts[1] = parts[1].slice(0, 1);
                                }
                                this.value = parts.join('.');
                            } else if (this.value.length > 3) {
                                this.value = this.value.slice(0, 3);
                            }
                        });

                        document.getElementById('weight').addEventListener('input', function(e) {
                            if (this.value.includes('.')) {
                                let parts = this.value.split('.');
                                if (parts[0].length > 3) {
                                    parts[0] = parts[0].slice(0, 3);
                                }
                                if (parts[1] && parts[1].length > 1) {
                                    parts[1] = parts[1].slice(0, 1);
                                }
                                this.value = parts.join('.');
                            } else if (this.value.length > 3) {
                                this.value = this.value.slice(0, 3);
                            }
                        });
                    </script>
                </body>
                </html>
            `), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });

        case '/tdee':
            return new Response(wrapResponseWithWatermark(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>TDEE计算器</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0; 
                            padding: 0; 
                            background-color: #f4f4f4; 
                        }
                        .container {
                            max-width: 760px;
                            margin: 20px auto;
                            padding: 30px;
                            background: white;
                            border-radius: 12px;
                            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                        }
                        h1 {
                            color: #333;
                            text-align: center;
                            margin-bottom: 30px;
                        }
                        .input-group {
                            margin: 15px 0;
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                        }
                        label {
                            display: block;
                            margin-bottom: 10px;
                            color: #555;
                            font-weight: bold;
                        }
                        input[type="number"], select {
                            width: 100%;
                            padding: 12px;
                            border: 1px solid #ddd;
                            border-radius: 6px;
                            font-size: 16px;
                            box-sizing: border-box;
                        }
                        .radio-group {
                            display: flex;
                            gap: 20px;
                            margin: 10px 0;
                        }
                        .radio-label {
                            display: flex;
                            align-items: center;
                            gap: 5px;
                            cursor: pointer;
                        }
                        .button-group {
                            display: flex;
                            justify-content: center;
                            gap: 15px;
                            margin-top: 20px;
                        }
                        button {
                            padding: 12px 30px;
                            border: none;
                            border-radius: 6px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: all 0.3s;
                            min-width: 120px;
                        }
                        button:first-child {
                            background: #007bff;
                            color: white;
                        }
                        button:last-child {
                            background: #6c757d;
                            color: white;
                        }
                        #result {
                            margin: 20px 0;
                            padding: 20px;
                            border-radius: 8px;
                            text-align: center;
                            font-size: 18px;
                            display: none;
                            background-color: #e8f5e9;
                            color: #2e7d32;
                        }
                        .back-link {
                            display: block;
                            text-align: center;
                            color: #007BFF;
                            text-decoration: none;
                            margin-top: 20px;
                            padding: 10px;
                        }
                        .info-text {
                            font-size: 14px;
                            color: #666;
                            margin-top: 5px;
                        }

                        @media screen and (max-width: 768px) {
                            .container {
                                margin: 10px;
                                padding: 15px;
                            }
                            h1 {
                                font-size: 20px;
                            }
                            .input-group {
                                padding: 15px;
                            }
                            .radio-group {
                                flex-direction: column;
                                gap: 10px;
                            }
                            button {
                                width: 100%;
                            }
                            .button-group {
                                flex-direction: column;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>TDEE计算器</h1>
                        <div class="input-group">
                            <label for="age">年龄</label>
                            <input type="number" id="age" min="1" max="120" placeholder="请输入年龄(1-120)">
                        </div>
                        <div class="input-group">
                            <label>性别</label>
                            <div class="radio-group">
                                <label class="radio-label">
                                    <input type="radio" name="gender" value="male" checked> 男性
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="gender" value="female"> 女性
                                </label>
                            </div>
                        </div>
                        <div class="input-group">
                            <label for="height">身高 (cm)</label>
                            <input type="number" id="height" step="0.1" placeholder="请输入身高(100-999)">
                        </div>
                        <div class="input-group">
                            <label for="weight">体重 (kg)</label>
                            <input type="number" id="weight" step="0.1" placeholder="请输入体重(20-999)">
                        </div>
                        <div class="input-group">
                            <label for="activity">活动水平</label>
                            <select id="activity">
                                <option value="1.2">久坐不动 (几乎不运动)</option>
                                <option value="1.375">轻度活动 (每周运动1-3次)</option>
                                <option value="1.55">中度活动 (每周运动3-5次)</option>
                                <option value="1.725">高度活动 (每周运动6-7次)</option>
                                <option value="1.9">专业运动 (每天训练2次以上)</option>
                            </select>
                            <div class="info-text">请根据您的日常活动水平选择合适的选项</div>
                        </div>
                        <div id="result"></div>
                        <div class="button-group">
                            <button onclick="calculateTDEE()">计算</button>
                            <button onclick="resetForm()">重置</button>
                        </div>
                        <a href="/" class="back-link">返回首页</a>
                    </div>
                    <script>
                        function calculateTDEE() {
                            const age = parseFloat(document.getElementById('age').value);
                            const gender = document.querySelector('input[name="gender"]:checked').value;
                            const height = parseFloat(document.getElementById('height').value);
                            const weight = parseFloat(document.getElementById('weight').value);
                            const activity = parseFloat(document.getElementById('activity').value);
                            const result = document.getElementById('result');

                            // 验证输入
                            if (!age || !height || !weight) {
                                alert('请填写所有必填项');
                                return;
                            }

                            // 验证年龄范围
                            if (age < 1 || age > 120) {
                                alert('年龄必须在1-120岁之间');
                                return;
                            }

                            // 验证身高范围和小数位数
                            if (height < 100 || height > 999) {
                                alert('身高必须在100-999cm之间');
                                return;
                            }
                            if (height.toString().includes('.') && height.toString().split('.')[1].length > 1) {
                                alert('身高最多保留一位小数');
                                return;
                            }

                            // 验证体重范围和小数位数
                            if (weight < 20 || weight > 999) {
                                alert('体重必须在20-999kg之间');
                                return;
                            }
                            if (weight.toString().includes('.') && weight.toString().split('.')[1].length > 1) {
                                alert('体重最多保留一位小数');
                                return;
                            }

                            // 计算基础代谢率(BMR)
                            let bmr;
                            if (gender === 'male') {
                                bmr = 10 * weight + 6.25 * height - 5 * age + 5;
                            } else {
                                bmr = 10 * weight + 6.25 * height - 5 * age - 161;
                            }

                            // 计算TDEE
                            const tdee = Math.round(bmr * activity);

                            // 显示结果
                            result.style.display = 'block';
                            result.innerHTML = \`
                                <div>您的基础代谢率(BMR)：\${Math.round(bmr)} 卡路里/天</div>
                                <div style="margin-top:10px">您的每日消耗热量(TDEE)：\${tdee} 卡路里/天</div>
                                <div style="margin-top:15px;font-size:14px;color:#666">
                                    * BMR是身体在完全静息状态下维持基本生命活动所需的能量<br>
                                    * TDEE是根据您的活动水平计算的每日总能量消耗
                                </div>
                            \`;
                        }

                        function resetForm() {
                            document.getElementById('age').value = '';
                            document.getElementById('height').value = '';
                            document.getElementById('weight').value = '';
                            document.getElementById('activity').value = '1.2';
                            document.querySelector('input[value="male"]').checked = true;
                            document.getElementById('result').style.display = 'none';
                        }

                        // 限制输入
                        document.getElementById('age').addEventListener('input', function(e) {
                            if (this.value.length > 3) {
                                this.value = this.value.slice(0, 3);
                            }
                        });

                        document.getElementById('height').addEventListener('input', function(e) {
                            if (this.value.includes('.')) {
                                let parts = this.value.split('.');
                                if (parts[0].length > 3) {
                                    parts[0] = parts[0].slice(0, 3);
                                }
                                if (parts[1] && parts[1].length > 1) {
                                    parts[1] = parts[1].slice(0, 1);
                                }
                                this.value = parts.join('.');
                            } else if (this.value.length > 3) {
                                this.value = this.value.slice(0, 3);
                            }
                        });

                        document.getElementById('weight').addEventListener('input', function(e) {
                            if (this.value.includes('.')) {
                                let parts = this.value.split('.');
                                if (parts[0].length > 3) {
                                    parts[0] = parts[0].slice(0, 3);
                                }
                                if (parts[1] && parts[1].length > 1) {
                                    parts[1] = parts[1].slice(0, 1);
                                }
                                this.value = parts.join('.');
                            } else if (this.value.length > 3) {
                                this.value = this.value.slice(0, 3);
                            }
                        });
                    </script>
                </body>
                </html>
            `), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });

        case '/douyin':
            return new Response(wrapResponseWithWatermark(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>抖音视频解析</title>
                    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
                    <style>
                        body { 
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            margin: 0; 
                            padding: 0; 
                            background-color: #f5f6fa;
                            color: #2d3436;
                        }
                        .container { 
                            max-width: 800px; 
                            margin: 30px auto;
                            padding: 25px;
                            background: white;
                            border-radius: 16px;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                        }
                        h1 {
                            text-align: center;
                            color: #2d3436;
                            font-size: 28px;
                            margin-bottom: 30px;
                            font-weight: 600;
                        }
                        .input-group {
                            margin: 25px 0;
                            display: flex;
                            gap: 12px;
                            position: relative;
                        }
                        input {
                            flex: 1;
                            padding: 14px 20px;
                            border: 2px solid #e1e1e1;
                            border-radius: 12px;
                            font-size: 16px;
                            transition: all 0.3s ease;
                            background: #f8f9fa;
                        }
                        input:focus {
                            outline: none;
                            border-color: #74b9ff;
                            box-shadow: 0 0 0 3px rgba(116, 185, 255, 0.2);
                        }
                        button {
                            padding: 14px 28px;
                            background: #74b9ff;
                            color: white;
                            border: none;
                            border-radius: 12px;
                            cursor: pointer;
                            font-size: 16px;
                            font-weight: 600;
                            transition: all 0.3s ease;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                        button:hover {
                            background: #0984e3;
                            transform: translateY(-2px);
                            box-shadow: 0 4px 12px rgba(9, 132, 227, 0.2);
                        }
                        button:active {
                            transform: translateY(0);
                        }
                        .loading {
                            text-align: center;
                            margin: 20px 0;
                        }
                        .spinner {
                            width: 40px;
                            height: 40px;
                            border: 4px solid #f3f3f3;
                            border-top: 4px solid #74b9ff;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                            margin: 0 auto;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                        .error-message {
                            background: #fff3f3;
                            color: #eb4d4b;
                            padding: 15px;
                            margin: 15px 0;
                            border-radius: 12px;
                            border-left: 4px solid #eb4d4b;
                            font-size: 15px;
                        }
                        .success-message {
                            background: #f0fff4;
                            color: #00b894;
                            padding: 15px;
                            margin: 15px 0;
                            border-radius: 12px;
                            border-left: 4px solid #00b894;
                            font-size: 15px;
                        }
                        #videoContainer {
                            margin: 25px 0;
                            border-radius: 16px;
                            overflow: hidden;
                            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                        }
                        #videoContainer video {
                            width: 100%;
                            display: block;
                            background: #000;
                        }
                        #downloadBtn {
                            width: 100%;
                            margin-top: 20px;
                            background: #00b894;
                        }
                        #downloadBtn:hover {
                            background: #00a884;
                        }
                        .back-link {
                            display: block;
                            text-align: center;
                            color: #74b9ff;
                            text-decoration: none;
                            margin-top: 25px;
                            font-weight: 500;
                            transition: all 0.3s ease;
                        }
                        .back-link:hover {
                            color: #0984e3;
                        }
                        .instruction {
                            background: #f8f9fa;
                            padding: 20px;
                            border-radius: 12px;
                            margin: 20px 0;
                            font-size: 15px;
                            line-height: 1.6;
                        }
                        .instruction h3 {
                            margin-top: 0;
                            color: #2d3436;
                        }
                        .instruction ol {
                            margin: 0;
                            padding-left: 20px;
                        }
                        
                        @media screen and (max-width: 768px) {
                            .container {
                                margin: 15px;
                                padding: 20px;
                            }
                            h1 {
                                font-size: 24px;
                            }
                            .input-group {
                                flex-direction: column;
                            }
                            button {
                                width: 100%;
                                justify-content: center;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>抖音视频解析</h1>
                        
                        <div class="instruction">
                            <h3>使用说明</h3>
                            <ol>
                                <li>打开抖音APP，点击要下载的视频右下角的"分享"按钮</li>
                                <li>点击"复制链接"</li>
                                <li>将复制的链接粘贴到上方输入框</li>
                                <li>点击"解析"按钮即可</li>
                            </ol>
                        </div>
        
                        <div class="input-group">
                            <input type="text" id="videoUrl" placeholder="请粘贴抖音视频链接">
                            <button id="parseBtn">
                                <i class="fas fa-search"></i>
                                解析
                            </button>
                        </div>
        
                        <div id="loading" class="loading" style="display: none;">
                            <div class="spinner"></div>
                        </div>
        
                        <div id="resultContainer"></div>
                        <div id="videoContainer"></div>
                        
                        <button id="downloadBtn" style="display: none;">
                            <i class="fas fa-download"></i>
                            下载视频
                        </button>
        
                        <a href="/" class="back-link">
                            <i class="fas fa-arrow-left"></i>
                            返回首页
                        </a>
                    </div>

                    <script>
                        let currentVideoUrl = '';
                        
                        // 添加事件监听，而不是使用 onclick
                        document.getElementById('parseBtn').addEventListener('click', async function() {
                            const input = document.getElementById('videoUrl').value;
                            const resultContainer = document.getElementById('resultContainer');
                            const match = input.match(/https:\\/\\/[^\\s]+/);
                            
                            if (!match) {
                                resultContainer.innerHTML = '<div class="error-message">请输入正确的抖音视频链接</div>';
                                return;
                            }
                            
                            const loading = document.getElementById('loading');
                            loading.style.display = 'block';
                            resultContainer.innerHTML = '';
                            const videoContainer = document.getElementById('videoContainer');
                            videoContainer.innerHTML = '';
                            document.getElementById('downloadBtn').style.display = 'none';

                            const url = match[0];
                            const apiUrl = 'https://api.1sy.us.kg/dy?url=' + encodeURIComponent(url);
                            const proxyUrl = \`/proxy?url=\${encodeURIComponent(apiUrl)}\`;

                            try {
                                const response = await fetch(apiUrl);
                                const data = await response.json();
                                
                                if (data.data && data.data.dyurl) {
                                    try {
                                        const realVideoUrl = data.data.dyurl;
                                        const proxyVideoUrl = \`/proxy?url=\${encodeURIComponent(realVideoUrl)}\`;
                                        currentVideoUrl = proxyVideoUrl;

                                        videoContainer.innerHTML = \`
                                            <video controls style="max-width: 100%; height: auto; display: none;" onloadeddata="this.style.display='block'">
                                                <source src="\${proxyVideoUrl}" type="video/mp4">
                                                您的浏览器不支持视频标签
                                            </video>
                                            <div class="video-loading" style="text-align: center; padding: 20px;">
                                                <div class="spinner"></div>
                                                <p style="color: #666;">视频加载中...</p>
                                            </div>\`;

                                        // 添加视频加载事件监听
                                        const video = videoContainer.querySelector('video');
                                        const loadingDiv = videoContainer.querySelector('.video-loading');
                                        
                                        video.addEventListener('loadeddata', function() {
                                            loadingDiv.style.display = 'none';
                                            video.style.display = 'block';
                                        });

                                        video.addEventListener('error', function() {
                                            loadingDiv.innerHTML = '<p style="color: #dc3545;">视频加载失败，请重试</p>';
                                        });

                                        document.getElementById('downloadBtn').style.display = 'block';
                                        resultContainer.innerHTML = '<div class="success-message">解析成功！</div>';
                                        document.querySelector('.instruction').style.display = 'none';
                                    } catch (redirectError) {
                                        console.error('Redirect Error:', redirectError);
                                        resultContainer.innerHTML = '<div class="error-message">获取视频链接失败，请稍后重试</div>';
                                        document.querySelector('.instruction').style.display = 'block';
                                    }
                                } else {
                                    resultContainer.innerHTML = '<div class="error-message">解析失败，请检查链接是否正确</div>';
                                    document.querySelector('.instruction').style.display = 'block';
                                }
                            } catch (error) {
                                console.error('Error:', error);
                                resultContainer.innerHTML = '<div class="error-message">解析服务暂时不可用，请稍后重试</div>';
                            } finally {
                                loading.style.display = 'none';
                            }
                        });

 
// 下载视频事件
document.getElementById('downloadBtn').addEventListener('click', async function() {
    const resultContainer = document.getElementById('resultContainer');
    const loading = document.getElementById('loading');
    
    if (!currentVideoUrl) {
        resultContainer.innerHTML = '<div class="error-message">没有可下载的视频</div>';
        return;
    }
    
    try {
        loading.style.display = 'block';
        resultContainer.innerHTML = '<div class="success-message">正在获取下载地址...</div>';

        // 先获取重定向后的真实URL
        const response = await fetch(currentVideoUrl, {
            method: 'HEAD',
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error('获取视频地址失败');
        }

        const finalUrl = response.url;
        
        // 创建一个新的 a 标签用于下载
        const a = document.createElement('a');
        a.href = finalUrl;
        a.download = '抖音视频.mp4';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        resultContainer.innerHTML = \`
            <div class="success-message">
                下载已开始，如果没有自动下载，请点击<a href="\${finalUrl}" target="_blank">这里</a>直接下载
            </div>\`;
    } catch (error) {
        console.error('Download error:', error);
        resultContainer.innerHTML = '<div class="error-message">下载失败，请稍后重试</div>';
    } finally {
        loading.style.display = 'none';
    }
});

                    </script>
                </body>
                </html>
            `), {
                headers: { 'Content-Type': 'text/html; charset=utf-8','Access-Control-Allow-Origin':'*' },
            });
            

        default:
            return new Response(wrapResponseWithWatermark(`
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>TOOLS</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 0; 
                            padding: 0; 
                            background-color: #f4f4f4; 
                        }
                        .container { 
                            max-width: 760px; 
                            margin: 20px auto; 
                            padding: 20px;
                            overflow: hidden;
                        }
                        h1 {
                            text-align: center;
                            color: #333;
                            margin-bottom: 30px;
                        }
                        .module {
                            float: left;
                            width: calc(31% - 4px);
                            margin: 5px;
                            padding: 15px 0;
                            background: white;
                            border-radius: 8px;
                            text-decoration: none;
                            color: #333;
                            text-align: center;
                            transition: all 0.3s ease;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                            position: relative;
                            overflow: hidden;
                        }
                        .module:hover {
                            transform: translateY(-2px);
                            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                            background: #007bff;
                            color: white;
                        }
                        .module::after {
                            content: '';
                            position: absolute;
                            bottom: 0;
                            left: 0;
                            width: 100%;
                            height: 3px;
                            background: #007bff;
                            transform: scaleX(0);
                            transition: transform 0.3s ease;
                        }
                        .module:hover::after {
                            transform: scaleX(1);
                        }
                        .clearfix::after {
                            content: "";
                            clear: both;
                            display: table;
                        }

                        /* 移动端适配 */
                        @media screen and (max-width: 480px) {
                            .container {
                                margin: 10px;
                                padding: 10px;
                            }
                            h1 {
                                font-size: 20px;
                                margin-bottom: 20px;
                            }
                            .module {
                                float: none;
                                width: calc(100% - 4px);
                                display: block;
                                margin: 8px 2px;
                                box-sizing: border-box;
                            }
                            .clearfix {
                                display: flex;
                                flex-direction: column;
                                gap: 8px;
                            }
                        }

                        /* 触摸设备优化 */
                        @media (hover: none) {
                            .module:active {
                                background: #007bff;
                                color: white;
                                transform: scale(0.98);
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>简易 TOOLS</h1>
                        <div class="clearfix">
                            <a href="/encode" class="module">URL转码</a>
                            <a href="/hotspot" class="module">今日热点</a>
                            <a href="/history" class="module">那年今日</a>
                            <a href="#" onclick="goToRealtime(event)" class="module">实时线报</a>
                            <a href="/bzq" class="module">保质期</a>
                            <a href="/bmi" class="module">BMI计算</a>
                            <a href="/tdee" class="module">TDEE计算</a>
                            <a href="/douyin" class="module">抖音解析</a>
                        </div>
                    </div>
                    <script>
                        function goToRealtime(event) {
                            event.preventDefault();
                            const currentUrl = window.location.href;
                            const httpUrl = currentUrl.replace('https://', 'http://') + 'realtime';
                            window.location.href = httpUrl;
                        }
                    </script>
                </body>
                </html>
            `),{
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
    }
}
