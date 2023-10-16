import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { SMS } from '@ionic-native/sms/ngx';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginPage } from './login-page/login-page.page';
import { BettingService } from './services/betting.service';
import { DbService } from './services/db.service';
import { SessionService } from './services/session.service';
import { SmsParser } from './services/sms-parser.service';
import { WalletService } from './services/wallet.service';
import { SmsService } from './services/sms-service.service';
import { BluetoothSerial } from '@ionic-native/bluetooth-serial/ngx';
import { BluetoothPrinterService } from './services/bluetooth-printer.service';

export function serviceInitializer(db_service: DbService,session_service: SessionService, sms_service: SmsService, betting_service: BettingService, wallet_service: WalletService) {
  return () => {
    return new Promise(async (resolve,error) => {

      await db_service.initialize()
      console.log("1")
      await session_service.initialize()
      console.log("2")
      await sms_service.initialize()
      console.log("3")
      await betting_service.initialize()
      console.log("4")
      await wallet_service.initialize()
      console.log("5")
        
      console.log("App Initialization Complete!")
      resolve("ok")

    })
  }
}

@NgModule({
  declarations: [
    AppComponent,
    LoginPage
  ],
  entryComponents: [],
  imports: [
    HttpClientModule,
    BrowserModule, 
    CommonModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    IonicStorageModule.forRoot()
  ],
  providers: [
    AndroidPermissions,
    SMS,
    SmsParser,
    DbService,
    BluetoothSerial,
    BluetoothPrinterService,
    SessionService,
    { 
      provide: RouteReuseStrategy,
      useClass: IonicRouteStrategy
    },
    {
      provide: APP_INITIALIZER,
      useFactory: serviceInitializer,
      deps: [DbService, SessionService, SmsService, BettingService, WalletService],
      multi: true
    }
  ],
  bootstrap: [AppComponent],
})

export class AppModule {}
