const bodyParser = require("body-parser");
const express = require("express");

const app = express();

const {logger} = require('./src/utils/logger');
const {OPENHIM, CHANNEL_CONFIG_ENDPOINTS_URL} = require("./config");
const {registerMediator} = require("openhim-mediator-utils");
const {forwardRequestToFhirServer, forwardRequestToFHIR} = require("src/controller/authInterceptor")

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


logger.information("Setting up routes");
app.get('/', (req, res) => {
    logger.information('Loading the root route')
    res.send('Loaded');
});


app.post('/', (req, res) => {
    logger.information('Loading the root route')
    res.send('Loaded');
});

app.all('/fhirResource', async function (req, res) {
    const {response} = await forwardRequestToFhirServer(req);
    res.send(response);
});

const registerMediatorCallback = (err) => {
    if (err) {
        throw new Error(`Mediator Registration Failed: Reason ${err}`);
    }
    logger.information('Successfully registered mediator.');
};

const mediatorConfig = {
    urn: "urn:mediator:emr-auth2-mediator",
    version: "1.0.0",
    name: "EMR Auth2 Mediator",
    description:
        "A mediator for supporting authentication of payloads against the LINUX for Health FHIR server.",
    defaultChannelConfig: [
        {
            name: "EMR Auth2 Mediator",
            urlPattern: "^/emr-auth2-fhir/.*$",
            routes: [
                {
                    name: "eCHIS Mediator",
                    host: CHANNEL_CONFIG_ENDPOINTS_URL,
                    pathTransform: "s/\\/auth2-mediator/",
                    port: 22000,
                    primary: true,
                    type: "http",
                },
            ],
            allow: ["*"],
            methods: ["GET", "POST", "PUT", "DELETE"],
            type: "http",
        },
    ],
    endpoints: [
        {
            name: "Mediator",
            host: CHANNEL_CONFIG_ENDPOINTS_URL,
            path: "/",
            port: "22000",
            primary: true,
            type: "http",
        },
    ],
};

registerMediator(OPENHIM, mediatorConfig, registerMediatorCallback);


module.exports = app;