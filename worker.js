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
                            .container { max-width: 600px; margin: 20px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
                            h1 { color: #333; text-align: center; }
                            p { font-size: 18px; }
                            a { text-decoration: none; color: #007BFF; }
                            a:hover { text-decoration: underline; margin-top: 10px; }
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
                    .container { max-width: 600px; margin: 20px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); }
                    h1 { color: #333; text-align: center; }
                    form { margin-top: 20px; }
                    input[type="text"] { width: 96%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; }
                    button { padding: 10px 15px; background-color: #007BFF; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%; }
                    button:hover { background-color: #0056b3; }
                    a { display: block; text-align: center; margin-top: 10px; }
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
                    max-width: 600px; 
                    padding: 10px; 
                    background: white; 
                    border: 1px dashed #007BFF; /* 虚线边框 */
                    float: left; /* 左浮动 */
                    text-align: center; /* 文字居中 */
                }
                h1 { color: #333; text-align: center; }
                a { display: block; text-decoration: none; color: #007BFF; }
                a:hover { text-decoration: underline; }
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
            </style>
            <script>
                let isFetching = false; // 请求标志

                async function fetchTodayData() {
                    if (isFetching) return; // 如果正在请求，直接返回
                    isFetching = true; // 设置请求标志

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
                        data.data.forEach(item => {
                            ul.innerHTML += \`<li>\${item.title}</li>\`; // 使用反引号
                        });
                        
                        // 将结果容器添加到页面
                        document.body.appendChild(resultContainer);
                    } catch (error) {
                        console.error('获取数据时出错:', error);
                    } finally {
                        // 10秒后重置请求标志
                        setTimeout(() => {
                            isFetching = false;
                        }, 10000);
                    }
                }
            </script>
        </head>
        <body>
            <div class="home">
                <h1>简易 TOOLS</h1>
                <div class="url-container"><a href="/encode">URL转码</a></div>
                <div class="hotspot" onclick="alert('功能开发中');">今日热点</div>
                <div class="hotspot" onclick="fetchTodayData();">那年今日</div>
            </div>
        </body>
        </html>
    `, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
}
