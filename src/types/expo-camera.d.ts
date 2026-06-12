declare module 'expo-camera' {
  import React from 'react';
  export interface BarcodeScanningResult {
    data: string;
    type: string;
  }
  export interface CameraViewProps {
    onBarcodeScanned?: (result: BarcodeScanningResult) => void;
    barcodeScannerSettings?: { barcodeTypes: string[] };
    style?: object;
    children?: React.ReactNode;
  }
  export const CameraView: React.FC<CameraViewProps>;
  export type CameraPermissionResponse = { granted: boolean };
  export function useCameraPermissions(): [
    CameraPermissionResponse | null,
    () => Promise<CameraPermissionResponse>,
  ];
}
