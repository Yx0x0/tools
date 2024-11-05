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

                        // 默认赚客数据
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
                                <input type="number" id="expiryValue" min="1" value="12">
                                <select id="expiryUnit">
                                    <option value="months">月</option>
                                    <option value="days">天</option>
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
                                today.setHours(0, 0, 0, 0); // 设置时间为当天开始

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

                            // 计算天数差异
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
                            initDate(); // 重置为今天的日期
                            document.getElementById('expiryValue').value = '12';
                            document.getElementById('expiryUnit').value = 'months';
                            document.getElementById('result').innerHTML = '';
                        }

                        // 阻止按钮点击事件冒泡
                        document.querySelectorAll('button').forEach(button => {
                            button.addEventListener('click', (e) => {
                                e.stopPropagation();
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
