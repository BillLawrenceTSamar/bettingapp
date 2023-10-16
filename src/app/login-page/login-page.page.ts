import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { SessionService } from '../services/session.service';
import { EasySms } from 'easy-sms';

@Component({
  selector: 'login-page',
  templateUrl: 'login-page.page.html',
  styleUrls: ['login-page.page.scss']
})

export class LoginPage {
  
    loading = null
    password: string
    slideOpts = {
        initialSlide: 0,
        speed: 400
    };

    constructor(
        private r: Router,
        private session_service: SessionService,
        public loadingController: LoadingController
    ) {}

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
            keyboardClose: true
        });

        await this.loading.present();
    
        // const { role, data } = await this.loading.onDidDismiss();
        // console.log('Loading dismissed with role:', role);
      }

    signin() {

        this.presentLoadingWithOptions()
        
        let login_subscription = this.session_service.login(this.password).subscribe((response: any) => {
            
            this.loading.dismiss()
            this.loading = null

            if(response.status == true) {
                this.r.navigate(['/app'])
            } else {
                alert(response.message)
            }

            login_subscription.unsubscribe()
        })
         
    }
}