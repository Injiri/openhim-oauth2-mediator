const axios = require('axios');
const { generateToken } = require("auth");
const { FHIR, CHT } = require('../../config');
const {logger} = require("../utils/logger");
const FHIR_URL = FHIR.url;

const forwardRequestToFhirServer = async (req) => {
    logger.information("Attempt forwarding request");
    let requestBody = req?.body || {};
    try {
        const axiosInstance = axios.create({
            baseURL: FHIR.url,
            method: req.method || 'get',
            headers: {
                "Content-Type": "application/json",
            },
        });

        axiosInstance.interceptors.response.use(
            (response) => {
                return response;
            },
            async function (error) {
                const originalRequest = error.config;
                if (error.response && error.response.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    const token = await generateToken();
                    axiosInstance.defaults.headers.common[
                        "Authorization"
                        ] = `Bearer ${token}`;
                    return axiosInstance(originalRequest);
                }
                return Promise.reject(error);
            }
        );
        logger.information("Generating FHIR resource");

        
        if(['put','post','patch', 'delete'].includes(req.method.toLowerCase())){
            const response = await axiosInstance.post(`${FHIR_URL}/`, JSON.stringify(requestBody)); //i.e /ServiceRequest
        } else {
            const response = await axiosInstance.request(`${FHIR_URL}/`);
        }
        
        const location = response.headers.location.split("/");
        logger.information("FHIR server response");
        logger.information(`Response ${location.at(-3)}`);

        return { response };
    } catch (error) {
        logger.error(error.message);

        if (!error.status) {
            return {status: 400, patient: {message: error.message}};
        }
    }
};

module.exports = {
    forwardRequestToFhirServer
}

