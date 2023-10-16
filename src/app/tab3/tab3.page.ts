import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { DrawCategories, Session, SessionService } from '../services/session.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {

  receiver_stl: string
  receiver_3d: string
  machine_id: string
  agent_code: string
  agent_name: string
  reference_no: string
  activation: string
  printer_mac_address: string
  session?: Session

  constructor(private session_service: SessionService,public toastController: ToastController) {
    
    this.machine_id = this.session_service.machine_id
    this.agent_code = this.session_service.agent_code
    this.agent_name = this.session_service.agent_name
    this.reference_no = this.session_service.reference_no
    this.activation = this.session_service.activation
    this.printer_mac_address = this.session_service.printer_mac_address
    
    this.receiver_3d = this.session_service.get_receiver_number(DrawCategories['3d'])
    this.receiver_stl = this.session_service.get_receiver_number(DrawCategories.stl)
    
  }

  updateField(key: string, target: any) {
    this[key] = target.value
  }

  save() {

    this.session_service.set_receiver_number(DrawCategories.stl,this.receiver_stl)
    this.session_service.set_receiver_number(DrawCategories['3d'],this.receiver_3d)

    this.session_service.machine_id = this.machine_id
    this.session_service.agent_code = this.agent_code
    this.session_service.agent_name = this.agent_name
    this.session_service.reference_no = this.reference_no
    this.session_service.activation = this.activation

    this.printer_mac_address = this.printer_mac_address.toUpperCase()
    this.session_service.printer_mac_address = this.printer_mac_address
    this.session_service.save_settings().then(_=>this.presentToastWithOptions("SETTINGS","Changes have been saved successfully!",'primary'))

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

}
