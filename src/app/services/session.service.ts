import { Injectable } from "@angular/core";
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from "rxjs";
import { map } from 'rxjs/operators';
import { DbService } from "./db.service";
import { PAYLOAD_DEFINITIONS, SmsParser } from "./sms-parser.service";
import { SmsRetriever } from "@ionic-native/sms-retriever";
import {  } from "@ionic-native/sms";

declare var sms: any;

@Injectable({
    providedIn: "root"
})

export class SessionService {

    private flash_data: any
    private app_sms_key: any
    private receiver_number_stl: string
    private receiver_number_3d: string
    public machine_id: string
    public agent_code: string
    public agent_name: string
    public reference_no: string
    public activation: string
    public printer_mac_address: string

    constructor(
        private db_service: DbService, 
        private http: HttpClient,
        private sms_parser: SmsParser
    ) {}

    async initialize() {

        // -- Initialize SMS hash
        this.app_sms_key = await SmsRetriever.getAppHash()
        console.log(this.app_sms_key)

        this.machine_id = await this.db_service.get('machine_id')
        this.agent_code = await this.db_service.get('agent_code')
        this.agent_name = await this.db_service.get('agent_name')
        this.reference_no = await this.db_service.get('reference_no')
        this.activation = await this.db_service.get('activation')
        this.printer_mac_address = await this.db_service.get('printer_mac_address')

        if(this.printer_mac_address == null || this.printer_mac_address == "") {
            this.printer_mac_address = "0B:8D:31:38:CB:41"
            this.db_service.set('printer_mac_address',this.printer_mac_address)
        }

        // -- Initialize Assigned Receiver Number
        this.receiver_number_stl = await this.db_service.get('receiver_stl')
        if(this.receiver_number_stl == null) {
            this.receiver_number_stl = '000'
            this.db_service.set('receiver_stl',this.receiver_number_stl)
        }

        this.receiver_number_3d = await this.db_service.get('receiver_3d')
        if(this.receiver_number_3d == null) {
            this.receiver_number_3d = '000'
            this.db_service.set('receiver_3d',this.receiver_number_3d)
        }

        // -- Initialize Empty Flash Object
        this.flash_data = {}

        return true
    } 

    is_activated() {

        if(this.activation.length < 8 || this.activation.length > 8) {
            return false
        }
        
        try {
            let a = Number(this.activation.substring(0,2))
            let b = Number(this.activation.substring(2,4))
            let c = Number(this.activation.substring(4,6))
            let d = Number(this.activation.substring(6,8))
            //alert(a + b + c + d)
            if(a + b + c + d == 200) {
                return true
            }

        } catch(e) {
            return false
        }

        return false
    }

    async save_settings() {

        await this.db_service.set('activation', this.activation)
        await this.db_service.set('machine_id',this.machine_id)
        await this.db_service.set('agent_code',this.agent_code)
        await this.db_service.set('agent_name',this.agent_name)
        await this.db_service.set('reference_no',this.reference_no)
        await this.db_service.set('printer_mac_address',this.printer_mac_address)
        return true
    }

    set_receiver_number(draw_category: DrawCategories, receiver_number: string) {

        if(draw_category === DrawCategories.stl) {
            this.receiver_number_stl = receiver_number
            this.db_service.set('receiver_stl', receiver_number)
        }

        if(draw_category === DrawCategories["3d"]) {
            this.receiver_number_3d = receiver_number
            this.db_service.set('receiver_3d', receiver_number)
        }
        
    }

    get_app_sms_key() {
        return this.app_sms_key
    }

    get_receiver_number(draw_category: DrawCategories) {

        if(draw_category === DrawCategories.stl) {
            return this.receiver_number_stl
        }

        if(draw_category === DrawCategories["3d"]) {
            return this.receiver_number_3d
        }

    } 
  
    login(password: string) { 

        return new Observable(subscriber => { 
            
            let msg = '#login#' + password + "#" + this.app_sms_key

            console.log(sms)
            sms.sendSMS('+630337435049', 'test',function(){
                console.log("SMS sent."); 
               }, function(e){
                console.log('Error sending SMS.'); 
            });



            // Server Login Pattern: #<login>#<password>#<sms_passkey>
            // this.sms.hasPermission().then((val) => {

            //     this.sms.send(this.receiver_number, msg).then(() => {

            //         SmsRetriever.startWatching()
            //         .then(async (sms_response: any) => {
            //             try {
            //                 let response = this.sms_parser.parseResponse(sms_response.Message,PAYLOAD_DEFINITIONS.LOGIN_RESPONSE)
            //                 if(response.params.status == 'error') {
            //                     subscriber.next({
            //                         status: false,
            //                         message: "The password you provided is invalid"
            //                     })
            //                     return    
            //                 }

            //                 console.log(response.params)

            //                 this.session_behavior_subject$.next({
            //                     fullname: response.params.fullname,
            //                     user_id: response.params.user_id,
            //                     security_key: response.params.security_key,
            //                 })
            //                 this.receiver_number = response.params.assigned_bridge
            //                 subscriber.next({
            //                     status: true,
            //                     message: "Successfully Logged In"
            //                 })
            //             }
            //             catch(err) {
            //                 console.log("Response Processing Error Occured")
            //                 console.log(err)
            //                 subscriber.next({
            //                     status: false,
            //                     message: "The server has encountered an error, please try again later"
            //                 })  
            //             }
            //         })
            //         .catch(err_sms_retriever => {
            //             console.log("SMS Retriever Error Occured")
            //             console.log(err_sms_retriever)
            //             subscriber.next({
            //                 status: false,
            //                 message: "No response from the server, please try again later"
            //             }) 
            //         });
                    
            //     }).catch(err_sms_sending => {
            //         console.log("SMS Sender Error Occured")
            //         console.log(err_sms_sending)
            //         subscriber.next({
            //             status: false,
            //             message: "The app is unable to communicate with the server, please make sure you have sms load balance"
            //         }) 
            //     })

            // },(reject_reason) => {
            //     console.log("SMS Sender Error Occured")
            //     console.log(reject_reason)
            //     subscriber.next({
            //         status: false,
            //         message: "The app is unable to communicate with the server, please grant SMS permissions for the app"
            //     }) 
            // })
        })

    }

    set_flashdata(key: string, value: string) {
        this.flash_data[key] = value
    }

    get_flashdata(key: string) {

        if(this.flash_data[key] == null) {
            return null
        } else {
            let data = this.flash_data[key]
            delete this.flash_data[key]
            return data
        }

    }

}

export enum DrawCategories {
    'stl','3d'
}

export interface ServerResponse {
    status:number;
    payload:any;
}

export interface Session {
    fullname: string
    user_id: number
    security_key: string
}