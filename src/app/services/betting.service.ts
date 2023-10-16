import { HttpClient } from "@angular/common/http";
import { Injectable, NgZone } from "@angular/core";
import { SMS } from "@ionic-native/sms/ngx";
import { BehaviorSubject, Observable } from "rxjs";
import { first, map, switchMap, take } from "rxjs/operators";
import { DbService } from "./db.service";
import { DrawCategories, Session, SessionService } from "./session.service";
import { SmsParser } from "./sms-parser.service";
import { SmsService } from "./sms-service.service";

@Injectable({
    providedIn: 'root'
})

export class BettingService {

    private list_draw$: BehaviorSubject<Array<Draw>> = null
    private list_batches$: BehaviorSubject<Array<BatchRecord>> = null
    private ctr_stl: number = 0;
    private ctr_3d: number = 0;
    private session: Session

    constructor(
        private session_service: SessionService,
        private db_service: DbService,
        private sms_parser: SmsParser, 
        private sms: SMS,
        private sms_service: SmsService,
        private ng_zone: NgZone,
        private http: HttpClient
    ) {} 

    increment_stl_ctr() {
        this.ctr_stl++
        this.db_service.set('ctr_stl',this.ctr_stl)
    }

    increment_3d_ctr() {
        this.ctr_3d++
        this.db_service.set('ctr_3d',this.ctr_3d)
    }

    get_stl_ctr() {
        return (this.ctr_stl + 1).toString().padStart(7,"0")
    }

    get_3d_ctr() {

        let alphabet = ['A','B','C','D','E']
        return alphabet[((this.ctr_3d + 1) % 5)]

    }

    initialize() {
        // chain two subscription
        return new Promise((resolve,reject) => { 

            this.sms_service.listen().subscribe((sms:any) => {
                this.ng_zone.run(() => {

                    // original
                    // let bet_success_message = "Bet/s Successfuly Recorded!"
                    let bet_success_message = "All bets are valid."
                    let bsm_index = sms.message.indexOf(bet_success_message)

                    if(bsm_index > -1) {
                       // alert("finalize")
                        try {
                            let updated_data: BatchRecord[] = []
                            let subscriber_list_batches = this.list_batches$.subscribe(list_batches => {
                             
                                list_batches.forEach(batch => {
                                    //original
                                    // if(sms.message.indexOf(batch.content) > -1) {
                                    //     batch.is_confirmed = true
                                    // }
                                    console.log("VAL " + batch.content.split('.')[0])
                                    // custom
                                    if(sms.message.indexOf(batch.content.split('.')[0]) > -1) {
                                        batch.is_confirmed = true
                                    }

                                })
                                updated_data = list_batches
                            }) 

                            subscriber_list_batches.unsubscribe()
                            this.list_batches$.next(updated_data)
                        }
                        catch(err_processing) {
                            console.log('The server encountered an error')
                            console.log(err_processing)
                        }
                    }
                    
                })
            })

            this.list_draw$ = new BehaviorSubject<Array<Draw>>([
                // 1 4 2 5 3 6
                {
                    id: 6,
                    name: "STL Third Draw",
                    category: DrawCategories.stl,
                    from: new Date(0,0,0,15,0,0,0),
                    //to: new Date(0,0,0,19,0,0,0)
                    to: new Date(0,0,0,23,59,59,59) 
                },
                {
                    id: 3,
                    name: "3D Third Draw",
                    category: DrawCategories["3d"],
                    from: new Date(0,0,0,17,0,1,59),
                    //to: new Date(0,0,0,21,0,0,0) 
                    to: new Date(0,0,0,23,59,59,59) 
                },
                {
                    id: 5,
                    name: "STL Second Draw",
                    category: DrawCategories.stl,
                    from: new Date(0,0,0,11,0,0,0),
                    to: new Date(0,0,0,15,0,0,0)
                },
                {
                    id: 2,
                    name: "3D Second Draw",
                    category: DrawCategories["3d"],
                    from: new Date(0,0,0,14,0,1,59),
                    to: new Date(0,0,0,17,0,0,0)
                },
                {
                    id: 4,
                    name: "STL First Draw",
                    category: DrawCategories.stl,
                    //from: new Date(0,0,0,8,0,0,0),
                    from: new Date(0,0,0,0,0,0,0),
                    to: new Date(0,0,0,11,0,0,0)
                },
                {
                    id: 1,
                    name: "3D First Draw",
                    category: DrawCategories["3d"],
                    //from: new Date(0,0,0,8,0,0,0),
                    from: new Date(0,0,0,0,0,0,0),
                    to: new Date(0,0,0,14,0,0,0)
                }
            ])

            this.db_service.get('today').then((val: Date) => {
                let now = new Date()
                now.setHours(0,0,0,0) 

                if(val === null) {
                    this.db_service.set('today',now)
                    this.db_service.set('ctr_stl',0)
                    this.db_service.set('ctr_3d',0)
                    return
                }

                if(val < now) {
                    this.db_service.set('today',now)
                    this.db_service.set('ctr_stl',0)
                    this.db_service.set('ctr_3d',0)
                }
            }).finally(() => {
                this.db_service.get('ctr_stl').then(val => {

                    this.ctr_stl = val
                    if(val === null) {
    
                        this.db_service.set('ctr_stl',0)
                        this.ctr_stl = 0
                    }
                    
                })
    
                this.db_service.get('ctr_3d').then(val => {
                    
                    this.ctr_3d = val
                    if(val === null) {
    
                        this.db_service.set('ctr_3d',0)
                        this.ctr_3d = 0
                    }
                    
                })
            })

            

            this.db_service.get('list_batches').then((db_batches: Array<BatchRecord>) => {

                if(db_batches == undefined || db_batches == null) {
                    db_batches = []
                }

                db_batches = db_batches.filter(batch => {
                    
                    let today = new Date()
                    today.setHours(0,0,0,0) 
                    let tmpfrom = new Date(batch.date_placed)
                    tmpfrom.setHours(0,0,0,0) 

                    if(today.toDateString() == tmpfrom.toDateString()) {
                        return true
                    }
                    else {
                        return false
                    } 
                    
                })

                this.list_batches$ = new BehaviorSubject(db_batches)

                this.list_batches$.subscribe(batches => {

                    console.log("saving batches")
                    this.db_service.set('list_batches',batches)

                })

                resolve("ok")
            })

        }) 

    }

    active_draw_obspipe(list_draw_data,draw_category) {
        
        let today = new Date();
        let active_draw: Draw = {
            id: -1,
            category: DrawCategories["3d"],
            from: null,
            to: null,
            name: 'Closed' 
        }

        list_draw_data.forEach(draw => {

            let from = new Date()
            from.setHours(draw.from.getHours(),draw.from.getMinutes(),1)
            let to = new Date()
            to.setHours(draw.to.getHours(),draw.to.getMinutes(),0)

            console.log('-----')
            console.log(today)
            console.log(from) 
            console.log(to)

            if(today >= from && today <= to && draw.category === draw_category) {
                active_draw = draw
            }

        })

        return active_draw
    }
 
    active_draw(draw_category: DrawCategories) {

        return this.list_draw$.pipe(
            map(list_draw_data => {

                let today = new Date();
                let active_draw: Draw = {
                    id: -1,
                    category: DrawCategories["3d"],
                    from: null,
                    to: null,
                    name: 'Closed' 
                }

                list_draw_data.forEach(draw => {

                    let from = new Date()
                    from.setHours(draw.from.getHours(),draw.from.getMinutes(),1)
                    let to = new Date()
                    to.setHours(draw.to.getHours(),draw.to.getMinutes(),0)

                    console.log('-----')
                    console.log(today)
                    console.log(from) 
                    console.log(to)

                    if(today >= from && today <= to && draw.category === draw_category) {
                        active_draw = draw
                    }

                })

                return active_draw
            })
        )

    }

    list_draw() {
        console.log('calling draws')
        return this.list_draw$.pipe(map(data => data))
    }

    list_batches() {
        console.log('calling bets')
        return this.list_batches$.pipe(map(data => data))
    }

    place_bet(bets: Array<Bet>,draw_category: DrawCategories, is_resend: boolean = false) {

        return new Observable(subscriber => {
            
            this.sms.hasPermission().then((val) => { 
 
                if(val === false) {
                    console.log("SMS Sender Error Occured")
                    subscriber.next({
                        status: false,
                        message: "Unable to communicate to the server, make sure SMS permissions is granted to this app"
                    }) 
                } 

                let receiver_number = this.session_service.get_receiver_number(draw_category)
                let formatted_bets = this.format_to_bet_string(bets)
                let new_list_batches: BatchRecord[] = null
                const today = new Date()

                if(is_resend === false) {
                    this.list_batches().pipe(take(1)).subscribe(list_batches => {

                        console.log(draw_category + JSON.stringify(list_batches))

                        this.active_draw(draw_category).pipe(take(1)).subscribe(active_draw => {

                            console.log(active_draw)

                            list_batches.push({
                                content: formatted_bets,
                                draw: active_draw,
                                date_placed: today,
                                is_confirmed: false
                            })

                            console.log(list_batches) 
                                
                            new_list_batches = list_batches

                        })

                        this.list_batches$.next(new_list_batches)
                        
                    })
                }

                this.sms.send(receiver_number,formatted_bets).then(() => { 
       
                    subscriber.next({
                        status: true,
                        message: 'Bets Sent!' 
                    })
                    
                }).catch(error_sms_sending => {
                    console.log('Unable to communicate to the server, make sure you have enough SMS load balance to send a text message')
                    console.log(error_sms_sending)
                    subscriber.next({
                        status: false,
                        message: 'Unable to communicate to the server, make sure you have enough SMS load balance to send a text message'
                    })
                })

            },(reject_reason) => {
                console.log("SMS Sender Error Occured")
                console.log(reject_reason)
                subscriber.next({
                    status: false,
                    message: "Unable to communicate to the server, make sure SMS permissions is granted to this app"
                }) 
            })

        }) 
    }

    private format_to_bet_string(bets: Array<Bet>) {
        let formatted_bets = ''
        bets.map((bet, index, arr) => {
            formatted_bets += (bet.number + "." + bet.straight + "." + bet.ramble)
            if(index + 1 < bets.length) {
                formatted_bets += "\n" 
            }
        })
        return formatted_bets
    }

}

export interface BatchRecord {
    content: string;
    draw: Draw;
    is_confirmed: Boolean
    date_placed: Date
} 

export interface Bet {
    number: string;
    straight: number;
    ramble: number;
    draw: Draw;
} 

export interface Draw {
    id: number
    name: string
    category: DrawCategories
    from: Date
    to: Date
}