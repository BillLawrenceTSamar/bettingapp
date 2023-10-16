import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";
import { io } from "socket.io-client";
import { DbService } from "./db.service";
import { DrawCategories, Session, SessionService } from "./session.service";
import { SMS } from '@ionic-native/sms/ngx';
import { SmsService } from "./sms-service.service";

@Injectable({
    providedIn: "root"
})

export class WalletService {

    //socket = io()
    private wallet$: BehaviorSubject<any> = null
    private balance: number = 0
    session: Session = null

    constructor(
        private db_service: DbService, 
        private session_service: SessionService, 
        private http: HttpClient, 
        private sms_service: SmsService,
        private sms: SMS
    ) {}
 
    initialize() {

        return new Promise(async (resolve,reject) => {

            // Fomrat:
            // #<action>#<params>#<better_id>#<security>
            
            let stored_wallet_balance = await this.db_service.get('wallet')
            //let stored_wallet_balance:any = 1000

            if(stored_wallet_balance == null || stored_wallet_balance == undefined || Number.isNaN(Number.parseInt(stored_wallet_balance))) {
                stored_wallet_balance = 0
            }

            if(this.wallet$ == null) {
                this.wallet$ = new BehaviorSubject(stored_wallet_balance)
                this.wallet$.subscribe(new_wallet_data => {
                    this.db_service.set('wallet',new_wallet_data)
                    this.balance = new_wallet_data
                })  
    

                this.sms_service.listen().subscribe((sms:any) => {
        
                    let refresh_template = 'Your outstanding wallet balance is:'
                    let refresh_index = sms.message.indexOf(refresh_template) 
        
                    if(refresh_index > -1) {
                        try {
                            let balance = sms.message.split(refresh_template)[1]
                            this.wallet$.next(parseInt(balance))
                        } 
                        catch (err) {
                            console.log(err)
                        }
                    }
                })

                resolve('ok')  
            }
            else {
                this.wallet$.next(stored_wallet_balance)
                resolve('ok')
            }

        })

    }

    refresh() {
        if(this.session == null) {
            console.log("Cannot Refresh Wallet, No Session is Initialized")
            return
        }

        let data = JSON.stringify({
            'session': this.session
        })

        this.http.post('/api/get_wallet',data).subscribe((response:{status: Number, payload: any}) => {
            if(response.status == 1) {
                this.wallet$.next(Number(response.payload.wallet))
            }
            else {
                console.log(JSON.stringify(response.payload))
            }
        })
    }
 
    refresh_sms() {

        return new Observable(subscriber => {

            this.sms.hasPermission().then((val) => {
                let receiver_number = this.session_service.get_receiver_number(DrawCategories["3d"])
                //alert(receiver_number)
                this.sms.send(receiver_number,"wallet").then(async () => {

                    console.log("Inquiry Message Sent!")
                    subscriber.next({
                        status: true,
                        message: ''
                    })

                }).catch(err_sms_sending => {
                    
                    console.log(err_sms_sending)
                    subscriber.next({
                        status: false,
                        message: ''
                    })

                })

            },(reject_reason) => {
                console.log("SMS Sender Error Occured")
                console.log(reject_reason)
                subscriber.next({
                    status: false,
                    message: "The app is unable to communicate with the server, please grant SMS permissions for the app"
                }) 
            })
        })
    }

    get_wallet() {
        return this.wallet$.pipe(map(data => data))
    }

    use_wallet(amount: number) {

        console.log("USE " + this.balance + " X " + amount)

        this.wallet$.next((this.balance - amount)) 
    }

    top_up(amount: number, control_number: string) {

        let message = "load " + amount + " " + control_number

        return new Observable(subscriber => {
            console.log(message)

            this.sms.hasPermission().then((val) => {
                let receiver_number = this.session_service.get_receiver_number(DrawCategories["3d"])
                this.sms.send(receiver_number,message).then(async () => {
                    
                    subscriber.next({
                        status: true,
                        message: ''
                    })

                }).catch(err_sms_sending => {

                    console.log(err_sms_sending)
                    console.log('')
                    subscriber.next({
                        status: false,
                        message: ''
                    })
                    
                })

            },(reject_reason) => {
                console.log("SMS Sender Error Occured")
                console.log(reject_reason)
                subscriber.next({
                    status: false,
                    message: "The app is unable to communicate with the server, please grant SMS permissions for the app"
                }) 
            })

        })
    }
} 