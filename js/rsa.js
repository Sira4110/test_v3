class RSAEncryptor {
    constructor() {
        // Storage for keys and results
        this.keyPair = null;
        this.encryptedText = null;
        this.decryptedText = null;
    }

    // Generation of a random prime number of a given bit length
    generateLargePrime(bitLength) {
        while (true) {
            // Generate a random number of the desired length
            let num = this.generateRandomBigInt(bitLength);
            
            // Let's make sure that the number is odd (all prime numbers except 2 are odd)
            if (num % 2n === 0n) num += 1n;
            
            // Check if the number is prime
            if (this.isProbablePrime(num, 5)) {
                return num;
            }
        }
    }

    // Generation of a random BigInt of a given bit length
    generateRandomBigInt(bitLength) {
        const bytes = Math.ceil(bitLength / 8);
        const randomBytes = new Uint8Array(bytes);
        
        // Fill the array with random bytes
        window.crypto.getRandomValues(randomBytes);
        
        // Set the high bit to guarantee the desired length
        randomBytes[0] |= 0x80;
        
        // Convert the byte array to a string of hexadecimal numbers
        let hexString = '0x';
        for (let i = 0; i < randomBytes.length; i++) {
            const hex = randomBytes[i].toString(16).padStart(2, '0');
            hexString += hex;
        }
        
        // Convert hexadecimal string to BigInt
        return BigInt(hexString);
    }

    // Miller-Rabin simplicity test.
    isProbablePrime(n, k) {
        if (n <= 1n) return false;
        if (n <= 3n) return true;
        if (n % 2n === 0n) return false;

        // Find r and d such that n-1 = 2^r * d, where d is odd
        let r = 0n;
        let d = n - 1n;
        while (d % 2n === 0n) {
            d /= 2n;
            r += 1n;
        }

        // We run k tests
        witnessLoop: for (let i = 0; i < k; i++) {
            // We choose a random a in the range [2, n-2]
            const a = this.getRandomInRange(2n, n - 2n);
            
            // Calculate x = a^d mod n
            let x = this.modPow(a, d, n);
            
            if (x === 1n || x === n - 1n) continue;

            // Repeat r-1 times
            for (let j = 1n; j < r; j++) {
                x = this.modPow(x, 2n, n);
                if (x === n - 1n) continue witnessLoop;
                if (x === 1n) return false;
            }
            
            return false;
        }
        
        // If all tests are passed, the number is probably prime
        return true;
    }

    // Getting a random BigInt in the specified range
    getRandomInRange(min, max) {
        const range = max - min + 1n;
        const bitsNeeded = range.toString(2).length;
        
        while (true) {
            const randomBigInt = this.generateRandomBigInt(bitsNeeded);
            const result = min + (randomBigInt % range);
            
            if (result >= min && result <= max) {
                return result;
            }
        }
    }

    // Algorithm for modulo degree (a^b mod n)
    modPow(base, exponent, modulus) {
        if (modulus === 1n) return 0n;
        
        let result = 1n;
        base = base % modulus;
        
        while (exponent > 0n) {
            // If the exponent is odd, multiply the result by the base
            if (exponent % 2n === 1n) {
                result = (result * base) % modulus;
            }
            
            // The exponent is integer divisible by 2
            exponent = exponent / 2n;
            base = (base * base) % modulus;
        }
        
        return result;
    }

    // Extended Euclid's algorithm for finding NER and Bezu coefficients
    extendedGCD(a, b) {
        if (a === 0n) {
            return { gcd: b, x: 0n, y: 1n };
        }
        
        const { gcd, x, y } = this.extendedGCD(b % a, a);
        return { 
            gcd: gcd, 
            x: y - (b / a) * x, 
            y: x 
        };
    }

    // Finding the multiplicative inverse modulo (a^(-1) mod m)
    modInverse(a, m) {
        const { gcd, x } = this.extendedGCD(a, m);
        
        if (gcd !== 1n) {
            throw new Error('Modular inverse does not exist');
        }
        
        // Guarantee a positive result
        return (x % m + m) % m;
    }

    // RSA key pair generation
    generateKeyPair() {
        const keySize = parseInt(document.getElementById('keySize').value);
        
        // Show loading indicator
        this.showGeneratingMessage(true);
        
        // Use setTimeout to release the UI thread
        setTimeout(() => {
            try {
                // The bit length for each prime number should be about half of the desired key length
                const primeBitLength = keySize / 2;
                
                // Generate two different prime numbers
                const p = this.generateLargePrime(primeBitLength);
                let q;
                do {
                    q = this.generateLargePrime(primeBitLength);
                } while (p === q);  // Let's make sure that p and q are different
                
                // Вычисляем n = p * q (модуль)
                const n = p * q;
                
                // We calculate the Euler function φ(n) = (p-1)(q-1)
                const phi = (p - 1n) * (q - 1n);
                
                // Select e (open exponent)
                // Usually 65537 (0x10001) is used, if it fits
                let e = 65537n;
                while (this.extendedGCD(e, phi).gcd !== 1n) {
                    e += 2n;  // Looking for an odd mutually prime with phi
                }
                
                // We compute d (closed exponent), the modular inverse to e modulo phi
                const d = this.modInverse(e, phi);
                
                // Creating and saving keys
                const publicKey = {
                    n: n.toString(),
                    e: e.toString()
                };
                
                const privateKey = {
                    n: n.toString(),
                    d: d.toString(),
                    p: p.toString(), // We can save for the Chinese residue theorem
                    q: q.toString()  // To speed up the transcription
                };
                
                this.keyPair = {
                    publicKey: publicKey,
                    privateKey: privateKey
                };
                
                // Formatting the keys for display
                const publicKeyString = this.formatKey('PUBLIC', publicKey);
                const privateKeyString = this.formatKey('PRIVATE', privateKey);
                
                // Display keys in the interface
                document.getElementById('publicKeyDisplay').value = publicKeyString;
                document.getElementById('privateKeyDisplay').value = privateKeyString;
                
                // Showing the key block
                document.getElementById('keyPairDisplay').style.display = 'block';
                
                // Hiding the loading indicator
                this.showGeneratingMessage(false);
            } catch (error) {
                console.error('Error generating key pair:', error);
                alert('Ошибка при генерации ключей. Проверьте консоль для деталей.');
                this.showGeneratingMessage(false);
            }
        }, 100);
    }
    
    // Formatting the key for display and storage
    formatKey(type, keyData) {
        const header = `-----BEGIN RSA ${type} KEY-----`;
        const footer = `-----END RSA ${type} KEY-----`;
        
        // Convert key data to JSON and encode in base64
        const keyJson = JSON.stringify(keyData);
        const keyBase64 = btoa(keyJson);
        
        // Split base64 string into 64-character strings
        const chunks = [];
        for (let i = 0; i < keyBase64.length; i += 64) {
            chunks.push(keyBase64.substring(i, i + 64));
        }
        
        // Connecting everything in PEM format
        return `${header}\n${chunks.join('\n')}\n${footer}`;
    }
    
    // Reading a key from PEM format
    parseKey(pemKey) {
        try {
            // Remove headings and line feeds
            const lines = pemKey.split('\n');
            let base64Content = '';
            
            let capture = false;
            for (const line of lines) {
                if (line.includes('BEGIN RSA')) {
                    capture = true;
                    continue;
                }
                if (line.includes('END RSA')) {
                    capture = false;
                    break;
                }
                if (capture) {
                    base64Content += line;
                }
            }
            
            // Decode base64 and parse JSON
            const jsonContent = atob(base64Content);
            return JSON.parse(jsonContent);
        } catch (error) {
            console.error('Error parsing key:', error);
            throw new Error('Invalid key format');
        }
    }
    
    // Service method for displaying the key generation indicator
    showGeneratingMessage(show) {
        // Search for an existing message or create a new one
        let message = document.getElementById('generatingMessage');
        if (!message && show) {
            message = document.createElement('div');
            message.id = 'generatingMessage';
            message.className = 'generating-message';
            message.textContent = 'Generating keys, please wait... (this may take a while)';
            
            // Add before the generate button
            const button = document.querySelector('.key-generation-section .primary-btn');
            button.parentNode.insertBefore(message, button.nextSibling);
        } else if (message && !show) {
            message.remove();
        }
    }
    
    // Text encryption
    encryptText() {
        const inputText = document.getElementById('inputText').value;
        const publicKeyPem = document.getElementById('encryptionPublicKey').value;
        
        if (!inputText) {
            return alert('Please enter text to encrypt!');
        }
        
        if (!publicKeyPem) {
            return alert('Please enter a public key for encryption!');
        }
        
        try {
            // Disassembling a key from PEM format
            const publicKey = this.parseKey(publicKeyPem);
            const n = BigInt(publicKey.n);
            const e = BigInt(publicKey.e);
            
            // Determine the maximum block length for encryption
            // Since n has byte length log256(n), the maximum secure block size is log256(n) - 11
            const maxBlockSize = Math.floor(this.getBitLength(n) / 8) - 11;
            
            // Convert text to bytes
            const textBytes = this.stringToBytes(inputText);
            
            // Split the text into blocks and encrypt each block
            const encryptedBlocks = [];
            for (let i = 0; i < textBytes.length; i += maxBlockSize) {
                const block = textBytes.slice(i, i + maxBlockSize);
                // Adding PKCS#1 v1.5 padding
                const paddedBlock = this.addPadding(block, Math.floor(this.getBitLength(n) / 8));
                // Convert the block to a number
                const blockValue = this.bytesToBigInt(paddedBlock);
                // Encrypt: c = m^e mod n
                const encrypted = this.modPow(blockValue, e, n);
                // Save the encrypted block
                encryptedBlocks.push(encrypted.toString());
            }
            
            // Merge the encrypted blocks into a single string
            this.encryptedText = JSON.stringify(encryptedBlocks);
            
            // Display the result
            document.getElementById('encryptedTextDisplay').value = this.encryptedText;
            document.getElementById('encryptionResults').style.display = 'block';
            
        } catch (error) {
            console.error('Encryption error:', error);
            alert('Error during encryption. Check the console for details.');
        }
    }
    
    // Adding PKCS#1 v1.5 padding for encryption
    addPadding(data, blockSize) {
        // Format: 00 || 02 || PS || 00 || D
        // PS - random non-zero bytes
        // D - data
        
        // Check that the data is placed in the block
        if (data.length > blockSize - 11) {
            throw new Error(`Data too long: ${data.length} > ${blockSize - 11}`);
        }
        
        // Create a buffer for the filled block
        const buffer = new Uint8Array(blockSize);
        
        // First two bytes: 00 and 02
        buffer[0] = 0;
        buffer[1] = 2;
        
        // Generate random non-zero bytes for PS
        const psLength = blockSize - data.length - 3;
        for (let i = 0; i < psLength; i++) {
            let randomByte;
            do {
                randomByte = window.crypto.getRandomValues(new Uint8Array(1))[0];
            } while (randomByte === 0); // PS must not contain null bytes
            
            buffer[2 + i] = randomByte;
        }
        
        // Add a separator (00) between PS and data
        buffer[2 + psLength] = 0;
        
        // Copy data to the end of the buffer
        buffer.set(data, 3 + psLength);
        
        return buffer;
    }
    
    // Removing PKCS#1 v1.5 padding after decryption
    removePadding(paddedData) {
        // Check format: 00 || 02 || PS || 00 || D
        if (paddedData[0] !== 0 || paddedData[1] !== 2) {
            throw new Error('Invalid padding format');
        }
        
        // Looking for a separator (first zero after PS)
        let i = 2;
        while (i < paddedData.length && paddedData[i] !== 0) {
            i++;
        }
        
        // Check if we found the separator
        if (i === paddedData.length) {
            throw new Error('Invalid padding: no zero separator found');
        }
        
        // Return data after the delimiter
        return paddedData.slice(i + 1);
    }
    
    // Text decoding
    decryptText() {
        const encryptedInput = document.getElementById('encryptedInput').value;
        const privateKeyPem = document.getElementById('decryptionPrivateKey').value;
        
        if (!encryptedInput) {
            return alert('Please enter encrypted text to decrypt!');
        }
        
        if (!privateKeyPem) {
            return alert('Please enter a private key for decryption!');
        }
        
        try {
            // Disassembling a key from PEM format
            const privateKey = this.parseKey(privateKeyPem);
            const n = BigInt(privateKey.n);
            const d = BigInt(privateKey.d);
            
            // Unscrambling the encrypted blocks
            let encryptedBlocks;
            try {
                encryptedBlocks = JSON.parse(encryptedInput);
                if (!Array.isArray(encryptedBlocks)) {
                    encryptedBlocks = [encryptedInput]; // Single unit
                }
            } catch (jsonError) {
                encryptedBlocks = [encryptedInput]; // Not JSON, count as one block
            }
            
            // Determine the block size (in bytes)
            const blockSize = Math.floor(this.getBitLength(n) / 8);
            
            // Deciphering each block
            const decryptedBytes = [];
            for (const block of encryptedBlocks) {
                // Convert string to BigInt
                const encryptedValue = BigInt(block);
                
                // Decode: m = c^d mod n
                const decrypted = this.modPow(encryptedValue, d, n);
                
                // Convert BigInt to bytes
                const decryptedBlock = this.bigIntToBytes(decrypted, blockSize);
                
                try {
                    // Remove padding
                    const unpaddedBlock = this.removePadding(decryptedBlock);
                    // Add the decrypted bytes to the result
                    decryptedBytes.push(...unpaddedBlock);
                } catch (paddingError) {
                    console.error('Padding error:', paddingError);
                    // If padding is an issue, add the block as is
                    decryptedBytes.push(...decryptedBlock);
                }
            }
            
            // Convert bytes to a string
            this.decryptedText = this.bytesToString(decryptedBytes);
            
            // Display the result
            document.getElementById('decryptedTextArea').value = this.decryptedText;
            document.getElementById('decryptionResult').style.display = 'block';
            
        } catch (error) {
            console.error('Decryption error:', error);
            alert('Error during decryption. Check the console for details.');
        }
    }
    
    // Auxiliary methods for data conversion
    
    // Getting the bit length of a number
    getBitLength(n) {
        return n.toString(2).length;
    }
    
    // Converting a string to a byte array
    stringToBytes(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }
    
    // Преобразование массива байтов в строку
    bytesToString(bytes) {
        const decoder = new TextDecoder();
        return decoder.decode(new Uint8Array(bytes));
    }
    
    // Converting byte array to BigInt
    bytesToBigInt(bytes) {
        let result = 0n;
        for (let i = 0; i < bytes.length; i++) {
            result = (result << 8n) | BigInt(bytes[i]);
        }
        return result;
    }
    
    // Converting BigInt to a fixed-length byte array
    bigIntToBytes(value, length) {
        const bytes = new Uint8Array(length);
        for (let i = length - 1; i >= 0; i--) {
            bytes[i] = Number(value & 0xffn);
            value = value >> 8n;
        }
        return bytes;
    }
    
    // Methods for copying and downloading
    
    // Copying a public key to the clipboard
    copyPublicKey() {
        const publicKey = document.getElementById('publicKeyDisplay').value;
        if (publicKey) {
            this.copyToClipboard(publicKey);
            alert('Public key copied to clipboard!');
        }
    }
    
    // Copying a private key to the clipboard
    copyPrivateKey() {
        const privateKey = document.getElementById('privateKeyDisplay').value;
        if (privateKey) {
            this.copyToClipboard(privateKey);
            alert('Private key copied to clipboard!');
        }
    }
    
    // Method for copying to clipboard
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
            console.error('Failed to copy text: ', err);
        }
        
        document.body.removeChild(textArea);
    }
    
    // Downloading the public key to a file
    downloadPublicKey() {
        const publicKey = document.getElementById('publicKeyDisplay').value;
        if (publicKey) {
            this.downloadFile(publicKey, 'public_key.pem');
        }
    }
    
    // Downloading the private key to a file
    downloadPrivateKey() {
        const privateKey = document.getElementById('privateKeyDisplay').value;
        if (privateKey) {
            this.downloadFile(privateKey, 'private_key.pem');
        }
    }
    
    // Copying encrypted text
    copyEncryptedText() {
        const encryptedText = document.getElementById('encryptedTextDisplay').value;
        if (encryptedText) {
            this.copyToClipboard(encryptedText);
            alert('Encrypted text copied to clipboard!');
        }
    }
    
    // Downloading encrypted text
    downloadEncryptedText() {
        const encryptedText = document.getElementById('encryptedTextDisplay').value;
        if (encryptedText) {
            this.downloadFile(encryptedText, 'encrypted_message.txt');
        }
    }
    
    // Copying decrypted text
    copyDecryptedText() {
        const decryptedText = document.getElementById('decryptedTextArea').value;
        if (decryptedText) {
            this.copyToClipboard(decryptedText);
            alert('Decrypted text copied to clipboard!');
        }
    }
    
    // Downloading the decrypted text
    downloadDecryptedText() {
        const decryptedText = document.getElementById('decryptedTextArea').value;
        if (decryptedText) {
            this.downloadFile(decryptedText, 'decrypted_message.txt');
        }
    }
    
    // Method for downloading the file
    downloadFile(data, filename) {
        const blob = new Blob([data], { type: 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Creating an instance of RSAEncryptor class
const rsaEncryptor = new RSAEncryptor();