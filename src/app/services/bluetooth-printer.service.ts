import { Injectable } from "@angular/core";
import { BluetoothSerial } from "@ionic-native/bluetooth-serial/ngx";
import { Observable } from "rxjs";

@Injectable()

export class BluetoothPrinterService {

    constructor(private btSerial: BluetoothSerial) {

    }

    searchBluetoothPrinter() {
    //This will return a list of bluetooth devices
       return this.btSerial.list(); 
    }

    connectToBluetoothPrinter(macAddress) {
    //This will connect to bluetooth printer via the mac address provided
       return this.btSerial.connect(macAddress)
    }

    disconnectBluetoothPrinter() {
    //This will disconnect the current bluetooth connection
       return this.btSerial.disconnect();
    }

    //macAddress->the device's mac address 
    //data_string-> string to be printer
   sendToBluetoothPrinter(macAddress,data_string: Uint8Array) {

      console.log("byte length " + data_string.byteLength)

      //this.disconnectBluetoothPrinter().then(() => {
      
       //1. Try connecting to bluetooth printer
         this.connectToBluetoothPrinter(macAddress)
         .subscribe(async _ =>{

            let buff = data_string
            
            while(buff.length > 0) {

               let towrite: Uint8Array = null
               
               if(buff.length >= 3800) {
                  towrite = buff.slice(0,3800)
               } else {
                  towrite = buff.slice(0,buff.length)
               }
               console.log(towrite)
               try {
                  await this.btSerial.write(towrite)
               }
               catch(e) {
                  console.log(e)
               } 

               buff = buff.slice(3800,buff.length)

            }

            setTimeout(() => {
               this.disconnectBluetoothPrinter()
            }, 5000);
            
            return true

         },err=>{
         console.log(err)
            //If there is an error connecting to bluetooth printer
            //handle it here
         })

      //})


   }

}