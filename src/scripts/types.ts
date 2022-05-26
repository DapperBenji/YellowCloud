export interface KeyVal {
   [key: string]: string
}

export enum SettingType {
   Default,
   Display
}

export class Setting {
   selector: string
   namespace?: string
   type: SettingType

   constructor(selector: string, namespace?: string, type = SettingType.Default) {
      this.selector = selector
      this.namespace = namespace
      this.type = type
   }

   getElement(): HTMLInputElement | Array<HTMLInputElement> {
      return this.type === SettingType.Display ?
         (document.querySelectorAll(this.selector) as Array<HTMLInputElement>) :
         (document.querySelector(`#${this.selector}`) as HTMLInputElement)
   }
}