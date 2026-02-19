// 字符集定义
const charsets = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// DOM 元素
const lengthInput = document.getElementById('length');
const lengthDisplay = document.getElementById('lengthDisplay');
const uppercaseInput = document.getElementById('uppercase');
const lowercaseInput = document.getElementById('lowercase');
const numbersInput = document.getElementById('numbers');
const symbolsInput = document.getElementById('symbols');
const passwordDisplay = document.getElementById('password');
const generateBtn = document.getElementById('generate');
const copyBtn = document.getElementById('copy');
const message = document.getElementById('message');

// 更新长度显示
lengthInput.addEventListener('input', (e) => {
    lengthDisplay.textContent = e.target.value;
});

// 生成密码函数
function generatePassword() {
    // 检查至少选择一个字符集
    if (!uppercaseInput.checked && !lowercaseInput.checked && 
        !numbersInput.checked && !symbolsInput.checked) {
        showMessage('请至少选择一个字符类型！', 'error');
        return;
    }

    const length = parseInt(lengthInput.value);
    let availableChars = '';

    // 构建可用字符集
    if (uppercaseInput.checked) availableChars += charsets.uppercase;
    if (lowercaseInput.checked) availableChars += charsets.lowercase;
    if (numbersInput.checked) availableChars += charsets.numbers;
    if (symbolsInput.checked) availableChars += charsets.symbols;

    // 生成密码
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * availableChars.length);
        password += availableChars[randomIndex];
    }

    passwordDisplay.value = password;
    showMessage('密码已生成！', 'success');
}

// 复制到剪贴板
function copyPassword() {
    if (!passwordDisplay.value) {
        showMessage('请先生成密码！', 'error');
        return;
    }

    navigator.clipboard.writeText(passwordDisplay.value).then(() => {
        showMessage('密码已复制到剪贴板！', 'success');
    }).catch(() => {
        showMessage('复制失败，请重试！', 'error');
    });
}

// 显示消息
function showMessage(text, type = 'success') {
    message.textContent = text;
    message.className = type === 'error' ? 'message error' : 'message';
    
    // 3秒后消息消失
    setTimeout(() => {
        message.textContent = '';
    }, 3000);
}

// 事件监听
generateBtn.addEventListener('click', generatePassword);
copyBtn.addEventListener('click', copyPassword);

// 页面加载时生成初始密码
generatePassword();