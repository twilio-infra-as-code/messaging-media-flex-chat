import { Resource, Serverless, FlexPlugin, CheckServerless } from 'twilio-pulumi-provider';
import * as pulumi from '@pulumi/pulumi';

const stack = pulumi.getStack();

const serviceName = 'sms-media-serverless';
const domain = CheckServerless.getDomainName(serviceName, stack);

const { 
    
    PROXY_SERVICE_SID,
    CHAT_SERVICE_SID,
    TWILIO_WHATSAPP_NUMBER,
    TWILIO_SMS_NUMBER

} = process.env;

const proxyService = new Resource("proxy-service", {
    resource: ["proxy", "services"],
    attributes: {
        sid: PROXY_SERVICE_SID,
        callbackUrl: pulumi.all([domain]).apply(([ domain ]) => `https://${domain}/mms-handler`)
    }
});

const serverless = new Serverless("sms-media-functions-assets", {
    attributes: {
        cwd: `../serverless/main`,
        serviceName,
        envPath: `.${stack}.env`,
        env: {
            CHAT_SERVICE_SID: CHAT_SERVICE_SID,
            PROXY_SERVICE_SID: PROXY_SERVICE_SID,
            TWILIO_WHATSAPP_NUMBER: TWILIO_WHATSAPP_NUMBER,
            TWILIO_SMS_NUMBER: TWILIO_SMS_NUMBER
        },
        functionsEnv: stack,
        pkgJson: require("../serverless/main/package.json")
    }
});

const smsMediaFlexPlugin = new FlexPlugin("sms-media-flex-plugin", { 
    attributes: {
        cwd: "../flex-plugins/sms-media",
        env: pulumi.all([domain]).apply(([ domain ]) => (
            {
                REACT_APP_MMS_FUNCTIONS_DOMAIN: `https://${domain}`,
            }
        ))
    }
});
 
export let output =  {
    proxyServiceSid: proxyService.sid,
    serverless: serverless.sid,
    smsMediaFlexPluginSid: smsMediaFlexPlugin.sid
}
