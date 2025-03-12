class OTPEncryptor {
    constructor() {
        // Властивості для зберігання результатів шифрування тексту
        this.encryptedTextResult = null;
        this.textEncryptionKey = null;
    }
    
    // Метод XOR шифрування
    xorEncryptDecrypt(text, key) {
        let result = new Uint8Array(text.length);
        for (let i = 0; i < text.length; i++) {
            result[i] = text[i] ^ key[i];
        }
        return result;
    }

    // Метод для шифрування введеного тексту
    encryptText() {
        const textInput = document.getElementById('inputText').value;
        if (!textInput) {
            return alert('Введіть текст для шифрування!');
        }
        
        // Перетворення тексту в масив байтів
        const textEncoder = new TextEncoder();
        const textArray = textEncoder.encode(textInput);
        
        // Генерація випадкового ключа
        let key = new Uint8Array(textArray.length);
        window.crypto.getRandomValues(key);
        
        // Шифрування тексту
        let encryptedData = this.xorEncryptDecrypt(textArray, key);
        
        // Збереження результатів у двійковому форматі
        this.encryptedTextResult = encryptedData;
        this.textEncryptionKey = key;
        
        // Показати блок результатів
        document.getElementById('encryptionResults').style.display = 'block';
    }
    
    // Завантаження зашифрованого тексту і ключа у двійковому форматі
    downloadEncryptedText() {
        if (!this.encryptedTextResult || !this.textEncryptionKey) {
            return alert('Спочатку зашифруйте текст!');
        }
        
        this.downloadFile(this.encryptedTextResult, 'ciphertext.txt');
        this.downloadFile(this.textEncryptionKey, 'key.txt');
    }
    
    // Додамо методи для декодування Base64 під час дешифрування
    base64ToUint8Array(base64) {
        const binary = atob(base64);
        const array = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i);
        }
        return array;
    }
    
    // Копіювання зашифрованого тексту у форматі Base64
    copyEncryptedText() {
        if (!this.encryptedTextResult) {
            return alert('Спочатку зашифруйте текст!');
        }
        
        // Конвертація байтів у Base64 для зручного копіювання
        const base64Encoded = btoa(String.fromCharCode.apply(null, this.encryptedTextResult));
        this.copyToClipboard(base64Encoded);
        alert('Зашифрований текст скопійовано у форматі Base64!');
    }
    
    // Копіювання ключа у форматі Base64
    copyEncryptionKey() {
        if (!this.textEncryptionKey) {
            return alert('Спочатку зашифруйте текст!');
        }
        
        // Конвертація байтів у Base64 для зручного копіювання
        const base64Key = btoa(String.fromCharCode.apply(null, this.textEncryptionKey));
        this.copyToClipboard(base64Key);
        alert('Ключ шифрування скопійовано у форматі Base64!');
    }
    
    // Допоміжний метод для копіювання в буфер обміну
    copyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Не вдалося скопіювати текст: ', err);
        }
        
        document.body.removeChild(textArea);
    }

    // Оригінальний метод для шифрування файлу
    encryptFile() {
        let fileInput = document.getElementById('inputFile').files[0];
        if (!fileInput) return alert('Оберіть файл для шифрування!');
        
        let reader = new FileReader();
        reader.onload = (event) => {
            let textArray = new Uint8Array(event.target.result);
            let key = new Uint8Array(textArray.length);
            window.crypto.getRandomValues(key);
            let encryptedData = this.xorEncryptDecrypt(textArray, key);
            
            this.downloadFile(encryptedData, 'ciphertext.txt');
            this.downloadFile(key, 'key.txt');
        };
        reader.readAsArrayBuffer(fileInput);
    }

    // Удосконалений метод дешифрування файлу
    decryptFile() {
        let encFile = document.getElementById('encryptedFile').files[0];
        let keyFile = document.getElementById('keyFile').files[0];
        if (!encFile || !keyFile) return alert('Оберіть файли для розшифрування!');
        
        // Додаємо виявлення формату файлу
        let reader1 = new FileReader();
        let reader2 = new FileReader();
        
        // Перевіримо, чи це текстовий файл з Base64
        reader1.onload = (event1) => {
            let encryptedData;
            
            // Спробуємо виявити, чи це двійковий або Base64 файл
            let content = new Uint8Array(event1.target.result);
            let isTextFile = this.isTextFile(content);
            
            if (isTextFile) {
                // Обробка текстового файлу (можливо Base64)
                let textContent = new TextDecoder().decode(content);
                try {
                    // Спробуємо декодувати як Base64
                    encryptedData = this.base64ToUint8Array(textContent.trim());
                } catch (e) {
                    // Якщо не Base64, використовуємо як звичайний текст
                    encryptedData = content;
                }
            } else {
                // Прямий двійковий файл
                encryptedData = content;
            }
            
            reader2.onload = (event2) => {
                let keyContent = new Uint8Array(event2.target.result);
                let isKeyTextFile = this.isTextFile(keyContent);
                let key;
                
                if (isKeyTextFile) {
                    let keyText = new TextDecoder().decode(keyContent);
                    try {
                        // Спробуємо декодувати як Base64
                        key = this.base64ToUint8Array(keyText.trim());
                    } catch (e) {
                        key = keyContent;
                    }
                } else {
                    key = keyContent;
                }
                
                if (encryptedData.length !== key.length) {
                    return alert('Ключ і зашифрований файл мають різну довжину!');
                }
                
                let decryptedData = this.xorEncryptDecrypt(encryptedData, key);
                
                // Спробуємо інтерпретувати результат як текст
                try {
                    let decryptedText = new TextDecoder().decode(decryptedData);
                    // Створити блок для відображення розшифрованого тексту
                    this.showDecryptedResult(decryptedText);
                } catch (e) {
                    // Якщо не можемо декодувати як текст, просто завантажуємо файл
                    this.downloadFile(decryptedData, 'decrypted.txt');
                }
            };
            reader2.readAsArrayBuffer(keyFile);
        };
        reader1.readAsArrayBuffer(encFile);
    }
    
    // Метод для відображення розшифрованого результату
    showDecryptedResult(text) {
        // Створити блок результату, якщо його ще немає
        let resultArea = document.getElementById('decryptionResult');
        if (!resultArea) {
            resultArea = document.createElement('div');
            resultArea.id = 'decryptionResult';
            resultArea.className = 'decryption-result';
            
            const resultContainer = document.createElement('div');
            resultContainer.className = 'result-container';
            
            const resultTitle = document.createElement('h3');
            resultTitle.textContent = 'Decryption Result:';
            resultContainer.appendChild(resultTitle);
            
            const textArea = document.createElement('textarea');
            textArea.className = 'result-textarea';
            textArea.id = 'decryptedTextArea';
            textArea.readOnly = true;
            resultContainer.appendChild(textArea);
            
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'result-actions';
            
            const copyButton = document.createElement('button');
            copyButton.className = 'secondary-btn';
            copyButton.textContent = 'Copy Result';
            copyButton.onclick = () => this.copyDecryptedText();
            buttonContainer.appendChild(copyButton);
            
            const downloadButton = document.createElement('button');
            downloadButton.className = 'secondary-btn';
            downloadButton.textContent = 'Download Result';
            downloadButton.onclick = () => this.downloadDecryptedText();
            buttonContainer.appendChild(downloadButton);
            
            resultContainer.appendChild(buttonContainer);
            resultArea.appendChild(resultContainer);
            
            // Додати елемент на сторінку
            const decryptSection = document.querySelector('.otp_container');
            decryptSection.appendChild(resultArea);
        }
        
        document.getElementById('decryptedTextArea').value = text;
        resultArea.style.display = 'block';
    }
    
    // Копіювання розшифрованого тексту
    copyDecryptedText() {
        const textArea = document.getElementById('decryptedTextArea');
        if (textArea && textArea.value) {
            this.copyToClipboard(textArea.value);
            alert('Розшифрований текст скопійовано!');
        }
    }
    
    // Завантаження розшифрованого тексту
    downloadDecryptedText() {
        const textArea = document.getElementById('decryptedTextArea');
        if (textArea && textArea.value) {
            const textEncoder = new TextEncoder();
            const textArray = textEncoder.encode(textArea.value);
            this.downloadFile(textArray, 'decrypted.txt');
        }
    }
    
    // Перевірка чи файл є текстовим
    isTextFile(data) {
        // Проста евристика для визначення текстового файлу
        // Перевіряємо перші 100 байтів на наявність двійкових символів
        const maxCheck = Math.min(data.length, 100);
        for (let i = 0; i < maxCheck; i++) {
            // Непрукований ASCII або нетекстовий UTF-8 символ
            if ((data[i] < 32 && ![9, 10, 13].includes(data[i])) || data[i] > 126) {
                return false;
            }
        }
        return true;
    }

    // Метод для завантаження файлу
    downloadFile(data, filename) {
        let blob = new Blob([data], { type: 'application/octet-stream' });
        let link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

const otp = new OTPEncryptor();