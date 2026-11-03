import { Status, STATUS_TYPE } from 'kubeflow';

export interface PVCResponseObject {
  age: {
    uptime: string;
    timestamp: string;
  };
  capacity: string;
  class: string;
  modes: string[];
  name: string;
  namespace: string;
  status: Status;
  notebooks: string[];
  viewer: {
    status: STATUS_TYPE;
    url: string;
  };
}