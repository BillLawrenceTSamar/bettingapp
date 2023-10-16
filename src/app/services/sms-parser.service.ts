import { Injectable } from "@angular/core";

@Injectable()


export class SmsParser {

    parseResponse = (sms_response: string, payload_definition: PayloadDefinition): SmsResponse => {
        // Fomrat:
        // #<action>#<params>#<better_id>#<security>
        let response = sms_response.split("#")

        if(response.length < 3) {
            throw new Error('Unable to parse SMS Responsse, got ' + sms_response)
        }

        let action = response[1]
        let params = {}

        if(action != payload_definition.prefix) {
            throw new Error('Unable to parse SMS Responsse, got ' + sms_response)
        }

        payload_definition.keys.forEach((key,i,arr) => {
            params[key] = response[i + 2]
        })

        return {
            'action': action,
            'params': params
        }
    } 

    parseCommand = (sms_command: SmsCommand): string => {
        let msg = "#" + sms_command.action + "#" + sms_command.params + "#" + sms_command.better_id + "#" + sms_command.security_key + "#" + sms_command.app_id
        return msg
    }

}

export const PAYLOAD_DEFINITIONS = {
    TOPUP_RESPONSE: {
        prefix: 'wallet_topup',
        keys: [
            'status',
            'message'
        ]
    }, 
    WALLET_RESPONSE: {
        prefix: 'wallet_balance',
        keys: [
            'status',
            'message',
            'balance'
        ]
    },
    LOGIN_RESPONSE: {
        prefix: 'login',
        keys: [
            'status',
            'fullname',
            'user_id',
            'security_key',
            'assigned_bridge'
        ]
    },
    BET_RESPONSE: {
        prefix: 'place',
        keys: [
            'status',
            'message'
        ]
    }
}

interface PayloadDefinition {
    prefix: string
    keys: Array<string>
}

export interface SmsResponse {
    action: string
    params: any
}

export interface SmsCommand {
    action: string
    params: any
    better_id: number
    security_key: string
    app_id: string
}