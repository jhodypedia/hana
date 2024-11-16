const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Membaca konfigurasi dan token
const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../config.json'), 'utf-8'));

// Secret key untuk reCAPTCHA
const RECAPTCHA_SECRET_KEY = '6LdeMoEqAAAAAOYR5Rj05zHqkr1cONkIWzUao81A'; // Ganti dengan secret key Anda

// Fungsi untuk memverifikasi reCAPTCHA
async function verifyRecaptcha(recaptchaResponse) {
    const url = 'https://www.google.com/recaptcha/api/siteverify';
    const params = {
        secret: RECAPTCHA_SECRET_KEY,
        response: recaptchaResponse
    };

    try {
        const response = await axios.post(url, null, { params });
        return response.data.success;
    } catch (error) {
        console.error('Error verifying reCAPTCHA:', error);
        return false;
    }
}

// Fungsi untuk mendapatkan headers dengan User-Agent acak
function getHeaders(authCode) {
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/91.0.864.59 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/89.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36"
    ];
    const randomIndex = Math.floor(Math.random() * userAgents.length);
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${authCode}`,
        "Origin": "https://hanafuda.hana.network",
        "Priority": "u=1, i",
        "Referer": "https://hanafuda.hana.network/",
        "Sec-CH-UA": '"Google Chrome";v="129", "Not=A?Brand";v="8", "Chromium";v="129"',
        "Sec-CH-UA-Mobile": "?0",
        "Sec-CH-UA-Platform": '"Windows"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site",
        "User-Agent": userAgents[randomIndex]
    };
}

// Fungsi untuk mendapatkan informasi pengguna
async function getUserInfo(authCode) {
    const url = "https://hanafuda-backend-app-520478841386.us-central1.run.app/graphql";
    const headers = getHeaders(authCode);
    
    const payload = {
        query: `query GetGardenForCurrentUser {
            getGardenForCurrentUser {
                gardenStatus {
                    growActionCount
                }
            }
        }`,
        operationName: "GetGardenForCurrentUser"
    };

    try {
        const response = await axios.post(url, payload, { headers });
        return response.data;
    } catch (error) {
        console.error("Error fetching user info:", error);
        return null;
    }
}

// Fungsi untuk menangani proses dari frontend
async function processAuthCode(authCode, recaptchaResponse) {
    const minGrowActions = config.min_grow_actions || 5;

    const captchaVerified = await verifyRecaptcha(recaptchaResponse);
    if (!captchaVerified) {
        return { success: false, message: "reCAPTCHA verification failed." };
    }

    let userInfo = await getUserInfo(authCode);
    let growActionCount = 0;

    if (userInfo && userInfo.data && userInfo.data.getGardenForCurrentUser) {
        growActionCount = userInfo.data.getGardenForCurrentUser.gardenStatus.growActionCount;
    }

    if (growActionCount >= minGrowActions) {
        return { success: true, message: `Grow Action Tersedia: ${growActionCount}` };
    } else {
        return { success: false, message: "Grow action tidak mencukupi. Coba lagi nanti." };
    }
}

const app = express();
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// Endpoint untuk memproses Auth Code
app.post('/process', async (req, res) => {
    const { authCode, recaptchaResponse } = req.body;
    
    if (!authCode || !recaptchaResponse) {
        return res.status(400).json({ success: false, message: "Auth Code atau CAPTCHA tidak ditemukan." });
    }

    const result = await processAuthCode(authCode, recaptchaResponse);
    res.json(result);
});

// Menjalankan server
app.listen(3000, () => {
    console.log('Server berjalan di http://localhost:3000');
});
