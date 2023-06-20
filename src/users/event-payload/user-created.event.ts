export interface UserCreated {
  payload: {
    firstname: string;
    lastname?: string;
    email: string;
    activationToken: string;
  };
  template: string;
}
