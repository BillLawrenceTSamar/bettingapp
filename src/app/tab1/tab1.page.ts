import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController, ToastController } from '@ionic/angular';
import { first, take } from 'rxjs/operators';
import { BettingFormModal } from '../betting-form-modal/betting-form-modal.component';
import { Bet, BatchRecord, BettingService, Draw } from '../services/betting.service';
import { Session, SessionService } from '../services/session.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})

export class Tab1Page implements OnInit {

  list_draw?: Array<Draw> = []
  list_batches?: Array<BatchRecord> = []
  draw_bet_count: any = {}
  no_unconfirmed: number = 0
  session?: Session

  constructor(
    private alertController: AlertController,
    private toastController: ToastController,
    public session_service: SessionService, 
    private betting_service: BettingService, 
    public modalController: ModalController
  ) {}

  ngOnInit() {

    this.betting_service.list_draw().subscribe(data => this.list_draw = data)
    this.betting_service.list_batches().subscribe(data => {
      this.list_batches = data
      this.draw_bet_count = {}

      let prev_unconfirmed = this.no_unconfirmed
      this.no_unconfirmed = 0

      this.list_draw.forEach((draw,i,arr) => {
        let count = 0
        this.list_batches.forEach(batch => {

          if(batch.draw.id == draw.id) {
            count++
          }

          if(batch.is_confirmed === false) {
            this.no_unconfirmed++
          }

        }) 

        this.draw_bet_count[draw.id] = count
      })

      if(this.no_unconfirmed < prev_unconfirmed) {
        this.presentToastWithOptions("Batch Confirmed!","the receiver has confirmed a batch in the list","success")
      }

      console.log(this.draw_bet_count)
    })
  }

  show_batch_details(batch_content: string) {
    this.presentAlert("Batch Details",batch_content)
  }

  resend(batch_content: string, draw: Draw) {
    this.presentAlertConfirm('Action Confirmation Needed!','Please choose what action you want to do for this batch?',
      () => {
        this.presentToastWithOptions("Resending Cancelled!","You declined the confirmation","primary")
      },
      () => {
        this.presentToastWithOptions("Oopss!","This feature is still under construction","primary")
      },
      () => {
        this.presentToastWithOptions("Resend Action Selected!","Resending the batch to the receiver","primary")
        let array_numbers = batch_content.split('\n')
        //alert(JSON.stringify(array_numbers))

        let bets: Bet[] = []

        array_numbers.forEach(number => {
          
          let parts = number.split('.')
          
          bets.push({
            number: parts[0],
            straight: Number(parts[1]),
            ramble: Number(parts[2]),
            draw: draw
          })

        })

        console.log(bets)

        this.betting_service
          .place_bet(bets,draw.category,true)
          .pipe(first())
          .subscribe((response: any) => {
            if(response.status === false) {
              this.presentToastWithOptions("Resend Failed!",response.message,"danger")
              return
            }
            this.presentToastWithOptions("Resend Successful!","The batch " + batch_content + " has been resent to the receiver","primary")
          })

      }
    )
  }

  async presentAlertConfirm(header, message, cancel_callback, followup_callback, okay_callback) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: [
        {
          text: 'Follow Up',
          cssClass: 'success',
          handler: followup_callback
        },
        {
          text: 'Resend Batch',
          cssClass: 'success',
          handler: okay_callback
        },
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: cancel_callback
        }
      ]
    });

    await alert.present();
  }

  async presentAlert(header,message) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  async presentToastWithOptions(header: string, message: string, color: string) {
    const toast = await this.toastController.create({
      header: header,
      message: message,
      duration: 7000,
      position: 'bottom',
      color: color,
      buttons: [
        {
          text: 'OK',
          role: 'cancel',
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    await toast.present();

    const { role } = await toast.onDidDismiss();
    console.log('onDidDismiss resolved with role', role);
  }

  async presentModal() {

    if(this.session_service.agent_code == null || this.session_service.agent_code == '' ||
       this.session_service.agent_name == null || this.session_service.agent_name == '' ||
       this.session_service.machine_id == null || this.session_service.machine_id == '' ||
       this.session_service.printer_mac_address == null || this.session_service.printer_mac_address == '') {

        this.presentToastWithOptions("Oops!","Please check and complete app settings before creating a batch!","danger");

        return 
    }

    if(this.session_service.is_activated() == false) {
      this.presentToastWithOptions("Oops!","This app is not activated","danger");

      return
    }
    
    const modal = await this.modalController.create({
      component: BettingFormModal,
      cssClass: 'my-custom-class'
    })

    return await modal.present();
  }

}
