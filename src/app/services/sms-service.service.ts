import { Injectable } from "@angular/core";
import { PluginListenerHandle } from "@capacitor/core";
import { SmsRetriever } from "@ionic-native/sms-retriever";
import { EasySms, EasySmsPlugin } from "easy-sms";
import { BehaviorSubject, Observable } from "rxjs";
import { DrawCategories, SessionService } from "./session.service";

@Injectable({
    providedIn: "root"
})

export class SmsService {

    private smsReceived: BehaviorSubject<any> = null

    constructor(
        private session_service: SessionService
    ) {}

    async initialize() {

        await SmsRetriever.getAppHash().then(hash => {
            console.log("The app SMS hash is " + hash)
        })

        if(this.smsReceived == null) {
            this.smsReceived = new BehaviorSubject({
                message: ""
            })
            this.newListen()

            // this.smsReceived = new BehaviorSubject(subscriber => {
                
            //    EasySms.addListener('sms-received', (data) => {
 
            //         let receiver_number_stl  = this.session_service.get_receiver_number(DrawCategories.stl)
            //         let receiver_number_3d  = this.session_service.get_receiver_number(DrawCategories["3d"])
            //         console.log(receiver_number_stl + " OR " + receiver_number_3d +  " = " + data.sender)
            //         if(data.sender === receiver_number_stl || data.sender === receiver_number_3d) {
            //             subscriber.next(data)
            //         }
    
            //     })
            // })  
        }

        return true
    }
 
    newListen() {
        console.log('listen called')
        SmsRetriever.startWatching().then((response: any) => {

            console.log("ok " + response.Message)
            //alert(response.Message) 
            this.smsReceived.next({
                message: response.Message, 
            })
            this.newListen()

        },reject_reason => {

            console.log("reject " + JSON.stringify(reject_reason))
            this.newListen()

        })

    }

    listen() {
        return this.smsReceived.asObservable()
    }
}