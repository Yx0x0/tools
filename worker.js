// Cloudflare Workers 的入口
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

// 处理请求的函数
async function handleRequest(request) {
    const url = new URL(request.url);

    if (url.pathname === '/encode') {
        if (request.method === 'POST') {
            const formData = await request.formData();
            const originalUrl = formData.get('url'); // 从表单数据获取 URL

            if (originalUrl) {
                const encodedUrl = encodeURIComponent(originalUrl);
                return new Response(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>URL 转码结果</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                            .container { max-width: 760px; margin: 20px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
                            h1 { color: #333; text-align: center; }
                            p { font-size: 18px; }
                            a { text-decoration: none; color: #007BFF; padding: 10px; border-radius: 4px; transition: background-color 0.3s; }
                            a:hover { background-color: #0056b3; color: white; } /* 鼠标悬停时的样式 */
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>转码结果</h1>
                            <p>原始 URL: <strong>${originalUrl}</strong></p>
                            <p>转码后的 URL: <strong>${encodedUrl}</strong></p>
                            <a href="/">返回首页</a>
                        </div>
                    </body>
                    </html>
                `, {
                    headers: { 'Content-Type': 'text/html; charset=utf-8' },
                });
            }
        }

        // 返回包含输入表单的 HTML
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>URL 转码</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                    .container { max-width: 760px; margin: 20px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
                    h1 { color: #333; text-align: center; }
                    form { margin-top: 20px; }
                    input[type="text"] { width: 96%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; }
                    button { padding: 10px 15px; background-color: #007BFF; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
                    button:hover { background-color: #0056b3; }
                    a { display: block; text-align: center; margin-top: 10px; text-decoration: none; color: #007BFF; padding: 10px; border-radius: 4px; transition: background-color 0.3s; }
                    a:hover { background-color: #0056b3; color: white; } /* 鼠标悬停时的样式 */
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>URL 转码</h1>
                    <form method="POST">
                        <label for="url">请输入 URL:</label>
                        <input type="text" id="url" name="url" required>
                        <button type="submit">转码</button>
                    </form>
                    <a href="/">返回首页</a>
                </div>
            </body>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
        });
    }

    // 首页显示 URL 转码入口
    return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>TOOLS</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
                .container { max-width: 600px; margin: 20px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
                .url-container { 
                    max-width: 760px; 
                    background: white; 
                    border: 1px dashed #007BFF; /* 虚线边框 */
                    float: left; /* 左浮动 */
                    text-align: center; /* 文字居中 */
                }
                h1 { color: #333; text-align: center; }
                a { display: block; text-decoration: none; color: #007BFF; padding: 10px; border-radius: 4px; transition: background-color 0.3s; }
                a:hover { background-color: #0056b3; color: white; } /* 鼠标悬停时的样式 */
                .home { width: 960px; margin: 0 auto; }
                .hotspot { 
                    padding: 10px; 
                    background: white; 
                    border: 1px dashed #ccc; 
                    text-align: center; 
                    cursor: pointer; 
                    margin: 0 8px;
                    float:left;
                }
                ul li{line-height: 25px;}
                .loading {
                    display: none;
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(255, 255, 255, 0.8);
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    text-align: center;
                }
                .loading .spinner {
                    border: 8px solid #f3f3f3; /* Light grey */
                    border-top: 8px solid #3498db; /* Blue */
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    animation: spin 1s linear infinite; /* 旋转动画 */
                    margin: 0 auto 10px; /* 居中 */
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .tabs {
                    display: flex;
                    justify-content: center; /* 居中对齐 */
                    margin: 20px;
                }
                .tabs button {
                    padding: 10px 15px;
                    margin: 0 5px; /* 添加按钮间距 */
                    background-color: #007BFF;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }
                .tabs button:hover {
                    background-color: #0056b3; /* 鼠标悬停时的样式 */
                }
                ul {
                    list-style-type: decimal; /* 使用数字显示列表 */
                    padding-left: 20px; /* 添加左侧内边距 */
                }
                .container,#resultContainer {
                    max-width: 760px; /* 页面最大宽度 */
                    margin: 0 auto; /* 内容居中 */
                }
            </style>
            <script>
                let isFetching = false; // 请求标志

                async function fetchTodayData() {
                    if (isFetching) return; // 如果正在请求，直接返回
                    isFetching = true; // 设置请求标志

                    // 显示加载提示
                    const loading = document.createElement('div');
                    loading.className = 'loading';
                    loading.innerHTML = '<div class="spinner"></div>加载中，请稍候...';
                    document.body.appendChild(loading);
                    loading.style.display = 'block';

                    try {
                        const response = await fetch('https://uapis.cn/api/hotlist?type=history');
                        const data = await response.json();
                        
                        // 隐藏首页内容
                        document.querySelector('.home').style.display = 'none';
                        
                        // 创建一个与 URL 转码相似的容器
                        const resultContainer = document.createElement('div');
                        resultContainer.className = 'container';
                        resultContainer.innerHTML = '<h1>历史上的今天</h1><ul></ul><a href="/" style="display: block; text-align: center; margin-top: 20px; text-decoration: none; color: #007BFF;">返回首页</a>';
                        
                        // 处理并展示数据
                        const ul = resultContainer.querySelector('ul');
                        data.data.slice(0, 20).forEach(item => { // 只显示前 20 条
                            ul.innerHTML += \`<li>\${item.title}</li>\`; // 使用反引号
                        });
                        
                        // 将结果容器添加到页面
                        document.body.appendChild(resultContainer);
                    } catch (error) {
                        console.error('获取数据时出错:', error);
                    } finally {
                        // 隐藏加载提示
                        loading.style.display = 'none';
                        // 10秒后重置请求标志
                        setTimeout(() => {
                            isFetching = false;
                        }, 10000);
                    }
                }

                async function fetchHotspotData() {
                    if (isFetching) return; // 如果正在请求，直接返回
                    isFetching = true; // 设置请求标志

                    // 显示加载提示
                    const loading = document.createElement('div');
                    loading.className = 'loading';
                    loading.innerHTML = '<div class="spinner"></div>加载中，请稍候...';
                    document.body.appendChild(loading);
                    loading.style.display = 'block';

                    try {
                        // 分别请求不同的热搜榜
                        const bilibiliResponse = await fetch('https://uapis.cn/api/hotlist?type=bilibili');
                        const zhihuResponse = await fetch('https://uapis.cn/api/hotlist?type=zhihu');
                        const douyinResponse = await fetch('https://uapis.cn/api/hotlist?type=douyin');

                        const bilibiliData = await bilibiliResponse.json();
                        const zhihuData = await zhihuResponse.json();
                        const douyinData = await douyinResponse.json();
                        
                        // 隐藏首页内容
                        document.querySelector('.home').style.display = 'none';
                        
                        // 创建一个与 URL 转码相似的容器
                        const resultContainer = document.createElement('div');
                        resultContainer.className = 'container';
                        resultContainer.innerHTML = \`
                            <h1>今日热点</h1>
                            <div style="display: flex; justify-content: space-between;">
                                <div class="hotspot" style="flex: 1; margin-right: 10px;">
                                    <h2>哔哩哔哩热搜榜</h2>
                                    <ul></ul>
                                </div>
                                <div class="hotspot" style="flex: 1; margin-right: 10px;">
                                    <h2>知乎热搜榜</h2>
                                    <ul></ul>
                                </div>
                                <div class="hotspot" style="flex: 1;">
                                    <h2>抖音热搜榜</h2>
                                    <ul></ul>
                                </div>
                            </div>
                            <a href="/" style="display: block; text-align: center; margin-top: 20px; text-decoration: none; color: #007BFF;">返回首页</a>
                        \`;
                        
                        // 处理并展示数据
                        const bilibiliUl = resultContainer.querySelectorAll('div.hotspot')[0].querySelector('ul');
                        const zhihuUl = resultContainer.querySelectorAll('div.hotspot')[1].querySelector('ul');
                        const douyinUl = resultContainer.querySelectorAll('div.hotspot')[2].querySelector('ul');

                        bilibiliData.data.slice(0, 20).forEach(item => { // 只显示前 20 条
                            bilibiliUl.innerHTML += \`<li>\${item.title}</li>\`;
                        });
                        zhihuData.data.slice(0, 20).forEach(item => { // 只显示前 20 条
                            zhihuUl.innerHTML += \`<li>\${item.title}</li>\`;
                        });
                        douyinData.data.slice(0, 20).forEach(item => { // 只显示前 20 条
                            douyinUl.innerHTML += \`<li>\${item.title}</li>\`;
                        });
                        
                        // 将结果容器添加到页面
                        document.body.appendChild(resultContainer);
                    } catch (error) {
                        console.error('获取今日热点时出错:', error);
                    } finally {
                        // 隐藏加载提示
                        loading.style.display = 'none';
                        // 10秒后重置请求标志
                        setTimeout(() => {
                            isFetching = false;
                        }, 10000);
                    }
                }

                async function fetchRealTimeData() {
                    // 清除原有内容
                    const resultContainer = document.getElementById('resultContainer');
                    if (resultContainer) {
                        resultContainer.innerHTML = ''; // 清空结果容器
                    }

                    // 隐藏首页内容
                    document.querySelector('.home').style.display = 'none';

                    // 清除已有的 tabs
                    const existingTabs = document.querySelector('.tabs');
                    if (existingTabs) {
                        existingTabs.remove(); // 移除已有的 tabs
                    }

                    // 创建新的标签页
                    const tabs = \`
                        <div class="tabs">
                            <button onclick="fetchData('http://new.ixbk.net/plus/json/push_16.json', '赚客吧')">赚客吧</button>
                            <button onclick="fetchData('http://new.ixbk.net/plus/json/push_17.json', '酷安')">酷安</button>
                            <button onclick="fetchData('http://new.ixbk.net/plus/json/push_19.json', '值得买')">值得买</button>
                        </div>
                        <div id="resultContainer"></div>
                    \`;
                    document.body.insertAdjacentHTML('beforeend', tabs);

                    // 默认加载第一个TAB的内容
                    fetchData('http://new.ixbk.net/plus/json/push_16.json', '赚客吧');

                    // 滚动到页面顶部
                    window.scrollTo(0, 0);
                }

                async function fetchData(apiUrl, tabName) {
                    try {
                        const response = await fetch(apiUrl);
                        const data = await response.json();
                        const resultContainer = document.getElementById('resultContainer');
                        resultContainer.innerHTML = \`<h2>\${tabName}</h2><ol></ol>\`; // 使用有序列表
                        const ol = resultContainer.querySelector('ol'); // 获取 OL 元素
                        data.forEach(item => {
                            const fullUrl = \`http://new.ixbk.net\${item.url}\`;
                            ol.innerHTML += \`<li><a href="\${fullUrl}" target="_blank">\${item.title}</a></li>\`; // 以 OL 展示数据
                        });

                        // 添加返回首页链接
                        const backLink = document.createElement('a');
                        backLink.textContent = '返回首页';
                        backLink.href = '#'; // 设置为 #，以防止页面跳转
                        backLink.onclick = () => {
                            // 隐藏首页内容
                            document.querySelector('.home').style.display = 'block'; 
                            resultContainer.innerHTML = ''; // 清空结果容器
                            // 清除已有的 tabs
                            const existingTabs = document.querySelector('.tabs');
                            if (existingTabs) {
                                existingTabs.remove(); // 移除已有的 tabs
                            }
                        };
                        backLink.style.display = 'block';
                        backLink.style.margin = '20px auto';
                        backLink.style.textAlign = 'center';
                        backLink.style.color = '#007BFF';
                        backLink.style.textDecoration = 'underline';
                        resultContainer.appendChild(backLink); // 将链接添加到结果容器
                    } catch (error) {
                        console.error('获取数据时出错:', error);
                    }
                }

                // 默认加载第一个TAB的内容
                fetchRealTimeData(); // 触发实时线报的加载
            </script>
        </head>
        <body>
            <div class="home">
                <h1>简易 TOOLS</h1>
                <div class="url-container"><a href="/encode">URL转码</a></div>
                <a href="#" class="hotspot" onclick="fetchHotspotData();">今日热点</a>
                <a href="#" class="hotspot" onclick="fetchTodayData();">那年今日</a>
                <a href="#" class="hotspot" onclick="fetchRealTimeData();">实时线报</a>
            </div>
        </body>
        </html>
    `, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}
