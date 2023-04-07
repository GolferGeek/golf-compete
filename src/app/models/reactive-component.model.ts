export enum ReactiveComponentStatus {
  ADD = 'add',
  ADD_BUTTON = 'add-button',
  EDIT = 'edit',
  VIEW = 'view',
  LIST = 'list',
}

export class ReactiveComponentModel {
  status: ReactiveComponentStatus = ReactiveComponentStatus.LIST;
  componentData: any;
  changeStatus(status: ReactiveComponentStatus) {
    this.status = status;
  }
}
