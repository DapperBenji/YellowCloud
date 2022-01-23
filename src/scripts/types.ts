export interface KeyVal {
   [key: string]: string
}

export enum SettingType {
   Default,
   Display
}

export class Setting {
   selector: string
   namespace: string
   type: SettingType

   constructor(selector: string, namespace = null, type = SettingType.Default) {
      this.selector = selector
      this.namespace = namespace
      this.type = type
   }

   getElement(index?: number): HTMLInputElement {
      return index ? document.querySelectorAll(this.selector)[index] :
         document.querySelector(this.selector)
   }
}