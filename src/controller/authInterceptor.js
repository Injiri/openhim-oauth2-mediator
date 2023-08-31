const axios = require('axios');
const { generateToken } = require("auth");
const { FHIR, CHT } = require('../../config');
const {logger} = require("../utils/logger");
const FHIR_URL = FHIR.url;

const forwardRequestToFhirServer = async (requestBody) => {
    logger.information("Attempt forwarding request");
    try {
        const axiosInstance = axios.create({
            baseURL: FHIR.url,
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

        const response = await axiosInstance.post(`${FHIR_URL}/`, JSON.stringify(requestBody)); //i.e /ServiceRequest
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

