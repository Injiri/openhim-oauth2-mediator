const qs = require("qs");
const axios = require("axios");

const token = {
    timestamp: null,
    value: null,
};

const requestNewToken = async () => {
    const data = qs.stringify({
        client_id: process.env.FHIR_CLIENT_ID,
        client_secret: process.env.FHIR_CLIENT_SECRET,
        grant_type: process.env.FHIR_GRANT_TYPE,
        scope: process.env.FHIR_SCOPE,
    });

    const config = {
        maxBodyLength: Infinity,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    };

    const res = await axios.post(
        `${process.env.CLIENT_REGISTRY_TOKEN_URL}/connect/token`,
        data,
        config
    );
    return res.data.access_token;
};

const generateToken = async () => {
    if (token.timestamp && token.value) {
        const now = new Date();
        const diff = now - token.timestamp;
        if (diff < 36000000) {
            // 10 hours
            return token.value;
        } else {
            token.value = await requestNewToken();
            token.timestamp = new Date();
            return token.value;
        }
    } else {
        token.value = await requestNewToken();
        token.timestamp = new Date();
        return token.value;
    }
};

module.exports = {
    generateToken,
};