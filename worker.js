// Cloudflare Workers 的入口
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

// 处理请求的函数
async function handleRequest(request) {
    const url = new URL(request.url);

    // 路由处理
    switch (url.pathname) {
        case '/encode':
            if (request.method === 'POST') {
                const formData = await request.formData();
                const originalUrl = formData.get('url');
                
                if (originalUrl) {
                    const encodedUrl = encodeURIComponent(originalUrl);
                    return new Response(`
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
                    `, {
                        headers: { 'Content-Type': 'text/html; charset=utf-8' },
                    });
                }
            }

            // GET 请求返回表单页面
            return new Response(`
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
            `, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });

        case '/realtime':
            return new Response(`
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

                        /* 移动端适配 */
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

                        // 默认加载赚客吧数据
                        fetchData('http://new.ixbk.net/plus/json/push_16.json', '赚客吧');
                    </script>
                </body>
                </html>
            `, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
            
        case '/bzq':
            return new Response(`
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
                            margin: 25px 0;
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
                            width: 100%;
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
                            margin: 30px 0;
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
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>保质期计算器</h1>
                        <div class="input-group">
                            <label for="productDate">生产日期</label>
                            <input type="date" id="productDate">
                        </div>
                        <div class="input-group">
                            <label>保质期</label>
                            <div style="display: flex; gap: 10px;">
                                <input type="number" id="expiryValue" min="1" value="12" style="flex: 2;">
                                <select id="expiryUnit" style="flex: 1;">
                                    <option value="months">月</option>
                                    <option value="days">天</option>
                                </select>
                            </div>
                        </div>
                        <div id="result"></div>
                        <div class="button-group">
                            <button onclick="calculateExpiry()">计算</button>
                            <button onclick="resetForm()">重置</button>
                        </div>
                        <a href="/" class="back-link">返回首页</a>
                    </div>
                    <script>
                        // 计算函数
                        function calculateExpiry() {
                                const productDate = new Date(document.getElementById('productDate').value);
                                const value = parseInt(document.getElementById('expiryValue').value);
                                const unit = document.getElementById('expiryUnit').value;
                                
                                if(isNaN(productDate.getTime())) {
                                    alert('请选择生产日期');
                                    return;
                                }
                                
                                const expiryDate = new Date(productDate);
                                if(unit === 'months') {
                                    expiryDate.setMonth(expiryDate.getMonth() + value);
                                } else {
                                    expiryDate.setDate(expiryDate.getDate() + value);
                                }
                                
                                const result = document.getElementById('result');
                                result.innerHTML = '<div style="background: #e8f5e9; padding: 15px; border-radius: 6px; color: #2e7d32;">' +
                                    '到期日期: ' + expiryDate.toLocaleDateString() +
                                '</div>';
                        }

                        // 重置函数
                        function resetForm() {
                            document.getElementById('productDate').value = '';
                            document.getElementById('expiryValue').value = '12';
                            document.getElementById('expiryUnit').value = 'months';
                            document.getElementById('result').innerHTML = '';
                        }
                            
                            // 添加按钮悬停效果
                                const buttons = document.querySelectorAll('button');
                                buttons.forEach(button => {
                                    button.addEventListener('mouseover', () => {
                                        button.style.opacity = '0.9';
                                        button.style.transform = 'translateY(-1px)';
                                    });
                                    button.addEventListener('mouseout', () => {
                                        button.style.opacity = '1';
                                        button.style.transform = 'translateY(0)';
                                    });
                                });
                    </script>
                </body>
                </html>
            `, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });

        case '/hotspot':
            return new Response(`
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
                            background: white;
                            border-radius: 12px;
                            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
                        }
                        h1, h2 {
                            color: #333;
                            text-align: center;
                        }
                        .hotspot-container {
                            display: flex;
                            gap: 20px;
                            margin: 20px 0;
                        }
                        .hotspot-section {
                            flex: 1;
                            background: #f8f9fa;
                            padding: 15px;
                            border-radius: 8px;
                        }
                        ul {
                            list-style: none;
                            padding: 0;
                            margin: 0;
                        }
                        li {
                            padding: 10px;
                            border-bottom: 1px solid #eee;
                            font-size: 14px;
                            line-height: 1.4;
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
                            margin: 0 auto;
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
                            }
                            .hotspot-container {
                                flex-direction: column;
                                gap: 15px;
                            }
                            h1 {
                                font-size: 20px;
                            }
                            h2 {
                                font-size: 18px;
                            }
                            li {
                                padding: 12px 10px;
                                font-size: 15px;
                            }
                            .hotspot-section {
                                padding: 10px;
                            }
                        }

                        /* 触摸设备优化 */
                        @media (hover: none) {
                            li:active {
                                background: #f0f0f0;
                            }
                            .back-link:active {
                                background: #f0f0f0;
                            }
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
                                content.innerHTML = \`
                                    <div class="hotspot-container">
                                        <div class="hotspot-section">
                                            <h2>哔哩哔哩热搜</h2>
                                            <ul>
                                                \${bilibiliData.data.slice(0, 20).map(item => \`
                                                    <li>\${item.title}</li>
                                                \`).join('')}
                                            </ul>
                                        </div>
                                        <div class="hotspot-section">
                                            <h2>知乎热搜</h2>
                                            <ul>
                                                \${zhihuData.data.slice(0, 20).map(item => \`
                                                    <li>\${item.title}</li>
                                                \`).join('')}
                                            </ul>
                                        </div>
                                        <div class="hotspot-section">
                                            <h2>抖音热搜</h2>
                                            <ul>
                                                \${douyinData.data.slice(0, 20).map(item => \`
                                                    <li>\${item.title}</li>
                                                \`).join('')}
                                            </ul>
                                        </div>
                                    </div>
                                \`;
                            } catch (error) {
                                console.error('获取数据失败:', error);
                                document.getElementById('content').innerHTML = '<p style="text-align: center; color: #dc3545;">加载失败，请稍后重试</p>';
                            }
                        }

                        fetchHotspotData();
                    </script>
                </body>
                </html>
            `, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });

        case '/history':
            return new Response(`
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
            `, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });

        default:
            return new Response(`
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
                            font-size: 24px;
                        }
                        .module {
                            float: left;
                            width: calc(32% - 4px);
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

                        /* 移动端响应式样式 */
                        @media screen and (max-width: 768px) {
                            .container {
                                margin: 10px;
                                padding: 10px;
                            }
                            h1 {
                                font-size: 20px;
                                margin-bottom: 20px;
                            }
                            .module {
                                width: calc(50% - 4px); /* 两列布局 */
                                padding: 12px 0;
                                font-size: 14px;
                                margin-bottom: 4px;
                            }
                        }

                        @media screen and (max-width: 480px) {
                            .container {
                                margin: 5px;
                                padding: 5px;
                            }
                            h1 {
                                font-size: 18px;
                                margin-bottom: 15px;
                            }
                            .module {
                                width: calc(100% - 4px); /* 单列布局 */
                                padding: 15px 0;
                                margin-bottom: 6px;
                                font-size: 16px;
                            }
                            /* 移动端触摸反馈 */
                            .module:active {
                                background: #007bff;
                                color: white;
                                transform: scale(0.98);
                            }
                        }

                        /* 优化触摸体验 */
                        @media (hover: none) {
                            .module:hover {
                                transform: none;
                            }
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
            `, {
                headers: { 'Content-Type': 'text/html; charset=utf-8' },
            });
    }
}
