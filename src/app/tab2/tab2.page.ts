import { Component, NgZone, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { WalletService } from '../services/wallet.service';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {

  loading = null
  balance: number
  control_number: string
  amount: number

  constructor(
    private loadingController: LoadingController,
    private wallet_service: WalletService,
    private ng_zone: NgZone,
    public toastController: ToastController
    ) {}

  ngOnInit() {
    this.wallet_service.get_wallet().subscribe(data => {
      this.ng_zone.run(() => {
        this.balance = parseInt(data)
      })
    })
  }

  updateField(key: string, target: any) {
    this[key] = target.value
  }

  async presentLoadingWithOptions() {
    this.loading = await this.loadingController.create({
        message: 'Communicating with Server',
        translucent: true,
        cssClass: 'custom-class custom-loading',
        backdropDismiss: false,
        showBackdrop: true,
        animated: true,
        mode: 'md',
        keyboardClose: true,
        duration: 8000
    });

    await this.loading.present();

    // const { role, data } = await this.loading.onDidDismiss();
    // console.log('Loading dismissed with role:', role);
  }

  async presentToastWithOptions(header: string, message: string, color: string) {
    const toast = await this.toastController.create({
      header: header,
      message: message, 
      duration: 5000,
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


  refresh_wallet() {
    this.presentLoadingWithOptions()
    let sub = this.wallet_service.refresh_sms().subscribe((response: any) => {
      this.loading.dismiss()
      this.presentToastWithOptions('BETTING EXPRESS - REFRESH WALLET',response.message,(response.status == true? 'primary':'danger'))
      //alert(response.message)
      sub.unsubscribe()
    })
  }

  topUp() {
    
    if(this.control_number == '' || this.control_number == null || this.amount < 1 || this.amount == null) {
      //alert('please specify the Gcash transfer control number')
      this.presentToastWithOptions('BETTING EXPRESS - TOP UP','please specify the Gcash transfer control number!','danger')
      return
    }

    this.presentLoadingWithOptions()
 
    let sub = this.wallet_service.top_up(this.amount,this.control_number).subscribe((response:any) => {
      this.loading.dismiss()
      this.presentToastWithOptions('BETTING EXPRESS - TOP UP',response.message,(response.status == true? 'primary':'danger'))
      //alert(response.message)
      sub.unsubscribe()
    })
  }

}
