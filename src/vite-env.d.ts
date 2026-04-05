/// <reference types="vite/client" />

declare module "*.png" {
  const value: string;
  export default value;
}

declare module "react-leaflet-draw" {
  import { Component } from "react";
  import { Control } from "leaflet";
  
  export interface EditControlProps {
    position?: Control.Position;
    onCreated?: (e: any) => void;
    onEdited?: (e: any) => void;
    onDeleted?: (e: any) => void;
    onMounted?: (e: any) => void;
    onEditStart?: (e: any) => void;
    onEditStop?: (e: any) => void;
    onDeleteStart?: (e: any) => void;
    onDeleteStop?: (e: any) => void;
    draw?: any;
    edit?: any;
  }

  export class EditControl extends Component<EditControlProps> {}
}
